"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Check,
  ChevronRight,
  Clock3,
  Loader2,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Utensils,
  X,
} from "lucide-react";
import Image from "next/image";

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
// NEXT ACTIONS
// ============================================================

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

  served: null,

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
  if (!value) {
    return "—";
  }

  try {
    return new Date(
      value
    ).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
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
  // ==========================================================
  // STATE
  // ==========================================================

  const [orders, setOrders] =
    useState([]);

  const [counts, setCounts] =
    useState({
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      cancelled: 0,
    });

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState(null);

  const [updatingOrder, setUpdatingOrder] =
    useState(null);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [cancellationReason, setCancellationReason] =
    useState("");

  const [showCancelModal, setShowCancelModal] =
    useState(false);

  // ==========================================================
  // LOAD ORDERS
  // ==========================================================

  const loadOrders = useCallback(
    async ({
      silent = false,
    } = {}) => {
      try {
        if (silent) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setError("");

        const params =
          new URLSearchParams();

        if (statusFilter) {
          params.set(
            "status",
            statusFilter
          );
        }

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
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
              credentials:
                "include",
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
          data.counts || {
            pending: 0,
            confirmed: 0,
            preparing: 0,
            ready: 0,
            served: 0,
            cancelled: 0,
          }
        );

        setPagination(
          data.pagination ||
            null
        );
      } catch (error) {
        console.error(
          "Admin orders error:",
          error
        );

        setError(
          error.message ||
            "Unable to load orders."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      page,
      search,
      statusFilter,
    ]
  );

  // ==========================================================
  // INITIAL / FILTER LOAD
  // ==========================================================

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
  // STATUS FILTER
  // ==========================================================

  function handleStatusFilter(
    value
  ) {
    setStatusFilter(value);
    setPage(1);
  }

  // ==========================================================
  // SEARCH
  // ==========================================================

  function handleSearch(
    event
  ) {
    setSearch(
      event.target.value
    );

    setPage(1);
  }

  // ==========================================================
  // UPDATE ORDER STATUS
  // ==========================================================

  async function updateOrderStatus(
    order,
    nextStatus,
    reason = ""
  ) {
    if (!order?.orderNumber) {
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

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body: JSON.stringify({
              status:
                nextStatus,

              cancellationReason:
                reason,
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

      // Update selected order
      setSelectedOrder(
        data.order
      );

      // Close cancellation UI
      setShowCancelModal(
        false
      );

      setCancellationReason(
        ""
      );

      // Reload current list
      await loadOrders({
        silent: true,
      });
    } catch (error) {
      console.error(
        "Update order error:",
        error
      );

      alert(
        error.message ||
          "Unable to update order."
      );
    } finally {
      setUpdatingOrder(
        null
      );
    }
  }

  // ==========================================================
  // ACTION BUTTON
  // ==========================================================

  function handlePrimaryAction(
    order
  ) {
    const action =
      NEXT_ACTIONS[
        order.status
      ];

    if (!action) {
      return;
    }

    updateOrderStatus(
      order,
      action.status
    );
  }

  // ==========================================================
  // CANCEL
  // ==========================================================

  function openCancelModal(
    order
  ) {
    setSelectedOrder(
      order
    );

    setCancellationReason(
      ""
    );

    setShowCancelModal(
      true
    );
  }

  function confirmCancellation() {
    if (
      !cancellationReason.trim()
    ) {
      alert(
        "Please enter a cancellation reason."
      );

      return;
    }

    updateOrderStatus(
      selectedOrder,
      "cancelled",
      cancellationReason.trim()
    );
  }

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const activeOrders =
    useMemo(() => {
      return (
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
        )
      );
    }, [counts]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#F5F0E8] text-[#171513]">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 border-b border-[#E5DED2] bg-[#F5F0E8]/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full ">
              <Image src="/logo.png" alt="Ramen Cafe Logo" width={50} height={50} />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-[0.15em]">
                RAMEN CAFE
              </p>

              <p className="text-[9px] tracking-[0.18em] text-[#6B6258]">
                ADMIN PANEL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                loadOrders({
                  silent: true,
                })
              }
              disabled={
                isRefreshing
              }
              className="flex h-10 items-center gap-2 rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 text-xs font-semibold transition hover:bg-white disabled:opacity-50"
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

            <button
              className="flex h-10 items-center gap-2 rounded-xl bg-[#171513] px-4 text-xs font-semibold text-white transition hover:bg-[#B83A2E]"
            >
              <LogOut
                size={15}
              />

              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================
          BODY
      ====================================================== */}

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* ====================================================
            PAGE TITLE
        ==================================================== */}

        <div className="mb-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
            Restaurant Operations
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Orders
          </h1>

          <p className="mt-2 text-sm text-[#6B6258]">
            Manage incoming orders and
            control the kitchen workflow.
          </p>
        </div>

        {/* ====================================================
            STAT CARDS
        ==================================================== */}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Pending"
            value={counts.pending}
            icon={
              <Clock3 size={18} />
            }
            active={
              statusFilter ===
              "pending"
            }
            onClick={() =>
              handleStatusFilter(
                statusFilter ===
                  "pending"
                  ? ""
                  : "pending"
              )
            }
          />

          <StatCard
            label="Confirmed"
            value={counts.confirmed}
            icon={
              <Check size={18} />
            }
            active={
              statusFilter ===
              "confirmed"
            }
            onClick={() =>
              handleStatusFilter(
                statusFilter ===
                  "confirmed"
                  ? ""
                  : "confirmed"
              )
            }
          />

          <StatCard
            label="Preparing"
            value={counts.preparing}
            icon={
              <Utensils
                size={18}
              />
            }
            active={
              statusFilter ===
              "preparing"
            }
            onClick={() =>
              handleStatusFilter(
                statusFilter ===
                  "preparing"
                  ? ""
                  : "preparing"
              )
            }
          />

          <StatCard
            label="Ready"
            value={counts.ready}
            icon={
              <Package
                size={18}
              />
            }
            active={
              statusFilter ===
              "ready"
            }
            onClick={() =>
              handleStatusFilter(
                statusFilter ===
                  "ready"
                  ? ""
                  : "ready"
              )
            }
          />
        </div>

        {/* ====================================================
            TOOLBAR
        ==================================================== */}

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8177]"
            />

            <input
              value={search}
              onChange={
                handleSearch
              }
              placeholder="Search order, customer, phone..."
              className="h-12 w-full rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] pl-11 pr-4 text-sm outline-none transition focus:border-[#B83A2E]"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                handleStatusFilter(
                  event.target
                    .value
                )
              }
              className="h-12 rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] px-4 text-sm font-medium outline-none"
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
                    {
                      config.label
                    }
                  </option>
                )
              )}
            </select>

            <div className="hidden rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-3 text-xs text-[#6B6258] sm:block">
              <span className="font-semibold text-[#171513]">
                {activeOrders}
              </span>{" "}
              active orders
            </div>
          </div>
        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5">
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

        {/* ====================================================
            LOADING
        ==================================================== */}

        {isLoading &&
          !error && (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-52 animate-pulse rounded-3xl bg-[#FFFDF8]"
                  />
                )
              )}
            </div>
          )}

        {/* ====================================================
            EMPTY
        ==================================================== */}

        {!isLoading &&
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
                There are no orders matching
                the current filters.
              </p>
            </div>
          )}

        {/* ====================================================
            ORDERS
        ==================================================== */}

        {!isLoading &&
          !error &&
          orders.length >
            0 && (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {orders.map(
                (order) => (
                  <OrderCard
                    key={
                      order.id ||
                      order.orderNumber
                    }
                    order={order}
                    isUpdating={
                      updatingOrder ===
                      order.orderNumber
                    }
                    onPrimaryAction={() =>
                      handlePrimaryAction(
                        order
                      )
                    }
                    onCancel={() =>
                      openCancelModal(
                        order
                      )
                    }
                    onView={() =>
                      setSelectedOrder(
                        order
                      )
                    }
                  />
                )
              )}
            </div>
          )}

        {/* ====================================================
            PAGINATION
        ==================================================== */}

        {pagination &&
          pagination.totalPages >
            1 && (
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] p-4">
              <p className="text-xs text-[#6B6258]">
                Page{" "}
                <span className="font-semibold text-[#171513]">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#171513]">
                  {
                    pagination.totalPages
                  }
                </span>
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
                          value -
                            1
                        )
                    )
                  }
                  className="rounded-xl border border-[#DED6C9] px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
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
                        value +
                        1
                    )
                  }
                  className="rounded-xl bg-[#171513] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </div>

      {/* ======================================================
          ORDER DETAIL MODAL
      ====================================================== */}

      {selectedOrder &&
        !showCancelModal && (
          <OrderDetailModal
            order={
              selectedOrder
            }
            isUpdating={
              updatingOrder ===
              selectedOrder.orderNumber
            }
            onClose={() =>
              setSelectedOrder(
                null
              )
            }
            onPrimaryAction={() =>
              handlePrimaryAction(
                selectedOrder
              )
            }
            onCancel={() =>
              openCancelModal(
                selectedOrder
              )
            }
          />
        )}

      {/* ======================================================
          CANCEL MODAL
      ====================================================== */}

      {showCancelModal &&
        selectedOrder && (
          <CancelModal
            order={
              selectedOrder
            }
            reason={
              cancellationReason
            }
            setReason={
              setCancellationReason
            }
            isUpdating={
              updatingOrder ===
              selectedOrder.orderNumber
            }
            onClose={() => {
              setShowCancelModal(
                false
              );

              setCancellationReason(
                ""
              );
            }}
            onConfirm={
              confirmCancellation
            }
          />
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
          : "border-[#E5DED2] bg-[#FFFDF8] hover:-translate-y-0.5 hover:shadow-sm"
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

      <p className="mt-5 text-xs font-medium text-[#6B6258]">
        {label}
      </p>

      <p className="mt-1 text-3xl font-semibold tracking-[-0.04em]">
        {value}
      </p>
    </button>
  );
}

// ============================================================
// ORDER CARD
// ============================================================

function OrderCard({
  order,
  isUpdating,
  onPrimaryAction,
  onCancel,
  onView,
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
    Array.isArray(
      order.items
    )
      ? order.items.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.quantity ||
                0
            ),
          0
        )
      : 0;

  return (
    <article className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] sm:p-6">
      {/* TOP */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
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
          className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* INFO */}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <InfoItem
          icon={
            <MapPin
              size={14}
            />
          }
          label={`Table ${
            order.tableId ||
            "—"
          }`}
        />

        <InfoItem
          icon={
            <Package
              size={14}
            />
          }
          label={`${totalItems} ${
            totalItems === 1
              ? "item"
              : "items"
          }`}
        />

        <InfoItem
          icon={
            <Clock3
              size={14}
            />
          }
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
          {
            order.customer
              ?.name ||
            "Unknown Customer"
          }
        </p>

        <p className="mt-1 text-xs text-[#6B6258]">
          {
            order.customer
              ?.phone ||
            "No phone"
          }
        </p>
      </div>

      {/* FOOTER */}

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8A8177]">
            Total
          </p>

          <p className="mt-0.5 text-xl font-semibold">
            {formatPrice(
              order.total
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={
              onView
            }
            className="rounded-xl border border-[#DED6C9] px-3 py-2.5 text-xs font-semibold transition hover:bg-[#F5F0E8]"
          >
            View
          </button>

          {action && (
            <button
              disabled={
                isUpdating
              }
              onClick={
                onPrimaryAction
              }
              className="flex items-center gap-2 rounded-xl bg-[#B83A2E] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#171513] disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <Check
                  size={14}
                />
              )}

              {
                action.label
              }
            </button>
          )}

          {(order.status ===
            "pending" ||
            order.status ===
              "confirmed" ||
            order.status ===
              "preparing") && (
            <button
              disabled={
                isUpdating
              }
              onClick={
                onCancel
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              title="Cancel order"
            >
              <X
                size={15}
              />
            </button>
          )}
        </div>
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
      {icon}

      <span>
        {label}
      </span>
    </div>
  );
}

// ============================================================
// ORDER DETAIL MODAL
// ============================================================

function OrderDetailModal({
  order,
  isUpdating,
  onClose,
  onPrimaryAction,
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-[#FFFDF8] p-6 sm:rounded-3xl sm:p-7">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B83A2E]">
              Order Details
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              #
              {
                order.orderNumber
              }
            </h2>

            <p className="mt-1 text-xs text-[#6B6258]">
              {formatDate(
                order.createdAt
              )}
            </p>
          </div>

          <button
            onClick={
              onClose
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DED6C9]"
          >
            <X
              size={17}
            />
          </button>
        </div>

        {/* STATUS */}

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#F5F0E8] p-4">
          <span className="text-xs font-medium text-[#6B6258]">
            Current Status
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        {/* CUSTOMER */}

        <section className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
            Customer
          </p>

          <div className="mt-2 rounded-2xl border border-[#E5DED2] p-4">
            <p className="text-sm font-semibold">
              {
                order.customer
                  ?.name
              }
            </p>

            <p className="mt-1 text-xs text-[#6B6258]">
              {
                order.customer
                  ?.email
              }
            </p>

            <p className="mt-1 text-xs text-[#6B6258]">
              {
                order.customer
                  ?.phone
              }
            </p>
          </div>
        </section>

        {/* TABLE */}

        <section className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
            Table
          </p>

          <div className="mt-2 rounded-2xl border border-[#E5DED2] p-4">
            <p className="text-sm font-semibold">
              Table{" "}
              {
                order.tableId
              }
            </p>
          </div>
        </section>

        {/* ITEMS */}

        <section className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
            Items & Pricing
          </p>

          <div className="mt-2 divide-y divide-[#E5DED2] rounded-2xl border border-[#E5DED2]">
            {order.items?.map(
              (
                item,
                index
              ) => {
                const quantity = Math.max(
                  1,
                  Number(item.quantity || 1)
                );

                const addons = Array.isArray(
                  item.addons || item.addOns
                )
                  ? item.addons || item.addOns
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
                      `${item.productId}-${index}`
                    }
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs text-[#6B6258]">
                          Qty: {quantity}
                        </p>

                        {item.noodles && (
                          <p className="mt-1 text-[11px] text-[#8A8177]">
                            Noodles: {item.noodles}
                          </p>
                        )}

                        {item.spice && (
                          <p className="text-[11px] text-[#8A8177]">
                            Spice: {item.spice}
                          </p>
                        )}
                      </div>

                      <p className="shrink-0 text-sm font-semibold">
                        {formatPrice(item.total)}
                      </p>
                    </div>

                    {/* EXPLICIT PRICE BREAKDOWN */}
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
                            <span className="text-[#171513]">
                              Add-ons
                            </span>
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
        </section>

        {/* BILL */}

        <section className="mt-5 rounded-2xl bg-[#F5F0E8] p-5">
          <div className="flex justify-between text-xs text-[#6B6258]">
            <span>
              Subtotal
            </span>

            <span>
              {formatPrice(
                order.subtotal
              )}
            </span>
          </div>

          <div className="mt-2 flex justify-between text-xs text-[#6B6258]">
            <span>
              GST ({order.taxRate}%)
            </span>

            <span>
              {formatPrice(
                order.taxAmount
              )}
            </span>
          </div>

          <div className="mt-4 flex justify-between border-t border-[#DED6C9] pt-4">
            <span className="text-sm font-semibold">
              Total
            </span>

            <span className="text-lg font-semibold">
              {formatPrice(
                order.total
              )}
            </span>
          </div>
        </section>

        {/* ACTIONS */}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {action && (
            <button
              disabled={
                isUpdating
              }
              onClick={
                onPrimaryAction
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#B83A2E] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isUpdating && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {
                action.label
              }
            </button>
          )}

          {(order.status ===
            "pending" ||
            order.status ===
              "confirmed" ||
            order.status ===
              "preparing") && (
            <button
              disabled={
                isUpdating
              }
              onClick={
                onCancel
              }
              className="rounded-2xl border border-red-100 px-5 py-3.5 text-sm font-semibold text-red-600"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CANCEL MODAL
// ============================================================

function CancelModal({
  order,
  reason,
  setReason,
  isUpdating,
  onClose,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[#FFFDF8] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-600">
              Cancel Order
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              #
              {
                order.orderNumber
              }
            </h2>
          </div>

          <button
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DED6C9]"
          >
            <X
              size={16}
            />
          </button>
        </div>

        <p className="mt-4 text-sm text-[#6B6258]">
          Please provide a reason for
          cancelling this order.
        </p>

        <textarea
          value={reason}
          onChange={(event) =>
            setReason(
              event.target.value
            )
          }
          rows={4}
          placeholder="e.g. Item unavailable, customer requested cancellation..."
          className="mt-4 w-full resize-none rounded-2xl border border-[#DED6C9] bg-[#F5F0E8] p-4 text-sm outline-none focus:border-[#B83A2E]"
        />

        <div className="mt-4 flex gap-2">
          <button
            onClick={
              onClose
            }
            className="flex-1 rounded-2xl border border-[#DED6C9] px-4 py-3 text-sm font-semibold"
          >
            Keep Order
          </button>

          <button
            disabled={
              isUpdating
            }
            onClick={
              onConfirm
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isUpdating && (
              <Loader2
                size={15}
                className="animate-spin"
              />
            )}

            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}