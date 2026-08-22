import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

import {
  requireOrderAccess,
} from "@/lib/admin-auth";

// ============================================================
// CONSTANTS
// ============================================================

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "completed",
  "cancelled",
];

const ALLOWED_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
];

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// ============================================================
// ORDER MANAGEMENT AUTHORIZATION
// ============================================================

async function requireOrderManagementAccess() {
  return requireOrderAccess();
}

// ============================================================
// HELPERS
// ============================================================

function cleanText(value, maxLength = 100) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

// ============================================================
// SERIALIZE ORDER
// ============================================================

function serializeOrder(order) {
  if (!order) {
    return null;
  }

  return {
    _id: order._id?.toString(),

    orderNumber:
      order.orderNumber,

    userId:
      order.userId?.toString(),

    // ========================================================
    // CUSTOMER
    // ========================================================

    customer: order.customer
      ? {
          name:
            order.customer.name ||
            "",

          email:
            order.customer.email ||
            "",

          phone:
            order.customer.phone ||
            "",
        }
      : null,

    // ========================================================
    // TABLE
    // ========================================================

    tableId:
      order.tableId || "",

    // ========================================================
    // ITEMS
    // ========================================================

    items:
      Array.isArray(order.items)
        ? order.items.map(
            (item) => ({
              productId:
                item.productId,

              name:
                item.name,

              image:
                item.image || "",

              price:
                Number(
                  item.price || 0
                ),

              quantity:
                Number(
                  item.quantity || 0
                ),

              noodles:
                item.noodles || "",

              spice:
                item.spice || "",

              addons:
                Array.isArray(
                  item.addons
                )
                  ? item.addons.map(
                      (addon) => ({
                        name:
                          addon.name,

                        price:
                          Number(
                            addon.price ||
                              0
                          ),
                      })
                    )
                  : [],

              total:
                Number(
                  item.total || 0
                ),
            })
          )
        : [],

    // ========================================================
    // AMOUNTS
    // ========================================================

    subtotal:
      Number(
        order.subtotal || 0
      ),

    taxRate:
      Number(
        order.taxRate || 0
      ),

    taxAmount:
      Number(
        order.taxAmount || 0
      ),

    total:
      Number(
        order.total || 0
      ),

    // ========================================================
    // BILL
    // ========================================================

    bill: order.bill
      ? {
          billNumber:
            order.bill.billNumber ||
            null,

          status:
            order.bill.status ||
            "not_requested",

          amount:
            Number(
              order.bill.amount || 0
            ),

          requestedAt:
            order.bill.requestedAt ||
            null,

          generatedAt:
            order.bill.generatedAt ||
            null,

          paidAt:
            order.bill.paidAt ||
            null,
        }
      : null,

    // ========================================================
    // PAYMENT
    // ========================================================

    payment: order.payment
      ? {
          status:
            order.payment.status ||
            "pending",

          amount:
            Number(
              order.payment.amount || 0
            ),

          method:
            order.payment.method ||
            null,

          transactionId:
            order.payment.transactionId ||
            null,

          paidAt:
            order.payment.paidAt ||
            null,
        }
      : null,

    // ========================================================
    // RECEIPT
    // ========================================================

    receipt: order.receipt
      ? {
          sentAt:
            order.receipt.sentAt ||
            null,
        }
      : null,

    // ========================================================
    // ORDER STATUS
    // ========================================================

    status:
      order.status,

    estimatedPreparationMinutes:
      Number(
        order.estimatedPreparationMinutes ||
          0
      ),

    estimatedReadyAt:
      order.estimatedReadyAt ||
      null,

    confirmedAt:
      order.confirmedAt ||
      null,

    preparingAt:
      order.preparingAt ||
      null,

    readyAt:
      order.readyAt ||
      null,

    servedAt:
      order.servedAt ||
      null,

    completedAt:
      order.completedAt ||
      null,

    cancelledAt:
      order.cancelledAt ||
      null,

    cancellationReason:
      order.cancellationReason ||
      "",

    createdAt:
      order.createdAt ||
      null,

    updatedAt:
      order.updatedAt ||
      null,
  };
}

// ============================================================
// GET
// /api/admin/orders
// ============================================================

export async function GET(request) {
  try {
    // ----------------------------------------------------------
    // AUTHORIZATION
    // ----------------------------------------------------------

    const auth =
      await requireOrderManagementAccess();

    if (auth.response) {
      return auth.response;
    }

    // ----------------------------------------------------------
    // QUERY PARAMETERS
    // ----------------------------------------------------------

    const { searchParams } =
      new URL(request.url);

    const search =
      cleanText(
        searchParams.get("search"),
        100
      );

    const status =
      cleanText(
        searchParams.get("status"),
        30
      ).toLowerCase();

    const paymentStatus =
      cleanText(
        searchParams.get(
          "paymentStatus"
        ),
        30
      ).toLowerCase();

    const pageValue =
      Number(
        searchParams.get("page")
      );

    const limitValue =
      Number(
        searchParams.get("limit")
      );

    // ----------------------------------------------------------
    // PAGE
    // ----------------------------------------------------------

    const page =
      Number.isInteger(pageValue) &&
      pageValue > 0
        ? pageValue
        : 1;

    // ----------------------------------------------------------
    // LIMIT
    // ----------------------------------------------------------

    const limit =
      Number.isInteger(limitValue) &&
      limitValue > 0
        ? Math.min(
            limitValue,
            MAX_LIMIT
          )
        : DEFAULT_LIMIT;

    // ----------------------------------------------------------
    // BUILD FILTER
    // ----------------------------------------------------------

    const filter = {};

    // ----------------------------------------------------------
    // STATUS FILTER
    // ----------------------------------------------------------

    if (
      status &&
      ALLOWED_STATUSES.includes(
        status
      )
    ) {
      filter.status = status;
    }

    // ----------------------------------------------------------
    // PAYMENT FILTER
    // ----------------------------------------------------------

    if (
      paymentStatus &&
      ALLOWED_PAYMENT_STATUSES.includes(
        paymentStatus
      )
    ) {
      filter["payment.status"] =
        paymentStatus;
    }

    // ----------------------------------------------------------
    // SEARCH
    //
    // Searches:
    // - Order number
    // - Table
    // - Customer name
    // - Customer email
    // - Customer phone
    // - Transaction ID
    // ----------------------------------------------------------

    if (search) {
      const regex =
        new RegExp(
          escapeRegex(search),
          "i"
        );

      filter.$or = [
        {
          orderNumber: regex,
        },

        {
          tableId: regex,
        },

        {
          "customer.name":
            regex,
        },

        {
          "customer.email":
            regex,
        },

        {
          "customer.phone":
            regex,
        },

        {
          "payment.transactionId":
            regex,
        },
      ];
    }

    // ----------------------------------------------------------
    // DATABASE
    // ----------------------------------------------------------

    await connectDB();

    // ----------------------------------------------------------
    // STATUS COUNTS
    //
    // These counts intentionally use the same filter as
    // the order list.
    // ----------------------------------------------------------

    const [
      pending,
      confirmed,
      preparing,
      ready,
      served,
      completed,
      cancelled,
    ] = await Promise.all([
      Order.countDocuments({
        ...filter,
        status: "pending",
      }),

      Order.countDocuments({
        ...filter,
        status: "confirmed",
      }),

      Order.countDocuments({
        ...filter,
        status: "preparing",
      }),

      Order.countDocuments({
        ...filter,
        status: "ready",
      }),

      Order.countDocuments({
        ...filter,
        status: "served",
      }),

      Order.countDocuments({
        ...filter,
        status: "completed",
      }),

      Order.countDocuments({
        ...filter,
        status: "cancelled",
      }),
    ]);

    // ----------------------------------------------------------
    // TOTAL
    // ----------------------------------------------------------

    const total =
      await Order.countDocuments(
        filter
      );

    // ----------------------------------------------------------
    // TOTAL PAGES
    // ----------------------------------------------------------

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total / limit
        )
      );

    // ----------------------------------------------------------
    // SAFE PAGE
    // ----------------------------------------------------------

    const safePage =
      Math.min(
        page,
        totalPages
      );

    // ----------------------------------------------------------
    // SKIP
    // ----------------------------------------------------------

    const skip =
      (safePage - 1) *
      limit;

    // ----------------------------------------------------------
    // FETCH ORDERS
    // ----------------------------------------------------------

    const orders =
      await Order.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean();

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return Response.json({
      success: true,

      orders:
        orders.map(
          serializeOrder
        ),

      counts: {
        pending,
        confirmed,
        preparing,
        ready,
        served,
        completed,
        cancelled,
      },

      pagination: {
        page: safePage,

        limit,

        total,

        totalPages,

        hasPreviousPage:
          safePage > 1,

        hasNextPage:
          safePage <
          totalPages,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/orders error:",
      error
    );

    return Response.json(
      {
        success: false,

        error:
          "Unable to load orders.",
      },
      {
        status: 500,
      }
    );
  }
}