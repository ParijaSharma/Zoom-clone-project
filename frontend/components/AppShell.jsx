"use client";

import { usePathname } from "next/navigation";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default function AppShell({ children }) {
  const pathname = usePathname();

  // If inside an active meeting room (/meeting/[id]), render full-screen immersive Zoom layout
  const isMeetingRoom =
    pathname.startsWith("/meeting/") && pathname.split("/").length >= 3;

  if (isMeetingRoom) {
    return (
      <main className="h-screen w-screen overflow-hidden bg-[#1a1a1a] text-white">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* TOP BAR */}
      <TopBar />

      {/* SIDEBAR + CONTENT */}
      <div className="flex flex-1">
        {/* SIDEBAR */}
        <Sidebar />

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1 bg-[#f7f8fc] px-8 py-7">
          {children}
        </main>
      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
