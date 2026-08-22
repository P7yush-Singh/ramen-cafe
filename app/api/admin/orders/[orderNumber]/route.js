import { connectDB } from "@/lib/mongodb";

import Order from "@/models/Order";

import {
  requireOrderAccess,
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
// ORDER MANAGEMENT AUTHORIZATION
// ============================================================

async function requireOrderManagementAccess() {
  return requireOrderAccess();
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

// ============================================================
// VALIDATE STATUS TRANSITION
// ============================================================

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
    // STATUS
    // ========================================================

    status:
      order.status,

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
    // PREPARATION
    // ========================================================

    estimatedPreparationMinutes:
      Number(
        order.estimatedPreparationMinutes ||
          0
      ),

    estimatedReadyAt:
      order.estimatedReadyAt ||
      null,

    // ========================================================
    // TIMESTAMPS
    // ========================================================

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
    // AUTHORIZATION
    // ----------------------------------------------------------

    const auth =
      await requireOrderManagementAccess();

    if (auth.response) {
      return auth.response;
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

    // ----------------------------------------------------------
    // FIND ORDER
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

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

export async function PATCH(
  request,
  { params }
) {
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
    // REQUEST BODY
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
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse(
        "Invalid request body.",
        400
      );
    }

    const hasStatusUpdate =
      typeof body.status === "string" &&
      body.status.trim().length > 0;

    const hasPaymentUpdate =
      typeof body.paymentStatus === "string" &&
      body.paymentStatus.trim().length > 0;

    if (
      !hasStatusUpdate &&
      !hasPaymentUpdate
    ) {
      return errorResponse(
        "No valid order update was provided.",
        400
      );
    }

    // ----------------------------------------------------------
    // DATABASE
    // ----------------------------------------------------------

    await connectDB();

    // ----------------------------------------------------------
    // FIND ORDER
    // ----------------------------------------------------------

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

    // ==========================================================
    // PAYMENT UPDATE
    // ==========================================================

    if (hasPaymentUpdate) {
      const paymentStatus =
        String(
          body.paymentStatus || ""
        )
          .trim()
          .toLowerCase();

      const allowedPaymentStatuses = [
        "pending",
        "paid",
        "failed",
        "refunded",
      ];

      if (
        !allowedPaymentStatuses.includes(
          paymentStatus
        )
      ) {
        return errorResponse(
          `Invalid payment status. Allowed values: ${allowedPaymentStatuses.join(
            ", "
          )}.`,
          400
        );
      }

      if (!order.payment) {
        order.payment = {
          status: "pending",
          amount: 0,
          method: null,
          transactionId: null,
          paidAt: null,
        };
      }

      order.payment.status =
        paymentStatus;

      if (
        body.paymentMethod !==
        undefined
      ) {
        const paymentMethod =
          String(
            body.paymentMethod || ""
          )
            .trim()
            .toLowerCase()
            .slice(0, 30);

        order.payment.method =
          paymentMethod || null;
      }

      if (
        body.transactionId !==
        undefined
      ) {
        const transactionId =
          String(
            body.transactionId || ""
          )
            .trim()
            .slice(0, 100);

        order.payment.transactionId =
          transactionId || null;
      }

      if (
        paymentStatus === "paid"
      ) {
        const now =
          new Date();

        order.payment.amount =
          Number(
            order.total || 0
          );

        order.payment.paidAt =
          now;

        if (order.bill) {
          order.bill.status =
            "paid";

          order.bill.amount =
            Number(
              order.total || 0
            );

          order.bill.paidAt =
            now;
        }
      } else {
        order.payment.paidAt =
          null;
      }

      await order.save();

      return successResponse({
        message:
          "Payment updated successfully.",

        order:
          serializeOrder(
            order
          ),
      });
    }

    // ==========================================================
    // STATUS UPDATE
    // ==========================================================

    const nextStatus =
      String(
        body.status || ""
      )
        .trim()
        .toLowerCase();

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

    const cancellationReason =
      String(
        body.cancellationReason ||
          ""
      )
        .trim()
        .slice(0, 500);

    if (
      nextStatus === "cancelled" &&
      !cancellationReason
    ) {
      return errorResponse(
        "Cancellation reason is required.",
        400
      );
    }

    const currentStatus =
      String(
        order.status || ""
      )
        .trim()
        .toLowerCase();

    if (
      currentStatus ===
      nextStatus
    ) {
      return errorResponse(
        `Order is already ${nextStatus}.`,
        409
      );
    }

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

    order.status =
      nextStatus;

    const now =
      new Date();

    if (
      nextStatus === "confirmed"
    ) {
      order.confirmedAt =
        now;
    }

    if (
      nextStatus === "preparing"
    ) {
      order.preparingAt =
        now;
    }

    if (
      nextStatus === "ready"
    ) {
      order.readyAt =
        now;

      order.estimatedReadyAt =
        now;
    }

    if (
      nextStatus === "served"
    ) {
      order.servedAt =
        now;
    }

    if (
      nextStatus === "completed"
    ) {
      order.completedAt =
        now;
    }

    if (
      nextStatus === "cancelled"
    ) {
      order.cancelledAt =
        now;

      order.cancellationReason =
        cancellationReason;
    }

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
