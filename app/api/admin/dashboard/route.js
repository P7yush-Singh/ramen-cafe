import {
  connectDB,
} from "@/lib/mongodb";

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
// INDIA DAY RANGE
// ============================================================

function getIndiaDayRange() {
  const now = new Date();

  const indiaDate =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format(now);

  const [
    year,
    month,
    day,
  ] = indiaDate
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
  if (!Array.isArray(items)) {
    return 0;
  }

  return items.reduce(
    (total, item) =>
      total +
      Number(
        item?.quantity || 0
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
    } = getIndiaDayRange();

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
            // ==================================================
            // PAID REVENUE
            // ==================================================

            revenue: [
              {
                $match: {
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

                  subtotal: {
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
            ],

            // ==================================================
            // UNIQUE CUSTOMERS
            // ==================================================

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

            // ==================================================
            // ACTIVE TABLES
            // ==================================================

            tables: [
              {
                $match: {
                  status: {
                    $nin: [
                      "cancelled",
                      "completed",
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

            // ==================================================
            // ORDER STATUS COUNTS
            // ==================================================

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
    // 5. EXTRACT SUMMARY DATA
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
    // 6. REVENUE CALCULATIONS
    // ========================================================

    const totalRevenue =
      Number(
        revenueData.revenue || 0
      );

    const totalSubtotal =
      Number(
        revenueData.subtotal || 0
      );

    const totalTax =
      Number(
        revenueData.tax || 0
      );

    const totalPaidOrders =
      Number(
        revenueData.orders || 0
      );

    const totalItemsSold =
      Number(
        revenueData.items || 0
      );

    const averageOrderValue =
      totalPaidOrders > 0
        ? Math.round(
            (
              totalRevenue /
                totalPaidOrders +
              Number.EPSILON
            ) *
              100
          ) / 100
        : 0;

    // ========================================================
    // 7. STATUS COUNTS
    // ========================================================

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      completed: 0,
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
    // 8. BILL REQUESTS
    // ========================================================

    const billRequestsResult =
      await Order.aggregate([
        {
          $match: {
            "bill.status": {
              $in: [
                "requested",
                "generated",
                "paid",
              ],
            },
          },
        },

        {
          $group: {
            _id: {
              status:
                "$bill.status",
            },

            count: {
              $sum: 1,
            },

            amount: {
              $sum:
                "$total",
            },
          },
        },
      ]);

    const billRequests = {
      requested: 0,
      requestedAmount: 0,

      generated: 0,
      generatedAmount: 0,

      paid: 0,
      paidAmount: 0,

      total: 0,
      totalAmount: 0,
    };

    for (
      const item of
        billRequestsResult
    ) {
      const status =
        item._id?.status;

      const count =
        Number(
          item.count || 0
        );

      const amount =
        Number(
          item.amount || 0
        );

      if (
        status ===
        "requested"
      ) {
        billRequests.requested =
          count;

        billRequests.requestedAmount =
          amount;
      }

      if (
        status ===
        "generated"
      ) {
        billRequests.generated =
          count;

        billRequests.generatedAmount =
          amount;
      }

      if (
        status ===
        "paid"
      ) {
        billRequests.paid =
          count;

        billRequests.paidAmount =
          amount;
      }
    }

    billRequests.total =
      billRequests.requested +
      billRequests.generated +
      billRequests.paid;

    billRequests.totalAmount =
      billRequests.requestedAmount +
      billRequests.generatedAmount +
      billRequests.paidAmount;

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
            "payment",
            "bill",
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
    // 11. RESPONSE
    // ========================================================

    return successResponse({
      // ======================================================
      // DATE
      // ======================================================

      date: {
        timezone:
          "Asia/Kolkata",

        start:
          start.toISOString(),

        end:
          end.toISOString(),
      },

      // ======================================================
      // DEDICATED REVENUE SECTION
      // ======================================================

      revenue: {
        today:
          totalRevenue,

        subtotal:
          totalSubtotal,

        tax:
          totalTax,

        paidOrders:
          totalPaidOrders,

        itemsSold:
          totalItemsSold,

        averageOrderValue:
          averageOrderValue,

        currency:
          "INR",
      },

      // ======================================================
      // OVERVIEW
      // ======================================================

      overview: {
        revenue:
          totalRevenue,

        orders:
          totalPaidOrders,

        customers:
          Number(
            customerData.count ||
              0
          ),

        itemsSold:
          totalItemsSold,

        activeTables:
          Number(
            tableData.count ||
              0
          ),

        averageOrderValue:
          averageOrderValue,
      },

      // ======================================================
      // ORDER STATUS
      // ======================================================

      statusCounts,

      // ======================================================
      // BILL REQUESTS
      // ======================================================

      billRequests,

      // ======================================================
      // RECENT ORDERS
      // ======================================================

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
              order.payment
                ?.status ||
              "pending",

            paymentMethod:
              order.payment
                ?.method ||
              null,

            billStatus:
              order.bill
                ?.status ||
              "not_requested",

            itemCount:
              getItemCount(
                order.items
              ),

            createdAt:
              order.createdAt,
          })
        ),

      // ======================================================
      // POPULAR PRODUCTS
      // ======================================================

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

    // ========================================================
    // DATABASE ERROR
    // ========================================================

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

    // ========================================================
    // GENERIC ERROR
    // ========================================================

    return errorResponse(
      "Unable to load dashboard data.",
      500
    );
  }
}