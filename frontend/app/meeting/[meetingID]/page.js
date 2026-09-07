"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Share2,
  Users,
  MessageSquare,
  Smile,
  Shield,
  PhoneOff,
  Copy,
  Check,
  MoreVertical,
  Maximize2,
  Minimize2,
  Grid,
  Send,
  Lock,
  Radio,
  UserX,
  VolumeX,
  Sparkles,
} from "lucide-react";
import { getMeeting, joinMeeting, getWebSocketUrl } from "@/lib/api";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function MeetingRoomPage({ params }) {
  // Unwrap params in Next.js 15+ App Router
  const resolvedParams = use(params);
  const meetingId = resolvedParams.meetingID;

  const router = useRouter();
  const searchParams = useSearchParams();

  // Query Params & Session State
  const initialName = searchParams.get("name") || "Parija Sharma";
  const isHostParam = searchParams.get("isHost") === "true";
  const initialAudioOff = searchParams.get("audioOff") === "true";
  const initialVideoOff = searchParams.get("videoOff") === "true";

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User Identification
  const [clientId] = useState(() => "client_" + Math.random().toString(36).substring(2, 9));
  const [displayName, setDisplayName] = useState(initialName);
  const [isHost, setIsHost] = useState(isHostParam);

  // Media Controls State
  const [isMuted, setIsMuted] = useState(initialAudioOff);
  const [isVideoOff, setIsVideoOff] = useState(initialVideoOff);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Drawer / UI Modals State
  const [activeTab, setActiveTab] = useState(null); // 'participants' | 'chat' | null
  const [showSecurityPopover, setShowSecurityPopover] = useState(false);
  const [showReactionsPopover, setShowReactionsPopover] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState([]);

  // Roster & Chat
  const [peers, setPeers] = useState({}); // peerId -> { display_name, is_host, is_muted, is_video_off, stream }
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({}); // peerId -> RTCPeerConnection
  const chatBottomRef = useRef(null);

  // ----------------------------------------------------
  // 1. Initialize Meeting & Fetch Metadata
  // ----------------------------------------------------
  useEffect(() => {
    async function initMeeting() {
      try {
        setLoading(true);
        const data = await getMeeting(meetingId);
        setMeeting(data);

        // If user is designated host by meeting model
        if (data.host_name === initialName || isHostParam) {
          setIsHost(true);
        }

        // Record participant entry in DB
        await joinMeeting(meetingId, initialName, isHostParam).catch(() => {});
      } catch (err) {
        console.error("Meeting fetch error:", err);
        setError("Meeting not found or has concluded.");
      } finally {
        setLoading(false);
      }
    }

    if (meetingId) {
      initMeeting();
    }
  }, [meetingId, initialName, isHostParam]);

  // ----------------------------------------------------
  // 2. Meeting Duration Counter
  // ----------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;
  }

  // ----------------------------------------------------
  // 3. Setup Local Media Stream (Camera & Mic)
  // ----------------------------------------------------
  useEffect(() => {
    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;

        if (initialAudioOff) {
          stream.getAudioTracks().forEach((t) => (t.enabled = false));
        }
        if (initialVideoOff) {
          stream.getVideoTracks().forEach((t) => (t.enabled = false));
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera/Mic not available or permission denied. Running in avatar audio fallback mode.", err);
      }
    }

    startMedia();

    return () => {
      // Clean up tracks on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [initialAudioOff, initialVideoOff]);

  // ----------------------------------------------------
  // 4. WebSocket Signaling & WebRTC Mesh Setup
  // ----------------------------------------------------
  useEffect(() => {
    if (!meetingId) return;

    const wsUrl = getWebSocketUrl(meetingId, clientId, displayName, isHost);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Connected to Zoom Signaling Server via WebSocket");
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        const msgType = data.type;

        // A. Initial Room Roster
        if (msgType === "room-roster") {
          const newPeers = {};
          data.peers.forEach((peer) => {
            newPeers[peer.client_id] = {
              ...peer,
              stream: null,
            };
            // Create peer connection & send SDP Offer to each existing peer
            createPeerConnection(peer.client_id, peer.display_name, true);
          });
          setPeers(newPeers);
        }

        // B. New Peer Joined
        else if (msgType === "peer-joined") {
          const peer = data.peer;
          setPeers((prev) => ({
            ...prev,
            [peer.client_id]: { ...peer, stream: null },
          }));
          // Note: Wait for the newly joined peer to send offer
        }

        // C. Peer Left
        else if (msgType === "peer-left") {
          const leftId = data.client_id;
          if (peerConnectionsRef.current[leftId]) {
            peerConnectionsRef.current[leftId].close();
            delete peerConnectionsRef.current[leftId];
          }
          setPeers((prev) => {
            const copy = { ...prev };
            delete copy[leftId];
            return copy;
          });
        }

        // D. WebRTC SDP Offer Received
        else if (msgType === "offer") {
          const fromPeerId = data.from_peer_id;
          const fromDisplayName = data.from_display_name;
          const pc = createPeerConnection(fromPeerId, fromDisplayName, false);
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.send(
            JSON.stringify({
              type: "answer",
              target_peer_id: fromPeerId,
              sdp: answer,
            })
          );
        }

        // E. WebRTC SDP Answer Received
        else if (msgType === "answer") {
          const fromPeerId = data.from_peer_id;
          const pc = peerConnectionsRef.current[fromPeerId];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          }
        }

        // F. ICE Candidate Received
        else if (msgType === "ice-candidate") {
          const fromPeerId = data.from_peer_id;
          const pc = peerConnectionsRef.current[fromPeerId];
          if (pc && data.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch((e) => {});
          }
        }

        // G. In-Meeting Chat Message
        else if (msgType === "chat-message") {
          setChatMessages((prev) => [...prev, data]);
          if (activeTab !== "chat") {
            // New message indicator
          }
        }

        // H. Media State Toggled by Peer
        else if (msgType === "media-toggle") {
          const { client_id, kind, enabled } = data;
          setPeers((prev) => {
            if (!prev[client_id]) return prev;
            return {
              ...prev,
              [client_id]: {
                ...prev[client_id],
                is_muted: kind === "audio" ? !enabled : prev[client_id].is_muted,
                is_video_off: kind === "video" ? !enabled : prev[client_id].is_video_off,
              },
            };
          });
        }

        // I. Host Mute All Command
        else if (msgType === "host-mute-all") {
          if (!isHost) {
            muteAudio();
            alert(`The host (${data.by_host}) muted everyone.`);
          }
        }

        // J. Kicked / Removed by Host
        else if (msgType === "kicked") {
          alert(data.reason || "You have been removed from the meeting by the host.");
          cleanupAndExit();
        }

        // K. Reaction
        else if (msgType === "reaction") {
          triggerReactionAnimation(data.emoji, data.sender_name);
        }
      } catch (err) {
        console.error("Signaling message handling error:", err);
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    };
  }, [meetingId, clientId, displayName, isHost]);

  // Scroll chat drawer automatically
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeTab]);

  // ----------------------------------------------------
  // 5. WebRTC Peer Connection Factory
  // ----------------------------------------------------
  function createPeerConnection(targetPeerId, targetDisplayName, isInitiator) {
    if (peerConnectionsRef.current[targetPeerId]) {
      return peerConnectionsRef.current[targetPeerId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[targetPeerId] = pc;

    // Add local media tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE Candidate generated by browser
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "ice-candidate",
            target_peer_id: targetPeerId,
            candidate: event.candidate,
          })
        );
      }
    };

    // Receive Remote Media Stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setPeers((prev) => {
        if (!prev[targetPeerId]) return prev;
        return {
          ...prev,
          [targetPeerId]: {
            ...prev[targetPeerId],
            stream: remoteStream,
          },
        };
      });
    };

    // If initiator, create and send SDP Offer
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(
              JSON.stringify({
                type: "offer",
                target_peer_id: targetPeerId,
                sdp: offer,
              })
            );
          }
        } catch (err) {
          console.error("Offer creation failed:", err);
        }
      };
    }

    return pc;
  }

  // ----------------------------------------------------
  // 6. Media Control Handlers
  // ----------------------------------------------------
  function toggleAudio() {
    if (!localStreamRef.current) {
      setIsMuted((prev) => !prev);
      return;
    }
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const nextMuted = !audioTrack.enabled;
      setIsMuted(nextMuted);

      // Notify signaling server
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "media-toggle",
            kind: "audio",
            enabled: !nextMuted,
          })
        );
      }
    } else {
      setIsMuted((prev) => !prev);
    }
  }

  function muteAudio() {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = false;
    }
    setIsMuted(true);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "media-toggle",
          kind: "audio",
          enabled: false,
        })
      );
    }
  }

  function toggleVideo() {
    if (!localStreamRef.current) {
      setIsVideoOff((prev) => !prev);
      return;
    }
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const nextVideoOff = !videoTrack.enabled;
      setIsVideoOff(nextVideoOff);

      // Notify signaling server
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "media-toggle",
            kind: "video",
            enabled: !nextVideoOff,
          })
        );
      }
    } else {
      setIsVideoOff((prev) => !prev);
    }
  }

  async function toggleScreenShare() {
    if (isScreenSharing) {
      // Stop screen share
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      // Revert video element to webcam
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        console.warn("Screen share cancelled or not allowed:", err);
      }
    }
  }

  // ----------------------------------------------------
  // 7. Chat & Reactions
  // ----------------------------------------------------
  function sendChatMessage(e) {
    e.preventDefault();
    if (!chatInput.trim() || socketRef.current?.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(
      JSON.stringify({
        type: "chat-message",
        text: chatInput.trim(),
      })
    );
    setChatInput("");
  }

  function sendReaction(emoji) {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "reaction",
          emoji,
        })
      );
    }
    triggerReactionAnimation(emoji, "You");
    setShowReactionsPopover(false);
  }

  function triggerReactionAnimation(emoji, sender) {
    const id = Date.now() + Math.random();
    const leftPercent = 20 + Math.random() * 60;
    setFloatingReactions((prev) => [...prev, { id, emoji, sender, leftPercent }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  }

  // ----------------------------------------------------
  // 8. Host Controls
  // ----------------------------------------------------
  function handleHostMuteAll() {
    if (!isHost || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(
      JSON.stringify({
        type: "host-mute-all",
      })
    );
  }

  function handleHostRemoveParticipant(targetId) {
    if (!isHost || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(
      JSON.stringify({
        type: "host-remove-participant",
        target_peer_id: targetId,
      })
    );
  }

  function cleanupAndExit() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    router.push("/");
  }

  function copyMeetingInvite() {
    const url = window.location.origin + `/meeting/${meetingId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  // Calculate peer array
  const peerList = Object.values(peers);
  const totalParticipants = 1 + peerList.length;

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#1a1a1a] text-white">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-[#0b5cff]">
            <Radio size={32} />
          </div>
          <h2 className="mt-4 text-xl font-bold">Connecting to Zoom Meeting...</h2>
          <p className="mt-1 text-sm text-gray-400">Negotiating WebRTC mesh & room encryption</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#1a1a1a] text-white">
        <div className="max-w-md rounded-2xl bg-[#242424] p-8 text-center shadow-xl border border-gray-800">
          <h2 className="text-xl font-bold text-red-400">Meeting Unavailable</h2>
          <p className="mt-2 text-sm text-gray-300">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-[#0b5cff] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#094ecf]"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#18181b] text-white select-none">
      {/* ---------------- TOP ZOOM BAR ---------------- */}
      <header className="z-20 flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-[#121214]/90 px-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/20">
            <Shield size={13} className="fill-green-400/20" />
            <span>End-to-End Encrypted</span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <h1 className="max-w-[280px] sm:max-w-md truncate text-xs font-semibold text-gray-200">
            {meeting?.title || "Zoom Meeting"}
          </h1>
        </div>

        {/* Center: Meeting Duration */}
        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-gray-300">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span>{formatDuration(meetingDuration)}</span>
        </div>

        {/* Right: Meeting ID & Copy */}
        <div className="flex items-center gap-3">
          <button
            onClick={copyMeetingInvite}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-gray-300 hover:bg-white/10 transition"
            title="Copy meeting invite link"
          >
            {copiedLink ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            <span className="font-mono">{meetingId}</span>
            <span className="text-[11px] text-gray-400">
              {copiedLink ? "Copied!" : "Invite"}
            </span>
          </button>
        </div>
      </header>

      {/* ---------------- MAIN VIDEO STAGE & DRAWER ---------------- */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* VIDEO GRID */}
        <div className="relative flex flex-1 items-center justify-center p-3 sm:p-5 overflow-hidden">
          {/* FLOATING EMOJI REACTION ANIMATION */}
          <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
            {floatingReactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-10 animate-bounce flex flex-col items-center transition-all duration-1000"
                style={{
                  left: `${r.leftPercent}%`,
                  animationDuration: "2s",
                }}
              >
                <span className="text-4xl filter drop-shadow-md">{r.emoji}</span>
                <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  {r.sender}
                </span>
              </div>
            ))}
          </div>

          {/* GRID CONTAINER */}
          <div
            className={`grid h-full w-full gap-3 ${
              totalParticipants === 1
                ? "grid-cols-1"
                : totalParticipants === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : totalParticipants <= 4
                ? "grid-cols-2"
                : "grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {/* LOCAL USER TILE */}
            <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#27272a] shadow-lg border border-white/5">
              {isVideoOff ? (
                /* Avatar Fallback */
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-[#8054c7] text-3xl sm:text-5xl font-bold text-white shadow-xl">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-300">{displayName}</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover scale-x-[-1]"
                />
              )}

              {/* Bottom Tag Bar */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-md">
                <span className="font-medium truncate max-w-[140px]">
                  {displayName} (You {isHost ? "• Host" : ""})
                </span>
                {isMuted ? (
                  <MicOff size={13} className="text-red-400" />
                ) : (
                  <Mic size={13} className="text-green-400" />
                )}
              </div>

              {isScreenSharing && (
                <div className="absolute top-3 right-3 rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                  Screen Sharing Active
                </div>
              )}
            </div>

            {/* REMOTE PEERS TILES */}
            {peerList.map((peer) => (
              <RemotePeerTile key={peer.client_id} peer={peer} />
            ))}
          </div>
        </div>

        {/* ---------------- SLIDE-IN PARTICIPANTS DRAWER ---------------- */}
        {activeTab === "participants" && (
          <aside className="z-20 flex w-80 shrink-0 flex-col border-l border-white/10 bg-[#1f1f23] text-white shadow-2xl animate-in slide-in-from-right-10">
            <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
              <h3 className="text-sm font-bold">Participants ({totalParticipants})</h3>
              <button
                onClick={() => setActiveTab(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* PARTICIPANTS LIST */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {/* Self */}
              <div className="flex items-center justify-between rounded-xl p-2.5 hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8054c7] text-xs font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">
                      {displayName} <span className="text-gray-400">(Me)</span>
                    </p>
                    <p className="text-[10px] text-blue-400">{isHost ? "Host" : "Participant"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isMuted ? (
                    <MicOff size={14} className="text-red-400" />
                  ) : (
                    <Mic size={14} className="text-green-400" />
                  )}
                  {isVideoOff ? (
                    <VideoOff size={14} className="text-red-400" />
                  ) : (
                    <VideoIcon size={14} className="text-green-400" />
                  )}
                </div>
              </div>

              {/* Peers */}
              {peerList.map((peer) => (
                <div
                  key={peer.client_id}
                  className="group flex items-center justify-between rounded-xl p-2.5 hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">
                      {peer.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{peer.display_name}</p>
                      <p className="text-[10px] text-gray-400">
                        {peer.is_host ? "Host" : "Participant"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {peer.is_muted ? (
                      <MicOff size={14} className="text-red-400" />
                    ) : (
                      <Mic size={14} className="text-green-400" />
                    )}

                    {/* Host Controls */}
                    {isHost && (
                      <button
                        onClick={() => handleHostRemoveParticipant(peer.client_id)}
                        className="rounded p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition"
                        title="Remove participant"
                      >
                        <UserX size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* HOST CONTROLS FOOTER */}
            <div className="border-t border-white/10 p-3 space-y-2">
              {isHost && (
                <button
                  onClick={handleHostMuteAll}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-xs font-semibold text-gray-200 hover:bg-white/20 transition"
                >
                  <VolumeX size={14} />
                  Mute All
                </button>
              )}
              <button
                onClick={copyMeetingInvite}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b5cff] py-2 text-xs font-semibold text-white hover:bg-[#094ecf] transition"
              >
                <Copy size={14} />
                {copiedLink ? "Link Copied!" : "Invite Link"}
              </button>
            </div>
          </aside>
        )}

        {/* ---------------- SLIDE-IN CHAT DRAWER ---------------- */}
        {activeTab === "chat" && (
          <aside className="z-20 flex w-80 shrink-0 flex-col border-l border-white/10 bg-[#1f1f23] text-white shadow-2xl animate-in slide-in-from-right-10">
            <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
              <h3 className="text-sm font-bold">Meeting Chat</h3>
              <button
                onClick={() => setActiveTab(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* MESSAGES FEED */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                  <MessageSquare size={32} className="mb-2 text-gray-500" />
                  <p className="text-xs">No messages yet.</p>
                  <p className="text-[11px] text-gray-500">Send a message to everyone in the room.</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span className="font-semibold text-gray-300">
                        {msg.sender_name} {msg.sender_id === clientId ? "(Me)" : ""}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div className="rounded-xl bg-white/10 p-2.5 text-xs text-gray-100 leading-relaxed break-words">
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* CHAT INPUT */}
            <form onSubmit={sendChatMessage} className="border-t border-white/10 p-3">
              <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#0b5cff]">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type message to everyone..."
                  className="w-full bg-transparent text-xs text-white placeholder:text-gray-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-600 hover:text-white disabled:opacity-30 transition"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>

      {/* ---------------- BOTTOM ZOOM TOOLBAR ---------------- */}
      <footer className="z-20 flex h-20 shrink-0 items-center justify-between border-t border-white/5 bg-[#121214] px-4 sm:px-8">
        {/* LEFT: AUDIO & VIDEO CONTROLS */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Microphone */}
          <button
            onClick={toggleAudio}
            className="flex flex-col items-center justify-center rounded-xl p-2 sm:px-3 text-gray-300 hover:bg-white/10 transition"
          >
            {isMuted ? (
              <MicOff size={20} className="text-red-400" />
            ) : (
              <Mic size={20} className="text-green-400" />
            )}
            <span className="mt-1 text-[11px] font-medium">
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </button>

          {/* Video Camera */}
          <button
            onClick={toggleVideo}
            className="flex flex-col items-center justify-center rounded-xl p-2 sm:px-3 text-gray-300 hover:bg-white/10 transition"
          >
            {isVideoOff ? (
              <VideoOff size={20} className="text-red-400" />
            ) : (
              <VideoIcon size={20} className="text-green-400" />
            )}
            <span className="mt-1 text-[11px] font-medium">
              {isVideoOff ? "Start Video" : "Stop Video"}
            </span>
          </button>
        </div>

        {/* CENTER: COLLABORATION CONTROLS */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Security Popover */}
          <div className="relative">
            <button
              onClick={() => setShowSecurityPopover((prev) => !prev)}
              className="flex flex-col items-center justify-center rounded-xl p-2 sm:px-3 text-gray-300 hover:bg-white/10 transition"
            >
              <Shield size={20} />
              <span className="mt-1 text-[11px] font-medium">Security</span>
            </button>

            {showSecurityPopover && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 rounded-xl bg-[#242427] p-3 text-xs text-white shadow-2xl border border-white/10 animate-in fade-in">
                <p className="font-bold border-b border-white/10 pb-1.5 mb-2">Meeting Security</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0b5cff]" />
                    <span>Lock Meeting</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0b5cff]" />
                    <span>Enable Chat</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0b5cff]" />
                    <span>Allow Screen Share</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Participants */}
          <button
            onClick={() => setActiveTab(activeTab === "participants" ? null : "participants")}
            className={`relative flex flex-col items-center justify-center rounded-xl p-2 sm:px-3 transition ${
              activeTab === "participants"
                ? "bg-white/20 text-white"
                : "text-gray-300 hover:bg-white/10"
            }`}
          >
            <Users size={20} />
            <span className="mt-1 text-[11px] font-medium">Participants</span>
            <span className="absolute top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#0b5cff] text-[10px] font-bold">
              {totalParticipants}
            </span>
          </button>

          {/* Chat */}
          <button
            onClick={() => setActiveTab(activeTab === "chat" ? null : "chat")}
            className={`relative flex flex-col items-center justify-center rounded-xl p-2 sm:px-3 transition ${
              activeTab === "chat"
                ? "bg-white/20 text-white"
                : "text-gray-300 hover:bg-white/10"
            }`}
          >
            <MessageSquare size={20} />
            <span className="mt-1 text-[11px] font-medium">Chat</span>
            {chatMessages.length > 0 && (
              <span className="absolute top-1 right-2 flex h-2 w-2 rounded-full bg-blue-500" />
            )}
          </button>

          {/* Share Screen */}
          <button
            onClick={toggleScreenShare}
            className={`flex flex-col items-center justify-center rounded-xl p-2 sm:px-3 transition ${
              isScreenSharing
                ? "bg-green-600/30 text-green-400"
                : "text-gray-300 hover:bg-white/10"
            }`}
          >
            <Share2 size={20} className={isScreenSharing ? "text-green-400" : ""} />
            <span className="mt-1 text-[11px] font-medium">
              {isScreenSharing ? "Stop Share" : "Share Screen"}
            </span>
          </button>

          {/* Reactions */}
          <div className="relative">
            <button
              onClick={() => setShowReactionsPopover((prev) => !prev)}
              className="flex flex-col items-center justify-center rounded-xl p-2 sm:px-3 text-gray-300 hover:bg-white/10 transition"
            >
              <Smile size={20} />
              <span className="mt-1 text-[11px] font-medium">Reactions</span>
            </button>

            {showReactionsPopover && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl bg-[#242427] p-2 shadow-2xl border border-white/10 animate-in fade-in">
                {["👏", "👍", "❤️", "😂", "😮", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="rounded-lg p-1.5 text-2xl transition hover:scale-125 hover:bg-white/10"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: LEAVE / END MEETING */}
        <div>
          <button
            onClick={() => setShowLeaveModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-red-700 active:scale-95"
          >
            <PhoneOff size={15} />
            <span>{isHost ? "End" : "Leave"}</span>
          </button>
        </div>
      </footer>

      {/* ---------------- LEAVE / END MEETING MODAL ---------------- */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#242427] p-6 text-center shadow-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white">
              {isHost ? "End Meeting for All?" : "Leave Meeting?"}
            </h3>
            <p className="mt-2 text-xs text-gray-400">
              {isHost
                ? "You are the host. You can end the meeting for everyone or leave quietly."
                : "Are you sure you want to exit this meeting?"}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              {isHost && (
                <button
                  onClick={cleanupAndExit}
                  className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition"
                >
                  End Meeting for All
                </button>
              )}

              <button
                onClick={cleanupAndExit}
                className="w-full rounded-xl bg-white/10 py-2.5 text-xs font-bold text-gray-200 hover:bg-white/20 transition"
              >
                Leave Meeting
              </button>

              <button
                onClick={() => setShowLeaveModal(false)}
                className="w-full py-2 text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Remote Peer Tile Sub-Component
// ----------------------------------------------------
function RemotePeerTile({ peer }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  const hasVideoStream = peer.stream && !peer.is_video_off;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#27272a] shadow-lg border border-white/5">
      {hasVideoStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-[#0b75ed] text-3xl sm:text-5xl font-bold text-white shadow-xl">
            {peer.display_name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-gray-300">{peer.display_name}</span>
        </div>
      )}

      {/* Tag */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-md">
        <span className="font-medium truncate max-w-[140px]">{peer.display_name}</span>
        {peer.is_muted ? (
          <MicOff size={13} className="text-red-400" />
        ) : (
          <Mic size={13} className="text-green-400" />
        )}
      </div>
    </div>
  );
}
