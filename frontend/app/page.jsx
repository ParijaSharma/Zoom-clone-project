import ProfileCard from "@/components/ProfileCard";
import QuickActions from "@/components/QuickActions";
import WorkplaceProCard from "@/components/WorkplaceProCard";
import MeetingsPanel from "@/components/MeetingsPanel";
import RecentActivity from "@/components/RecentActivity";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1240px] pb-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN (2/3 WIDTH) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Card */}
          <ProfileCard />

          {/* Workplace Pro Promo Card */}
          <WorkplaceProCard />

          {/* Recent Activity Card */}
          <RecentActivity />
        </div>

        {/* RIGHT COLUMN (1/3 WIDTH) */}
        <div className="space-y-6">
          {/* Quick Actions (Schedule, Join, Host) */}
          <QuickActions />

          {/* Upcoming Meetings Panel */}
          <MeetingsPanel />
        </div>
      </div>
    </div>
  );
}