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
// ADMIN AUTHORIZATION
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

  if (!role) {
    return false;
  }

  return role !== "customer";
}

// ============================================================
// ORDER SERIALIZER
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

    // ========================================================
    // 2. ADMIN AUTH
    // ========================================================

    if (!isAdminUser(user)) {
      return errorResponse(
        "You are not authorized to access this order.",
        403
      );
    }

    // ========================================================
    // 3. PARAMS
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
    // 4. DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // 5. FIND ORDER
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
    // 6. RESPONSE
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

    // ========================================================
    // 2. ADMIN AUTH
    // ========================================================

    if (!isAdminUser(user)) {
      return errorResponse(
        "You are not authorized to update orders.",
        403
      );
    }

    // ========================================================
    // 3. PARAMS
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
    // 4. REQUEST BODY
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
    // 5. STATUS
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
    // 6. CANCELLATION REASON
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
    // 7. DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // 8. FIND ORDER
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
    // 9. CURRENT STATUS
    // ========================================================

    const currentStatus =
      String(
        order.status || ""
      )
        .trim()
        .toLowerCase();

    // ========================================================
    // 10. NO-OP
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
    // 11. VALIDATE TRANSITION
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
    // 12. UPDATE STATUS
    // ========================================================

    order.status =
      nextStatus;

    // ========================================================
    // 13. STATUS TIMESTAMPS
    // ========================================================

    const now =
      new Date();

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

      /*
       * Recalculate the expected
       * ready timestamp to the actual
       * ready moment.
       */

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
    // 14. SAVE
    // ========================================================

    await order.save();

    // ========================================================
    // 15. RESPONSE
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

    // ========================================================
    // MONGOOSE VALIDATION
    // ========================================================

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
      "Unable to update order.",
      500
    );
  }
}