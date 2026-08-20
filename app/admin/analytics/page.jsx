"use client";

import Link from "next/link";

import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Receipt,
  Download,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

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
      `${value}T00:00:00`
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
      }
    );
  } catch {
    return value;
  }
}

// ============================================================
// PAGE
// ============================================================

export default function AnalyticsPage() {
  const [
    analytics,
    setAnalytics,
  ] = useState(null);

  const [
    range,
    setRange,
  ] = useState("7");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // ==========================================================
  // LOAD
  // ==========================================================

  const loadAnalytics =
    useCallback(
      async (
        selectedRange,
        silent = false
      ) => {
        try {
          if (silent) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const response =
            await fetch(
              `/api/admin/analytics?range=${encodeURIComponent(
                selectedRange
              )}`,
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          let data = {};

          try {
            data =
              await response.json();
          } catch {
            data = {};
          }

          if (
            response.status ===
            401
          ) {
            window.location.href =
              "/admin/cafeadmin/login";

            return;
          }

          if (
            response.status ===
            403
          ) {
            throw new Error(
              data.error ||
                "You do not have permission to view analytics."
            );
          }

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ||
                "Unable to load analytics."
            );
          }

          setAnalytics(
            data
          );
        } catch (
          requestError
        ) {
          console.error(
            "Analytics error:",
            requestError
          );

          setError(
            requestError?.message ||
              "Unable to load analytics."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );


    // ==========================================================
// EXCEL EXPORT
// ==========================================================

async function downloadExcel(
  selectedRange
) {
  try {
    setRefreshing(true);

    // --------------------------------------------------------
    // Fetch fresh analytics specifically for export
    // --------------------------------------------------------

    const response =
      await fetch(
        `/api/admin/analytics?range=${encodeURIComponent(
          selectedRange
        )}`,
        {
          credentials:
            "include",

          cache:
            "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to prepare Excel report."
      );
    }

    // --------------------------------------------------------
    // Dynamically import XLSX
    // --------------------------------------------------------

    const XLSX =
      await import("xlsx");

    const summary =
      data.summary || {};

    const trend =
      data.dailyTrend || [];

    const period =
      data.range?.days ||
      selectedRange;

    // --------------------------------------------------------
    // DAILY SALES SHEET
    // --------------------------------------------------------

    const dailyRows =
  trend.map(
    (item) => ({
      Date:
        item.date,

      Orders:
        Number(
          item.orders || 0
        ),

      "Items Sold":
        Number(
          item.items || 0
        ),

      "Net Sales":
        Number(
          item.netSales || 0
        ),

      GST:
        Number(
          item.tax || 0
        ),

      "Total Sales":
        Number(
          item.revenue || 0
        ),
    })
  );

    // --------------------------------------------------------
    // SUMMARY SHEET
    // --------------------------------------------------------

    const summaryRows = [
      {
        Metric:
          "Report Period",

        Value:
          `Last ${period} Days`,
      },

      {
        Metric:
          "Total Orders",

        Value:
          Number(
            summary.orders || 0
          ),
      },

      {
        Metric:
          "Items Sold",

        Value:
          Number(
            summary.items || 0
          ),
      },

      {
        Metric:
          "Net Sales",

        Value:
          Number(
            summary.netSales || 0
          ),
      },

      {
        Metric:
          "GST Collected",

        Value:
          Number(
            summary.tax || 0
          ),
      },

      {
        Metric:
          "Total Sales / Revenue",

        Value:
          Number(
            summary.revenue || 0
          ),
      },

      {
        Metric:
          "Average Order Value",

        Value:
          Number(
            summary.averageOrderValue ||
              0
          ),
      },
    ];

    // --------------------------------------------------------
    // CREATE WORKBOOK
    // --------------------------------------------------------

    const workbook =
      XLSX.utils.book_new();

    // --------------------------------------------------------
    // DAILY SHEET
    // --------------------------------------------------------

    const dailyWorksheet =
      XLSX.utils.json_to_sheet(
        dailyRows
      );

    // Column widths
    dailyWorksheet["!cols"] = [
      {
        wch: 15,
      },
      {
        wch: 12,
      },
      {
        wch: 18,
      },
      {
        wch: 15,
      },
      {
        wch: 20,
      },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      dailyWorksheet,
      "Daily Sales"
    );

    // --------------------------------------------------------
    // SUMMARY SHEET
    // --------------------------------------------------------

    const summaryWorksheet =
      XLSX.utils.json_to_sheet(
        summaryRows
      );

    summaryWorksheet["!cols"] = [
      {
        wch: 30,
      },
      {
        wch: 25,
      },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      summaryWorksheet,
      "Summary"
    );

    // --------------------------------------------------------
    // FILE NAME
    // --------------------------------------------------------

    const filename =
      `Ramen-Cafe-Sales-${period}-Days.xlsx`;

    // --------------------------------------------------------
    // DOWNLOAD
    // --------------------------------------------------------

    XLSX.writeFile(
      workbook,
      filename
    );
  } catch (error) {
    console.error(
      "Excel export error:",
      error
    );

    alert(
      error?.message ||
        "Unable to download Excel report."
    );
  } finally {
    setRefreshing(false);
  }
}

  // ==========================================================
  // INITIAL
  // ==========================================================

  useEffect(() => {
    loadAnalytics(
      range
    );
  }, [
    range,
    loadAnalytics,
  ]);

  // ==========================================================
  // AUTO REFRESH
  // ==========================================================

  useEffect(() => {
    const timer =
      setInterval(
        () => {
          loadAnalytics(
            range,
            true
          );
        },
        60000
      );

    return () =>
      clearInterval(
        timer
      );
  }, [
    range,
    loadAnalytics,
  ]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading &&
    !analytics
  ) {
    return (
      <main className="min-h-screen bg-[#F5F0E8]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2
              size={30}
              className="mx-auto animate-spin text-[#B83A2E]"
            />

            <p className="mt-4 text-sm text-[#6B6258]">
              Loading analytics...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // DATA
  // ==========================================================

  const summary =
    analytics?.summary ||
    {};

  const trend =
    analytics?.dailyTrend ||
    [];

  const payments =
    analytics?.paymentMethods ||
    [];

  const statuses =
    analytics?.orderStatuses ||
    [];

  const products =
    analytics?.topProducts ||
    [];

  const bills =
    analytics?.billAnalytics ||
    [];

  const profit =
    analytics?.profit ||
    {};

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      {/* HEADER */}

      <header className="border-b border-[#E5DED2]">
        <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <Link
                href="/admin"
                className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#6B6258] hover:text-[#B83A2E]"
              >
                <ArrowLeft
                  size={14}
                />
                Dashboard
              </Link>

              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
                Financial Intelligence
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em]">
                Analytics
              </h1>

              <p className="mt-2 text-sm text-[#6B6258]">
                Understand restaurant sales and performance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
  {[
    [
      "today",
      "Today",
    ],
    [
      "7",
      "7 Days",
    ],
    [
      "30",
      "30 Days",
    ],
    [
      "90",
      "90 Days",
    ],
  ].map(
    (item) => (
      <button
        key={item[0]}
        type="button"
        onClick={() =>
          setRange(
            item[0]
          )
        }
        className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
          range ===
          item[0]
            ? "bg-[#171513] text-white"
            : "border border-[#DED6C9] bg-[#FFFDF8] text-[#6B6258]"
        }`}
      >
        {item[1]}
      </button>
    )
  )}

  {/* =====================================================
      EXCEL DOWNLOAD
  ===================================================== */}

  <button
    type="button"
    disabled={
      refreshing ||
      range === "today"
    }
    onClick={() =>
      downloadExcel(
        range
      )
    }
    className="flex h-10 items-center gap-2 rounded-xl bg-[#B83A2E] px-4 text-xs font-semibold text-white transition hover:bg-[#9F3026] disabled:cursor-not-allowed disabled:opacity-50"
  >
    <Download
      size={15}
    />

    Download Excel
  </button>

  {/* =====================================================
      REFRESH
  ===================================================== */}

  <button
    type="button"
    disabled={
      refreshing
    }
    onClick={() =>
      loadAnalytics(
        range,
        true
      )
    }
    className="flex h-10 items-center gap-2 rounded-xl border border-[#DED6C9] bg-[#FFFDF8] px-4 text-xs font-semibold disabled:opacity-50"
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
          </div>
        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Revenue"
              value={formatPrice(
                summary.revenue
              )}
              description="Paid orders"
              icon={
                <TrendingUp
                  size={19}
                />
              }
            />

            <MetricCard
              label="Net Sales"
              value={formatPrice(
                summary.netSales
              )}
              description="Before GST"
              icon={
                <Receipt
                  size={19}
                />
              }
            />

            <MetricCard
              label="Orders"
              value={
                summary.orders ||
                0
              }
              description={`${summary.items || 0} items sold`}
              icon={
                <ShoppingBag
                  size={19}
                />
              }
            />

            <MetricCard
              label="Average Order"
              value={formatPrice(
                summary.averageOrderValue
              )}
              description="Average paid order"
              icon={
                <BarChart3
                  size={19}
                />
              }
            />
          </div>
        </section>

        {/* ==================================================
    EXCEL REPORTS
================================================== */}

<section className="mt-6">
  <div className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-6">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B83A2E]">
          Sales Reports
        </p>

        <h2 className="mt-1 text-xl font-semibold">
          Download Excel Reports
        </h2>

        <p className="mt-2 text-xs text-[#6B6258]">
          Export daily order and sales data for accounting,
          reporting and restaurant management.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={refreshing}
          onClick={() =>
            downloadExcel("7")
          }
          className="flex items-center gap-2 rounded-xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-xs font-semibold text-[#171513] transition hover:bg-[#EDE6DA] disabled:opacity-50"
        >
          <Download
            size={15}
          />

          Last 7 Days
        </button>

        <button
          type="button"
          disabled={refreshing}
          onClick={() =>
            downloadExcel("30")
          }
          className="flex items-center gap-2 rounded-xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-xs font-semibold text-[#171513] transition hover:bg-[#EDE6DA] disabled:opacity-50"
        >
          <Download
            size={15}
          />

          Last 30 Days
        </button>

        <button
          type="button"
          disabled={refreshing}
          onClick={() =>
            downloadExcel("90")
          }
          className="flex items-center gap-2 rounded-xl border border-[#DED6C9] bg-[#F5F0E8] px-4 py-3 text-xs font-semibold text-[#171513] transition hover:bg-[#EDE6DA] disabled:opacity-50"
        >
          <Download
            size={15}
          />

          Last 90 Days
        </button>
      </div>
    </div>
  </div>
</section>

        {/* ==================================================
            PROFIT NOTICE
        ================================================== */}

        <section className="mt-6">
          <div className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B83A2E]">
                  Profit Tracking
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {profit.available
                    ? formatPrice(
                        profit.value
                      )
                    : "Not configured"}
                </h2>

                <p className="mt-2 max-w-2xl text-xs leading-5 text-[#6B6258]">
                  {profit.message ||
                    "Profit requires cost data."}
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F5F0E8] text-[#B83A2E]">
                <BarChart3
                  size={22}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            DAILY TREND
        ================================================== */}

        <section className="mt-8">
          <SectionHeading
            eyebrow="Sales Trend"
            title="Revenue by Day"
          />

          <div className="overflow-hidden rounded-3xl border border-[#E5DED2] bg-[#FFFDF8]">
            {trend.length ===
            0 ? (
              <EmptyState text="No paid sales found for this period." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead className="border-b border-[#E8E1D6] text-[10px] uppercase tracking-[0.14em] text-[#9B9186]">
                    <tr>
                      <th className="px-5 py-4">
                        Date
                      </th>

                      <th className="px-5 py-4">
                        Orders
                      </th>

                      <th className="px-5 py-4">
                        Net Sales
                      </th>

                      <th className="px-5 py-4">
                        GST
                      </th>

                      <th className="px-5 py-4 text-right">
                        Revenue
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E8E1D6]">
                    {trend.map(
                      (
                        item
                      ) => (
                        <tr
                          key={
                            item.date
                          }
                          className="text-sm"
                        >
                          <td className="px-5 py-4 font-medium">
                            {formatDate(
                              item.date
                            )}
                          </td>

                          <td className="px-5 py-4 text-[#6B6258]">
                            {
                              item.orders
                            }
                          </td>

                          <td className="px-5 py-4 text-[#6B6258]">
                            {formatPrice(
                              item.netSales
                            )}
                          </td>

                          <td className="px-5 py-4 text-[#6B6258]">
                            {formatPrice(
                              item.tax
                            )}
                          </td>

                          <td className="px-5 py-4 text-right font-semibold">
                            {formatPrice(
                              item.revenue
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ==================================================
            TWO COLUMN
        ================================================== */}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* PAYMENT METHODS */}

          <div className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-6">
            <SectionHeading
              eyebrow="Payments"
              title="Payment Methods"
            />

            {payments.length ===
            0 ? (
              <EmptyState text="No paid transactions found." />
            ) : (
              <div className="mt-5 space-y-3">
                {payments.map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item.method
                      }
                      className="flex items-center justify-between rounded-2xl bg-[#F5F0E8] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFFDF8] text-[#B83A2E]">
                          <CreditCard
                            size={17}
                          />
                        </div>

                        <div>
                          <p className="text-sm font-semibold capitalize">
                            {
                              item.method
                            }
                          </p>

                          <p className="mt-1 text-[10px] text-[#6B6258]">
                            {
                              item.orders
                            }{" "}
                            orders
                          </p>
                        </div>
                      </div>

                      <p className="text-sm font-semibold">
                        {formatPrice(
                          item.amount
                        )}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* ORDER STATUS */}

          <div className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-6">
            <SectionHeading
              eyebrow="Operations"
              title="Order Status"
            />

            {statuses.length ===
            0 ? (
              <EmptyState text="No orders found." />
            ) : (
              <div className="mt-5 space-y-3">
                {statuses.map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item.status
                      }
                      className="flex items-center justify-between rounded-2xl bg-[#F5F0E8] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFFDF8] text-[#B83A2E]">
                          {item.status ===
                          "completed" ? (
                            <CheckCircle2
                              size={
                                17
                              }
                            />
                          ) : (
                            <Clock3
                              size={
                                17
                              }
                            />
                          )}
                        </div>

                        <p className="text-sm font-semibold capitalize">
                          {
                            item.status
                          }
                        </p>
                      </div>

                      <p className="text-lg font-semibold">
                        {
                          item.count
                        }
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        {/* ==================================================
            TOP PRODUCTS
        ================================================== */}

        <section className="mt-8">
          <SectionHeading
            eyebrow="Menu Performance"
            title="Top Products"
          />

          <div className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8]">
            {products.length ===
            0 ? (
              <EmptyState text="No product sales found." />
            ) : (
              <div className="divide-y divide-[#E8E1D6]">
                {products.map(
                  (
                    product,
                    index
                  ) => (
                    <div
                      key={
                        product.productId ||
                        product.name
                      }
                      className="flex items-center justify-between gap-4 p-5"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F0E8] text-xs font-semibold text-[#B83A2E]">
                          {index +
                            1}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {
                              product.name
                            }
                          </p>

                          <p className="mt-1 text-xs text-[#6B6258]">
                            {
                              product.quantity
                            }{" "}
                            items sold
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
          </div>
        </section>

        {/* ==================================================
            BILLS
        ================================================== */}

        <section className="mt-8 pb-10">
          <SectionHeading
            eyebrow="Billing"
            title="Bill Activity"
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "requested",
              "generated",
              "paid",
              "cancelled",
            ].map(
              (status) => {
                const item =
                  bills.find(
                    (
                      bill
                    ) =>
                      bill.status ===
                      status
                  ) || {
                    count: 0,
                    amount: 0,
                  };

                return (
                  <div
                    key={
                      status
                    }
                    className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B9186]">
                      {status}
                    </p>

                    <p className="mt-2 text-2xl font-semibold capitalize">
                      {
                        item.count
                      }
                    </p>

                    <p className="mt-1 text-xs text-[#6B6258]">
                      {formatPrice(
                        item.amount
                      )}
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  label,
  value,
  description,
  icon,
}) {
  return (
    <div className="rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 sm:p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5F0E8] text-[#B83A2E]">
        {icon}
      </div>

      <p className="mt-5 text-xs text-[#6B6258]">
        {label}
      </p>

      <p className="mt-1 text-3xl font-semibold tracking-tighter">
        {value}
      </p>

      <p className="mt-2 text-[10px] text-[#9B9186]">
        {description}
      </p>
    </div>
  );
}

// ============================================================
// SECTION HEADING
// ============================================================

function SectionHeading({
  eyebrow,
  title,
}) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B83A2E]">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
        {title}
      </h2>
    </div>
  );
}

// ============================================================
// EMPTY
// ============================================================

function EmptyState({
  text,
}) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F0E8]">
        <BarChart3
          size={18}
          className="text-[#B83A2E]"
        />
      </div>

      <p className="mt-3 text-xs text-[#6B6258]">
        {text}
      </p>
    </div>
  );
}