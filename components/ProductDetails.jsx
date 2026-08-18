"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  Leaf,
  Flame,
} from "lucide-react";

import ProductCustomization from "@/components/ProductCustomization";

export default function ProductDetails({ product }) {
  const [showCustomization, setShowCustomization] =
    useState(false);

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F0E8]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">
            Product not found
          </h1>

          <Link
            href="/menu"
            className="mt-4 inline-flex rounded-xl bg-[#B83A2E] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8] pb-28 lg:pb-10">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-[#DED6C9]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link
            href="/menu"
            className="flex items-center gap-2 text-sm text-[#6B6258] transition hover:text-[#171513]"
          >
            <ArrowLeft size={17} />

            Back to Menu
          </Link>

          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-full border border-[#DED6C9] bg-[#FFFDF8] px-4 py-2.5 text-sm font-medium"
          >
            <ShoppingBag size={17} />

            Cart
          </Link>
        </div>
      </header>

      {/* =====================================================
          PRODUCT
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">

          {/* =================================================
              IMAGE
          ================================================== */}

          <div className="relative">
            <div className="overflow-hidden rounded-4xl bg-[#FFFDF8]">
              <img
                src={product.image}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            </div>

            {product.popular && (
              <div className="absolute left-5 top-5 rounded-full bg-[#B83A2E] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white">
                Popular
              </div>
            )}
          </div>

          {/* =================================================
              DETAILS
          ================================================== */}

          <div className="lg:py-4">

            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B83A2E]">
                  {product.category}
                </p>

                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                  {product.name}
                </h1>
              </div>

              <span className="shrink-0 text-xl font-semibold">
                ₹{product.price}
              </span>
            </div>

            {/* Description */}

            <p className="mt-6 text-base leading-7 text-[#6B6258]">
              {product.description}
            </p>

            {/* =================================================
                TAGS
            ================================================== */}

            <div className="mt-5 flex flex-wrap gap-2">

              {product.isVeg && (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800">
                  <Leaf size={13} />
                  Vegetarian
                </span>
              )}

              {product.spicy > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-[#B83A2E]/10 px-3 py-1.5 text-xs font-medium text-[#B83A2E]">
                  <Flame size={13} />

                  {"🌶️".repeat(product.spicy)}

                  {" "}
                  Spicy
                </span>
              )}

              <span className="rounded-full bg-[#FFFDF8] px-3 py-1.5 text-xs font-medium text-[#6B6258]">
                Freshly prepared
              </span>
            </div>

            {/* =================================================
                CUSTOMIZE BUTTON
            ================================================== */}

            <div className="mt-9 border-t border-[#DED6C9] pt-7">
              <button
                onClick={() =>
                  setShowCustomization(true)
                }
                className="flex w-full items-center justify-between rounded-2xl bg-[#B83A2E] px-6 py-5 text-white transition hover:bg-[#171513]"
              >
                <span className="font-semibold">
                  Customize & Add to Cart
                </span>

                <span className="font-semibold">
                  From ₹{product.price}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CUSTOMIZATION
      ====================================================== */}

      {showCustomization && (
        <ProductCustomization
          product={product}
          mode="mobile"
          onClose={() =>
            setShowCustomization(false)
          }
          onAdded={() =>
            setShowCustomization(false)
          }
        />
      )}
    </main>
  );
}