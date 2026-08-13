import { connectDB } from "@/lib/mongodb";
import { getServerUser } from "@/lib/auth-server";

import Order from "@/models/Order";

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
// ADMIN AUTH
// ============================================================

function isAdminUser(user) {
  if (!user) {
    return false;
  }

  const role = String(
    user.role || ""
  )
    .trim()
    .toLowerCase();

  /*
   * Current authentication uses:
   *
   * customer
   *
   * Restaurant-side roles can be:
   *
   * staff
   * admin
   * owner
   * manager
   */

  return (
    role &&
    role !== "customer"
  );
}

// ============================================================
// IST DATE HELPERS
// ============================================================

function getIndiaDayRange() {
  /*
   * Ramen Cafe operates in India.
   *
   * We explicitly calculate today's range
   * in Asia/Kolkata instead of depending on
   * the server's timezone.
   */

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

  /*
   * Example:
   *
   * 2026-08-12
   */

  const [
    year,
    month,
    day,
  ] =
    indiaDate.split("-").map(
      Number
    );

  /*
   * Asia/Kolkata = UTC+05:30
   *
   * Start:
   * 00:00 IST
   *
   * End:
   * next day 00:00 IST
   */

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
    // 1. AUTHENTICATION
    // ========================================================

    const user =
      await getServerUser();

    if (!user) {
      return errorResponse(
        "Authentication required.",
        401
      );
    }

    // ========================================================
    // 2. ADMIN AUTHORIZATION
    // ========================================================

    if (
      !isAdminUser(user)
    ) {
      return errorResponse(
        "You are not authorized to access the dashboard.",
        403
      );
    }

    // ========================================================
    // 3. DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // 4. TODAY RANGE
    // ========================================================

    const {
      start,
      end,
    } =
      getIndiaDayRange();

    // ========================================================
    // 5. TODAY ORDERS
    // ========================================================

    const todayFilter = {
      createdAt: {
        $gte: start,
        $lt: end,
      },
    };

    // ========================================================
    // 6. TODAY SUMMARY
    // ========================================================

    const todaySummary =
      await Order.aggregate([
        {
          $match:
            todayFilter,
        },

        {
          $facet: {
            /*
             * Revenue:
             *
             * Cancelled orders are excluded.
             *
             * At the current stage we use order
             * totals because payment integration
             * is not yet the source of truth.
             */

            revenue: [
              {
                $match: {
                  status: {
                    $ne: "cancelled",
                  },
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

            /*
             * Unique customers
             */

            customers: [
              {
                $match: {
                  status: {
                    $ne: "cancelled",
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

            /*
             * Active tables today
             */

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

            /*
             * Status counts
             */

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
    // 7. EXTRACT SUMMARY
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
    // 8. STATUS COUNTS
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
        summary.statuses ||
        []
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
    // 9. RECENT ORDERS
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
            "createdAt",
            "items",
          ].join(" ")
        )
        .lean();

    // ========================================================
    // 10. POPULAR PRODUCTS TODAY
    // ========================================================

    const popularProducts =
      await Order.aggregate([
        {
          $match: {
            ...todayFilter,

            status: {
              $ne: "cancelled",
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
    // 11. AVERAGE ORDER VALUE
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
            (totalRevenue /
              totalOrders +
              Number.EPSILON) *
              100
          ) / 100
        : 0;

    // ========================================================
    // 12. RESPONSE
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