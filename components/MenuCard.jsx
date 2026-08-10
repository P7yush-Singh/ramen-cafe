"use client";

import { Flame, Leaf, Plus } from "lucide-react";

export default function MenuCard({
  product,
  onCustomize,
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#E5DED2] bg-[#FFFDF8] transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <div className="flex h-47.5">
        {/* Product Image */}
        <div className="relative h-full w-[40%] shrink-0 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          {product.popular && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-[#B83A2E] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-white">
              Popular
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col p-4">
          <div>
            <h3 className="line-clamp-2 text-[17px] font-semibold leading-tight tracking-tight">
              {product.name}
            </h3>

            <p className="mt-2 text-[15px] font-semibold">
              ₹{product.price}
            </p>

            <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-[#6B6258]">
              {product.description}
            </p>
          </div>

          {/* Bottom information */}
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <div className="flex min-w-0 items-center gap-2">
              {/* Veg / Non Veg */}
              {product.isVeg ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-green-700">
                  <span className="flex h-4 w-4 items-center justify-center rounded border border-green-600">
                    <Leaf size={9} />
                  </span>

                  Veg
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-medium text-[#B83A2E]">
                  <span className="flex h-4 w-4 items-center justify-center rounded border border-[#B83A2E]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#B83A2E]" />
                  </span>

                  Non-Veg
                </span>
              )}

              {/* Spice */}
              {product.spicy > 0 && (
                <span className="flex items-center gap-0.5 text-[#B83A2E]">
                  {Array.from({
                    length: product.spicy,
                  }).map((_, index) => (
                    <Flame
                      key={index}
                      size={11}
                      fill="currentColor"
                    />
                  ))}
                </span>
              )}
            </div>

            {/* Customize */}
            <button
              onClick={() => onCustomize(product)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#DED6C9] bg-[#FFFDF8] transition hover:border-[#171513] hover:bg-[#171513] hover:text-white"
              aria-label={`Customize ${product.name}`}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}