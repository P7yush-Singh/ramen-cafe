"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Check,
} from "lucide-react";

export default function ProductDetails({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [noodle, setNoodle] = useState("Regular");
  const [spice, setSpice] = useState("Medium");
  const [selectedAddons, setSelectedAddons] = useState([]);

  const addons = [
    {
      id: "extra-egg",
      name: "Extra Egg",
      price: 40,
    },
    {
      id: "extra-chashu",
      name: "Extra Chashu",
      price: 80,
    },
    {
      id: "extra-noodles",
      name: "Extra Noodles",
      price: 50,
    },
    {
      id: "corn",
      name: "Sweet Corn",
      price: 30,
    },
  ];

  const addonTotal = useMemo(() => {
    return selectedAddons.reduce((total, addonId) => {
      const addon = addons.find((item) => item.id === addonId);

      return total + (addon?.price || 0);
    }, 0);
  }, [selectedAddons]);

  const total = (product.price + addonTotal) * quantity;

  function toggleAddon(addonId) {
    setSelectedAddons((current) =>
      current.includes(addonId)
        ? current.filter((id) => id !== addonId)
        : [...current, addonId]
    );
  }

  function addToCart() {
    const existingCart = JSON.parse(
      localStorage.getItem("ramen-cart") || "[]"
    );

    const selectedAddonObjects = addons.filter((addon) =>
      selectedAddons.includes(addon.id)
    );

    const cartItem = {
      cartItemId: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      image: product.image,
      basePrice: product.price,
      quantity,
      noodle,
      spice,
      addons: selectedAddonObjects,
      total,
    };

    existingCart.push(cartItem);

    localStorage.setItem(
      "ramen-cart",
      JSON.stringify(existingCart)
    );

    localStorage.setItem(
      "ramen-cart-updated",
      Date.now().toString()
    );

    window.location.href = "/cart";
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8] pb-28 lg:pb-10">
      {/* Header */}
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

      {/* Product */}
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Image */}
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

          {/* Details */}
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

            <p className="mt-6 text-base leading-7 text-[#6B6258]">
              {product.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {product.isVeg && (
                <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800">
                  Vegetarian
                </span>
              )}

              {product.spicy > 0 && (
                <span className="rounded-full bg-[#B83A2E]/10 px-3 py-1.5 text-xs font-medium text-[#B83A2E]">
                  {"🌶️".repeat(product.spicy)} Spicy
                </span>
              )}

              <span className="rounded-full bg-[#FFFDF8] px-3 py-1.5 text-xs font-medium text-[#6B6258]">
                Freshly prepared
              </span>
            </div>

            {/* Noodles */}
            {product.category === "ramen" && (
              <>
                <div className="mt-9 border-t border-[#DED6C9] pt-7">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">
                      Choose your noodles
                    </h2>

                    <span className="text-xs text-[#6B6258]">
                      Required
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {["Regular", "Thin", "Thick"].map((item) => (
                      <button
                        key={item}
                        onClick={() => setNoodle(item)}
                        className={`rounded-xl border px-3 py-3 text-sm transition ${
                          noodle === item
                            ? "border-[#171513] bg-[#171513] text-white"
                            : "border-[#DED6C9] bg-[#FFFDF8] hover:border-[#171513]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spice */}
                <div className="mt-7">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">
                      Spice level
                    </h2>

                    <span className="text-xs text-[#6B6258]">
                      Required
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {["Mild", "Medium", "Hot"].map((item) => (
                      <button
                        key={item}
                        onClick={() => setSpice(item)}
                        className={`rounded-xl border px-3 py-3 text-sm transition ${
                          spice === item
                            ? "border-[#171513] bg-[#171513] text-white"
                            : "border-[#DED6C9] bg-[#FFFDF8] hover:border-[#171513]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Add-ons */}
            <div className="mt-7 border-t border-[#DED6C9] pt-7">
              <h2 className="font-semibold">
                Make it yours
              </h2>

              <div className="mt-4 space-y-2">
                {addons.map((addon) => {
                  const selected = selectedAddons.includes(addon.id);

                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-[#171513] bg-[#FFFDF8]"
                          : "border-[#DED6C9] bg-transparent hover:bg-[#FFFDF8]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                            selected
                              ? "border-[#B83A2E] bg-[#B83A2E] text-white"
                              : "border-[#B8B0A5]"
                          }`}
                        >
                          {selected && <Check size={13} />}
                        </div>

                        <span className="text-sm font-medium">
                          {addon.name}
                        </span>
                      </div>

                      <span className="text-sm text-[#6B6258]">
                        +₹{addon.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-7 flex items-center justify-between border-t border-[#DED6C9] pt-7">
              <span className="font-semibold">Quantity</span>

              <div className="flex items-center rounded-full border border-[#DED6C9] bg-[#FFFDF8]">
                <button
                  onClick={() =>
                    setQuantity((value) => Math.max(1, value - 1))
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-[#F5F0E8]"
                >
                  <Minus size={16} />
                </button>

                <span className="w-10 text-center text-sm font-semibold">
                  {quantity}
                </span>

                <button
                  onClick={() =>
                    setQuantity((value) => value + 1)
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-[#F5F0E8]"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add */}
            <div className="mt-7">
              <button
                onClick={addToCart}
                className="flex w-full items-center justify-between rounded-2xl bg-[#B83A2E] px-6 py-5 text-white transition hover:bg-[#171513]"
              >
                <span className="font-semibold">
                  Add to Cart
                </span>

                <span className="font-semibold">
                  ₹{total}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}