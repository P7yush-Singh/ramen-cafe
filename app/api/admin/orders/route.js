import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

import {
  requireOrderAccess,
} from "@/lib/admin-auth";

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "cancelled",
];

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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
  status = 400,
  extra = {}
) {
  return Response.json(
    {
      success: false,
      error: message,
      ...extra,
    },
    {
      status,
    }
  );
}

// ============================================================
// HELPERS
// ============================================================

function normalizeText(
  value,
  maxLength = 200
) {
  return String(
    value ?? ""
  )
    .trim()
    .slice(0, maxLength);
}

// ============================================================
// SERIALIZE ORDER
// ============================================================

function serializeOrder(
  order
) {
  return {
    id:
      order._id
        ? String(
            order._id
          )
        : null,

    orderId:
      order._id
        ? String(
            order._id
          )
        : null,

    orderNumber:
      order.orderNumber,

    userId:
      order.userId
        ? String(
            order.userId
          )
        : null,

    customer:
      order.customer ||
      null,

    tableId:
      order.tableId,

    items:
      Array.isArray(
        order.items
      )
        ? order.items
        : [],

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

    status:
      order.status,

    paymentStatus:
      order.paymentStatus,

    paymentMethod:
      order.paymentMethod ||
      null,

    estimatedPreparationMinutes:
      order.estimatedPreparationMinutes ??
      null,

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

    cancelledAt:
      order.cancelledAt ||
      null,

    cancellationReason:
      order.cancellationReason ||
      "",

    createdAt:
      order.createdAt,

    updatedAt:
      order.updatedAt,
  };
}

// ============================================================
// GET /api/admin/orders
// ============================================================

export async function GET(
  request
) {
  try {
    // ========================================================
    // 1. AUTHORIZATION
    // ========================================================

    const auth =
      await requireOrderAccess();

    if (auth.response) {
      return auth.response;
    }

    // ========================================================
    // 2. DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // 3. QUERY PARAMETERS
    // ========================================================

    const url =
      new URL(request.url);

    const searchParams =
      url.searchParams;

    const status =
      normalizeText(
        searchParams.get(
          "status"
        ) || "",
        30
      ).toLowerCase();

    const tableId =
      normalizeText(
        searchParams.get(
          "tableId"
        ) || "",
        30
      ).toUpperCase();

    const search =
      normalizeText(
        searchParams.get(
          "search"
        ) || "",
        100
      );

    const paymentStatus =
      normalizeText(
        searchParams.get(
          "paymentStatus"
        ) || "",
        30
      ).toLowerCase();

    const pageValue =
      Number(
        searchParams.get(
          "page"
        ) || 1
      );

    const limitValue =
      Number(
        searchParams.get(
          "limit"
        ) ||
          DEFAULT_LIMIT
      );

    const page =
      Number.isFinite(
        pageValue
      ) &&
      pageValue >= 1
        ? Math.floor(
            pageValue
          )
        : 1;

    const limit =
      Number.isFinite(
        limitValue
      ) &&
      limitValue >= 1
        ? Math.min(
            Math.floor(
              limitValue
            ),
            MAX_LIMIT
          )
        : DEFAULT_LIMIT;

    // ========================================================
    // 4. VALIDATE STATUS
    // ========================================================

    if (
      status &&
      !ALLOWED_STATUSES.includes(
        status
      )
    ) {
      return errorResponse(
        `Invalid order status. Allowed values: ${ALLOWED_STATUSES.join(
          ", "
        )}.`,
        400
      );
    }

    // ========================================================
    // 5. VALIDATE PAYMENT STATUS
    // ========================================================

    const ALLOWED_PAYMENT_STATUSES = [
      "pending",
      "paid",
      "failed",
      "refunded",
    ];

    if (
      paymentStatus &&
      !ALLOWED_PAYMENT_STATUSES.includes(
        paymentStatus
      )
    ) {
      return errorResponse(
        `Invalid payment status. Allowed values: ${ALLOWED_PAYMENT_STATUSES.join(
          ", "
        )}.`,
        400
      );
    }

    // ========================================================
    // 6. BUILD FILTER
    // ========================================================

    const filter = {};

    if (status) {
      filter.status =
        status;
    }

    if (tableId) {
      filter.tableId =
        tableId;
    }

    if (paymentStatus) {
      filter.paymentStatus =
        paymentStatus;
    }

    // ========================================================
    // SEARCH
    // ========================================================

    if (search) {
      const escapedSearch =
        search.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const searchRegex =
        new RegExp(
          escapedSearch,
          "i"
        );

      filter.$or = [
        {
          orderNumber:
            searchRegex,
        },

        {
          "customer.name":
            searchRegex,
        },

        {
          "customer.email":
            searchRegex,
        },

        {
          "customer.phone":
            searchRegex,
        },
      ];
    }

    // ========================================================
    // 7. PAGINATION
    // ========================================================

    const skip =
      (page - 1) *
      limit;

    // ========================================================
    // 8. FETCH ORDERS
    // ========================================================

    const [
      orders,
      totalOrders,
    ] =
      await Promise.all([
        Order.find(filter)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Order.countDocuments(
          filter
        ),
      ]);

    // ========================================================
    // 9. SERIALIZE
    // ========================================================

    const serializedOrders =
      orders.map(
        serializeOrder
      );

    // ========================================================
    // 10. PAGINATION
    // ========================================================

    const totalPages =
      totalOrders > 0
        ? Math.ceil(
            totalOrders /
              limit
          )
        : 0;

    // ========================================================
    // 11. STATUS COUNTS
    // ========================================================

    const statusCounts =
      await Order.aggregate([
        {
          $group: {
            _id:
              "$status",

            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const counts = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      cancelled: 0,
    };

    for (
      const item of statusCounts
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          counts,
          item._id
        )
      ) {
        counts[
          item._id
        ] =
          Number(
            item.count || 0
          );
      }
    }

    // ========================================================
    // 12. PAYMENT COUNTS
    // ========================================================

    const paymentCounts =
      await Order.aggregate([
        {
          $group: {
            _id:
              "$paymentStatus",

            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const payments = {
      pending: 0,
      paid: 0,
      failed: 0,
      refunded: 0,
    };

    for (
      const item of
        paymentCounts
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          payments,
          item._id
        )
      ) {
        payments[
          item._id
        ] =
          Number(
            item.count || 0
          );
      }
    }

    // ========================================================
    // 13. RESPONSE
    // ========================================================

    return successResponse({
      orders:
        serializedOrders,

      counts,

      payments,

      pagination: {
        page,
        limit,
        totalOrders,
        totalPages,

        hasNextPage:
          page <
          totalPages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/orders error:",
      error
    );

    if (
      error?.name ===
        "MongoServerSelectionError" ||
      error?.name ===
        "MongoNetworkError" ||
      error?.code ===
        "ECONNREFUSED" ||
      error?.code ===
        "ETIMEDOUT" ||
      error?.code ===
        "ENOTFOUND"
    ) {
      return errorResponse(
        "Database is temporarily unavailable.",
        503
      );
    }

    return errorResponse(
      "Unable to load admin orders.",
      500
    );
  }
}