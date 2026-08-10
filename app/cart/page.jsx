"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
} from "lucide-react";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedCart = JSON.parse(
      localStorage.getItem("ramen-cart") || "[]"
    );

    setCart(savedCart);
    setLoaded(true);
  }, []);

  function saveCart(updatedCart) {
    setCart(updatedCart);

    localStorage.setItem(
      "ramen-cart",
      JSON.stringify(updatedCart)
    );

    localStorage.setItem(
      "ramen-cart-updated",
      Date.now().toString()
    );
  }

  function updateQuantity(cartItemId, change) {
    const updated = cart.map((item) => {
      if (item.cartItemId !== cartItemId) {
        return item;
      }

      const quantity = Math.max(
        1,
        item.quantity + change
      );

      const addonTotal = item.addons.reduce(
        (sum, addon) => sum + addon.price,
        0
      );

      return {
        ...item,
        quantity,
        total:
          (item.basePrice + addonTotal) * quantity,
      };
    });

    saveCart(updated);
  }

  function removeItem(cartItemId) {
    const updated = cart.filter(
      (item) => item.cartItemId !== cartItemId
    );

    saveCart(updated);
  }

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.total,
      0
    );
  }, [cart]);

  const tax = Math.round(subtotal * 0.05);

  const grandTotal = subtotal + tax;

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F0E8]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DED6C9] border-t-[#B83A2E]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8] pb-28 lg:pb-10">
      {/* Header */}
      <header className="border-b border-[#DED6C9]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link
            href="/menu"
            className="flex items-center gap-2 text-sm text-[#6B6258] hover:text-[#171513]"
          >
            <ArrowLeft size={17} />
            Continue Shopping
          </Link>

          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingBag size={18} />
            Your Cart
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Cart items */}
          <div>
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B83A2E]">
                Your selection
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
                Your bowl awaits.
              </h1>
            </div>

            {cart.length === 0 ? (
              <div className="rounded-3xl bg-[#FFFDF8] px-6 py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F0E8] text-2xl">
                  🍜
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  Your cart is empty
                </h2>

                <p className="mt-2 text-sm text-[#6B6258]">
                  Add something delicious from our menu.
                </p>

                <Link
                  href="/menu"
                  className="mt-7 inline-flex rounded-full bg-[#171513] px-6 py-3 text-sm font-semibold text-white"
                >
                  Explore Menu
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="rounded-3xl bg-[#FFFDF8] p-4 sm:p-5"
                  >
                    <div className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-24 w-24 shrink-0 rounded-2xl object-cover sm:h-32 sm:w-32"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="font-semibold">
                              {item.name}
                            </h2>

                            <p className="mt-1 text-sm text-[#6B6258]">
                              {item.noodle} noodles ·{" "}
                              {item.spice} spice
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              removeItem(item.cartItemId)
                            }
                            className="text-[#6B6258] transition hover:text-[#B83A2E]"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>

                        {item.addons.length > 0 && (
                          <div className="mt-2 text-xs text-[#6B6258]">
                            {item.addons
                              .map((addon) => addon.name)
                              .join(" · ")}
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-[#DED6C9]">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  -1
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="w-8 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  1
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <p className="font-semibold">
                            ₹{item.total}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {cart.length > 0 && (
            <aside className="h-fit rounded-3xl bg-[#171513] p-6 text-white lg:sticky lg:top-8">
              <h2 className="text-xl font-semibold">
                Order Summary
              </h2>

              <div className="mt-7 space-y-4 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>

                <div className="flex justify-between text-white/60">
                  <span>Taxes</span>
                  <span>₹{tax}</span>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      Total
                    </span>

                    <span className="text-lg font-semibold">
                      ₹{grandTotal}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-7 block rounded-2xl bg-[#B83A2E] px-5 py-4 text-center text-sm font-semibold transition hover:bg-white hover:text-[#171513]"
              >
                Continue to Checkout
              </Link>

              <p className="mt-4 text-center text-xs leading-5 text-white/40">
                You'll need to sign in before placing
                your order.
              </p>
            </aside>
          )}
        </div>
      </section>
    </main>
  );
}