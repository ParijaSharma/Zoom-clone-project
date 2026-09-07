"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  Shield,
  Video,
  Copy,
  Check,
  ArrowLeft,
  Calendar as CalendarIcon,
} from "lucide-react";
import { createMeeting } from "@/lib/api";

export default function SchedulePage() {
  const router = useRouter();

  // Form State
  const [topic, setTopic] = useState("Parija Sharma's Scheduled Meeting");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("14:00");
  const [duration, setDuration] = useState("45");
  const [passcode, setPasscode] = useState("zoom123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Success State
  const [scheduledMeeting, setScheduledMeeting] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleSchedule(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const scheduledDateTime = new Date(`${date}T${time}:00`);

      const res = await createMeeting({
        title: topic,
        description: description || undefined,
        scheduled_at: scheduledDateTime.toISOString(),
        duration: parseInt(duration, 10),
        host_name: "Parija Sharma",
        passcode: passcode || undefined,
      });

      setScheduledMeeting(res);
    } catch (err) {
      console.error("Failed to schedule meeting:", err);
      setError(err.message || "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyInvite() {
    if (!scheduledMeeting) return;
    const inviteText = `Parija Sharma is inviting you to a scheduled Zoom meeting.\n\nTopic: ${scheduledMeeting.title}\nTime: ${new Date(
      scheduledMeeting.scheduled_at
    ).toLocaleString()}\n\nJoin Zoom Meeting:\n${scheduledMeeting.invite_link}\n\nMeeting ID: ${
      scheduledMeeting.meeting_id
    }\nPasscode: ${scheduledMeeting.passcode || "None"}`;

    navigator.clipboard.writeText(inviteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-gray-900 transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Schedule a Meeting</h1>
        </div>
      </div>

      {scheduledMeeting ? (
        /* SUCCESS CONFIRMATION MODAL CARD */
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3 text-green-600">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Check size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Meeting Scheduled!</h2>
          </div>

          <div className="mt-6 space-y-4 rounded-2xl bg-gray-50 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Topic</p>
              <p className="text-base font-bold text-gray-900">{scheduledMeeting.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Date & Time</p>
                <p className="text-sm font-medium text-gray-800">
                  {new Date(scheduledMeeting.scheduled_at).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Duration</p>
                <p className="text-sm font-medium text-gray-800">{scheduledMeeting.duration} minutes</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Meeting ID</p>
                <p className="font-mono text-base font-bold text-[#0b5cff]">
                  {scheduledMeeting.meeting_id}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Passcode</p>
                <p className="font-mono text-sm font-medium text-gray-700">
                  {scheduledMeeting.passcode || "None"}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Invite Link</p>
              <p className="mt-1 truncate font-mono text-xs text-blue-600 bg-white p-2 rounded-lg border border-gray-200">
                {scheduledMeeting.invite_link}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={handleCopyInvite}
              className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              <span>{copied ? "Invitation Copied!" : "Copy Full Invitation"}</span>
            </button>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                Back to Dashboard
              </Link>
              <Link
                href={`/meeting/${scheduledMeeting.meeting_id}?isHost=true`}
                className="rounded-xl bg-[#0b5cff] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#094ecf]"
              >
                Start Meeting Now
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* SCHEDULING FORM */
        <form
          onSubmit={handleSchedule}
          className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm space-y-6"
        >
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* TOPIC */}
          <div>
            <label className="block text-sm font-semibold text-gray-800">
              Topic
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#0b5cff] focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="e.g. Weekly Standup, Project Discussion"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-semibold text-gray-800">
              Description <span className="text-xs font-normal text-gray-400">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#0b5cff] focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Enter meeting agenda or brief description"
            />
          </div>

          {/* WHEN (DATE & TIME) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                Date
              </label>
              <div className="relative mt-1.5">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#0b5cff] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800">
                Time
              </label>
              <div className="relative mt-1.5">
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#0b5cff] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* DURATION */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-[#0b5cff] focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800">
                Time Zone
              </label>
              <input
                type="text"
                disabled
                value="(GMT+5:30) India Standard Time"
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* SECURITY & PASSCODE */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Shield size={16} className="text-[#0b5cff]" /> Security
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700">Passcode</label>
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#0b5cff] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="waitingRoom"
                  defaultChecked
                  className="h-4 w-4 rounded text-[#0b5cff] focus:ring-blue-400"
                />
                <label htmlFor="waitingRoom" className="text-xs font-medium text-gray-700">
                  Enable Waiting Room
                </label>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
            <Link
              href="/"
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#0b5cff] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#094ecf] disabled:opacity-50"
            >
              {loading ? "Scheduling..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}