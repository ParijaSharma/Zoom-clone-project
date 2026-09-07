"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Loader2 } from "lucide-react";
import { createMeeting } from "@/lib/api";

export default function MeetingPage() {
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    async function startInstantMeeting() {
      try {
        const meeting = await createMeeting({
          title: "Parija Sharma's Instant Meeting",
          description: "Instant video conferencing room generated via Zoom Web App",
          duration: 45,
          host_name: "Parija Sharma",
        });

        if (meeting && meeting.meeting_id) {
          router.push(`/meeting/${meeting.meeting_id}?isHost=true`);
        } else {
          throw new Error("Invalid meeting response from server");
        }
      } catch (err) {
        console.error("Error creating instant meeting:", err);
        setError(err.message || "Failed to start meeting");
      }
    }

    startInstantMeeting();
  }, [router]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="rounded-3xl bg-white p-10 shadow-lg max-w-md w-full border border-gray-100">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f97316] text-white shadow-md">
          <Video size={32} />
        </div>

        {error ? (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-red-600">Failed to start meeting</h2>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-[#0b5cff] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#094ecf]"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin text-[#0b5cff]" size={20} />
              <h2 className="text-xl font-bold text-gray-900">Starting Zoom Meeting</h2>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Generating your unique meeting ID and provisioning real-time room...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}