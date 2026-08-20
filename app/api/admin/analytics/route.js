import {
  connectDB,
} from "@/lib/mongodb";

import {
  getServerUser,
} from "@/lib/auth-server";

import Order from "@/models/Order";

// ============================================================
// RESPONSE
// ============================================================

function successResponse(
  data,
  status = 200
) {
  return Response.json(
    {
      success: true,
      ...data,
    },
    {
      status,
    }
  );
}

function errorResponse(
  message,
  status = 400
) {
  return Response.json(
    {
      success: false,
      error: message,
    },
    {
      status,
    }
  );
}

// ============================================================
// ROLE CHECK
// ============================================================

function canViewAnalytics(
  user
) {
  const role =
    String(
      user?.role ||
        ""
    )
      .trim()
      .toLowerCase();

  return (
    role === "admin" ||
    role === "owner"
  );
}

// ============================================================
// IST DATE
// ============================================================

function getIndiaDate() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "Asia/Kolkata",

      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(
    new Date()
  );
}

// ============================================================
// RANGE
// ============================================================

function getDateRange(
  range
) {
  const days =
    range === "today"
      ? 1
      : range === "7"
      ? 7
      : range === "30"
      ? 30
      : range === "90"
      ? 90
      : 7;

  const [
    year,
    month,
    day,
  ] =
    getIndiaDate()
      .split("-")
      .map(Number);

  const end =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        0,
        0,
        0
      ) -
        5.5 *
          60 *
          60 *
          1000
    );

  const start =
    new Date(
      end.getTime() -
        (days - 1) *
          24 *
          60 *
          60 *
          1000
    );

  return {
    days,
    start,
    end: new Date(
      end.getTime() +
        24 *
          60 *
          60 *
          1000
    ),
  };
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request
) {
  try {
    // ========================================================
    // 1. AUTH
    // ========================================================

    const user =
      await getServerUser();

    if (!user) {
      return errorResponse(
        "Authentication required.",
        401
      );
    }

    if (
      !canViewAnalytics(
        user
      )
    ) {
      return errorResponse(
        "Only admin and owner accounts can access analytics.",
        403
      );
    }

    // ========================================================
    // 2. RANGE
    // ========================================================

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const requestedRange =
      searchParams.get(
        "range"
      ) || "7";

    const {
      days,
      start,
      end,
    } =
      getDateRange(
        requestedRange
      );

    // ========================================================
    // 3. DB
    // ========================================================

    await connectDB();

    const dateFilter = {
      createdAt: {
        $gte: start,
        $lt: end,
      },
    };

    // ========================================================
    // 4. MAIN SUMMARY
    // ========================================================

    const summaryResult =
      await Order.aggregate([
        {
          $match: {
            ...dateFilter,

            "payment.status":
              "paid",

            status: {
              $ne:
                "cancelled",
            },
          },
        },

        {
          $group: {
            _id: null,

            revenue: {
              $sum:
                "$total",
            },

            netSales: {
              $sum:
                "$subtotal",
            },

            tax: {
              $sum:
                "$taxAmount",
            },

            orders: {
              $sum: 1,
            },

            items: {
              $sum: {
                $reduce: {
                  input:
                    "$items",

                  initialValue:
                    0,

                  in: {
                    $add: [
                      "$$value",

                      {
                        $ifNull: [
                          "$$this.quantity",
                          0,
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      ]);

    const summary =
      summaryResult[0] ||
      {};

    const revenue =
      Number(
        summary.revenue ||
          0
      );

    const netSales =
      Number(
        summary.netSales ||
          0
      );

    const tax =
      Number(
        summary.tax || 0
      );

    const orders =
      Number(
        summary.orders || 0
      );

    const items =
      Number(
        summary.items || 0
      );

    const averageOrderValue =
      orders > 0
        ? Math.round(
            (
              revenue /
                orders
            ) *
              100
          ) / 100
        : 0;

    // ========================================================
    // 5. DAILY TREND
    // ========================================================

    const dailyTrend =
      await Order.aggregate([
        {
          $match: {
            ...dateFilter,

            "payment.status":
              "paid",

            status: {
              $ne:
                "cancelled",
            },
          },
        },

        {
  $group: {
    _id: {
      $dateToString: {
        format:
          "%Y-%m-%d",

        date:
          "$createdAt",

        timezone:
          "Asia/Kolkata",
      },
    },

    revenue: {
      $sum:
        "$total",
    },

    netSales: {
      $sum:
        "$subtotal",
    },

    tax: {
      $sum:
        "$taxAmount",
    },

    orders: {
      $sum: 1,
    },

    items: {
      $sum: {
        $reduce: {
          input:
            "$items",

          initialValue:
            0,

          in: {
            $add: [
              "$$value",

              {
                $ifNull: [
                  "$$this.quantity",
                  0,
                ],
              },
            ],
          },
        },
      },
    },
  },
},

        {
          $sort: {
            _id: 1,
          },
        },
      ]);


    // ========================================================
    // 6. PAYMENT METHODS
    // ========================================================

    const paymentMethods =
      await Order.aggregate([
        {
          $match: {
            ...dateFilter,

            "payment.status":
              "paid",

            status: {
              $ne:
                "cancelled",
            },
          },
        },

        {
          $group: {
            _id:
              "$payment.method",

            orders: {
              $sum: 1,
            },

            amount: {
              $sum:
                "$total",
            },
          },
        },

        {
          $sort: {
            amount: -1,
          },
        },
      ]);

    // ========================================================
    // 7. ORDER STATUS
    // ========================================================

    const orderStatuses =
      await Order.aggregate([
        {
          $match:
            dateFilter,
        },

        {
          $group: {
            _id:
              "$status",

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]);

    // ========================================================
    // 8. TOP PRODUCTS
    // ========================================================

    const topProducts =
      await Order.aggregate([
        {
          $match: {
            ...dateFilter,

            "payment.status":
              "paid",

            status: {
              $ne:
                "cancelled",
            },
          },
        },

        {
          $unwind:
            "$items",
        },

        {
          $group: {
            _id: {
              productId:
                "$items.productId",

              name:
                "$items.name",
            },

            quantity: {
              $sum:
                "$items.quantity",
            },

            revenue: {
              $sum:
                "$items.total",
            },
          },
        },

        {
          $sort: {
            revenue: -1,
          },
        },

        {
          $limit: 10,
        },
      ]);

    // ========================================================
    // 9. BILL ANALYTICS
    // ========================================================

    const billAnalytics =
      await Order.aggregate([
        {
          $match:
            dateFilter,
        },

        {
          $group: {
            _id:
              "$bill.status",

            count: {
              $sum: 1,
            },

            amount: {
              $sum:
                "$bill.amount",
            },
          },
        },
      ]);

    // ========================================================
    // 10. RESPONSE
    // ========================================================

    return successResponse({
      range: {
        key:
          requestedRange,

        days,

        start:
          start.toISOString(),

        end:
          end.toISOString(),

        timezone:
          "Asia/Kolkata",
      },

      summary: {
        revenue,

        netSales,

        tax,

        orders,

        items,

        averageOrderValue,

        currency:
          "INR",
      },

      // IMPORTANT:
      // There is currently no COGS / cost / expense
      // information in the Order model.

      profit: {
        available:
          false,

        value:
          null,

        message:
          "True profit requires product cost, COGS and operating expense data.",
      },

      dailyTrend:
  dailyTrend.map(
    (item) => ({
      date:
        item._id,

      revenue:
        Number(
          item.revenue ||
            0
        ),

      netSales:
        Number(
          item.netSales ||
            0
        ),

      tax:
        Number(
          item.tax || 0
        ),

      orders:
        Number(
          item.orders ||
            0
        ),

      items:
        Number(
          item.items || 0
        ),
    })
  ),

      paymentMethods:
        paymentMethods.map(
          (item) => ({
            method:
              item._id ||
              "other",

            orders:
              Number(
                item.orders ||
                  0
              ),

            amount:
              Number(
                item.amount ||
                  0
              ),
          })
        ),

      orderStatuses:
        orderStatuses.map(
          (item) => ({
            status:
              item._id ||
              "unknown",

            count:
              Number(
                item.count ||
                  0
              ),
          })
        ),

      topProducts:
        topProducts.map(
          (item) => ({
            productId:
              item._id
                ?.productId ||
              null,

            name:
              item._id
                ?.name ||
              "Unknown",

            quantity:
              Number(
                item.quantity ||
                  0
              ),

            revenue:
              Number(
                item.revenue ||
                  0
              ),
          })
        ),

      billAnalytics:
        billAnalytics.map(
          (item) => ({
            status:
              item._id ||
              "not_requested",

            count:
              Number(
                item.count ||
                  0
              ),

            amount:
              Number(
                item.amount ||
                  0
              ),
          })
        ),
    });
  } catch (error) {
    console.error(
      "Analytics API error:",
      error
    );

    return errorResponse(
      "Unable to load analytics.",
      500
    );
  }
}