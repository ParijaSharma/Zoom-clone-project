"use client";

import Link from "next/link";
import {
  Search,
  ChevronDown,
  CalendarDays,
  Plus,
  Video,
  ExternalLink,
  Copy,
  Box,
} from "lucide-react";
const menuItems = [
  { name: "Home", href: "/", active: true },
  { name: "AI", href: "#" },
  { name: "Meetings", href: "/meeting" },
  { name: "Recordings", href: "#" },
  { name: "Summaries", href: "#" },
  { name: "Hub", href: "#" },
  { name: "Whiteboards", href: "#" },
  { name: "Notes", href: "#" },
  { name: "Clips", href: "#" },
  { name: "Canvas", href: "#" },
  { name: "Paper", href: "#" },
  { name: "Sheets", href: "#" },
  { name: "Slides", href: "#" },
  { name: "Tasks", href: "#" },
  { name: "Scheduler", href: "#" },
];

export default function Sidebar() {
  return (
    <aside className="w-[300px] shrink-0 overflow-y-auto border-r border-gray-200 bg-[#f0f2f7] py-4">
      <nav className="px-3">
       
        <div className="space-y-0.5">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex h-8 items-center justify-between rounded-md px-3 text-[13px] transition ${
                item.active
                  ? "bg-[#e6f0ff] font-medium text-[#0b5cff]"
                  : "text-[#1f2937] hover:bg-gray-100"
              }`}
            >
              <span>{item.name}</span>

              {(item.name === "AI" || item.name === "Hub") && (
                <span className="flex items-center gap-1">
                  <span className="rounded border border-[#a8c7ff] px-1 text-[9px] text-[#0b5cff]">
                    New
                  </span>
                  <ExternalLink size={14} strokeWidth={1.8} className="text-gray-400" />
                </span>
              )}

              {[
                "Whiteboards",
                "Notes",
                "Clips",
                "Canvas",
                "Paper",
                "Sheets",
                "Slides",
                "Tasks",
                "Scheduler",
              ].includes(item.name) && (
                <ExternalLink size={14} strokeWidth={1.8} />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}