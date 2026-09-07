"use client";

export default function WorkplaceProCard() {
  return (
    <section className="w-full rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {/* HEADER */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0b5cff] text-white text-[11px] font-bold">
          zoom
        </div>
        <span className="text-[14px] font-semibold text-[#0b5cff]">
          Workplace Pro
        </span>
      </div>

      <h2 className="mt-3 text-[22px] font-bold text-gray-900">
        Upgrade and save!
      </h2>

      {/* GRAPHIC BANNER */}
      <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c66ee] to-[#043382] p-4 text-white shadow-inner">
        <div className="relative mx-auto flex max-w-[340px] flex-col gap-2 rounded-xl bg-[#09224f]/80 p-3 backdrop-blur-sm">
          
                    {/* TOP VIDEO TILE (Sydney Doe) */}
          <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl bg-gray-900">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&crop=face&w=600&h=320&q=80"
              alt="Sydney Doe"
              className="h-full w-full"
              style={{ objectFit: "cover", objectPosition: "top" }}
            />

            {/* Reactions Emojis */}
            <div className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-sm shadow">
              😊
            </div>
            <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-sm shadow">
              👍
            </div>

            {/* Name Tag */}
            <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
              Sydney Doe
            </div>
          </div>

          {/* BOTTOM ROW (2 TILES) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Tile 1 - David K. */}
            <div className="relative h-20 w-full overflow-hidden rounded-xl bg-gray-900">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&crop=face&w=300&h=180&q=80"
                alt="David K."
                className="h-full w-full"
                style={{ objectFit: "cover", objectPosition: "top" }}
              />
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                David K.
              </span>
            </div>

            {/* Tile 2 - Sarah M. */}
            <div className="relative h-20 w-full overflow-hidden rounded-xl bg-gray-900">
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&crop=face&w=300&h=180&q=80"
                alt="Sarah M."
                className="h-full w-full"
                style={{ objectFit: "cover", objectPosition: "top" }}
              />
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                Sarah M.
              </span>
            </div>
          </div>

          {/* BOTTOM ROW (2 TILES) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Tile 1 - Man with Glasses */}
            <div className="relative h-20 overflow-hidden rounded-xl bg-gray-900">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&crop=faces&w=300&h=200&q=80"
                alt="David K."
                className="h-full w-full object-cover object-[center_20%]"
              />
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                David K.
              </span>
            </div>

            {/* Tile 2 - Woman with Glasses */}
            <div className="relative h-20 overflow-hidden rounded-xl bg-gray-900">
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&crop=faces&w=300&h=200&q=80"
                alt="Sarah M."
                className="h-full w-full object-cover object-[center_20%]"
              />
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                Sarah M.
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* DESCRIPTION & CTA */}
      <p className="mt-4 text-[13px] leading-relaxed text-gray-600">
        Unlock savings up to 16% when you select an annual Zoom Workplace Pro plan.
      </p>

      <button className="mt-4 w-full rounded-xl bg-[#0b5cff] py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#094ecf] active:scale-[0.99]">
        Upgrade today
      </button>
    </section>
  );
}