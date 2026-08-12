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
  Clock3,
  MapPin,
  PackageCheck,
  ChefHat,
  ShoppingBag,
} from "lucide-react";

import {
  getMenuUrl,
} from "@/lib/tableSession";

export default function OrderDetailsPage({
  params,
}) {
  const [order, setOrder] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadOrder() {
      try {
        const {
          orderNumber,
        } = await params;

        const response =
          await fetch(
            `/api/orders/${encodeURIComponent(
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
      } catch (error) {
        console.error(
          "Order details error:",
          error
        );

        setError(
          error.message ||
            "Unable to load order."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [params]);

  function formatPrice(
    value
  ) {
    return `₹${Math.round(
      Number(value || 0)
    ).toLocaleString(
      "en-IN"
    )}`;
  }

  function formatDate(
    value
  ) {
    if (!value) {
      return "";
    }

    return new Date(
      value
    ).toLocaleString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F5F0E8] px-4 py-12">

        <div className="mx-auto max-w-[760px] lg:mb-16">

          <div className="h-8 w-32 animate-pulse rounded bg-[#DED6C9]" />

          <div className="mt-8 h-[650px] animate-pulse rounded-3xl bg-[#FFFDF8]" />

        </div>

      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F0E8] px-4">

        <div className="w-full max-w-md rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-8 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F0E8] text-3xl">
            🍜
          </div>

          <h1 className="mt-5 text-2xl font-semibold">
            Order not found
          </h1>

          <p className="mt-2 text-sm text-[#6B6258]">
            {error ||
              "This order does not exist or does not belong to your account."}
          </p>

          <Link
            href="/orders"
            className="mt-6 inline-flex rounded-2xl bg-[#171513] px-6 py-3.5 text-sm font-semibold text-white"
          >
            Back to Orders
          </Link>

        </div>

      </main>
    );
  }

  const statusSteps = [
    {
      key: "pending",
      label: "Order Placed",
      description:
        "We've received your order.",
      icon: Check,
    },
    {
      key: "confirmed",
      label: "Confirmed",
      description:
        "The restaurant has confirmed your order.",
      icon: CheckCircle2,
    },
    {
      key: "preparing",
      label: "Preparing",
      description:
        "Your food is being prepared.",
      icon: ChefHat,
    },
    {
      key: "ready",
      label: "Ready",
      description:
        "Your order is ready.",
      icon: PackageCheck,
    },
    {
      key: "served",
      label: "Served",
      description:
        "Enjoy your meal!",
      icon: CheckCircle2,
    },
  ];

  const statusIndex =
    statusSteps.findIndex(
      (step) =>
        step.key ===
        order.status
    );

  const currentStatusIndex =
    statusIndex === -1
      ? 0
      : statusIndex;

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-7 sm:py-10">

      <div className="mx-auto max-w-[760px]">

        {/* ==========================================
            HEADER
        =========================================== */}

        <div className="flex items-center justify-between">

          <Link
            href="/orders"
            className="flex items-center gap-2 text-sm font-medium text-[#6B6258]"
          >
            <ArrowLeft size={17} />

            My Orders
          </Link>

          <div className="text-center">

            <p className="text-sm font-semibold tracking-[0.15em]">
              RAMEN CAFE
            </p>

            <p className="text-[8px] tracking-[0.18em] text-[#6B6258]">
              ラーメンカフェ
            </p>

          </div>

          <ShoppingBag
            size={18}
          />

        </div>

        {/* ==========================================
            TITLE
        =========================================== */}

        <div className="mt-8">

          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
            Order Details
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            #{order.orderNumber}
          </h1>

          <p className="mt-2 text-xs text-[#8A8177]">
            {formatDate(
              order.createdAt
            )}
          </p>

        </div>

        {/* ==========================================
            STATUS
        =========================================== */}

        <section className="mt-7 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-7">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
                Order Status
              </p>

              <h2 className="mt-1 text-xl font-semibold capitalize">
                {order.status}
              </h2>

            </div>

            <Clock3
              size={22}
              className="text-[#B83A2E]"
            />

          </div>

          {order.status !==
            "cancelled" && (
            <div className="mt-7">

              {statusSteps.map(
                (
                  step,
                  index
                ) => {
                  const Icon =
                    step.icon;

                  const completed =
                    index <=
                    currentStatusIndex;

                  const active =
                    index ===
                    currentStatusIndex;

                  return (
                    <div
                      key={
                        step.key
                      }
                      className="flex gap-4"
                    >

                      <div className="flex flex-col items-center">

                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            completed
                              ? "bg-[#B83A2E] text-white"
                              : "bg-[#F5F0E8] text-[#9A9186]"
                          }`}
                        >
                          <Icon
                            size={16}
                          />
                        </div>

                        {index <
                          statusSteps.length -
                            1 && (
                          <div
                            className={`my-1 h-10 w-px ${
                              index <
                              currentStatusIndex
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

          {order.status ===
            "cancelled" && (
            <div className="mt-6 rounded-2xl bg-red-50 p-4">

              <p className="text-sm font-semibold text-red-700">
                This order has been
                cancelled.
              </p>

              {order.cancellationReason && (
                <p className="mt-1 text-xs text-red-600">
                  {
                    order.cancellationReason
                  }
                </p>
              )}

            </div>
          )}

          {order.status !==
            "cancelled" &&
            order.estimatedReadyAt && (
              <div className="mt-2 rounded-2xl bg-[#F5F0E8] p-4">

                <p className="text-xs font-semibold">
                  Estimated ready time
                </p>

                <p className="mt-1 text-sm text-[#6B6258]">
                  {formatDate(
                    order.estimatedReadyAt
                  )}
                </p>

              </div>
            )}

        </section>

        {/* ==========================================
            TABLE
        =========================================== */}

        <section className="mt-4 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#171513] text-white">

              <MapPin
                size={18}
              />

            </div>

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8A8177]">
                Dining Table
              </p>

              <p className="mt-1 text-lg font-semibold">
                Table{" "}
                {order.tableId}
              </p>

            </div>

          </div>

        </section>

        {/* ==========================================
            ITEMS
        =========================================== */}

        <section className="mt-4 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-7">

          <div className="flex items-center gap-2">

            <ShoppingBag
              size={18}
            />

            <h2 className="font-semibold">
              Order Items
            </h2>

          </div>

          <div className="mt-6 space-y-5">

            {order.items?.map(
              (
                item,
                index
              ) => (
                <div
                  key={`${item.productId}-${index}`}
                  className="flex gap-4"
                >

                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#F5F0E8]">

                    {item.image ? (
                      <img
                        src={item.image}
                        alt={
                          item.name
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">
                        🍜
                      </div>
                    )}

                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex justify-between gap-3">

                      <div>

                        <p className="text-sm font-semibold">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs text-[#8A8177]">
                          Qty{" "}
                          {
                            item.quantity
                          }
                          {" · "}
                          {formatPrice(
                            item.price
                          )}
                          {" / item"}
                        </p>

                      </div>

                      <p className="text-sm font-semibold">
                        {formatPrice(
                          item.total
                        )}
                      </p>

                    </div>

                    {(item.noodles ||
                      item.spice) && (
                      <div className="mt-2 text-[10px] text-[#6B6258]">

                        {item.noodles && (
                          <span>
                            Noodles:{" "}
                            {
                              item.noodles
                            }
                          </span>
                        )}

                        {item.noodles &&
                          item.spice && (
                            <span>
                              {" · "}
                            </span>
                          )}

                        {item.spice && (
                          <span>
                            Spice:{" "}
                            {
                              item.spice
                            }
                          </span>
                        )}

                      </div>
                    )}

                    {item.addons?.length > 0 && (
                      <p className="mt-1 text-[10px] text-[#6B6258]">
                        Add-ons:{" "}
                        {item.addons.map((addon, index) => (
                          <span key={`${addon.name}-${index}`}>
                            {addon.name} (
                            <span className="font-bold">
                              {formatPrice(addon.price)}
                            </span>
                            ){index < item.addons.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </p>
                    )}

                  </div>

                </div>
              )
            )}

          </div>

        </section>

        {/* ==========================================
            BILL
        =========================================== */}

        <section className="mt-4 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-7">

          <h2 className="font-semibold">
            Bill Summary
          </h2>

          <div className="mt-5 space-y-3 text-sm">

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
                GST (
                {
                  order.taxRate
                }%)
              </span>

              <span>
                {formatPrice(
                  order.taxAmount
                )}
              </span>

            </div>

            <div className="flex justify-between border-t border-[#E5DED2] pt-4">

              <span className="font-semibold">
                Total
              </span>

              <span className="text-2xl font-semibold">
                {formatPrice(
                  order.total
                )}
              </span>

            </div>

          </div>

          <div className="mt-5 flex justify-between rounded-2xl bg-[#F5F0E8] p-4">

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                Payment
              </p>

              <p className="mt-1 text-sm font-semibold capitalize">
                {
                  order.paymentStatus
                }
              </p>

            </div>

            {order.paymentMethod && (
              <div className="text-right">

                <p className="text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                  Method
                </p>

                <p className="mt-1 text-sm font-semibold capitalize">
                  {
                    order.paymentMethod
                  }
                </p>

              </div>
            )}

          </div>

        </section>

        {/* ==========================================
            ACTIONS
        =========================================== */}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">

          <Link
            href="/orders"
            className="rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] px-5 py-4 text-center text-sm font-semibold"
          >
            All Orders
          </Link>

          <Link
            href={getMenuUrl()}
            className="rounded-2xl bg-[#171513] px-5 py-4 text-center text-sm font-semibold text-white"
          >
            Order Again
          </Link>

        </div>

      </div>

    </main>
  );
}