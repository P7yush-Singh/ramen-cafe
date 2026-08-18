"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  AlertCircle,
  Check,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Utensils,
  X,
} from "lucide-react";

// ============================================================
// CONFIG
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

  completed: {
    label: "Completed",
    className:
      "bg-emerald-50 text-emerald-700",
  },

  cancelled: {
    label: "Cancelled",
    className:
      "bg-red-50 text-red-700",
  },
};

const NEXT_ACTIONS = {
  pending: {
    label: "Confirm",
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
    label: "Complete",
    status: "completed",
  },

  completed: null,

  cancelled: null,
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
  if (!value) return "—";

  try {
    return new Date(
      value
    ).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function getStatusConfig(status) {
  return (
    STATUS_CONFIG[status] ||
    STATUS_CONFIG.pending
  );
}

// ============================================================
// PAGE
// ============================================================

export default function AdminOrdersPage() {
  const [orders, setOrders] =
    useState([]);

  const [counts, setCounts] =
    useState({
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      completed: 0,
      cancelled: 0,
    });

  const [pagination, setPagination] =
    useState(null);

  const [statusFilter, setStatusFilter] =
    useState("");

  const [paymentFilter, setPaymentFilter] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [updatingOrder, setUpdatingOrder] =
    useState(null);

  const [cancelOrder, setCancelOrder] =
    useState(null);

  const [cancelReason, setCancelReason] =
    useState("");

  // ==========================================================
  // LOAD
  // ==========================================================

  const loadOrders = useCallback(
    async ({
      silent = false,
    } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params =
          new URLSearchParams();

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (statusFilter) {
          params.set(
            "status",
            statusFilter
          );
        }

        if (paymentFilter) {
          params.set(
            "paymentStatus",
            paymentFilter
          );
        }

        params.set(
          "page",
          String(page)
        );

        params.set(
          "limit",
          "20"
        );

        const response =
          await fetch(
            `/api/admin/orders?${params.toString()}`,
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

        setCounts(
          data.counts || {}
        );

        setPagination(
          data.pagination ||
            null
        );
      } catch (err) {
        console.error(
          "Admin orders error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load orders."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      page,
      search,
      statusFilter,
      paymentFilter,
    ]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // ==========================================================
  // AUTO REFRESH
  // ==========================================================

  useEffect(() => {
    const interval =
      setInterval(() => {
        loadOrders({
          silent: true,
        });
      }, 15000);

    return () =>
      clearInterval(
        interval
      );
  }, [loadOrders]);

  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  async function updateStatus(
    order,
    status,
    cancellationReason = ""
  ) {
    if (
      !order?.orderNumber
    ) {
      return;
    }

    try {
      setUpdatingOrder(
        order.orderNumber
      );

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
              cancellationReason,
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

      setCancelOrder(null);
      setCancelReason("");

      await loadOrders({
        silent: true,
      });
    } catch (err) {
      console.error(
        "Order status update error:",
        err
      );

      alert(
        err?.message ||
          "Unable to update order."
      );
    } finally {
      setUpdatingOrder(null);
    }
  }

  function handleAction(order) {
    const action =
      NEXT_ACTIONS[
        order.status
      ];

    if (!action) return;

    updateStatus(
      order,
      action.status
    );
  }

  function handleCancel() {
    if (
      !cancelOrder
    ) {
      return;
    }

    if (
      !cancelReason.trim()
    ) {
      alert(
        "Please enter a cancellation reason."
      );

      return;
    }

    updateStatus(
      cancelOrder,
      "cancelled",
      cancelReason.trim()
    );
  }

  // ==========================================================
  // STATS
  // ==========================================================

  const activeOrders =
    Number(
      counts.pending || 0
    ) +
    Number(
      counts.confirmed || 0
    ) +
    Number(
      counts.preparing || 0
    ) +
    Number(
      counts.ready || 0
    ) +
    Number(
      counts.served || 0
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#F5F0E8] text-[#171513]">
      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-[#E5DED2] bg-[#F5F0E8]/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="Ramen Cafe"
              width={50}
              height={50}
            />

            <div>
              <p className="text-sm font-semibold tracking-[0.15em]">
                RAMEN CAFE
              </p>

              <p className="text-[9px] tracking-[0.18em] text-[#6B6258]">
                ADMIN PANEL
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              loadOrders({
                silent: true,
              })
            }
            disabled={refreshing}
            className="flex h-10 items-center gap-2 rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 text-xs font-semibold disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="mb-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
            Restaurant Operations
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Orders
          </h1>

          <p className="mt-2 text-sm text-[#6B6258]">
            Manage orders, kitchen
            workflow and payments.
          </p>
        </div>

        {/* STATS */}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard
            label="Pending"
            value={counts.pending}
            icon={<Clock3 size={18} />}
            active={
              statusFilter ===
              "pending"
            }
            onClick={() => {
              setPage(1);
              setStatusFilter(
                statusFilter ===
                  "pending"
                  ? ""
                  : "pending"
              );
            }}
          />

          <StatCard
            label="Confirmed"
            value={counts.confirmed}
            icon={<Check size={18} />}
            active={
              statusFilter ===
              "confirmed"
            }
            onClick={() => {
              setPage(1);
              setStatusFilter(
                statusFilter ===
                  "confirmed"
                  ? ""
                  : "confirmed"
              );
            }}
          />

          <StatCard
            label="Preparing"
            value={counts.preparing}
            icon={<Utensils size={18} />}
            active={
              statusFilter ===
              "preparing"
            }
            onClick={() => {
              setPage(1);
              setStatusFilter(
                statusFilter ===
                  "preparing"
                  ? ""
                  : "preparing"
              );
            }}
          />

          <StatCard
            label="Ready"
            value={counts.ready}
            icon={<Package size={18} />}
            active={
              statusFilter ===
              "ready"
            }
            onClick={() => {
              setPage(1);
              setStatusFilter(
                statusFilter ===
                  "ready"
                  ? ""
                  : "ready"
              );
            }}
          />

          <StatCard
            label="Served"
            value={counts.served}
            icon={<Check size={18} />}
            active={
              statusFilter ===
              "served"
            }
            onClick={() => {
              setPage(1);
              setStatusFilter(
                statusFilter ===
                  "served"
                  ? ""
                  : "served"
              );
            }}
          />

          <StatCard
            label="Completed"
            value={counts.completed}
            icon={<Check size={18} />}
            active={
              statusFilter ===
              "completed"
            }
            onClick={() => {
              setPage(1);
              setStatusFilter(
                statusFilter ===
                  "completed"
                  ? ""
                  : "completed"
              );
            }}
          />

          <StatCard
            label="Cancelled"
            value={counts.cancelled}
            icon={<X size={18} />}
            active={
              statusFilter ===
              "cancelled"
            }
            onClick={() => {
              setPage(1);
              setStatusFilter(
                statusFilter ===
                  "cancelled"
                  ? ""
                  : "cancelled"
              );
            }}
          />
        </div>

        {/* TOOLBAR */}

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xl">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8177]"
            />

            <input
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
                setPage(1);
              }}
              placeholder="Search order, customer, phone, table..."
              className="h-12 w-full rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] pl-11 pr-4 text-sm outline-none focus:border-[#B83A2E]"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value
                );
                setPage(1);
              }}
              className="h-12 rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] px-4 text-sm outline-none"
            >
              <option value="">
                All Status
              </option>

              {Object.entries(
                STATUS_CONFIG
              ).map(
                ([
                  value,
                  config,
                ]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {config.label}
                  </option>
                )
              )}
            </select>

            <select
              value={paymentFilter}
              onChange={(event) => {
                setPaymentFilter(
                  event.target.value
                );
                setPage(1);
              }}
              className="h-12 rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] px-4 text-sm outline-none"
            >
              <option value="">
                All Payments
              </option>

              <option value="pending">
                Payment Pending
              </option>

              <option value="paid">
                Paid
              </option>

              <option value="failed">
                Failed
              </option>

              <option value="refunded">
                Refunded
              </option>
            </select>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-5">
            <AlertCircle
              size={18}
              className="mt-0.5 text-red-600"
            />

            <div>
              <p className="text-sm font-semibold text-red-700">
                Unable to load orders
              </p>

              <p className="mt-1 text-xs text-red-600">
                {error}
              </p>

              <button
                onClick={() =>
                  loadOrders()
                }
                className="mt-3 rounded-xl bg-[#171513] px-4 py-2 text-xs font-semibold text-white"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-56 animate-pulse rounded-3xl bg-[#FFFDF8]"
                />
              )
            )}
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          orders.length ===
            0 && (
            <div className="mt-6 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F0E8] text-3xl">
                🍜
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                No orders found
              </h2>

              <p className="mt-2 text-sm text-[#6B6258]">
                No orders match the
                current filters.
              </p>
            </div>
          )}

        {/* ORDERS */}

        {!loading &&
          !error &&
          orders.length >
            0 && (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {orders.map(
                (order) => (
                  <OrderCard
                    key={
                      order._id ||
                      order.orderNumber
                    }
                    order={order}
                    updating={
                      updatingOrder ===
                      order.orderNumber
                    }
                    onAction={() =>
                      handleAction(
                        order
                      )
                    }
                    onCancel={() => {
                      setCancelOrder(
                        order
                      );
                      setCancelReason(
                        ""
                      );
                    }}
                  />
                )
              )}
            </div>
          )}

        {/* PAGINATION */}

        {pagination &&
          pagination.totalPages >
            1 && (
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] p-4">
              <p className="text-xs text-[#6B6258]">
                Page{" "}
                <b className="text-[#171513]">
                  {pagination.page}
                </b>{" "}
                of{" "}
                <b className="text-[#171513]">
                  {
                    pagination.totalPages
                  }
                </b>
              </p>

              <div className="flex gap-2">
                <button
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    setPage(
                      (value) =>
                        Math.max(
                          1,
                          value - 1
                        )
                    )
                  }
                  className="rounded-xl border border-[#DED6C9] px-4 py-2 text-xs font-semibold disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    setPage(
                      (value) =>
                        value + 1
                    )
                  }
                  className="rounded-xl bg-[#171513] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </div>

      {/* CANCEL MODAL */}

      {cancelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-[#FFFDF8] p-6">
            <h2 className="text-xl font-semibold">
              Cancel Order
            </h2>

            <p className="mt-2 text-sm text-[#6B6258]">
              Order #
              {
                cancelOrder.orderNumber
              }
            </p>

            <textarea
              value={cancelReason}
              onChange={(event) =>
                setCancelReason(
                  event.target.value
                )
              }
              placeholder="Enter cancellation reason..."
              rows={4}
              className="mt-5 w-full rounded-2xl border border-[#DED6C9] bg-white p-4 text-sm outline-none focus:border-[#B83A2E]"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() =>
                  setCancelOrder(
                    null
                  )
                }
                className="rounded-xl border border-[#DED6C9] px-4 py-2.5 text-xs font-semibold"
              >
                Close
              </button>

              <button
                onClick={
                  handleCancel
                }
                disabled={
                  updatingOrder ===
                  cancelOrder.orderNumber
                }
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {updatingOrder ===
                cancelOrder.orderNumber ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : null}

                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  icon,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left transition ${
        active
          ? "border-[#B83A2E] bg-[#FFFDF8] shadow-sm"
          : "border-[#E5DED2] bg-[#FFFDF8] hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5F0E8] text-[#B83A2E]">
          {icon}
        </div>

        <ChevronRight
          size={16}
          className="text-[#8A8177]"
        />
      </div>

      <p className="mt-5 text-xs text-[#6B6258]">
        {label}
      </p>

      <p className="mt-1 text-3xl font-semibold">
        {value || 0}
      </p>
    </button>
  );
}

// ============================================================
// ORDER CARD
// ============================================================

function OrderCard({
  order,
  updating,
  onAction,
  onCancel,
}) {
  const status =
    getStatusConfig(
      order.status
    );

  const action =
    NEXT_ACTIONS[
      order.status
    ];

  const totalItems =
    Array.isArray(order.items)
      ? order.items.reduce(
          (sum, item) =>
            sum +
            Number(
              item.quantity || 0
            ),
          0
        )
      : 0;

  const paymentPaid =
    order.payment?.status ===
    "paid";

  return (
    <article className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 shadow-sm sm:p-6">
      {/* TOP */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
            Order
          </p>

          <h2 className="mt-1 text-lg font-semibold">
            #{order.orderNumber}
          </h2>
        </div>

        <span
          className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* INFO */}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <InfoItem
          icon={<MapPin size={14} />}
          label={`Table ${
            order.tableId ||
            "—"
          }`}
        />

        <InfoItem
          icon={<Package size={14} />}
          label={`${totalItems} ${
            totalItems === 1
              ? "item"
              : "items"
          }`}
        />

        <InfoItem
          icon={<Clock3 size={14} />}
          label={formatDate(
            order.createdAt
          )}
        />
      </div>

      {/* CUSTOMER */}

      <div className="mt-5 rounded-2xl bg-[#F5F0E8] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8177]">
          Customer
        </p>

        <p className="mt-1 text-sm font-semibold">
          {order.customer?.name ||
            "Unknown Customer"}
        </p>

        <p className="mt-1 text-xs text-[#6B6258]">
          {order.customer?.phone ||
            order.customer?.email ||
            "No contact"}
        </p>
      </div>

      {/* PAYMENT */}

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#E5DED2] bg-white px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
            Payment
          </p>

          <p
            className={`mt-1 text-xs font-semibold ${
              paymentPaid
                ? "text-green-700"
                : "text-amber-700"
            }`}
          >
            {paymentPaid
              ? `Paid${
                  order.payment?.method
                    ? ` · ${order.payment.method.toUpperCase()}`
                    : ""
                }`
              : "Payment Pending"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
            Total
          </p>

          <p className="mt-0.5 text-xl font-semibold">
            {formatPrice(
              order.total
            )}
          </p>
        </div>
      </div>

      {/* ACTIONS */}

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        <Link
          href={`/admin/orders/${encodeURIComponent(
            order.orderNumber
          )}`}
          className="rounded-xl border border-[#DED6C9] px-4 py-2.5 text-xs font-semibold hover:bg-[#F5F0E8]"
        >
          View Details
        </Link>

        {action && (
          <button
            disabled={updating}
            onClick={onAction}
            className="flex items-center gap-2 rounded-xl bg-[#B83A2E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#171513] disabled:opacity-50"
          >
            {updating ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Check
                size={14}
              />
            )}

            {action.label}
          </button>
        )}

        {[
          "pending",
          "confirmed",
          "preparing",
        ].includes(
          order.status
        ) && (
          <button
            disabled={updating}
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </article>
  );
}

// ============================================================
// INFO ITEM
// ============================================================

function InfoItem({
  icon,
  label,
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-[#6B6258]">
      <span className="text-[#B83A2E]">
        {icon}
      </span>

      {label}
    </div>
  );
}