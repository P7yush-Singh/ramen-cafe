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
  "cancelled",
];

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
// STATUS TRANSITIONS
// ============================================================

const STATUS_TRANSITIONS = {
  pending: [
    "confirmed",
    "cancelled",
  ],

  confirmed: [
    "preparing",
    "cancelled",
  ],

  preparing: [
    "ready",
    "cancelled",
  ],

  ready: [
    "served",
  ],

  served: [],

  cancelled: [],
};

function isValidStatusTransition(
  currentStatus,
  nextStatus
) {
  if (
    currentStatus ===
    nextStatus
  ) {
    return false;
  }

  const allowed =
    STATUS_TRANSITIONS[
      currentStatus
    ] || [];

  return allowed.includes(
    nextStatus
  );
}

// ============================================================
// GET
// /api/admin/orders/[orderNumber]
// ============================================================

export async function GET(
  request,
  { params }
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
    // 2. PARAMS
    // ========================================================

    const {
      orderNumber,
    } = await params;

    if (!orderNumber) {
      return errorResponse(
        "Order number is required.",
        400
      );
    }

    const normalizedOrderNumber =
      String(
        orderNumber
      )
        .trim()
        .toUpperCase();

    // ========================================================
    // 3. DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // 4. FIND ORDER
    // ========================================================

    const order =
      await Order.findOne({
        orderNumber:
          normalizedOrderNumber,
      }).lean();

    if (!order) {
      return errorResponse(
        "Order not found.",
        404
      );
    }

    // ========================================================
    // 5. RESPONSE
    // ========================================================

    return successResponse({
      order:
        serializeOrder(
          order
        ),
    });
  } catch (error) {
    console.error(
      "GET /api/admin/orders/[orderNumber] error:",
      error
    );

    return errorResponse(
      "Unable to load order.",
      500
    );
  }
}

// ============================================================
// PATCH
// /api/admin/orders/[orderNumber]
// ============================================================

export async function PATCH(
  request,
  { params }
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
    // 2. PARAMS
    // ========================================================

    const {
      orderNumber,
    } = await params;

    if (!orderNumber) {
      return errorResponse(
        "Order number is required.",
        400
      );
    }

    const normalizedOrderNumber =
      String(
        orderNumber
      )
        .trim()
        .toUpperCase();

    // ========================================================
    // 3. REQUEST BODY
    // ========================================================

    let body;

    try {
      body =
        await request.json();
    } catch {
      return errorResponse(
        "Invalid JSON request body.",
        400
      );
    }

    if (
      !body ||
      typeof body !==
        "object" ||
      Array.isArray(body)
    ) {
      return errorResponse(
        "Invalid request body.",
        400
      );
    }

    // ========================================================
    // 4. STATUS
    // ========================================================

    const nextStatus =
      String(
        body.status || ""
      )
        .trim()
        .toLowerCase();

    if (!nextStatus) {
      return errorResponse(
        "New order status is required.",
        400
      );
    }

    if (
      !ALLOWED_STATUSES.includes(
        nextStatus
      )
    ) {
      return errorResponse(
        `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(
          ", "
        )}.`,
        400
      );
    }

    // ========================================================
    // 5. CANCELLATION REASON
    // ========================================================

    const cancellationReason =
      String(
        body.cancellationReason ||
          ""
      )
        .trim()
        .slice(0, 500);

    if (
      nextStatus ===
        "cancelled" &&
      !cancellationReason
    ) {
      return errorResponse(
        "Cancellation reason is required.",
        400
      );
    }

    // ========================================================
    // 6. DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // 7. FIND ORDER
    // ========================================================

    const order =
      await Order.findOne({
        orderNumber:
          normalizedOrderNumber,
      });

    if (!order) {
      return errorResponse(
        "Order not found.",
        404
      );
    }

    // ========================================================
    // 8. CURRENT STATUS
    // ========================================================

    const currentStatus =
      String(
        order.status || ""
      )
        .trim()
        .toLowerCase();

    // ========================================================
    // 9. NO-OP
    // ========================================================

    if (
      currentStatus ===
      nextStatus
    ) {
      return errorResponse(
        `Order is already ${nextStatus}.`,
        409
      );
    }

    // ========================================================
    // 10. VALIDATE TRANSITION
    // ========================================================

    if (
      !isValidStatusTransition(
        currentStatus,
        nextStatus
      )
    ) {
      return errorResponse(
        `Order cannot move from "${currentStatus}" to "${nextStatus}".`,
        409
      );
    }

    // ========================================================
    // 11. UPDATE STATUS
    // ========================================================

    order.status =
      nextStatus;

    const now =
      new Date();

    // ========================================================
    // 12. TIMESTAMPS
    // ========================================================

    if (
      nextStatus ===
      "confirmed"
    ) {
      order.confirmedAt =
        now;
    }

    if (
      nextStatus ===
      "preparing"
    ) {
      order.preparingAt =
        now;
    }

    if (
      nextStatus ===
      "ready"
    ) {
      order.readyAt =
        now;

      order.estimatedReadyAt =
        now;
    }

    if (
      nextStatus ===
      "served"
    ) {
      order.servedAt =
        now;
    }

    if (
      nextStatus ===
      "cancelled"
    ) {
      order.cancelledAt =
        now;

      order.cancellationReason =
        cancellationReason;
    }

    // ========================================================
    // 13. SAVE
    // ========================================================

    await order.save();

    // ========================================================
    // 14. RESPONSE
    // ========================================================

    return successResponse({
      message:
        "Order status updated successfully.",

      order:
        serializeOrder(
          order
        ),
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/orders/[orderNumber] error:",
      error
    );

    if (
      error?.name ===
      "ValidationError"
    ) {
      return errorResponse(
        "Order validation failed.",
        400,
        {
          details:
            Object.values(
              error.errors || {}
            ).map(
              (item) =>
                item.message
            ),
        }
      );
    }

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
      "Unable to update order.",
      500
    );
  }
}