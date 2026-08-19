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

  return (
    role === "admin" ||
    role === "owner" ||
    role === "staff" ||
    role === "manager"
  );
}

// ============================================================
// ALLOWED STATUSES
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
    "cancelled",
  ],

  served: [
    "completed",
  ],

  completed: [],

  cancelled: [],
};

function isValidStatusTransition(
  currentStatus,
  nextStatus
) {
  const allowed =
    STATUS_TRANSITIONS[
      currentStatus
    ] || [];

  return allowed.includes(
    nextStatus
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
    _id:
      order._id?.toString(),

    orderNumber:
      order.orderNumber,

    userId:
      order.userId?.toString(),

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

    tableId:
      order.tableId || "",

    items:
      Array.isArray(
        order.items
      )
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
            order.payment
              .transactionId ||
            null,

          paidAt:
            order.payment.paidAt ||
            null,
        }
      : null,

    receipt: order.receipt
      ? {
          sentAt:
            order.receipt.sentAt ||
            null,
        }
      : null,

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
// /api/admin/orders/[orderNumber]
// ============================================================

export async function GET(
  request,
  { params }
) {
  try {
    // ----------------------------------------------------------
    // AUTH
    // ----------------------------------------------------------

    const user =
      await getServerUser();

    if (!user) {
      return errorResponse(
        "Authentication required.",
        401
      );
    }

    if (!isAdminUser(user)) {
      return errorResponse(
        "You are not authorized to access this order.",
        403
      );
    }

    // ----------------------------------------------------------
    // PARAMS
    // ----------------------------------------------------------

    const resolvedParams =
      await params;

    const orderNumber =
      String(
        resolvedParams?.orderNumber ||
          ""
      ).trim();

    if (!orderNumber) {
      return errorResponse(
        "Order number is required.",
        400
      );
    }

    const normalizedOrderNumber =
      orderNumber.toUpperCase();

    // ----------------------------------------------------------
    // DATABASE
    // ----------------------------------------------------------

    await connectDB();

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
    // ----------------------------------------------------------
    // AUTH
    // ----------------------------------------------------------

    const user =
      await getServerUser();

    if (!user) {
      return errorResponse(
        "Authentication required.",
        401
      );
    }

    if (!isAdminUser(user)) {
      return errorResponse(
        "You are not authorized to update orders.",
        403
      );
    }

    // ----------------------------------------------------------
    // PARAMS
    // ----------------------------------------------------------

    const resolvedParams =
      await params;

    const orderNumber =
      String(
        resolvedParams?.orderNumber ||
          ""
      ).trim();

    if (!orderNumber) {
      return errorResponse(
        "Order number is required.",
        400
      );
    }

    const normalizedOrderNumber =
      orderNumber.toUpperCase();

    // ----------------------------------------------------------
    // BODY
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // CANCELLATION
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // DATABASE
    // ----------------------------------------------------------

    await connectDB();

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

    // ----------------------------------------------------------
    // CURRENT STATUS
    // ----------------------------------------------------------

    const currentStatus =
      String(
        order.status || ""
      )
        .trim()
        .toLowerCase();

    // ----------------------------------------------------------
    // SAME STATUS
    // ----------------------------------------------------------

    if (
      currentStatus ===
      nextStatus
    ) {
      return errorResponse(
        `Order is already ${nextStatus}.`,
        409
      );
    }

    // ----------------------------------------------------------
    // VALIDATE TRANSITION
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // UPDATE STATUS
    // ----------------------------------------------------------

    order.status =
      nextStatus;

    const now =
      new Date();

    // ----------------------------------------------------------
    // TIMESTAMPS
    // ----------------------------------------------------------

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
      "completed"
    ) {
      order.completedAt =
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

    // ----------------------------------------------------------
    // SAVE
    // ----------------------------------------------------------

    await order.save();

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

    // ----------------------------------------------------------
    // MONGOOSE VALIDATION
    // ----------------------------------------------------------

    if (
      error?.name ===
      "ValidationError"
    ) {
      return errorResponse(
        "Order validation failed.",
        400
      );
    }

    return errorResponse(
      "Unable to update order.",
      500
    );
  }
}