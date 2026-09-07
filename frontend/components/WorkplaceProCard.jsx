"use client";

import { Sparkles } from "lucide-react";

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
          {/* Mock Video Grid Preview matching Zoom screenshot */}
          <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-t from-black/60 to-transparent">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80"
              alt="Participant"
              className="h-48 w-full object-cover"
            />
            <div className="absolute left-2 top-2 rounded-full bg-yellow-400 p-1 text-xs">
              😊
            </div>
            <div className="absolute right-2 top-2 rounded-full bg-yellow-400 p-1 text-xs">
              👍
            </div>
            <div className="absolute bottom-1.5 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
              Sydney Doe
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative h-16 overflow-hidden rounded-lg bg-gray-800">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                alt="Participant"
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1 left-1.5 rounded bg-black/50 px-1 text-[9px] text-white">
                David K.
              </span>
            </div>
            <div className="relative h-16 overflow-hidden rounded-lg bg-gray-800">
              <img
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80"
                alt="Participant"
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1 left-1.5 rounded bg-black/50 px-1 text-[9px] text-white">
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
