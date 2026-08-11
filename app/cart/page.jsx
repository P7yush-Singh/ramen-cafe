"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";

import {
  getCart,
  saveCart,
} from "@/lib/cart";

import {
  getTableId,
  getMenuUrl,
} from "@/lib/tableSession";

export default function CartPage() {
  // =====================================================
  // STATE
  // =====================================================

  const [cart, setCart] = useState([]);

  const [tableId, setTableId] = useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  // =====================================================
  // INITIALIZE
  // =====================================================

  useEffect(() => {
    loadCart();

    const handleCartUpdate = () => {
      loadCart();
    };

    const handleTableUpdate = () => {
      setTableId(getTableId());
    };

    window.addEventListener(
      "cart-updated",
      handleCartUpdate
    );

    window.addEventListener(
      "storage",
      handleCartUpdate
    );

    window.addEventListener(
      "table-session-updated",
      handleTableUpdate
    );

    return () => {
      window.removeEventListener(
        "cart-updated",
        handleCartUpdate
      );

      window.removeEventListener(
        "storage",
        handleCartUpdate
      );

      window.removeEventListener(
        "table-session-updated",
        handleTableUpdate
      );
    };
  }, []);

  // =====================================================
  // LOAD CART
  // =====================================================

  function loadCart() {
    const currentCart = getCart();

    setCart(currentCart);

    setTableId(getTableId());

    setIsLoading(false);
  }

  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  function updateQuantity(
    cartItemId,
    change
  ) {
    const updatedCart = cart.map(
      (item) => {
        if (
          item.cartItemId !==
          cartItemId
        ) {
          return item;
        }

        const newQuantity =
          Number(item.quantity || 1) +
          change;

        if (newQuantity <= 0) {
          return null;
        }

        const unitPrice =
          getUnitPrice(item);

        return {
          ...item,

          quantity: newQuantity,

          total:
            unitPrice * newQuantity,
        };
      }
    ).filter(Boolean);

    setCart(updatedCart);

    saveCart(updatedCart);
  }

  // =====================================================
  // REMOVE ITEM
  // =====================================================

  function removeItem(cartItemId) {
    const updatedCart =
      cart.filter(
        (item) =>
          item.cartItemId !==
          cartItemId
      );

    setCart(updatedCart);

    saveCart(updatedCart);
  }

  // =====================================================
  // CLEAR CART
  // =====================================================

  function handleClearCart() {
    const confirmed =
      window.confirm(
        "Are you sure you want to remove all items from your cart?"
      );

    if (!confirmed) {
      return;
    }

    setCart([]);

    saveCart([]);
  }

  // =====================================================
  // UNIT PRICE
  // =====================================================

  function getUnitPrice(item) {
    const quantity =
      Number(item.quantity || 1);

    if (
      item.total !== undefined &&
      quantity > 0
    ) {
      return (
        Number(item.total) /
        quantity
      );
    }

    const addonTotal =
      Array.isArray(item.addons)
        ? item.addons.reduce(
            (sum, addon) =>
              sum +
              Number(
                addon.price || 0
              ),
            0
          )
        : 0;

    return (
      Number(
        item.basePrice || 0
      ) + addonTotal
    );
  }

  // =====================================================
  // SUBTOTAL
  // =====================================================

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        Number(item.total || 0),
      0
    );
  }, [cart]);

  // =====================================================
  // TAX
  //
  // Temporary MVP calculation.
  // We can later make GST configurable
  // from the admin dashboard.
  // =====================================================

  const taxRate = 0.05;

  const tax = useMemo(() => {
    return subtotal * taxRate;
  }, [subtotal]);

  // =====================================================
  // GRAND TOTAL
  // =====================================================

  const grandTotal = useMemo(() => {
    return subtotal + tax;
  }, [subtotal, tax]);

  // =====================================================
  // TOTAL ITEMS
  // =====================================================

  const totalItems = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );
  }, [cart]);

  // =====================================================
  // FORMAT PRICE
  // =====================================================

  function formatPrice(price) {
    return `₹${Math.round(price).toLocaleString(
      "en-IN"
    )}`;
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1100px] px-4 py-20 sm:px-8">
          <div className="animate-pulse">

            <div className="h-8 w-40 rounded bg-[#DED6C9]" />

            <div className="mt-8 h-32 rounded-3xl bg-[#FFFDF8]" />

            <div className="mt-4 h-32 rounded-3xl bg-[#FFFDF8]" />

          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // EMPTY CART
  // =====================================================

  if (cart.length === 0) {
    return (
      <EmptyCart
        tableId={tableId}
      />
    );
  }

  // =====================================================
  // MAIN CART
  // =====================================================

  return (
    <main className="min-h-screen bg-[#F5F0E8] pb-10">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-[#E5DED2] bg-[#F5F0E8]/95 backdrop-blur-xl">

        <div className="mx-auto flex h-[68px] max-w-[1100px] items-center justify-between px-4 sm:h-20 sm:px-8">

          <Link
            href={getMenuUrl()}
            className="flex items-center gap-2 text-sm font-medium text-[#6B6258] transition hover:text-[#171513]"
          >
            <ArrowLeft
              size={17}
            />

            <span>
              Back to Menu
            </span>
          </Link>

          <Link
            href="/"
            className="hidden text-center sm:block"
          >
            <p className="text-sm font-semibold tracking-[0.15em]">
              RAMEN CAFE
            </p>

            <p className="text-[8px] tracking-[0.18em] text-[#6B6258]">
              ラーメンカフェ
            </p>
          </Link>

          <div className="flex items-center gap-2">
            <ShoppingBag
              size={18}
            />

            <span className="text-sm font-semibold">
              {totalItems}
            </span>
          </div>

        </div>
      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-8 sm:py-10">

        {/* =================================================
            TITLE
        ================================================= */}

        <div className="mb-6">

          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E] sm:text-xs">
            Your Order
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Your cart
              </h1>

              <p className="mt-2 text-sm text-[#6B6258]">
                Review your items before checkout.
              </p>
            </div>

            {/* TABLE */}

            {tableId && (
              <div className="flex items-center gap-2 self-start rounded-full bg-[#171513] px-4 py-2 text-xs font-medium text-white sm:self-auto">

                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

                Table {tableId}

              </div>
            )}

          </div>
        </div>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">

          {/* =================================================
              ITEMS
          ================================================= */}

          <section className="space-y-3">

            {cart.map((item) => (
              <CartItem
                key={item.cartItemId}
                item={item}
                onIncrease={() =>
                  updateQuantity(
                    item.cartItemId,
                    1
                  )
                }
                onDecrease={() =>
                  updateQuantity(
                    item.cartItemId,
                    -1
                  )
                }
                onRemove={() =>
                  removeItem(
                    item.cartItemId
                  )
                }
                formatPrice={
                  formatPrice
                }
              />
            ))}

            {/* CLEAR CART */}

            <div className="flex justify-end pt-2">

              <button
                onClick={
                  handleClearCart
                }
                className="flex items-center gap-1.5 text-xs font-medium text-[#8A8177] transition hover:text-[#B83A2E]"
              >
                <Trash2
                  size={13}
                />

                Clear cart
              </button>

            </div>

          </section>

          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <aside className="lg:sticky lg:top-28">

            <div className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-6">

              <div className="flex items-center gap-2">
                <UtensilsCrossed
                  size={17}
                />

                <h2 className="font-semibold">
                  Order Summary
                </h2>
              </div>

              {/* TABLE */}

              {tableId && (
                <div className="mt-4 rounded-2xl bg-[#F5F0E8] p-3.5">

                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#8A8177]">
                    Dining at
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    Table {tableId}
                  </p>

                </div>
              )}

              {/* PRICE BREAKDOWN */}

              <div className="mt-5 space-y-3 border-t border-[#E5DED2] pt-5">

                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6258]">
                    Subtotal
                  </span>

                  <span className="font-medium">
                    {formatPrice(
                      subtotal
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6258]">
                    GST (5%)
                  </span>

                  <span className="font-medium">
                    {formatPrice(
                      tax
                    )}
                  </span>
                </div>

              </div>

              {/* TOTAL */}

              <div className="mt-5 flex items-end justify-between border-t border-[#E5DED2] pt-5">

                <div>
                  <p className="text-xs text-[#6B6258]">
                    Total
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {formatPrice(
                      grandTotal
                    )}
                  </p>
                </div>

                <p className="text-xs text-[#8A8177]">
                  {totalItems}{" "}
                  {totalItems === 1
                    ? "item"
                    : "items"}
                </p>

              </div>

              {/* CHECKOUT */}

              <Link
                href={
                  tableId
                    ? `/checkout?table=${encodeURIComponent(
                        tableId
                      )}`
                    : "/checkout"
                }
                className="mt-5 flex w-full items-center justify-center rounded-2xl bg-[#B83A2E] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#171513]"
              >
                Proceed to Checkout
              </Link>

              {/* CONTINUE SHOPPING */}

              <Link
                href={getMenuUrl()}
                className="mt-2 flex w-full items-center justify-center rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] px-5 py-3.5 text-sm font-medium text-[#171513] transition hover:bg-[#F5F0E8]"
              >
                Continue Shopping
              </Link>

            </div>

            {/* INFORMATION */}

            <div className="mt-3 rounded-2xl border border-[#E5DED2] bg-[#FFFDF8] p-4">

              <div className="flex gap-3">

                <span className="mt-0.5 text-sm">
                  ⏱
                </span>

                <div>
                  <p className="text-xs font-semibold">
                    Dining at Table{" "}
                    {tableId || "—"}
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-[#6B6258]">
                    Your order will be prepared
                    and served at your selected
                    table.
                  </p>
                </div>

              </div>

            </div>

          </aside>

        </div>

      </div>

      {/* =================================================
          MOBILE BOTTOM NAVIGATION
      ================================================= */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#DED6C9] bg-[#FFFDF8]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-xl lg:hidden">

        <div className="mx-auto flex max-w-md items-center justify-around">

          {/* Home */}

          <Link
            href="/"
            className="flex min-w-[58px] flex-col items-center gap-0.5 px-3 py-1.5 text-[#6B6258]"
          >
            <span className="text-lg leading-none">
              ⌂
            </span>

            <span className="text-[10px]">
              Home
            </span>
          </Link>

          {/* Menu */}

          <Link
            href={getMenuUrl()}
            className="flex min-w-[58px] flex-col items-center gap-0.5 px-3 py-1.5 text-[#6B6258]"
          >
            <span className="text-lg leading-none">
              ▣
            </span>

            <span className="text-[10px]">
              Menu
            </span>
          </Link>

          {/* Cart */}

          <Link
            href="/cart"
            className="flex min-w-[58px] flex-col items-center gap-0.5 px-3 py-1.5 text-[#B83A2E]"
          >
            <ShoppingBag
              size={18}
            />

            <span className="text-[10px] font-medium">
              Cart
            </span>
          </Link>

          {/* Account */}

          <Link
            href="/account"
            className="flex min-w-[58px] flex-col items-center gap-0.5 px-3 py-1.5 text-[#6B6258]"
          >
            <span className="text-lg leading-none">
              ♙
            </span>

            <span className="text-[10px]">
              Account
            </span>
          </Link>

        </div>
      </nav>

    </main>
  );
}

// =======================================================
// CART ITEM
// =======================================================

function CartItem({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  formatPrice,
}) {
  const addons =
    Array.isArray(item.addons)
      ? item.addons
      : [];

  return (
    <article className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-3.5 sm:p-4">

      <div className="flex gap-3.5 sm:gap-4">

        {/* IMAGE */}

        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#F5F0E8] sm:h-28 sm:w-28">

          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl">
              🍜
            </div>
          )}

        </div>

        {/* CONTENT */}

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">

              <h2 className="truncate text-base font-semibold sm:text-lg">
                {item.name}
              </h2>

              {/* VEG / NON VEG */}

              {item.isVeg !==
                undefined && (
                <p
                  className={`mt-1 text-[10px] font-medium ${
                    item.isVeg
                      ? "text-green-700"
                      : "text-[#B83A2E]"
                  }`}
                >
                  {item.isVeg
                    ? "🟢 Veg"
                    : "🔴 Non-Veg"}
                </p>
              )}

            </div>

            {/* REMOVE */}

            <button
              onClick={onRemove}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8A8177] transition hover:bg-[#F5F0E8] hover:text-[#B83A2E]"
              aria-label={`Remove ${item.name}`}
            >
              <Trash2
                size={15}
              />
            </button>

          </div>

          {/* CUSTOMIZATION */}

          <div className="mt-2 space-y-0.5 text-[11px] text-[#6B6258]">

            {item.noodle && (
              <p>
                Noodles:{" "}
                <span className="font-medium text-[#171513]">
                  {item.noodle}
                </span>
              </p>
            )}

            {item.spice && (
              <p>
                Spice:{" "}
                <span className="font-medium text-[#171513]">
                  {item.spice}
                </span>
              </p>
            )}

            {addons.length > 0 && (
              <p>
                Add-ons:{" "}
                <span className="font-medium text-[#171513]">
                  {addons
                    .map(
                      (addon) =>
                        addon.name
                    )
                    .join(", ")}
                </span>
              </p>
            )}

          </div>

          {/* BOTTOM */}

          <div className="mt-3 flex items-center justify-between gap-3">

            {/* QUANTITY */}

            <div className="flex items-center rounded-xl border border-[#DED6C9]">

              <button
                onClick={
                  onDecrease
                }
                className="flex h-8 w-8 items-center justify-center text-[#6B6258] transition hover:text-[#171513]"
                aria-label="Decrease quantity"
              >
                <Minus
                  size={13}
                />
              </button>

              <span className="w-7 text-center text-xs font-semibold">
                {item.quantity}
              </span>

              <button
                onClick={
                  onIncrease
                }
                className="flex h-8 w-8 items-center justify-center text-[#6B6258] transition hover:text-[#171513]"
                aria-label="Increase quantity"
              >
                <Plus
                  size={13}
                />
              </button>

            </div>

            {/* PRICE */}

            <p className="text-base font-semibold">
              {formatPrice(
                item.total || 0
              )}
            </p>

          </div>

        </div>

      </div>

    </article>
  );
}

// =======================================================
// EMPTY CART
// =======================================================

function EmptyCart({
  tableId,
}) {
  return (
    <main className="min-h-screen bg-[#F5F0E8] pb-20 lg:pb-0">

      {/* HEADER */}

      <header className="border-b border-[#E5DED2] bg-[#F5F0E8]">

        <div className="mx-auto flex h-[68px] max-w-[1100px] items-center justify-between px-4 sm:h-20 sm:px-8">

          <Link
            href={getMenuUrl()}
            className="flex items-center gap-2 text-sm font-medium text-[#6B6258]"
          >
            <ArrowLeft
              size={17}
            />

            Back to Menu
          </Link>

          <div className="hidden text-center sm:block">

            <p className="text-sm font-semibold tracking-[0.15em]">
              RAMEN CAFE
            </p>

            <p className="text-[8px] tracking-[0.18em] text-[#6B6258]">
              ラーメンカフェ
            </p>

          </div>

          <ShoppingBag
            size={18}
            className="text-[#6B6258]"
          />

        </div>
      </header>

      {/* EMPTY STATE */}

      <div className="flex min-h-[calc(100vh-148px)] items-center justify-center px-4 py-16">

        <div className="w-full max-w-md text-center">

          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#FFFDF8] text-5xl shadow-sm">
            🍜
          </div>

          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
            Your cart
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Your cart is empty
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#6B6258]">
            Looks like you haven't added
            anything yet. Explore our menu
            and find something delicious.
          </p>

          {/* TABLE */}

          {tableId && (
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-[#171513] px-4 py-2 text-xs font-medium text-white">

              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

              Table {tableId}

            </div>
          )}

          {/* BUTTON */}

          <Link
            href={getMenuUrl()}
            className="mx-auto mt-7 flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-[#B83A2E] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#171513]"
          >
            <UtensilsCrossed
              size={17}
            />

            Explore Menu
          </Link>

        </div>

      </div>

      {/* MOBILE NAV */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#DED6C9] bg-[#FFFDF8]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-xl lg:hidden">

        <div className="mx-auto flex max-w-md items-center justify-around">

          <Link
            href="/"
            className="flex min-w-[58px] flex-col items-center gap-0.5 px-3 py-1.5 text-[#6B6258]"
          >
            <span className="text-lg leading-none">
              ⌂
            </span>

            <span className="text-[10px]">
              Home
            </span>
          </Link>

          <Link
            href={getMenuUrl()}
            className="flex min-w-[58px] flex-col items-center gap-0.5 px-3 py-1.5 text-[#B83A2E]"
          >
            <span className="text-lg leading-none">
              ▣
            </span>

            <span className="text-[10px] font-medium">
              Menu
            </span>
          </Link>

          <Link
            href="/cart"
            className="flex min-w-[58px] flex-col items-center gap-0.5 px-3 py-1.5 text-[#B83A2E]"
          >
            <ShoppingBag
              size={18}
            />

            <span className="text-[10px] font-medium">
              Cart
            </span>
          </Link>

          <Link
            href="/account"
            className="flex min-w-[58px] flex-col items-center gap-0.5 px-3 py-1.5 text-[#6B6258]"
          >
            <span className="text-lg leading-none">
              ♙
            </span>

            <span className="text-[10px]">
              Account
            </span>
          </Link>

        </div>
      </nav>

    </main>
  );
}