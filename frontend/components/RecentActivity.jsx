"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, FileText, Check, Clock, Video } from "lucide-react";
import { getMeetings } from "@/lib/api";

export default function RecentActivity() {
  const [recentMeetings, setRecentMeetings] = useState([]);

  useEffect(() => {
    async function loadRecent() {
      try {
        const data = await getMeetings("recent");
        setRecentMeetings(data || []);
      } catch (err) {
        console.error("Failed to load recent meetings", err);
      }
    }
    loadRecent();
  }, []);

  return (
    <section className="min-h-[340px] rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold text-gray-900">
          Recent activity
        </h2>
        <span className="text-[12px] text-gray-400">Synced live</span>
      </div>

      <div className="mt-4 border-t border-gray-100" />

      {/* ZOOM DOCS WELCOME CARD (Exact match from screenshot) */}
      <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-100 bg-[#f9fafc] p-4 transition hover:bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-2xl shadow-sm">
            👋
          </div>

          <div>
            <h3 className="text-[15px] font-bold text-[#0b5cff] hover:underline cursor-pointer">
              Welcome to Zoom Docs, Parija Sharma!
            </h3>
            <p className="mt-0.5 text-[12px] text-gray-500">
              Created by <span className="font-medium text-gray-700">Parija Sharma</span>
            </p>
            <p className="text-[11px] text-gray-400">
              Just started • 0 Docs
            </p>
          </div>
        </div>

        <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* RECENT MEETINGS HISTORY */}
      <div className="mt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Past Meetings
        </h4>

        <div className="mt-2 space-y-2">
          {recentMeetings.length > 0 ? (
            recentMeetings.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <Video size={16} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-800">
                      {m.title}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      ID: {m.meeting_id} • Status: {m.status}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/meeting/${m.meeting_id}`}
                  className="rounded-lg border border-gray-200 px-3 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Reopen
                </Link>
              </div>
            ))
          ) : (
            <p className="py-2 text-xs text-gray-400">No previous meetings recorded.</p>
          )}
        </div>
      </div>
    </section>
  );
}