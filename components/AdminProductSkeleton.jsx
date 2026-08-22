"use client";

export default function AdminProductSkeleton({
  count = 6,
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-[#E5DED2] bg-[#FFFDF8]">
      <div className="divide-y divide-[#E5DED2]">
        {Array.from({
          length: count,
        }).map((_, index) => (
          <div
            key={index}
            className="flex animate-pulse items-center gap-4 px-5 py-4"
          >
            {/* Product image */}
            <div className="h-14 w-14 shrink-0 rounded-xl bg-[#E8E1D6]" />

            {/* Product information */}
            <div className="min-w-0 flex-1">
              <div className="h-4 w-40 rounded-md bg-[#E8E1D6]" />

              <div className="mt-2 h-3 w-28 rounded-md bg-[#E8E1D6]" />
            </div>

            {/* Category */}
            <div className="hidden h-4 w-20 rounded-md bg-[#E8E1D6] sm:block" />

            {/* Price */}
            <div className="hidden h-4 w-16 rounded-md bg-[#E8E1D6] sm:block" />

            {/* Status */}
            <div className="h-7 w-20 rounded-full bg-[#E8E1D6]" />

            {/* Action */}
            <div className="h-9 w-9 rounded-lg bg-[#E8E1D6]" />
          </div>
        ))}
      </div>
    </div>
  );
}