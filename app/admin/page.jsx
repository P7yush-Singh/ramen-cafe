"use client";

import Link from "next/link";

import {
  ArrowUpRight,
  Clock3,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  Utensils,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

// ============================================================
// STATUS CONFIG
// ============================================================

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className:
      "bg-[#FFF7E8] text-[#9A6700]",
  },

  confirmed: {
    label: "Confirmed",
    className:
      "bg-blue-50 text-blue-700",
  },

  preparing: {
    label: "Preparing",
    className:
      "bg-amber-50 text-amber-700",
  },

  ready: {
    label: "Ready",
    className:
      "bg-green-50 text-green-700",
  },

  served: {
    label: "Served",
    className:
      "bg-gray-100 text-gray-700",
  },

  cancelled: {
    label: "Cancelled",
    className:
      "bg-red-50 text-red-700",
  },
};

// ============================================================
// HELPERS
// ============================================================

function formatPrice(
  value
) {
  return `₹${Number(
    value || 0
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}

function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(
      value
    ).toLocaleString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  } catch {
    return "—";
  }
}

// ============================================================
// PAGE
// ============================================================

export default function AdminDashboardPage() {
  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // ==========================================================
  // FETCH DASHBOARD
  // ==========================================================

  const loadDashboard =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        try {
          if (silent) {
            setIsRefreshing(
              true
            );
          } else {
            setIsLoading(
              true
            );
          }

          setError("");

          const response =
            await fetch(
              "/api/admin/dashboard",
              {
                method: "GET",
                credentials:
                  "include",
                cache: "no-store",
              }
            );

          const data =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ||
                "Unable to load dashboard."
            );
          }

          setDashboard(
            data
          );
        } catch (error) {
          console.error(
            "Dashboard error:",
            error
          );

          setError(
            error.message ||
              "Unable to load dashboard."
          );
        } finally {
          setIsLoading(
            false
          );

          setIsRefreshing(
            false
          );
        }
      },
      []
    );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ==========================================================
  // AUTO REFRESH
  // ==========================================================

  useEffect(() => {
    const interval =
      setInterval(() => {
        loadDashboard({
          silent: true,
        });
      }, 30000);

    return () =>
      clearInterval(
        interval
      );
  }, [loadDashboard]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    isLoading &&
    !dashboard
  ) {
    return (
      <main className="min-h-screen bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <Loader2
                size={30}
                className="mx-auto animate-spin text-[#B83A2E]"
              />

              <p className="mt-4 text-sm text-[#6B6258]">
                Loading restaurant
                dashboard...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error &&
    !dashboard
  ) {
    return (
      <main className="min-h-screen bg-[#F5F0E8]">
        <div className="mx-auto max-w-[700px] px-4 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-2xl font-semibold">
            Dashboard unavailable
          </h1>

          <p className="mt-2 text-sm text-[#6B6258]">
            {error}
          </p>

          <button
            onClick={() =>
              loadDashboard()
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#171513] px-5 py-3 text-sm font-semibold text-white"
          >
            <RefreshCw
              size={15}
            />

            Try Again
          </button>
        </div>
      </main>
    );
  }

  const overview =
    dashboard?.overview ||
    {};

  const counts =
    dashboard?.statusCounts ||
    {};

  const recentOrders =
    dashboard?.recentOrders ||
    [];

  const popularProducts =
    dashboard?.popularProducts ||
    [];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="border-b border-[#E5DED2]">
        <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
                Restaurant Overview
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                Dashboard
              </h1>

              <p className="mt-2 text-sm text-[#6B6258]">
                Today's Ramen Cafe
                performance and
                operations.
              </p>
            </div>

            <button
              onClick={() =>
                loadDashboard({
                  silent: true,
                })
              }
              disabled={
                isRefreshing
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 text-xs font-semibold transition hover:bg-white disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* ====================================================
            ERROR BANNER
        ==================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-800">
            Dashboard refresh failed:
            {" "}
            {error}
          </div>
        )}

        {/* ====================================================
            OVERVIEW
        ==================================================== */}

        <section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStat
              label="Today's Revenue"
              value={formatPrice(
                overview.revenue
              )}
              change={`${formatPrice(
                overview.averageOrderValue
              )} average order`}
              icon={
                <TrendingUp
                  size={19}
                />
              }
            />

            <DashboardStat
              label="Today's Orders"
              value={
                overview.orders ||
                0
              }
              change={`${overview.itemsSold || 0} items sold`}
              icon={
                <ShoppingBag
                  size={19}
                />
              }
            />

            <DashboardStat
              label="Customers"
              value={
                overview.customers ||
                0
              }
              change="Unique customers today"
              icon={
                <Users
                  size={19}
                />
              }
            />

            <DashboardStat
              label="Active Tables"
              value={
                overview.activeTables ||
                0
              }
              change="Tables used today"
              icon={
                <Store
                  size={19}
                />
              }
            />
          </div>
        </section>

        {/* ====================================================
            KITCHEN
        ==================================================== */}

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B83A2E]">
                Live Operations
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                Kitchen Status
              </h2>
            </div>

            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-semibold text-[#B83A2E]"
            >
              View Orders

              <ArrowUpRight
                size={14}
              />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KitchenStatus
              label="Pending"
              value={
                counts.pending ||
                0
              }
              icon={
                <Clock3
                  size={18}
                />
              }
            />

            <KitchenStatus
              label="Confirmed"
              value={
                counts.confirmed ||
                0
              }
              icon={
                <ShoppingBag
                  size={18}
                />
              }
            />

            <KitchenStatus
              label="Preparing"
              value={
                counts.preparing ||
                0
              }
              icon={
                <Utensils
                  size={18}
                />
              }
            />

            <KitchenStatus
              label="Ready"
              value={
                counts.ready ||
                0
              }
              icon={
                <Package
                  size={18}
                />
              }
            />
          </div>
        </section>

        {/* ====================================================
            MAIN GRID
        ==================================================== */}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          {/* ==================================================
              RECENT ORDERS
          ================================================== */}

          <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8]">
            <div className="flex items-center justify-between border-b border-[#E8E1D6] p-5 sm:p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B83A2E]">
                  Activity
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  Recent Orders
                </h2>
              </div>

              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-[#B83A2E]"
              >
                View all
              </Link>
            </div>

            {recentOrders.length ===
            0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F0E8]">
                  🍜
                </div>

                <p className="mt-4 text-sm font-semibold">
                  No orders yet
                </p>

                <p className="mt-1 text-xs text-[#6B6258]">
                  New restaurant
                  orders will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E8E1D6]">
                {recentOrders.map(
                  (order) => (
                    <Link
                      key={
                        order.id
                      }
                      href={`/admin/orders/${encodeURIComponent(
                        order.orderNumber
                      )}`}
                      className="flex items-center justify-between gap-4 p-5 transition hover:bg-[#F9F6F0]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">
                            #
                            {
                              order.orderNumber
                            }
                          </p>

                          <StatusBadge
                            status={
                              order.status
                            }
                          />
                        </div>

                        <p className="mt-1 text-xs text-[#6B6258]">
                          Table{" "}
                          {
                            order.tableId
                          }{" "}
                          •{" "}
                          {
                            order.itemCount
                          }{" "}
                          items
                        </p>

                        <p className="mt-1 text-[10px] text-[#9B9186]">
                          {
                            order
                              .customer
                              ?.name ||
                            "Customer"
                          }{" "}
                          •{" "}
                          {formatDate(
                            order.createdAt
                          )}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">
                          {formatPrice(
                            order.total
                          )}
                        </p>

                        <ArrowUpRight
                          size={14}
                          className="ml-auto mt-2 text-[#9B9186]"
                        />
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </section>

          {/* ==================================================
              POPULAR PRODUCTS
          ================================================== */}

          <section className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8]">
            <div className="border-b border-[#E8E1D6] p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B83A2E]">
                Menu Performance
              </p>

              <h2 className="mt-1 text-lg font-semibold">
                Popular Today
              </h2>
            </div>

            {popularProducts.length ===
            0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F0E8]">
                  🍜
                </div>

                <p className="mt-4 text-sm font-semibold">
                  No product data
                </p>

                <p className="mt-1 text-xs text-[#6B6258]">
                  Product performance
                  will appear after
                  orders are placed.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E8E1D6]">
                {popularProducts.map(
                  (
                    product,
                    index
                  ) => (
                    <div
                      key={
                        product.productId ||
                        `${product.name}-${index}`
                      }
                      className="flex items-center justify-between gap-4 p-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F0E8] text-xs font-bold text-[#B83A2E]">
                          {index +
                            1}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {
                              product.name
                            }
                          </p>

                          <p className="mt-1 text-[10px] text-[#6B6258]">
                            {
                              product.quantity
                            }{" "}
                            sold
                          </p>
                        </div>
                      </div>

                      <p className="shrink-0 text-sm font-semibold">
                        {formatPrice(
                          product.revenue
                        )}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </div>

        {/* ====================================================
            QUICK ACTIONS
        ==================================================== */}

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B83A2E]">
              Quick Actions
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Restaurant Management
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickAction
              title="Manage Orders"
              description="Accept, prepare, ready and serve restaurant orders."
              href="/admin/orders"
              icon={
                <ShoppingBag
                  size={19}
                />
              }
            />

            <QuickAction
              title="Manage Menu"
              description="Add products, update prices and control availability."
              href="/admin/products"
              icon={
                <Package
                  size={19}
                />
              }
            />

            <QuickAction
              title="Manage Tables"
              description="Configure tables and generate QR codes."
              href="/admin/tables"
              icon={
                <Store
                  size={19}
                />
              }
            />
          </div>
        </section>
      </div>
    </main>
  );
}

// ============================================================
// DASHBOARD STAT
// ============================================================

function DashboardStat({
  label,
  value,
  change,
  icon,
}) {
  return (
    <div className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5F0E8] text-[#B83A2E]">
          {icon}
        </div>

        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9B9186]">
          Today
        </span>
      </div>

      <p className="mt-5 text-xs text-[#6B6258]">
        {label}
      </p>

      <p className="mt-1 text-3xl font-semibold tracking-[-0.05em]">
        {value}
      </p>

      <p className="mt-2 text-[10px] text-[#9B9186]">
        {change}
      </p>
    </div>
  );
}

// ============================================================
// KITCHEN STATUS
// ============================================================

function KitchenStatus({
  label,
  value,
  icon,
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5F0E8] text-[#B83A2E]">
        {icon}
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8A8177]">
          {label}
        </p>

        <p className="mt-1 text-2xl font-semibold">
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}) {
  const config =
    STATUS_CONFIG[
      status
    ] ||
    STATUS_CONFIG.pending;

  return (
    <span
      className={`rounded-full px-2 py-1 text-[8px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// ============================================================
// QUICK ACTION
// ============================================================

function QuickAction({
  title,
  description,
  href,
  icon,
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 transition hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(0,0,0,0.05)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F0E8] text-[#B83A2E]">
          {icon}
        </div>

        <ArrowUpRight
          size={17}
          className="text-[#9B9186] transition group-hover:text-[#B83A2E]"
        />
      </div>

      <h3 className="mt-6 text-base font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-[#6B6258]">
        {description}
      </p>
    </Link>
  );
}