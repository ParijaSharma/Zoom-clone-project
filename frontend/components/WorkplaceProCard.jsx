"use client";

export default function WorkplaceProCard() {
  return (
    <section className="w-full rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {/* HEADER */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0b5cff] text-[10px] font-bold text-white">
          zoom
        </div>

        <span className="text-[14px] font-semibold text-[#0b5cff]">
          Workplace Pro
        </span>
      </div>

      {/* TITLE */}
      <h2 className="mt-3 text-[22px] font-bold text-gray-900">
        Upgrade and save!
      </h2>

      {/* GRAPHIC BANNER */}
      <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c66ee] to-[#043382] p-4 shadow-inner">
        
        {/* VIDEO CONTAINER */}
        <div className="relative mx-auto max-w-[340px] rounded-xl bg-[#09224f] p-3">
          
          {/* MAIN VIDEO TILE */}
          <div className="relative h-[170px] w-full overflow-hidden rounded-xl bg-gray-900">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&h=450&q=80"
              alt="Sydney Doe"
              className="h-full w-full object-cover"
              style={{
                objectPosition: "center 20%",
              }}
            />

            {/* LEFT REACTION */}
            <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-sm shadow">
              😊
            </div>

            {/* RIGHT REACTION */}
            <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-sm shadow">
              👍
            </div>

            {/* NAME */}
            <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
              Sydney Doe
            </div>
          </div>

          {/* BOTTOM VIDEO ROW */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            
            {/* DAVID */}
            <div className="relative h-[82px] overflow-hidden rounded-xl bg-gray-900">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&h=300&q=80"
                alt="David K."
                className="h-full w-full object-cover"
                style={{
                  objectPosition: "center 20%",
                }}
              />

              <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[9px] font-medium text-white">
                David K.
              </span>
            </div>

            {/* SARAH */}
            <div className="relative h-[82px] overflow-hidden rounded-xl bg-gray-900">
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&h=300&q=80"
                alt="Sarah M."
                className="h-full w-full object-cover"
                style={{
                  objectPosition: "center 20%",
                }}
              />

              <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[9px] font-medium text-white">
                Sarah M.
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      <p className="mt-4 text-[13px] leading-relaxed text-gray-600">
        Unlock savings up to 16% when you select an annual Zoom Workplace Pro
        plan.
      </p>

      {/* BUTTON */}
      <button className="mt-4 w-full rounded-xl bg-[#0b5cff] py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#094ecf] active:scale-[0.99]">
        Upgrade today
      </button>
    </section>
  );
}