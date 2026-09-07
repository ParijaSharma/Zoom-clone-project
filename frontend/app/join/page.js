"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Video, MicOff, VideoOff, Loader2 } from "lucide-react";
import { getMeeting } from "@/lib/api";

export default function JoinPage() {
  const router = useRouter();
  const [meetingInput, setMeetingInput] = useState("");
  const [displayName, setDisplayName] = useState("Parija Sharma");
  const [noAudio, setNoAudio] = useState(false);
  const [noVideo, setNoVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Extract ID from full URL or formatted string
  function extractMeetingId(input) {
    if (!input) return "";
    let trimmed = input.trim();
    // If user pasted a full URL
    if (trimmed.includes("/meeting/")) {
      trimmed = trimmed.split("/meeting/")[1].split("?")[0];
    }
    // Remove all spaces, hyphens
    return trimmed.replace(/\s+/g, "").replace(/-/g, "");
  }

  async function handleJoin(e) {
    e.preventDefault();
    setError(null);

    const meetingId = extractMeetingId(meetingInput);
    if (!meetingId) {
      setError("Please enter a valid Meeting ID or link");
      return;
    }

    if (!displayName.trim()) {
      setError("Please enter your display name");
      return;
    }

    setLoading(true);

    try {
      // Validate meeting existence with backend
      const meeting = await getMeeting(meetingId);

      // Successfully validated -> redirect to meeting room
      const params = new URLSearchParams({
        name: displayName.trim(),
        audioOff: noAudio ? "true" : "false",
        videoOff: noVideo ? "true" : "false",
      });

      router.push(`/meeting/${meeting.meeting_id}?${params.toString()}`);
    } catch (err) {
      console.error("Meeting validation error:", err);
      setError(
        "Invalid Meeting ID. This meeting does not exist or has ended. Please check the ID and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-1.5 font-bold text-[#0b5cff]">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0b5cff] text-white text-[11px]">
              zoom
            </div>
            <span className="text-lg tracking-tight">Join Meeting</span>
          </div>
          <div className="w-6" />
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          {/* MEETING ID INPUT */}
          <div>
            <label className="block text-xs font-semibold text-gray-700">
              Meeting ID or Personal Link Name
            </label>
            <input
              type="text"
              required
              value={meetingInput}
              onChange={(e) => setMeetingInput(e.target.value)}
              placeholder="e.g. 266 426 0040 or invite link"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0b5cff] focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* DISPLAY NAME INPUT */}
          <div>
            <label className="block text-xs font-semibold text-gray-700">
              Your Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0b5cff] focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* PRE-JOIN OPTIONS */}
          <div className="space-y-2.5 border-t border-gray-100 pt-4 text-xs text-gray-600">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={noAudio}
                onChange={(e) => setNoAudio(e.target.checked)}
                className="h-4 w-4 rounded text-[#0b5cff] focus:ring-blue-400"
              />
              <span className="flex items-center gap-1.5">
                <MicOff size={14} className="text-gray-500" />
                Do not connect to audio
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={noVideo}
                onChange={(e) => setNoVideo(e.target.checked)}
                className="h-4 w-4 rounded text-[#0b5cff] focus:ring-blue-400"
              />
              <span className="flex items-center gap-1.5">
                <VideoOff size={14} className="text-gray-500" />
                Turn off my video
              </span>
            </label>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b5cff] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#094ecf] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Validating Meeting...
                </>
              ) : (
                "Join"
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          By joining, you agree to Zoom's Terms of Service and Privacy Statement.
        </p>
      </div>
    </div>
  );
}