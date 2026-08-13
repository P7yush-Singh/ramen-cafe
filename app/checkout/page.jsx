"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { getTableId, getMenuUrl } from "@/lib/tableSession";

export default function CheckoutPage() {
  // ============================================================
  // STATE
  // ============================================================

  const [cart, setCart] = useState([]);
  const [tableId, setTableId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // ============================================================
  // INITIALIZE CHECKOUT
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function initializeCheckout() {
      try {
        // --------------------------------------------------------
        // GET CART
        // --------------------------------------------------------

        const currentCart = getCart();

        if (mounted) {
          setCart(
            Array.isArray(currentCart)
              ? currentCart
              : []
          );
        }

        // --------------------------------------------------------
        // GET ACTIVE TABLE
        // --------------------------------------------------------

        const currentTable = getTableId();

        if (mounted) {
          setTableId(currentTable || null);
        }

        // --------------------------------------------------------
        // GET AUTHENTICATED USER
        // --------------------------------------------------------

        const user = await getCurrentUser();

        if (!mounted) return;

        if (user) {
          setIsLoggedIn(true);

          setCustomer({
            name: user.name || "",
            phone: user.phone || "",
            email: user.email || "",
          });
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error(
          "Checkout initialization error:",
          error
        );

        if (mounted) {
          setIsLoggedIn(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeCheckout();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // URLS
  // ============================================================

  const checkoutUrl = tableId
    ? `/checkout?table=${encodeURIComponent(tableId)}`
    : "/checkout";

  const loginUrl = `/login?redirect=${encodeURIComponent(
    checkoutUrl
  )}`;

  const cartUrl = tableId
    ? `/cart?table=${encodeURIComponent(tableId)}`
    : "/cart";

  const menuUrl = getMenuUrl();

  // ============================================================
  // TOTALS
  // ============================================================

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      return total + Number(item.total || 0);
    }, 0);
  }, [cart]);

  const tax = useMemo(() => {
    return subtotal * 0.05;
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal + tax;
  }, [subtotal, tax]);

  const totalItems = useMemo(() => {
    return cart.reduce((total, item) => {
      return total + Number(item.quantity || 0);
    }, 0);
  }, [cart]);

  // ============================================================
  // FORMAT PRICE
  // ============================================================

  function formatPrice(price) {
    return `₹${Math.round(
      Number(price || 0)
    ).toLocaleString("en-IN")}`;
  }

  // ============================================================
  // UPDATE CUSTOMER
  // ============================================================

  function updateCustomer(field, value) {
    setCustomer((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ============================================================
  // NORMALIZE CART FOR ORDER API
  // ============================================================

  function prepareOrderItems(items) {
    return items.map((item) => {
      const noodles =
        item.noodles ??
        item.noodle ??
        null;

      const spice =
        item.spice ??
        null;

      const addons =
        item.addons ??
        item.addOns ??
        [];

      return {
        ...item,

        // ------------------------------------------------------
        // Canonical Order item fields
        // ------------------------------------------------------

        productId:
          item.productId ??
          item.id ??
          null,

        name: item.name || "",

        image: item.image || "",

        price: Number(item.price || 0),

        quantity: Number(
          item.quantity || 1
        ),

        total: Number(
          item.total || 0
        ),

        noodles,

        spice,

        addons: Array.isArray(addons)
          ? addons
          : [],
      };
    });
  }

  // ============================================================
  // PLACE ORDER
  // ============================================================

  async function handlePlaceOrder(event) {
    event.preventDefault();

    // ----------------------------------------------------------
    // AUTH CHECK
    // ----------------------------------------------------------

    if (!isLoggedIn) {
      window.location.href = loginUrl;
      return;
    }

    // ----------------------------------------------------------
    // PREVENT DOUBLE SUBMISSION
    // ----------------------------------------------------------

    if (isSubmitting) {
      return;
    }

    // ----------------------------------------------------------
    // CUSTOMER VALIDATION
    // ----------------------------------------------------------

    const cleanName =
      customer.name.trim();

    if (!cleanName) {
      alert("Please enter your name.");
      return;
    }

    const cleanPhone =
      customer.phone.replace(/\D/g, "");

    if (
      !/^[6-9]\d{9}$/.test(cleanPhone)
    ) {
      alert(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    const cleanEmail =
      customer.email.trim().toLowerCase();

    if (!cleanEmail) {
      alert("Please enter your email address.");
      return;
    }

    // ----------------------------------------------------------
    // TABLE VALIDATION
    // ----------------------------------------------------------

    if (!tableId) {
      alert(
        "No active table found. Please scan the table QR code again."
      );
      return;
    }

    // ----------------------------------------------------------
    // CART VALIDATION
    // ----------------------------------------------------------

    if (
      !Array.isArray(cart) ||
      cart.length === 0
    ) {
      alert(
        "Your cart is empty."
      );
      return;
    }

    // ----------------------------------------------------------
    // PREPARE ITEMS
    // ----------------------------------------------------------

    const orderItems =
      prepareOrderItems(cart);

    // ----------------------------------------------------------
    // SUBMIT
    // ----------------------------------------------------------

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          tableId,
          items: orderItems,
          customer: {
            name: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
          },
        }),
      });

      // --------------------------------------------------------
      // PARSE RESPONSE SAFELY
      // --------------------------------------------------------

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Invalid response from the order server."
        );
      }

      // --------------------------------------------------------
      // AUTH EXPIRED
      // --------------------------------------------------------

      if (response.status === 401) {
        window.location.href = loginUrl;
        return;
      }

      // --------------------------------------------------------
      // API ERROR
      // --------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to place your order."
        );
      }

      // --------------------------------------------------------
      // VERIFY ORDER NUMBER
      // --------------------------------------------------------

      const orderNumber =
        data?.order?.orderNumber;

      if (!orderNumber) {
        console.error(
          "Invalid order response:",
          data
        );

        throw new Error(
          "Order was created but the order number was not returned."
        );
      }

      // --------------------------------------------------------
      // CLEAR LOCAL CART
      // --------------------------------------------------------

      localStorage.removeItem(
        "ramen-cart"
      );

      window.dispatchEvent(
        new Event("cart-updated")
      );

      // --------------------------------------------------------
      // REDIRECT TO NEW ORDER PAGE
      // --------------------------------------------------------

      window.location.href =
        `/orders/${encodeURIComponent(
          orderNumber
        )}`;
    } catch (error) {
      console.error(
        "Place order error:",
        error
      );

      alert(
        error?.message ||
          "Unable to place your order. Please try again."
      );

      setIsSubmitting(false);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1100px] px-4 py-16 sm:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-40 rounded bg-[#DED6C9]" />

            <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="h-[500px] rounded-3xl bg-[#FFFDF8]" />

              <div className="h-[400px] rounded-3xl bg-[#FFFDF8]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // EMPTY CART
  // ============================================================

  if (cart.length === 0) {
    return (
      <EmptyCheckout
        tableId={tableId}
      />
    );
  }

  // ============================================================
  // MAIN CHECKOUT
  // ============================================================

  return (
    <main className="min-h-screen bg-[#F5F0E8] pb-10">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="sticky top-0 z-40 border-b border-[#E5DED2] bg-[#F5F0E8]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1100px] items-center justify-between px-4 sm:h-20 sm:px-8">
          {/* BACK TO CART */}

          <Link
            href={cartUrl}
            className="flex items-center gap-2 text-sm font-medium text-[#6B6258] transition hover:text-[#171513]"
          >
            <ArrowLeft size={17} />

            Back to Cart
          </Link>

          {/* LOGO */}

          <div className="hidden text-center sm:block">
            <p className="text-sm font-semibold tracking-[0.15em]">
              RAMEN CAFE
            </p>

            <p className="text-[8px] tracking-[0.18em] text-[#6B6258]">
              ラーメンカフェ
            </p>
          </div>

          {/* ITEM COUNT */}

          <div className="flex items-center gap-2 text-[#6B6258]">
            <ShoppingBag size={18} />

            <span className="text-sm font-medium">
              {totalItems}
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================
          CONTENT
      ======================================================== */}

      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-8 sm:py-10">
        {/* TITLE */}

        <div className="mb-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E] sm:text-xs">
            Checkout
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Complete your order
          </h1>

          <p className="mt-2 text-sm text-[#6B6258]">
            Confirm your details before
            placing the order.
          </p>
        </div>

        {/* ======================================================
            CHECKOUT GRID
        ====================================================== */}

        <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
          {/* ====================================================
              LEFT
          ==================================================== */}

          <div className="space-y-4">
            {/* ==================================================
                TABLE
            ================================================== */}

            <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#171513] text-white">
                  <MapPin size={19} />
                </div>

                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
                    Dining Location
                  </p>

                  <div className="mt-1 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">
                      {tableId
                        ? `Table ${tableId}`
                        : "No table selected"}
                    </h2>

                    {tableId && (
                      <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-medium text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                        Active
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-5 text-[#6B6258]">
                    Your order will be prepared
                    and served at this table.
                  </p>
                </div>
              </div>
            </section>

            {/* ==================================================
                CUSTOMER
            ================================================== */}

            <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F0E8] text-[#171513]">
                    <UserRound size={19} />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
                      Customer
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                      {isLoggedIn
                        ? "Your details"
                        : "Login required"}
                    </h2>
                  </div>
                </div>

                {isLoggedIn && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <Check size={15} />
                  </span>
                )}
              </div>

              {/* NOT LOGGED IN */}

              {!isLoggedIn ? (
                <div className="mt-5 rounded-2xl bg-[#F5F0E8] p-4">
                  <p className="text-sm font-medium">
                    Please login to place
                    your order.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#6B6258]">
                    You can browse and add
                    items without an account,
                    but login is required
                    before placing the order.
                  </p>

                  <Link
                    href={loginUrl}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#171513] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#B83A2E]"
                  >
                    Login to Continue

                    <ChevronRight size={16} />
                  </Link>
                </div>
              ) : (
                /* LOGGED IN */

                <div className="mt-5 space-y-4">
                  {/* NAME */}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium">
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={customer.name}
                      onChange={(event) =>
                        updateCustomer(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="Enter your name"
                      autoComplete="name"
                      className="w-full rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-3 text-sm outline-none transition placeholder:text-[#9A9186] focus:border-[#171513]"
                    />
                  </div>

                  {/* PHONE */}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium">
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      inputMode="numeric"
                      value={customer.phone}
                      onChange={(event) =>
                        updateCustomer(
                          "phone",
                          event.target.value
                        )
                      }
                      placeholder="Enter your phone number"
                      autoComplete="tel"
                      className="w-full rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-3 text-sm outline-none transition placeholder:text-[#9A9186] focus:border-[#171513]"
                    />
                  </div>

                  {/* EMAIL */}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium">
                      Email
                    </label>

                    <input
                      type="email"
                      value={customer.email}
                      onChange={(event) =>
                        updateCustomer(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="your@email.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-3 text-sm outline-none transition placeholder:text-[#9A9186] focus:border-[#171513]"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* ==================================================
                EXPECTED TIME
            ================================================== */}

            <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-6">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F0E8]">
                  <Clock3 size={19} />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
                    Preparation Time
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    Approximately 15–25 minutes
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-[#6B6258]">
                    The exact expected time
                    will be calculated after
                    your order is accepted
                    by the kitchen.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* ====================================================
              RIGHT SUMMARY
          ==================================================== */}

          <aside className="lg:sticky lg:top-28">
            <div className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-6">
              <h2 className="font-semibold">
                Order Summary
              </h2>

              {/* ITEMS */}

              <div className="mt-5 space-y-4">
                {cart.map(
                  (item, index) => {
                    const noodles =
                      item.noodles ??
                      item.noodle ??
                      null;

                    const spice =
                      item.spice ??
                      null;

                    const quantity = Math.max(
                      1,
                      Number(item.quantity || 1)
                    );

                    const addons = Array.isArray(
                      item.addons ?? item.addOns
                    )
                      ? item.addons ?? item.addOns
                      : [];

                    const addonTotalPerUnit = addons.reduce(
                      (sum, addon) =>
                        sum +
                        Number(addon?.price || 0) *
                          Math.max(
                            1,
                            Number(addon?.quantity || 1)
                          ),
                      0
                    );

                    const addonTotal =
                      addonTotalPerUnit * quantity;

                    const baseTotal =
                      Number(item.price || 0) * quantity;

                    return (
                      <div
                        key={
                          item.cartItemId ||
                          `${item.id || item.name}-${index}`
                        }
                        className="rounded-2xl border border-[#E5DED2] p-3"
                      >
                        <div className="flex gap-3">
                          {/* IMAGE */}

                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F5F0E8]">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={
                                  item.name ||
                                  "Food item"
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                🍜
                              </div>
                            )}
                          </div>

                          {/* DETAILS */}

                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between gap-2">
                              <p className="min-w-0 truncate text-sm font-medium">
                                {item.name}
                              </p>

                              <p className="shrink-0 text-sm font-semibold">
                                {formatPrice(item.total)}
                              </p>
                            </div>

                            <p className="mt-1 text-[10px] text-[#8A8177]">
                              Qty {quantity}
                            </p>

                            {(noodles || spice) && (
                              <p className="text-[10px] text-[#8A8177]">
                                {noodles || ""}
                                {noodles && spice ? " · " : ""}
                                {spice || ""}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* EXACT PRICE BREAKDOWN */}

                        <div className="mt-3 rounded-xl bg-[#F5F0E8] p-3">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#6B6258]">
                              Base item
                            </span>
                            <span className="font-medium">
                              {formatPrice(baseTotal)}
                            </span>
                          </div>

                          {addons.length > 0 && (
                            <div className="mt-2 border-t border-[#DED6C9] pt-2">
                              <div className="flex items-center justify-between text-[11px] font-semibold">
                                <span>Add-ons</span>
                                <span className="text-[#B83A2E]">
                                  +{formatPrice(addonTotal)}
                                </span>
                              </div>

                              <div className="mt-1.5 space-y-1">
                                {addons.map(
                                  (addon, addonIndex) => {
                                    const addonQuantity = Math.max(
                                      1,
                                      Number(addon?.quantity || 1)
                                    );
                                    const addonLineTotal =
                                      Number(addon?.price || 0) *
                                      addonQuantity *
                                      quantity;

                                    return (
                                      <div
                                        key={`${addon?.name || "addon"}-${addonIndex}`}
                                        className="flex items-center justify-between gap-3 text-[11px] text-[#6B6258]"
                                      >
                                        <span className="min-w-0 truncate">
                                          + {addon?.name || "Add-on"}
                                          {addonQuantity > 1
                                            ? ` × ${addonQuantity}`
                                            : ""}
                                          {quantity > 1
                                            ? ` × ${quantity} items`
                                            : ""}
                                        </span>
                                        <span className="shrink-0 font-medium text-[#171513]">
                                          +{formatPrice(addonLineTotal)}
                                        </span>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between border-t border-[#DED6C9] pt-2 text-xs font-semibold">
                            <span>Item total</span>
                            <span>{formatPrice(item.total)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* PRICE */}

              <div className="mt-5 space-y-3 border-t border-[#E5DED2] pt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6258]">
                    Subtotal
                  </span>

                  <span>
                    {formatPrice(
                      subtotal
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6258]">
                    GST (5%)
                  </span>

                  <span>
                    {formatPrice(tax)}
                  </span>
                </div>
              </div>

              {/* TOTAL */}

              <div className="mt-5 flex items-end justify-between border-t border-[#E5DED2] pt-5">
                <div>
                  <p className="text-xs text-[#6B6258]">
                    Total
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {formatPrice(total)}
                  </p>
                </div>

                <p className="text-[10px] text-[#8A8177]">
                  {totalItems}{" "}
                  {totalItems === 1
                    ? "item"
                    : "items"}
                </p>
              </div>

              {/* PLACE ORDER */}

              {isLoggedIn ? (
                <form
                  onSubmit={
                    handlePlaceOrder
                  }
                >
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold text-white transition ${
                      isSubmitting
                        ? "cursor-not-allowed bg-[#8F7772]"
                        : "bg-[#B83A2E] hover:bg-[#171513]"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        Placing Order...
                      </>
                    ) : (
                      <>
                        Place Order

                        <ChevronRight
                          size={17}
                        />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <Link
                  href={loginUrl}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#171513] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#B83A2E]"
                >
                  Login to Place Order

                  <ChevronRight
                    size={17}
                  />
                </Link>
              )}

              <p className="mt-3 text-center text-[10px] leading-4 text-[#8A8177]">
                You can review your order
                before final submission.
              </p>
            </div>

            {/* BACK TO MENU */}

            <Link
              href={menuUrl}
              className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] px-5 py-3.5 text-sm font-medium transition hover:bg-[#F5F0E8]"
            >
              <ArrowLeft size={15} />

              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// EMPTY CHECKOUT
// ============================================================

function EmptyCheckout({ tableId }) {
  const menuUrl = getMenuUrl();

  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-[#E5DED2]">
        <div className="mx-auto flex h-20 max-w-[1100px] items-center justify-between px-4 sm:px-8">
          <Link
            href={menuUrl}
            className="flex items-center gap-2 text-sm font-medium text-[#6B6258]"
          >
            <ArrowLeft size={17} />

            Back to Menu
          </Link>

          <div className="text-center">
            <p className="text-sm font-semibold tracking-[0.15em]">
              RAMEN CAFE
            </p>

            <p className="text-[8px] tracking-[0.18em] text-[#6B6258]">
              ラーメンカフェ
            </p>
          </div>

          <ShoppingBag size={18} />
        </div>
      </header>

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#FFFDF8] text-5xl">
            🍜
          </div>

          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
            Checkout
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Your cart is empty
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#6B6258]">
            Add something delicious to
            your cart before continuing
            to checkout.
          </p>

          {/* TABLE */}

          {tableId && (
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-[#171513] px-4 py-2 text-xs font-medium text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

              Table {tableId}
            </div>
          )}

          {/* MENU */}

          <Link
            href={menuUrl}
            className="mx-auto mt-7 flex max-w-xs items-center justify-center rounded-2xl bg-[#B83A2E] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#171513]"
          >
            Explore Menu
          </Link>
        </div>
      </div>
    </main>
  );
}