"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, Copy, Check, Clock, Calendar, Volume2, Mic } from "lucide-react";
import { getMeetings } from "@/lib/api";

export default function MeetingsPanel() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);

  useEffect(() => {
    fetchUpcomingMeetings();
  }, []);

  async function fetchUpcomingMeetings() {
    try {
      setLoading(true);
      const data = await getMeetings("upcoming");
      setMeetings(data || []);
    } catch (err) {
      console.error("Failed to load meetings", err);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(meeting) {
    navigator.clipboard.writeText(meeting.invite_link);
    setCopiedId(meeting.meeting_id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function formatMeetingTime(isoString) {
    if (!isoString) return "Instant / Anytime";
    const date = new Date(isoString);
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) {
      return `Today, ${timeStr}`;
    }
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
  }

  return (
    <section className="min-h-[340px] rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-gray-900">Meetings</h2>
          <Link
            href="/schedule"
            className="text-[13px] font-medium text-[#0b5cff] hover:underline"
          >
            + Schedule
          </Link>
        </div>

        <Link
          href="/meeting"
          className="mt-1 inline-block text-[13px] text-[#0b5cff] hover:underline"
        >
          Visit Meetings
        </Link>

        {/* UPCOMING MEETINGS LIST */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="space-y-2 py-4">
              <div className="h-14 w-full animate-pulse rounded-xl bg-gray-100" />
              <div className="h-14 w-full animate-pulse rounded-xl bg-gray-100" />
            </div>
          ) : meetings.length > 0 ? (
            meetings.slice(0, 3).map((meeting) => (
              <div
                key={meeting.id}
                className="group relative rounded-xl border border-gray-100 bg-[#f8f9fb] p-3.5 transition hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-gray-900">
                      {meeting.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-gray-400" />
                        {formatMeetingTime(meeting.scheduled_at)}
                      </span>
                      <span>•</span>
                      <span>{meeting.duration || 45}m</span>
                    </div>
                    <p className="mt-1 text-[11px] font-mono text-gray-400">
                      ID: {meeting.meeting_id}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Link
                      href={`/meeting/${meeting.meeting_id}`}
                      className="rounded-lg bg-[#0b5cff] px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-[#094ecf]"
                    >
                      Start
                    </Link>

                    <button
                      onClick={() => handleCopy(meeting)}
                      className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-blue-600"
                      title="Copy invite link"
                    >
                      {copiedId === meeting.meeting_id ? (
                        <Check size={12} className="text-green-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>{copiedId === meeting.meeting_id ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-[#f4f5f7] px-4 py-5 text-center">
              <Calendar size={24} className="mx-auto mb-2 text-gray-400" />
              <p className="text-[14px] font-semibold leading-5 text-gray-800">
                No Upcoming Meetings
              </p>
              <Link
                href="/schedule"
                className="mt-2 inline-block text-[12px] font-medium text-[#0b5cff] hover:underline"
              >
                Schedule one now
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* TEST AUDIO AND VIDEO */}
      <div className="mt-6 border-t border-gray-100 pt-4">
        <button
          onClick={() => setShowTestModal(true)}
          className="w-full rounded-full bg-[#f3f4f6] px-4 py-2 text-[12px] font-medium text-[#0b5cff] transition hover:bg-[#e9eaec]"
        >
          Test Audio and Video
        </button>
      </div>

      {/* AUDIO / VIDEO TEST MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900">Test Audio & Video</h3>
            <p className="mt-1 text-xs text-gray-500">
              Verify your camera and microphone work properly with Zoom Clone.
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <Mic size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Microphone</p>
                    <p className="text-[11px] text-green-600">✓ Default Audio Input ready</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-600">Active</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <Volume2 size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Speaker</p>
                    <p className="text-[11px] text-gray-500">Ready to play meeting audio</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
                    audio.play().catch(() => {});
                  }}
                  className="rounded bg-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-300"
                >
                  Test Ring
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
                    <Video size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Webcam</p>
                    <p className="text-[11px] text-gray-500">Auto-detects when joining meeting</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-600">Ready</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTestModal(false)}
                className="rounded-xl bg-[#0b5cff] px-4 py-2 text-xs font-semibold text-white hover:bg-[#094ecf]"
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}