"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  Check,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Receipt,
  Search,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================

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
      year: "numeric",
      hour: "numeric",
      minute:
        "2-digit",
    }
  );
}

// ============================================================
// PAGE
// ============================================================

export default function AdminBillsPage() {
  const [bills, setBills] =
    useState([]);

  const [counts, setCounts] =
    useState({
      requested: 0,
      paid: 0,
      total: 0,
    });

  const [status, setStatus] =
    useState("requested");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedBill, setSelectedBill] =
    useState(null);

  const [paymentMethod, setPaymentMethod] =
    useState("cash");

  const [transactionId, setTransactionId] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [toast, setToast] =
    useState(null);

  // ==========================================================
  // LOAD
  // ==========================================================

  const loadBills =
    useCallback(
      async (
        silent = false
      ) => {
        try {
          if (silent) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError("");

          const params =
            new URLSearchParams();

          if (status) {
            params.set(
              "status",
              status
            );
          }

          if (
            search.trim()
          ) {
            params.set(
              "search",
              search.trim()
            );
          }

          const response =
            await fetch(
              `/api/admin/bills?${params.toString()}`,
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (
            response.status ===
            401
          ) {
            window.location.href =
              "/admin/cafeadmin/login";

            return;
          }

          if (
            !response.ok
          ) {
            throw new Error(
              data?.error ||
                "Unable to load bill requests."
            );
          }

          setBills(
            Array.isArray(
              data?.bills
            )
              ? data.bills
              : []
          );

          setCounts(
            data?.counts || {
              requested: 0,
              paid: 0,
              total: 0,
            }
          );
        } catch (err) {
          console.error(
            "Admin bills error:",
            err
          );

          setError(
            err?.message ||
              "Unable to load bill requests."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        status,
        search,
      ]
    );

  useEffect(() => {
    loadBills();
  }, [loadBills]);

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
  // MARK PAID
  // ==========================================================

  async function markPaid() {
    if (
      !selectedBill ||
      saving
    ) {
      return;
    }

    if (
      !paymentMethod
    ) {
      showToast(
        "Select a payment method.",
        "error"
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const response =
        await fetch(
          "/api/admin/bills",
          {
            method:
              "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                orderIds:
                  selectedBill.orderIds,

                paymentMethod,

                transactionId:
                  transactionId.trim(),
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            "Unable to mark bill as paid."
        );
      }

      showToast(
        "Payment recorded successfully. Receipt email processed."
      );

      setSelectedBill(
        null
      );

      setTransactionId("");

      await loadBills(
        true
      );
    } catch (err) {
      console.error(
        "Mark bill paid error:",
        err
      );

      showToast(
        err?.message ||
          "Unable to mark bill as paid.",
        "error"
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F0E8]">
        <div className="flex min-h-screen items-center justify-center">
          <Loader2
            className="animate-spin"
            size={25}
          />
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
        <header className="border-b border-[#E5DED2] bg-[#F5F0E8]">
          <div className="mx-auto flex min-h-20 max-w-[1300px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B83A2E]">
                Admin
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                Bill Requests
              </h1>
            </div>

            <button
              onClick={() =>
                loadBills(
                  true
                )
              }
              disabled={
                refreshing
              }
              className="inline-flex items-center gap-2 rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 py-2.5 text-xs font-semibold"
            >
              <RefreshCw
                size={14}
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

        <div className="mx-auto max-w-[1300px] px-4 py-7 sm:px-6 lg:px-8">
          {/* STATS */}

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Requested"
              value={
                counts.requested
              }
              active={
                status ===
                "requested"
              }
              onClick={() =>
                setStatus(
                  "requested"
                )
              }
            />

            <StatCard
              label="Paid"
              value={
                counts.paid
              }
              active={
                status ===
                "paid"
              }
              onClick={() =>
                setStatus(
                  "paid"
                )
              }
            />

            <StatCard
              label="All Bills"
              value={
                counts.total
              }
              active={
                status ===
                ""
              }
              onClick={() =>
                setStatus("")
              }
            />
          </div>

          {/* SEARCH */}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#93897E]"
              />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search table, customer, phone, email or order number..."
                className="h-12 w-full rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] pl-11 pr-4 text-sm outline-none focus:border-[#B83A2E]"
              />
            </div>

            <button
              onClick={() =>
                loadBills()
              }
              className="rounded-2xl bg-[#171513] px-6 py-3 text-xs font-semibold text-white"
            >
              Search
            </button>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* BILLS */}

          <div className="mt-6 space-y-4">
            {bills.length ===
            0 ? (
              <div className="rounded-3xl border border-[#DED6C9] bg-[#FFFDF8] p-12 text-center">
                <Receipt
                  size={30}
                  className="mx-auto text-[#B83A2E]"
                />

                <h2 className="mt-4 text-xl font-semibold">
                  No bill requests
                </h2>

                <p className="mt-2 text-sm text-[#6B6258]">
                  There are no bills matching the
                  current filter.
                </p>
              </div>
            ) : (
              bills.map(
                (
                  bill
                ) => (
                  <BillCard
                    key={
                      bill.id
                    }
                    bill={
                      bill
                    }
                    onPay={() => {
                      setSelectedBill(
                        bill
                      );

                      setPaymentMethod(
                        bill
                          ?.payment
                          ?.method ||
                          "cash"
                      );

                      setTransactionId(
                        bill
                          ?.payment
                          ?.transactionId ||
                          ""
                      );
                    }}
                  />
                )
              )
            )}
          </div>
        </div>
      </main>

      {/* PAYMENT MODAL */}

      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#FFFDF8] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#B83A2E]">
                  Collect Payment
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  Table{" "}
                  {
                    selectedBill.tableId
                  }
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedBill(
                    null
                  )
                }
                className="rounded-xl p-2 hover:bg-[#F5F0E8]"
              >
                <X
                  size={18}
                />
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-[#F5F0E8] p-5">
              <p className="text-xs text-[#6B6258]">
                Amount to collect
              </p>

              <p className="mt-1 text-3xl font-semibold">
                {price(
                  selectedBill.amount
                )}
              </p>

              <p className="mt-2 text-xs text-[#6B6258]">
                {selectedBill.customer
                  ?.name ||
                  "Customer"}
              </p>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold">
                Payment Method
              </label>

              <select
                value={
                  paymentMethod
                }
                onChange={(
                  event
                ) =>
                  setPaymentMethod(
                    event
                      .target
                      .value
                  )
                }
                className="mt-2 h-11 w-full rounded-xl border border-[#DED6C9] bg-white px-3 text-sm"
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

                <option value="other">
                  Other
                </option>
              </select>
            </div>

            {paymentMethod !==
              "cash" && (
              <div className="mt-4">
                <label className="text-xs font-semibold">
                  Transaction / Reference ID
                </label>

                <input
                  value={
                    transactionId
                  }
                  onChange={(
                    event
                  ) =>
                    setTransactionId(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Optional"
                  className="mt-2 h-11 w-full rounded-xl border border-[#DED6C9] bg-white px-3 text-sm outline-none"
                />
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() =>
                  setSelectedBill(
                    null
                  )
                }
                className="flex-1 rounded-xl border border-[#DED6C9] py-3 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={
                  markPaid
                }
                disabled={
                  saving
                }
                className="flex-1 rounded-xl bg-[#B83A2E] py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Saving...
                  </span>
                ) : (
                  "Mark Paid"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-32px)] max-w-md -translate-x-1/2">
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

            <p className="flex-1 text-sm">
              {
                toast.message
              }
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// BILL CARD
// ============================================================

function BillCard({
  bill,
  onPay,
}) {
  const paid =
    bill.status ===
    "paid";

  return (
    <div className="rounded-3xl border border-[#DED6C9] bg-[#FFFDF8] p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F5F0E8] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
              Table{" "}
              {
                bill.tableId
              }
            </span>

            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                paid
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {paid
                ? "Paid"
                : "Bill Requested"}
            </span>
          </div>

          <h2 className="mt-4 text-xl font-semibold">
            {bill.customer
              ?.name ||
              "Customer"}
          </h2>

          <div className="mt-3 grid gap-2 text-xs text-[#6B6258] sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Phone
                size={14}
              />
              {
                bill.customer
                  ?.phone ||
                  "—"
              }
            </div>

            <div className="flex items-center gap-2">
              <Mail
                size={14}
              />
              <span className="truncate">
                {
                  bill.customer
                    ?.email ||
                    "—"
                }
              </span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#93897E]">
              Orders
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {bill.orderNumbers.map(
                (
                  number
                ) => (
                  <span
                    key={
                      number
                    }
                    className="rounded-lg bg-[#F5F0E8] px-2.5 py-1.5 text-[10px] font-semibold"
                  >
                    #{number}
                  </span>
                )
              )}
            </div>
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs text-[#93897E]">
            <Clock3
              size={13}
            />

            Requested{" "}
            {date(
              bill.requestedAt
            )}
          </p>
        </div>

        <div className="lg:w-64">
          <div className="rounded-2xl bg-[#F5F0E8] p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#93897E]">
              Bill Amount
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {price(
                bill.amount
              )}
            </p>

            {paid ? (
              <p className="mt-2 text-xs text-green-700">
                Paid{" "}
                {date(
                  bill.paidAt
                )}
              </p>
            ) : (
              <button
                onClick={
                  onPay
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#B83A2E] py-3 text-sm font-semibold text-white"
              >
                <Wallet
                  size={16}
                />
                Collect Payment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left transition ${
        active
          ? "border-[#B83A2E] bg-[#FFFDF8]"
          : "border-[#DED6C9] bg-[#FFFDF8]"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#93897E]">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold">
        {value}
      </p>
    </button>
  );
}