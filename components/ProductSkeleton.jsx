"use client";

export default function ProductSkeleton({
  count = 6,
}) {
  return (
    <>
      {Array.from({
        length: count,
      }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-[#E5DED2] bg-[#FFFDF8]"
        >
          <div className="flex h-48 animate-pulse sm:h-52">
            {/* Image */}
            <div className="w-[42%] bg-[#E8E1D6] sm:w-[44%]" />

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
              <div>
                {/* Product name */}
                <div className="h-5 w-3/4 rounded-lg bg-[#E8E1D6]" />

                {/* Price */}
                <div className="mt-3 h-4 w-20 rounded-md bg-[#E8E1D6]" />

                {/* Description */}
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full rounded-md bg-[#E8E1D6]" />
                  <div className="h-3 w-4/5 rounded-md bg-[#E8E1D6]" />
                </div>
              </div>

              {/* Bottom */}
              <div className="flex items-end justify-between gap-3">
                {/* Food type */}
                <div className="h-4 w-16 rounded-md bg-[#E8E1D6]" />

                {/* Add button */}
                <div className="h-10 w-10 rounded-xl bg-[#E8E1D6]" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}