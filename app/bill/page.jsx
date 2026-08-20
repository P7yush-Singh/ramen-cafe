"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Check,
  Clock3,
  FileText,
  Mail,
  MapPin,
  RefreshCw,
  ShoppingBag,
  UserRound,
  Utensils,
  X,
} from "lucide-react";

import {
  getCurrentUser,
} from "@/lib/auth";

import {
  getTableId,
  getMenuUrl,
} from "@/lib/tableSession";

// ============================================================
// CONSTANTS
// ============================================================

const ACTIVE_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
];

// ============================================================
// PAGE
// ============================================================

export default function BillPage() {
  const [user, setUser] = useState(null);
  const [tableId, setTableId] = useState("");

  const [orders, setOrders] = useState([]);

  const [billRequest, setBillRequest] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [isRequesting, setIsRequesting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [toast, setToast] =
    useState(null);

  // ==========================================================
  // INITIALIZE
  // ==========================================================

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      setIsLoading(true);
      setError("");

      const currentTable =
        getTableId();

      setTableId(
        currentTable || ""
      );

      const currentUser =
        await getCurrentUser();

      if (!currentUser) {
        window.location.href =
          `/login?redirect=${encodeURIComponent(
            "/bill"
          )}`;

        return;
      }

      setUser(
        currentUser
      );

      await loadOrders(
        currentTable
      );

      if (currentTable) {
        await loadBillRequest(
          currentTable
        );
      }
    } catch (err) {
      console.error(
        "Bill initialization error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load bill."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // ==========================================================
  // LOAD ORDERS
  // ==========================================================

  const loadOrders =
    useCallback(
      async (
        currentTable = tableId,
        silent = false
      ) => {
        try {
          if (silent) {
            setIsRefreshing(
              true
            );
          }

          const response =
            await fetch(
              "/api/orders",
              {
                method:
                  "GET",
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const text =
            await response.text();

          let data = {};

          try {
            data = text
              ? JSON.parse(text)
              : {};
          } catch {
            throw new Error(
              "Orders API returned an invalid response."
            );
          }

          if (
            response.status ===
            401
          ) {
            window.location.href =
              `/login?redirect=${encodeURIComponent(
                "/bill"
              )}`;

            return [];
          }

          if (
            !response.ok
          ) {
            throw new Error(
              data?.error ||
                "Unable to load orders."
            );
          }

          const loaded =
            Array.isArray(
              data?.orders
            )
              ? data.orders
              : [];

          setOrders(
            loaded
          );

          return loaded;
        } catch (err) {
          console.error(
            "Load orders error:",
            err
          );

          setError(
            err?.message ||
              "Unable to load orders."
          );

          return [];
        } finally {
          setIsRefreshing(
            false
          );
        }
      },
      [tableId]
    );

  // ==========================================================
  // LOAD BILL REQUEST
  // ==========================================================

  async function loadBillRequest(
    currentTable
  ) {
    if (!currentTable) {
      setBillRequest(
        null
      );

      return;
    }

    try {
      const response =
        await fetch(
          `/api/bills/request?tableId=${encodeURIComponent(
            currentTable
          )}`,
          {
            method:
              "GET",
            credentials:
              "include",
            cache:
              "no-store",
            headers: {
              Accept:
                "application/json",
            },
          }
        );

      if (
        response.status ===
        401
      ) {
        return;
      }

      const text =
        await response.text();

      if (!text) {
        return;
      }

      let data;

      try {
        data =
          JSON.parse(text);
      } catch {
        return;
      }

      if (
        !response.ok
      ) {
        return;
      }

      setBillRequest(
        data?.billRequest ||
          null
      );
    } catch (err) {
      console.warn(
        "Bill request lookup failed:",
        err
      );
    }
  }

  // ==========================================================
  // ACTIVE ORDERS
  // ==========================================================

  const activeOrders =
    useMemo(() => {
      return orders.filter(
        (order) => {
          const status =
            String(
              order?.status ||
                ""
            )
              .trim()
              .toLowerCase();

          const paymentStatus =
            String(
              order?.payment
                ?.status ||
                "pending"
            )
              .trim()
              .toLowerCase();

          const orderTable =
            String(
              order?.tableId ||
                ""
            )
              .trim()
              .toUpperCase();

          const currentTable =
            String(
              tableId ||
                ""
            )
              .trim()
              .toUpperCase();

          return (
            ACTIVE_ORDER_STATUSES.includes(
              status
            ) &&
            paymentStatus !==
              "paid" &&
            orderTable ===
              currentTable
          );
        }
      );
    }, [
      orders,
      tableId,
    ]);

  // ==========================================================
  // TOTALS
  // ==========================================================

  const subtotal =
    useMemo(
      () =>
        activeOrders.reduce(
          (
            sum,
            order
          ) =>
            sum +
            Number(
              order?.subtotal ||
                0
            ),
          0
        ),
      [activeOrders]
    );

  const tax =
    useMemo(
      () =>
        activeOrders.reduce(
          (
            sum,
            order
          ) =>
            sum +
            Number(
              order?.taxAmount ||
                0
            ),
          0
        ),
      [activeOrders]
    );

  const total =
    useMemo(
      () =>
        activeOrders.reduce(
          (
            sum,
            order
          ) =>
            sum +
            Number(
              order?.total ||
                0
            ),
          0
        ),
      [activeOrders]
    );

  const totalItems =
    useMemo(
      () =>
        activeOrders.reduce(
          (
            sum,
            order
          ) =>
            sum +
            (
              Array.isArray(
                order?.items
              )
                ? order.items.reduce(
                    (
                      count,
                      item
                    ) =>
                      count +
                      Number(
                        item?.quantity ||
                          0
                      ),
                    0
                  )
                : 0
            ),
          0
        ),
      [activeOrders]
    );

  // ==========================================================
  // FORMAT
  // ==========================================================

  function price(
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

  function date(
    value
  ) {
    if (!value) {
      return "—";
    }

    const parsed =
      new Date(value);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "—";
    }

    return parsed.toLocaleString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute:
          "2-digit",
      }
    );
  }

  // ==========================================================
  // TOAST
  // ==========================================================

  function showToast(
    message,
    type = "success"
  ) {
    setToast({
      message,
      type,
    });

    setTimeout(
      () =>
        setToast(null),
      3500
    );
  }

  // ==========================================================
  // REQUEST BILL
  // ==========================================================

  async function requestBill() {
    if (!tableId) {
      showToast(
        "Table session not found. Please scan your table QR again.",
        "error"
      );

      return;
    }

    if (
      activeOrders.length ===
      0
    ) {
      showToast(
        "There are no unpaid orders for this table.",
        "error"
      );

      return;
    }

    if (
      billRequest?.status ===
      "requested"
    ) {
      showToast(
        "Your bill has already been requested.",
        "error"
      );

      return;
    }

    try {
      setIsRequesting(
        true
      );

      const response =
        await fetch(
          "/api/bills/request",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                tableId,

                orderIds:
                  activeOrders.map(
                    (
                      order
                    ) =>
                      order._id
                  ),
              }),
          }
        );

      const text =
        await response.text();

      let data = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          "Bill API returned an invalid response."
        );
      }

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            "Unable to request bill."
        );
      }

      setBillRequest(
        data?.billRequest ||
          null
      );

      showToast(
        "Bill requested successfully. Staff has been notified."
      );
    } catch (err) {
      console.error(
        "Request bill error:",
        err
      );

      showToast(
        err?.message ||
          "Unable to request bill.",
        "error"
      );
    } finally {
      setIsRequesting(
        false
      );
    }
  }

  // ==========================================================
  // REFRESH
  // ==========================================================

  async function refresh() {
    setError("");

    const currentTable =
      getTableId();

    setTableId(
      currentTable || ""
    );

    await loadOrders(
      currentTable,
      true
    );

    if (currentTable) {
      await loadBillRequest(
        currentTable
      );
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F5F0E8]">
        <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-8">
          <div className="h-8 w-40 animate-pulse rounded bg-[#E7DED2]" />

          <div className="mt-8 space-y-4">
            <div className="h-28 animate-pulse rounded-3xl bg-[#FFFDF8]" />
            <div className="h-48 animate-pulse rounded-3xl bg-[#FFFDF8]" />
            <div className="h-40 animate-pulse rounded-3xl bg-[#FFFDF8]" />
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <main className="min-h-screen bg-[#F5F0E8] text-[#171513]">
        <header className="border-b border-[#E5DED2]">
          <div className="mx-auto flex h-20 max-w-[900px] items-center justify-between px-4 sm:px-8">
            <Link
              href={getMenuUrl()}
              className="flex items-center gap-2 text-sm font-medium text-[#6B6258]"
            >
              <ArrowLeft
                size={17}
              />
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

            <Link
              href="/orders"
              className="rounded-full p-2"
            >
              <ShoppingBag
                size={18}
              />
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-8 sm:py-12">
          {/* HEADER */}

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B83A2E]">
                Account
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
                Request Bill
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#6B6258]">
                Request your bill and our staff will
                come to your table to collect payment.
              </p>
            </div>

            <button
              onClick={refresh}
              disabled={
                isRefreshing
              }
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-2.5 text-xs font-semibold"
            >
              <RefreshCw
                size={14}
                className={
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* TABLE / CUSTOMER */}

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[#DED6C9] bg-[#FFFDF8] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E8] text-[#B83A2E]">
                  <MapPin
                    size={18}
                  />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#93897E]">
                    Table
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {tableId
                      ? `Table ${tableId}`
                      : "Not detected"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#DED6C9] bg-[#FFFDF8] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E8] text-[#B83A2E]">
                  <UserRound
                    size={18}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#93897E]">
                    Customer
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold">
                    {user?.name ||
                      "Customer"}
                  </p>

                  <p className="mt-1 truncate text-xs text-[#6B6258]">
                    {user?.email ||
                      "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* REQUESTED */}

          {billRequest?.status ===
            "requested" && (
            <div className="mt-5 rounded-3xl border border-green-200 bg-green-50 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <Check
                    size={20}
                  />
                </div>

                <div>
                  <p className="font-semibold text-green-800">
                    Bill requested
                  </p>

                  <p className="mt-1 text-sm leading-6 text-green-700">
                    Our staff has been notified. Please
                    stay at your table while payment is
                    collected.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-700">
                      Request sent
                    </span>

                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B6258]">
                      Pay at table
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS */}

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils
                  size={16}
                  className="text-[#B83A2E]"
                />

                <h2 className="text-xs font-bold uppercase tracking-[0.17em] text-[#756C62]">
                  Current Orders
                </h2>
              </div>

              <span className="text-xs text-[#91877C]">
                {activeOrders.length}{" "}
                {activeOrders.length ===
                1
                  ? "order"
                  : "orders"}
              </span>
            </div>

            {activeOrders.length ===
            0 ? (
              <div className="rounded-3xl border border-[#DED6C9] bg-[#FFFDF8] p-10 text-center">
                <FileText
                  size={30}
                  className="mx-auto text-[#B83A2E]"
                />

                <h2 className="mt-4 text-xl font-semibold">
                  No unpaid orders
                </h2>

                <p className="mt-2 text-sm text-[#6B6258]">
                  There are currently no unpaid orders
                  available for this table.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map(
                  (
                    order
                  ) => (
                    <OrderCard
                      key={
                        order._id
                      }
                      order={
                        order
                      }
                      price={
                        price
                      }
                      date={
                        date
                      }
                    />
                  )
                )}
              </div>
            )}
          </section>

          {/* SUMMARY */}

          {activeOrders.length >
            0 && (
            <>
              <section className="mt-5 rounded-3xl border border-[#DED6C9] bg-[#FFFDF8] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#93897E]">
                  Bill Summary
                </p>

                <div className="mt-5 space-y-3">
                  <SummaryRow
                    label="Subtotal"
                    value={price(
                      subtotal
                    )}
                  />

                  <SummaryRow
                    label="GST"
                    value={price(
                      tax
                    )}
                  />

                  <div className="border-t border-[#E5DDD2] pt-3">
                    <SummaryRow
                      label="Total"
                      value={price(
                        total
                      )}
                      bold
                    />
                  </div>
                </div>
              </section>

              {/* PAYMENT */}

              <section className="mt-5 rounded-3xl border border-[#DED6C9] bg-[#F8F3EB] p-5">
                <div className="flex items-start gap-3">
                  <Clock3
                    size={18}
                    className="mt-0.5 text-[#B83A2E]"
                  />

                  <div>
                    <p className="text-sm font-semibold">
                      Payment is collected at your table
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#6B6258]">
                      There is no online payment gateway.
                      After requesting the bill, staff will
                      visit your table and collect payment.
                    </p>
                  </div>
                </div>
              </section>

              {/* REQUEST BUTTON */}

              {!billRequest ||
              billRequest.status !==
                "requested" ? (
                <button
                  onClick={
                    requestBill
                  }
                  disabled={
                    isRequesting ||
                    !tableId
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#B83A2E] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#171513] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRequesting ? (
                    <>
                      <RefreshCw
                        size={18}
                        className="animate-spin"
                      />
                      Requesting Bill...
                    </>
                  ) : (
                    <>
                      <FileText
                        size={18}
                      />
                      Request Bill ·{" "}
                      {price(total)}
                    </>
                  )}
                </button>
              ) : null}

              <div className="mt-5 rounded-3xl border border-[#DED6C9] bg-[#FFFDF8] p-5">
                <div className="flex items-start gap-3">
                  <Mail
                    size={18}
                    className="mt-0.5 text-[#B83A2E]"
                  />

                  <div>
                    <p className="text-sm font-semibold">
                      Order receipt
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#6B6258]">
                      After staff records your payment,
                      the receipt will be sent to your
                      registered email address.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* TOAST */}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2">
          <div className="flex items-start gap-3 rounded-2xl border border-[#DED6C9] bg-white p-4 shadow-2xl">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                toast.type ===
                "error"
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              {toast.type ===
              "error" ? (
                <X
                  size={17}
                />
              ) : (
                <Check
                  size={17}
                />
              )}
            </div>

            <p className="flex-1 pt-1 text-sm">
              {
                toast.message
              }
            </p>

            <button
              onClick={() =>
                setToast(
                  null
                )
              }
            >
              <X
                size={15}
              />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// ORDER CARD
// ============================================================

function OrderCard({
  order,
  price,
  date,
}) {
  const items =
    Array.isArray(
      order?.items
    )
      ? order.items
      : [];

  return (
    <div className="overflow-hidden rounded-3xl border border-[#DED6C9] bg-[#FFFDF8]">
      <div className="flex items-center justify-between border-b border-[#E5DDD2] px-5 py-4">
        <div>
          <p className="text-sm font-semibold">
            {order.orderNumber}
          </p>

          <p className="mt-1 text-[11px] text-[#91877C]">
            {date(
              order.createdAt
            )}
          </p>
        </div>

        <p className="text-lg font-semibold">
          {price(
            order.total
          )}
        </p>
      </div>

      <div className="divide-y divide-[#EEE7DD]">
        {items.map(
          (
            item,
            index
          ) => (
            <div
              key={`${item.productId}-${index}`}
              className="px-5 py-4"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <div className="flex items-start gap-2">
                    <span className="rounded-md bg-[#F5F0E8] px-2 py-1 text-[10px] font-bold">
                      {item.quantity}
                    </span>

                    <div>
                      <p className="text-sm font-semibold">
                        {item.name}
                      </p>

                      {item.noodles && (
                        <p className="mt-1 text-[11px] text-[#756C62]">
                          Noodles:{" "}
                          {
                            item.noodles
                          }
                        </p>
                      )}

                      {item.spice && (
                        <p className="text-[11px] text-[#756C62]">
                          Spice:{" "}
                          {
                            item.spice
                          }
                        </p>
                      )}

                      {item.addons
                        ?.length >
                        0 && (
                        <div className="mt-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-[#93897E]">
                            Add-ons
                          </p>

                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {item.addons.map(
                              (
                                addon,
                                addonIndex
                              ) => (
                                <span
                                  key={
                                    addonIndex
                                  }
                                  className="rounded-full bg-[#F5F0E8] px-2 py-1 text-[10px] text-[#756C62]"
                                >
                                  {
                                    addon.name
                                  }{" "}
                                  +
                                  {price(
                                    addon.price
                                  )}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <p className="shrink-0 text-sm font-semibold">
                  {price(
                    item.total
                  )}
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUMMARY
// ============================================================

function SummaryRow({
  label,
  value,
  bold = false,
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        bold
          ? "text-base font-semibold"
          : "text-sm"
      }`}
    >
      <span
        className={
          bold
            ? ""
            : "text-[#756C62]"
        }
      >
        {label}
      </span>

      <span>
        {value}
      </span>
    </div>
  );
}