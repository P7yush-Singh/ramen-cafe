"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChefHat,
  Clock3,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Receipt,
  User,
} from "lucide-react";

// ============================================================
// STATUS
// ============================================================

const STATUS_STEPS = [
  {
    key: "pending",
    label: "Order Placed",
    description:
      "Order received.",
  },

  {
    key: "confirmed",
    label: "Confirmed",
    description:
      "Restaurant confirmed the order.",
  },

  {
    key: "preparing",
    label: "Preparing",
    description:
      "Kitchen is preparing the food.",
  },

  {
    key: "ready",
    label: "Ready",
    description:
      "Order is ready.",
  },

  {
    key: "served",
    label: "Served",
    description:
      "Order has been served.",
  },

  {
    key: "completed",
    label: "Completed",
    description:
      "Order completed.",
  },
];

const NEXT_ACTIONS = {
  pending: {
    label: "Confirm Order",
    status: "confirmed",
  },

  confirmed: {
    label: "Start Preparing",
    status: "preparing",
  },

  preparing: {
    label: "Mark Ready",
    status: "ready",
  },

  ready: {
    label: "Mark Served",
    status: "served",
  },

  served: {
    label: "Complete Order",
    status: "completed",
  },
};

// ============================================================
// HELPERS
// ============================================================

function formatPrice(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ============================================================
// PAGE
// ============================================================

export default function AdminOrderDetailsPage({
  params,
}) {
  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updating, setUpdating] =
    useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState("cash");

  const [transactionId, setTransactionId] =
    useState("");

  // ==========================================================
// LOAD ORDER
// ==========================================================

useEffect(() => {
  async function loadOrder() {
    try {
      setLoading(true);
      setError("");

      const resolvedParams =
        await params;

      const orderNumber =
        String(
          resolvedParams?.orderNumber || ""
        ).trim();

      if (!orderNumber) {
        throw new Error(
          "Order number is required."
        );
      }

      const response =
        await fetch(
          `/api/admin/orders/${encodeURIComponent(
            orderNumber
          )}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load order."
        );
      }

      setOrder(
        data.order
      );

      if (
        data.order?.payment
          ?.method
      ) {
        setPaymentMethod(
          data.order.payment.method
        );
      }

      setTransactionId(
        data.order?.payment
          ?.transactionId ||
          ""
      );
    } catch (err) {
      console.error(
        "Admin order details error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load order."
      );
    } finally {
      setLoading(false);
    }
  }

  loadOrder();
}, [params]);

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        setError("");

        const resolvedParams =
          await params;

        const id =
          resolvedParams?.id;

        const response =
          await fetch(
            `/api/admin/orders/${encodeURIComponent(
              id
            )}`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load order."
          );
        }

        setOrder(
          data.order
        );

        if (
          data.order?.payment
            ?.method
        ) {
          setPaymentMethod(
            data.order.payment.method
          );
        }

        setTransactionId(
          data.order?.payment
            ?.transactionId ||
            ""
        );
      } catch (err) {
        console.error(
          "Admin order details error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load order."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [params]);

  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  async function updateStatus(
    status
  ) {
    if (!order) return;

    try {
      setUpdating(true);

      const response =
        await fetch(
          `/api/admin/orders/${encodeURIComponent(
            order.orderNumber
          )}`,
          {
            method: "PATCH",
            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update order."
        );
      }

      setOrder(
        data.order
      );
    } catch (err) {
      alert(
        err?.message ||
          "Unable to update order."
      );
    } finally {
      setUpdating(false);
    }
  }

  // ==========================================================
  // MARK PAYMENT PAID
  // ==========================================================

  async function markPaymentPaid() {
    if (!order) return;

    try {
      setUpdating(true);

      const response =
        await fetch(
          `/api/admin/orders/${encodeURIComponent(
            order.orderNumber
          )}`,
          {
            method: "PATCH",
            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              paymentStatus:
                "paid",

              paymentMethod,

              transactionId:
                transactionId.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update payment."
        );
      }

      setOrder(
        data.order
      );
    } catch (err) {
      alert(
        err?.message ||
          "Unable to update payment."
      );
    } finally {
      setUpdating(false);
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F0E8] px-4 py-10">
        <div className="mx-auto max-w-[1100px]">
          <div className="h-8 w-40 animate-pulse rounded bg-[#DED6C9]" />

          <div className="mt-7 h-32 animate-pulse rounded-3xl bg-[#FFFDF8]" />

          <div className="mt-5 h-96 animate-pulse rounded-3xl bg-[#FFFDF8]" />
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F0E8] px-4">
        <div className="w-full max-w-md rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-8 text-center">
          <div className="text-4xl">
            🍜
          </div>

          <h1 className="mt-5 text-2xl font-semibold">
            Order Not Found
          </h1>

          <p className="mt-2 text-sm text-[#6B6258]">
            {error ||
              "Unable to find this order."}
          </p>

          <Link
            href="/admin/orders"
            className="mt-6 inline-flex rounded-xl bg-[#171513] px-5 py-3 text-xs font-semibold text-white"
          >
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================================
  // CURRENT STATUS
  // ==========================================================

  const currentIndex =
    STATUS_STEPS.findIndex(
      (step) =>
        step.key ===
        order.status
    );

  const nextAction =
    NEXT_ACTIONS[
      order.status
    ];

  const isPaid =
    order.payment?.status ===
    "paid";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#F5F0E8] text-[#171513]">
      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        {/* HEADER */}

        <div className="flex items-center justify-between">
          <Link
            href="/admin/orders"
            className="flex items-center gap-2 text-sm font-medium text-[#6B6258]"
          >
            <ArrowLeft
              size={17}
            />

            Orders
          </Link>

          <p className="text-xs text-[#8A8177]">
            {formatDate(
              order.createdAt
            )}
          </p>
        </div>

        {/* TITLE */}

        <div className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
              Order Details
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              #{order.orderNumber}
            </h1>
          </div>

          <span
            className={`w-fit rounded-full px-4 py-2 text-xs font-semibold capitalize ${
              order.status ===
              "cancelled"
                ? "bg-red-50 text-red-700"
                : order.status ===
                  "completed"
                ? "bg-green-50 text-green-700"
                : "bg-[#FFF7E8] text-[#9A6700]"
            }`}
          >
            {order.status}
          </span>
        </div>

        {/* STATUS */}

        <section className="mt-7 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Clock3
              size={20}
              className="text-[#B83A2E]"
            />

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
                Kitchen Workflow
              </p>

              <h2 className="mt-1 text-lg font-semibold capitalize">
                {order.status}
              </h2>
            </div>
          </div>

          {order.status ===
          "cancelled" ? (
            <div className="mt-6 rounded-2xl bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">
                Order cancelled
              </p>

              {order.cancellationReason && (
                <p className="mt-1 text-xs text-red-600">
                  {
                    order.cancellationReason
                  }
                </p>
              )}
            </div>
          ) : (
            <div className="mt-7">
              {STATUS_STEPS.map(
                (
                  step,
                  index
                ) => {
                  const completed =
                    currentIndex >=
                    index;

                  const active =
                    currentIndex ===
                    index;

                  return (
                    <div
                      key={
                        step.key
                      }
                      className="flex gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${
                            completed
                              ? "bg-[#B83A2E] text-white"
                              : "bg-[#F5F0E8] text-[#9A9186]"
                          }`}
                        >
                          {completed ? (
                            <Check
                              size={16}
                            />
                          ) : (
                            <span className="text-xs">
                              {index +
                                1}
                            </span>
                          )}
                        </div>

                        {index <
                          STATUS_STEPS.length -
                            1 && (
                          <div
                            className={`h-10 w-px ${
                              currentIndex >
                              index
                                ? "bg-[#B83A2E]"
                                : "bg-[#DED6C9]"
                            }`}
                          />
                        )}
                      </div>

                      <div className="pb-5">
                        <p
                          className={`text-sm font-semibold ${
                            active
                              ? "text-[#B83A2E]"
                              : completed
                              ? "text-[#171513]"
                              : "text-[#8A8177]"
                          }`}
                        >
                          {
                            step.label
                          }
                        </p>

                        <p className="mt-1 text-xs text-[#8A8177]">
                          {
                            step.description
                          }
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* NEXT ACTION */}

          {nextAction &&
            order.status !==
              "cancelled" && (
              <button
                onClick={() =>
                  updateStatus(
                    nextAction.status
                  )
                }
                disabled={
                  updating
                }
                className="mt-3 flex items-center gap-2 rounded-xl bg-[#B83A2E] px-5 py-3 text-xs font-semibold text-white disabled:opacity-50"
              >
                {updating && (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                )}

                {nextAction.label}
              </button>
            )}
        </section>

        {/* CUSTOMER + TABLE */}

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6">
            <div className="flex items-center gap-3">
              <User
                size={18}
                className="text-[#B83A2E]"
              />

              <h2 className="font-semibold">
                Customer
              </h2>
            </div>

            <div className="mt-5">
              <p className="text-lg font-semibold">
                {
                  order.customer
                    ?.name
                }
              </p>

              <p className="mt-2 text-sm text-[#6B6258]">
                {
                  order.customer
                    ?.phone
                }
              </p>

              <p className="mt-1 text-sm text-[#6B6258]">
                {
                  order.customer
                    ?.email
                }
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6">
            <div className="flex items-center gap-3">
              <MapPin
                size={18}
                className="text-[#B83A2E]"
              />

              <h2 className="font-semibold">
                Table
              </h2>
            </div>

            <p className="mt-5 text-3xl font-semibold">
              {order.tableId ||
                "—"}
            </p>

            <p className="mt-1 text-sm text-[#6B6258]">
              Restaurant table
            </p>
          </section>
        </div>

        {/* ITEMS */}

        <section className="mt-5 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Package
              size={18}
              className="text-[#B83A2E]"
            />

            <h2 className="font-semibold">
              Ordered Items
            </h2>
          </div>

          <div className="mt-6 divide-y divide-[#E5DED2]">
            {order.items.map(
              (item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  className="py-5 first:pt-0 last:pb-0"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-[#6B6258]">
                        ₹
                        {Number(
                          item.price
                        ).toLocaleString(
                          "en-IN"
                        )}{" "}
                        ×{" "}
                        {
                          item.quantity
                        }
                      </p>

                      {item.noodles && (
                        <p className="mt-2 text-xs text-[#6B6258]">
                          Noodles:{" "}
                          {
                            item.noodles
                          }
                        </p>
                      )}

                      {item.spice && (
                        <p className="mt-1 text-xs text-[#6B6258]">
                          Spice:{" "}
                          {
                            item.spice
                          }
                        </p>
                      )}

                      {item.addons
                        ?.length >
                        0 && (
                        <div className="mt-2 space-y-1">
                          {item.addons.map(
                            (
                              addon,
                              addonIndex
                            ) => (
                              <p
                                key={
                                  addonIndex
                                }
                                className="text-xs text-[#6B6258]"
                              >
                                +{" "}
                                {
                                  addon.name
                                }{" "}
                                ·{" "}
                                {formatPrice(
                                  addon.price
                                )}
                              </p>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <p className="font-semibold">
                      {formatPrice(
                        item.total
                      )}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* BILL */}

        <section className="mt-5 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Receipt
              size={18}
              className="text-[#B83A2E]"
            />

            <h2 className="font-semibold">
              Bill Summary
            </h2>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B6258]">
                Subtotal
              </span>

              <span>
                {formatPrice(
                  order.subtotal
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#6B6258]">
                Tax (
                {
                  order.taxRate
                }
                %)
              </span>

              <span>
                {formatPrice(
                  order.taxAmount
                )}
              </span>
            </div>

            <div className="border-t border-[#E5DED2] pt-4">
              <div className="flex justify-between">
                <span className="font-semibold">
                  Total
                </span>

                <span className="text-xl font-semibold">
                  {formatPrice(
                    order.total
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PAYMENT */}

        <section className="mt-5 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
                Payment
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {isPaid
                  ? "Paid"
                  : "Payment Pending"}
              </h2>
            </div>

            {isPaid && (
              <CheckCircle2
                size={26}
                className="text-green-600"
              />
            )}
          </div>

          {isPaid ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <PaymentInfo
                label="Method"
                value={
                  order.payment
                    ?.method
                    ?.toUpperCase() ||
                  "—"
                }
              />

              <PaymentInfo
                label="Amount"
                value={formatPrice(
                  order.payment
                    ?.amount
                )}
              />

              <PaymentInfo
                label="Paid At"
                value={formatDate(
                  order.payment
                    ?.paidAt
                )}
              />

              {order.payment
                ?.transactionId && (
                <div className="sm:col-span-3">
                  <PaymentInfo
                    label="Transaction ID"
                    value={
                      order.payment
                        .transactionId
                    }
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={
                    paymentMethod
                  }
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target
                        .value
                    )
                  }
                  className="h-12 rounded-xl border border-[#DED6C9] bg-white px-4 text-sm outline-none"
                >
                  <option value="cash">
                    Cash
                  </option>

                  <option value="upi">
                    UPI
                  </option>

                  <option value="card">
                    Card
                  </option>

                  <option value="online">
                    Online
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>

                <input
                  value={
                    transactionId
                  }
                  onChange={(event) =>
                    setTransactionId(
                      event.target
                        .value
                    )
                  }
                  placeholder="Transaction ID (optional)"
                  className="h-12 rounded-xl border border-[#DED6C9] bg-white px-4 text-sm outline-none"
                />
              </div>

              <button
                onClick={
                  markPaymentPaid
                }
                disabled={
                  updating
                }
                className="mt-4 flex items-center gap-2 rounded-xl bg-[#171513] px-5 py-3 text-xs font-semibold text-white disabled:opacity-50"
              >
                {updating && (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                )}

                Mark Payment as Paid
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ============================================================
// PAYMENT INFO
// ============================================================

function PaymentInfo({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-[#F5F0E8] p-4">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
        {label}
      </p>

      <p className="mt-1 break-all text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}