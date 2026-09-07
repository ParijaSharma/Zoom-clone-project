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
export default function TopBar() {
  return (
    <header className="w-full shrink-0">
      {/* DARK BLUE TOP BAR */}
      <div className="h-10 bg-[#040425] text-white shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
        <div className="flex h-full items-center justify-end gap-7 px-6 text-[0.900rem] font-normal">
          <button className="flex items-center gap-1.5 hover:text-blue-300">
            <span className="text-sm"><Search /></span>
            Search
          </button>
          <button className="hover:text-blue-300">Support</button>
          <span>0008000503335</span>
          <div className="h-4 w-px bg-gray-600" />
          <button className="hover:text-blue-300">Contact Sales</button>
          <button className="hover:text-blue-300">Request a Demo</button>
        </div>
      </div>

      {/* MAIN WHITE NAVBAR */}
      <div className="h-16 border-b border-gray-200 bg-white">
        <div className="flex h-full items-center justify-between px-6">
          {/* LEFT SECTION */}
          <div className="flex items-center gap-8">
            {/* ZOOM LOGO */}
            <div className="text-4xl font-bold tracking-tighter text-[#0b5cff]">
              <img src="https://us05st1.zoom.us/static/26.8.66084/image/new/topNav/Zoom_logo.svg" alt="" />
            </div>

            <nav className="flex items-center gap-8 text-m font-large font-medium text-[#727389]">
              <button className="whitespace-nowrap hover:text-[#0b5cff]">Products</button>
              <button className="whitespace-nowrap hover:text-[#0b5cff]">Solutions</button>
              <button className="whitespace-nowrap hover:text-[#0b5cff]">Resources</button>
              <button className="whitespace-nowrap hover:text-[#0b5cff]">Plans & Pricing</button>
            </nav>
          </div>

          {/* RIGHT SECTION */}
          <nav className="flex items-center gap-8 text-m font-large font-medium text-[#727389]">
            <button className="whitespace-nowrap hover:text-[#0b5cff]">Schedule</button>
            <button className="whitespace-nowrap hover:text-[#0b5cff]">Join</button>
            <button className="flex items-center gap-1 whitespace-nowrap hover:text-[#0b5cff]">
              Host <ChevronDown size={14} strokeWidth={2} />
            </button>
            <button className="flex items-center gap-1 whitespace-nowrap hover:text-[#0b5cff]">
              Web App <ChevronDown size={14} strokeWidth={2} />
            </button>

            {/* PROFILE AVATAR */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8154c7] text-m font-bold text-white">
              P
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}