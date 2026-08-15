import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

import {
  requireDashboardAccess,
} from "@/lib/admin-auth";

// ============================================================
// RESPONSE HELPERS
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
// IST DATE HELPERS
// ============================================================

function getIndiaDayRange() {
  const now =
    new Date();

  const indiaDate =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format(now);

  const [
    year,
    month,
    day,
  ] =
    indiaDate
      .split("-")
      .map(Number);

  const start =
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

  const end =
    new Date(
      start.getTime() +
        24 *
          60 *
          60 *
          1000
    );

  return {
    start,
    end,
  };
}

// ============================================================
// ORDER ITEM COUNT
// ============================================================

function getItemCount(items) {
  if (
    !Array.isArray(items)
  ) {
    return 0;
  }

  return items.reduce(
    (
      total,
      item
    ) =>
      total +
      Number(
        item.quantity || 0
      ),
    0
  );
}

// ============================================================
// GET /api/admin/dashboard
// ============================================================

export async function GET() {
  try {
    // ========================================================
    // 1. AUTHORIZATION
    // ========================================================

    const auth =
      await requireDashboardAccess();

    if (auth.response) {
      return auth.response;
    }

    // ========================================================
    // 2. DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // 3. TODAY RANGE
    // ========================================================

    const {
      start,
      end,
    } =
      getIndiaDayRange();

    const todayFilter = {
      createdAt: {
        $gte: start,
        $lt: end,
      },
    };

    // ========================================================
    // 4. TODAY SUMMARY
    // ========================================================

    const todaySummary =
      await Order.aggregate([
        {
          $match:
            todayFilter,
        },

        {
          $facet: {
            // ------------------------------------------------
            // PAID REVENUE
            // ------------------------------------------------

            revenue: [
              {
                $match: {
                  paymentStatus:
                    "paid",
                },
              },

              {
                $group: {
                  _id: null,

                  revenue: {
                    $sum: "$total",
                  },

                  subtotal: {
                    $sum: "$subtotal",
                  },

                  tax: {
                    $sum: "$taxAmount",
                  },

                  orders: {
                    $sum: 1,
                  },

                  items: {
                    $sum: {
                      $reduce: {
                        input:
                          "$items",

                        initialValue: 0,

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
            ],

            // ------------------------------------------------
            // UNIQUE CUSTOMERS
            // ------------------------------------------------

            customers: [
              {
                $match: {
                  status: {
                    $ne:
                      "cancelled",
                  },
                },
              },

              {
                $group: {
                  _id:
                    "$userId",
                },
              },

              {
                $count:
                  "count",
              },
            ],

            // ------------------------------------------------
            // ACTIVE TABLES
            // ------------------------------------------------

            tables: [
              {
                $match: {
                  status: {
                    $nin: [
                      "cancelled",
                    ],
                  },
                },
              },

              {
                $group: {
                  _id:
                    "$tableId",
                },
              },

              {
                $count:
                  "count",
              },
            ],

            // ------------------------------------------------
            // ORDER STATUS COUNTS
            // ------------------------------------------------

            statuses: [
              {
                $group: {
                  _id:
                    "$status",

                  count: {
                    $sum: 1,
                  },
                },
              },
            ],
          },
        },
      ]);

    // ========================================================
    // 5. EXTRACT DATA
    // ========================================================

    const summary =
      todaySummary[0] || {};

    const revenueData =
      summary.revenue?.[0] ||
      {};

    const customerData =
      summary.customers?.[0] ||
      {};

    const tableData =
      summary.tables?.[0] ||
      {};

    // ========================================================
    // 6. STATUS COUNTS
    // ========================================================

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      cancelled: 0,
    };

    for (
      const item of
        summary.statuses || []
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          statusCounts,
          item._id
        )
      ) {
        statusCounts[
          item._id
        ] =
          Number(
            item.count || 0
          );
      }
    }

    // ========================================================
    // 7. RECENT ORDERS
    // ========================================================

    const recentOrders =
      await Order.find({})
        .sort({
          createdAt: -1,
        })
        .limit(8)
        .select(
          [
            "orderNumber",
            "tableId",
            "customer",
            "total",
            "status",
            "paymentStatus",
            "paymentMethod",
            "createdAt",
            "items",
          ].join(" ")
        )
        .lean();

    // ========================================================
    // 8. POPULAR PRODUCTS TODAY
    // ========================================================

    const popularProducts =
      await Order.aggregate([
        {
          $match: {
            ...todayFilter,

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
            quantity: -1,
          },
        },

        {
          $limit: 5,
        },
      ]);

    // ========================================================
    // 9. AVERAGE PAID ORDER VALUE
    // ========================================================

    const totalOrders =
      Number(
        revenueData.orders ||
          0
      );

    const totalRevenue =
      Number(
        revenueData.revenue ||
          0
      );

    const averageOrderValue =
      totalOrders > 0
        ? Math.round(
            (
              totalRevenue /
                totalOrders +
              Number.EPSILON
            ) *
              100
          ) / 100
        : 0;

    // ========================================================
    // 10. RESPONSE
    // ========================================================

    return successResponse({
      date: {
        timezone:
          "Asia/Kolkata",

        start:
          start.toISOString(),

        end:
          end.toISOString(),
      },

      overview: {
        revenue:
          totalRevenue,

        // Paid orders
        orders:
          totalOrders,

        customers:
          Number(
            customerData.count ||
              0
          ),

        itemsSold:
          Number(
            revenueData.items ||
              0
          ),

        activeTables:
          Number(
            tableData.count ||
              0
          ),

        averageOrderValue,
      },

      statusCounts,

      recentOrders:
        recentOrders.map(
          (order) => ({
            id:
              order._id.toString(),

            orderNumber:
              order.orderNumber,

            tableId:
              order.tableId,

            customer:
              order.customer ||
              null,

            total:
              Number(
                order.total || 0
              ),

            status:
              order.status,

            paymentStatus:
              order.paymentStatus,

            paymentMethod:
              order.paymentMethod ||
              null,

            itemCount:
              getItemCount(
                order.items
              ),

            createdAt:
              order.createdAt,
          })
        ),

      popularProducts:
        popularProducts.map(
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
                item.quantity || 0
              ),

            revenue:
              Number(
                item.revenue || 0
              ),
          })
        ),
    });
  } catch (error) {
    console.error(
      "GET /api/admin/dashboard error:",
      error
    );

    if (
      error?.name ===
        "MongoServerSelectionError" ||
      error?.name ===
        "MongoNetworkError"
    ) {
      return errorResponse(
        "Database is temporarily unavailable.",
        503
      );
    }

    return errorResponse(
      "Unable to load dashboard data.",
      500
    );
  }
}