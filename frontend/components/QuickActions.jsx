"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Video, Copy, Check } from "lucide-react";

export default function QuickActions() {
  const [copied, setCopied] = useState(false);
  const pmi = "266 426 0040";

  function handleCopyPMI() {
    navigator.clipboard.writeText("http://localhost:3000/meeting/2664260040");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {/* Schedule */}
        <Link
          href="/schedule"
          className="group flex flex-col items-center transition"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b75ed] text-white shadow-sm transition group-hover:scale-105 group-hover:bg-[#0962c9]">
            <CalendarDays size={22} strokeWidth={2} />
          </div>
          <span className="mt-2 text-xs font-semibold text-gray-700 group-hover:text-blue-600">
            Schedule
          </span>
        </Link>

        {/* Join */}
        <Link
          href="/join"
          className="group flex flex-col items-center transition"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b75ed] text-white shadow-sm transition group-hover:scale-105 group-hover:bg-[#0962c9]">
            <Plus size={24} strokeWidth={2.2} />
          </div>
          <span className="mt-2 text-xs font-semibold text-gray-700 group-hover:text-blue-600">
            Join
          </span>
        </Link>

        {/* Host (New Meeting) */}
        <Link
          href="/meeting"
          className="group flex flex-col items-center transition"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f97316] text-white shadow-sm transition group-hover:scale-105 group-hover:bg-[#ea580c]">
            <Video size={22} strokeWidth={2} />
          </div>
          <span className="mt-2 text-xs font-semibold text-gray-700 group-hover:text-orange-600">
            Host
          </span>
        </Link>
      </div>

      {/* Personal Meeting ID */}
      <div className="mt-8 border-t border-gray-100 pt-5 text-center">
        <p className="text-[12px] font-medium text-gray-500">
          Personal Meeting ID
        </p>
        <button
          onClick={handleCopyPMI}
          className="mt-1 inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-[15px] font-semibold text-gray-800 hover:bg-gray-100 transition"
          title="Click to copy invite link"
        >
          <span>{pmi}</span>
          {copied ? (
            <Check size={16} className="text-green-600" />
          ) : (
            <Copy size={16} className="text-gray-400" />
          )}
        </button>
        {copied && (
          <p className="mt-1 text-[11px] font-medium text-green-600 animate-in fade-in">
            Invite link copied to clipboard!
          </p>
        )}
      </div>
    </section>
  );
}