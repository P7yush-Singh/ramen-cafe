"use client";

import {
  Flame,
  Leaf,
  Plus,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";

export default function MenuCard({
  product,
  onCustomize,
}) {
  const [imageError, setImageError] =
    useState(false);

  const imageUrl =
    typeof product?.image ===
      "string"
      ? product.image.trim()
      : "";

  const normalizedFoodType =
    String(
      product?.foodType || ""
    )
      .trim()
      .toLowerCase();

  const isVeg =
    normalizedFoodType
      ? normalizedFoodType ===
        "veg"
      : product?.isVeg === true;

  const isPopular =
    product?.isPopular === true ||
    product?.popular === true;

  const spiceCount =
    Number(product?.spicy || 0);

  const showImage =
    Boolean(imageUrl) &&
    !imageError;

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#E5DED2] bg-[#FFFDF8] transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <div className="flex h-47.5">
        {/* Product Image */}
        <div className="relative h-full w-[40%] shrink-0 overflow-hidden bg-[#F5F0E8]">
          {showImage ? (
            <img
              src={imageUrl}
              alt={product?.name || "Menu item"}
              onError={() =>
                setImageError(true)
              }
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#8A8177]">
              <UtensilsCrossed
                size={42}
                strokeWidth={1.4}
              />
              <span className="text-[9px] font-medium uppercase tracking-[0.12em]">
                Ramen Cafe
              </span>
            </div>
          )}

          {isPopular && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-[#B83A2E] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-white">
              Popular
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col p-4">
          <div>
            <h3 className="line-clamp-2 text-[17px] font-semibold leading-tight tracking-tight">
              {product?.name}
            </h3>

            <p className="mt-2 text-[15px] font-semibold">
              ₹{product?.price}
            </p>

            <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-[#6B6258]">
              {product?.description ||
                "Freshly prepared at Ramen Cafe."}
            </p>
          </div>

          {/* Bottom information */}
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <div className="flex min-w-0 items-center gap-2">
              {/* Veg / Non Veg */}
              {isVeg ? (
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
              {spiceCount > 0 && (
                <span className="flex items-center gap-0.5 text-[#B83A2E]">
                  {Array.from({
                    length: Math.min(
                      spiceCount,
                      3
                    ),
                  }).map(
                    (_, index) => (
                      <Flame
                        key={index}
                        size={11}
                        fill="currentColor"
                      />
                    )
                  )}
                </span>
              )}
            </div>

            <button
              onClick={() =>
                onCustomize?.(product)
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#DED6C9] bg-[#FFFDF8] transition hover:border-[#171513] hover:bg-[#171513] hover:text-white"
              aria-label={`Customize ${
                product?.name ||
                "product"
              }`}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
