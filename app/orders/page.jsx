"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  MapPin,
  ShoppingBag,
} from "lucide-react";

import {
  getMenuUrl,
} from "@/lib/tableSession";

export default function OrdersPage() {
  const [orders, setOrders] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setIsLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/orders",
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
            "Unable to load orders."
        );
      }

      setOrders(
        Array.isArray(
          data.orders
        )
          ? data.orders
          : []
      );
    } catch (error) {
      console.error(
        "Orders loading error:",
        error
      );

      setError(
        error.message ||
          "Unable to load your orders."
      );
    } finally {
      setIsLoading(false);
    }
  }

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
    ).toLocaleDateString(
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

  function getStatusStyle(
    status
  ) {
    switch (status) {
      case "confirmed":
        return "bg-blue-50 text-blue-700";

      case "preparing":
        return "bg-amber-50 text-amber-700";

      case "ready":
        return "bg-green-50 text-green-700";

      case "served":
        return "bg-gray-100 text-gray-700";

      case "cancelled":
        return "bg-red-50 text-red-700";

      default:
        return "bg-[#F5F0E8] text-[#6B6258]";
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8]">

      {/* ============================================
          HEADER
      ============================================= */}

      <header className="border-b border-[#E5DED2] bg-[#F5F0E8]">

        <div className="mx-auto flex h-20 max-w-[900px] items-center justify-between px-4 sm:px-8">

          <Link
            href={getMenuUrl()}
            className="flex items-center gap-2 text-sm font-medium text-[#6B6258]"
          >
            <ArrowLeft size={17} />

            Menu
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

      </header>

      {/* ============================================
          CONTENT
      ============================================= */}

      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-8 sm:py-12">

        <div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
            Account
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            My Orders
          </h1>

          <p className="mt-2 text-sm text-[#6B6258]">
            View your previous and current
            Ramen Cafe orders.
          </p>

        </div>

        {/* ==========================================
            LOADING
        =========================================== */}

        {isLoading && (
          <div className="mt-8 space-y-4">

            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-3xl bg-[#FFFDF8]"
                />
              )
            )}

          </div>
        )}

        {/* ==========================================
            ERROR
        =========================================== */}

        {!isLoading && error && (
          <div className="mt-8 rounded-3xl border border-red-100 bg-red-50 p-6">

            <p className="text-sm font-semibold text-red-700">
              Unable to load orders
            </p>

            <p className="mt-1 text-xs text-red-600">
              {error}
            </p>

            <button
              onClick={loadOrders}
              className="mt-4 rounded-xl bg-[#171513] px-4 py-2.5 text-xs font-semibold text-white"
            >
              Try Again
            </button>

          </div>
        )}

        {/* ==========================================
            EMPTY
        =========================================== */}

        {!isLoading &&
          !error &&
          orders.length === 0 && (
            <div className="mt-8 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-10 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F0E8] text-3xl">
                🍜
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                No orders yet
              </h2>

              <p className="mt-2 text-sm text-[#6B6258]">
                Your Ramen Cafe orders will
                appear here.
              </p>

              <Link
                href={getMenuUrl()}
                className="mt-6 inline-flex rounded-2xl bg-[#B83A2E] px-6 py-3.5 text-sm font-semibold text-white"
              >
                Browse Menu
              </Link>

            </div>
          )}

        {/* ==========================================
            ORDERS
        =========================================== */}

        {!isLoading &&
          !error &&
          orders.length > 0 && (
            <div className="mt-8 space-y-4">

              {orders.map(
                (order) => (
                  <Link
                    key={
                      order._id ||
                      order.orderNumber
                    }
                    href={`/orders/${encodeURIComponent(
                      order.orderNumber
                    )}`}
                    className="group block rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A8177]">
                          Order
                        </p>

                        <h2 className="mt-1 text-lg font-semibold">
                          #
                          {
                            order.orderNumber
                          }
                        </h2>

                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-semibold capitalize ${getStatusStyle(
                          order.status
                        )}`}
                      >
                        {
                          order.status
                        }
                      </span>

                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">

                      <div className="flex items-center gap-2 text-xs text-[#6B6258]">

                        <MapPin
                          size={14}
                        />

                        Table{" "}
                        {
                          order.tableId
                        }

                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#6B6258]">

                        <Clock3
                          size={14}
                        />

                        {formatDate(
                          order.createdAt
                        )}

                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#6B6258]">

                        <ShoppingBag
                          size={14}
                        />

                        {
                          order.items
                            ?.length || 0
                        }{" "}
                        items

                      </div>

                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[#E5DED2] pt-4">

                      <div>

                        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                          Total
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                          {formatPrice(
                            order.total
                          )}
                        </p>

                      </div>

                      <div className="flex items-center gap-1 text-sm font-semibold">

                        View Order

                        <ChevronRight
                          size={17}
                          className="transition group-hover:translate-x-1"
                        />

                      </div>

                    </div>

                  </Link>
                )
              )}

            </div>
          )}

      </div>

    </main>
  );
}