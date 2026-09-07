export default function Footer() {
  return (
    <footer className="bg-[#34364f] px-8 py-10 text-white">
      
      <div className="mx-auto grid max-w-[1250px] grid-cols-2 gap-8 md:grid-cols-4">
        
        {/* ABOUT */}
        <div>
          <h3 className="mb-4 text-[13px] font-semibold">
            About
          </h3>

          <div className="space-y-2 text-[12px] text-gray-200">
            <p>Zoom Blog</p>
            <p>Customers</p>
            <p>Our Team</p>
            <p>Careers</p>
            <p>Integrations</p>
            <p>Partners</p>
            <p>Investors</p>
            <p>Press</p>
          </div>
        </div>

        {/* DOWNLOAD */}
        <div>
          <h3 className="mb-4 text-[13px] font-semibold">
            Download
          </h3>

          <div className="space-y-2 text-[12px] text-gray-200">
            <p>Zoom Workplace App</p>
            <p>Zoom Rooms Client</p>
            <p>Browser Extension</p>
            <p>Outlook Plug-in</p>
            <p>Android App</p>
          </div>
        </div>

        {/* SALES */}
        <div>
          <h3 className="mb-4 text-[13px] font-semibold">
            Sales
          </h3>

          <div className="space-y-2 text-[12px] text-gray-200">
            <p>Contact Sales</p>
            <p>Plans & Pricing</p>
            <p>Request a Demo</p>
            <p>Webinars and Events</p>
          </div>
        </div>

        {/* SUPPORT */}
        <div>
          <h3 className="mb-4 text-[13px] font-semibold">
            Support
          </h3>

          <div className="space-y-2 text-[12px] text-gray-200">
            <p>Test Zoom</p>
            <p>Account</p>
            <p>Support Center</p>
            <p>Learning Center</p>
            <p>Feedback</p>
            <p>Contact Us</p>
          </div>
        </div>

      </div>

      <div className="mx-auto mt-10 max-w-[1250px] border-t border-white/10 pt-5 text-[11px] text-gray-300">
        Copyright © 2026 Zoom Clone. All rights reserved.
      </div>

    </footer>
  );
}