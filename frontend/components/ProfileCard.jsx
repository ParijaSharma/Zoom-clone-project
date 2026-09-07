export default function ProfileCard() {
  return (
    <section className="w-full rounded-xl bg-white px-6 py-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">

      {/* PROFILE */}
      <div className="flex items-center gap-6">

        {/* Avatar */}
        <div className="flex h-[80px] w-[80px] shrink-0 items-center justify-center rounded-[20px] bg-[#8054c7] text-[34px]  text-white">
          P
        </div>

        {/* User Info */}
        <div>
          <h1 className="text-[25px] font-bold leading-tight text-[#111827] line-clamp-1">
            Parija Sharma
          </h1>

          <p className="mt-1 text-[13px]  text-[#4b5563]">
            Plan:{" "}
            <span className="font-semibold text-[#111827]">
              Workplace Basic
            </span>
          </p>
        </div>

      </div>

      {/* ACTIONS */}
      <div className="mt-8 flex flex-col gap-3">

        <button
          className="
            w-full
            rounded-4xl
            bg-[#f1f2f4]
            py-2
            text-[15px]
            font-small
            text-[#17345f]
            hover:text-[#17345f]

          "
        >
          Manage Plan
        </button>

        <button
          className="
            w-full
            rounded-4xl
            bg-[#f1f2f4]
            py-2
            text-[15px]
            font-small
            text-[#17345f]
            hover:bg-[#e9eaec]
            hover:text-[#17345f]
          "
        >
          View Plan Details
        </button>

      </div>

    </section>
  );
}