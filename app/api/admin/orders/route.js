import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getServerUser } from "@/lib/auth-server";
import Order from "@/models/Order";

// ============================================================
// CONSTANTS
// ============================================================

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
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

// ============================================================
// ADMIN AUTHORIZATION
// ============================================================

function isAdminUser(user) {
  if (!user) {
    return false;
  }

  /*
   * Normal customers are explicitly blocked.
   *
   * This allows restaurant-side roles such as:
   *
   * admin
   * owner
   * staff
   * manager
   *
   * without requiring us to change the
   * existing customer authentication flow.
   */

  const role = String(
    user.role || ""
  )
    .trim()
    .toLowerCase();

  if (!role) {
    return false;
  }

  return role !== "customer";
}

// ============================================================
// SERIALIZE ORDER
// ============================================================

function serializeOrder(order) {
  return {
    id:
      order._id
        ? String(order._id)
        : null,

    orderId:
      order._id
        ? String(order._id)
        : null,

    orderNumber:
      order.orderNumber,

    userId:
      order.userId
        ? String(order.userId)
        : null,

    customer:
      order.customer || null,

    tableId:
      order.tableId,

    items:
      Array.isArray(order.items)
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

    if (!isAdminUser(user)) {
      return errorResponse(
        "You are not authorized to access the admin orders.",
        403
      );
    }

    // ========================================================
    // 3. DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // 4. QUERY PARAMETERS
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
    // 5. VALIDATE STATUS
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

    /*
     * Search:
     *
     * - order number
     * - customer name
     * - customer email
     * - customer phone
     */

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
        counts[item._id] =
          item.count;
      }
    }

    // ========================================================
    // 12. RESPONSE
    // ========================================================

    return successResponse({
      orders:
        serializedOrders,

      counts,

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

    // ========================================================
    // DATABASE ERROR
    // ========================================================

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

    // ========================================================
    // FALLBACK
    // ========================================================

    return errorResponse(
      "Unable to load admin orders.",
      500
    );
  }
}