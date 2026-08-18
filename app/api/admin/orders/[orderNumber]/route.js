import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

import {
  requireUserAccess,
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

const ALLOWED_PAYMENT_METHODS = [
  "cash",
  "upi",
  "card",
  "online",
  "other",
];

const ALLOWED_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
];

// ============================================================
// HELPERS
// ============================================================

async function getIdentifier(params) {
  const resolved =
    await params;

  return String(
    resolved?.id || ""
  ).trim();
}

function serializeOrder(order) {
  if (!order) return null;

  return {
    _id: order._id?.toString(),

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

    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          productId:
            item.productId,

          name:
            item.name,

          image:
            item.image || "",

          price:
            Number(item.price || 0),

          quantity:
            Number(item.quantity || 0),

          noodles:
            item.noodles || "",

          spice:
            item.spice || "",

          addons:
            Array.isArray(item.addons)
              ? item.addons.map(
                  (addon) => ({
                    name:
                      addon.name,

                    price:
                      Number(
                        addon.price || 0
                      ),
                  })
                )
              : [],

          total:
            Number(item.total || 0),
        }))
      : [],

    subtotal:
      Number(order.subtotal || 0),

    taxRate:
      Number(order.taxRate || 0),

    taxAmount:
      Number(order.taxAmount || 0),

    total:
      Number(order.total || 0),

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
            order.payment.transactionId ||
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

async function findOrder(identifier) {
  if (
    mongoose.Types.ObjectId.isValid(
      identifier
    )
  ) {
    const byId =
      await Order.findById(
        identifier
      );

    if (byId) {
      return byId;
    }
  }

  return Order.findOne({
    orderNumber:
      identifier,
  });
}

// ============================================================
// GET /api/admin/orders/[id]
// ============================================================

export async function GET(
  request,
  { params }
) {
  try {
    // ----------------------------------------------------------
    // AUTH
    // ----------------------------------------------------------

    const auth =
      await requireUserAccess();

    if (auth.response) {
      return auth.response;
    }

    // ----------------------------------------------------------
    // ID
    // ----------------------------------------------------------

    const identifier =
      await getIdentifier(params);

    if (!identifier) {
      return Response.json(
        {
          success: false,
          error:
            "Order ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------------------------
    // DATABASE
    // ----------------------------------------------------------

    await connectDB();

    const order =
      await findOrder(
        identifier
      );

    if (!order) {
      return Response.json(
        {
          success: false,
          error:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      success: true,
      order:
        serializeOrder(order),
    });
  } catch (error) {
    console.error(
      "GET /api/admin/orders/[id] error:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to load order.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// PATCH /api/admin/orders/[id]
// ============================================================

export async function PATCH(
  request,
  { params }
) {
  try {
    // ----------------------------------------------------------
    // AUTH
    // ----------------------------------------------------------

    const auth =
      await requireUserAccess();

    if (auth.response) {
      return auth.response;
    }

    // ----------------------------------------------------------
    // ID
    // ----------------------------------------------------------

    const identifier =
      await getIdentifier(params);

    if (!identifier) {
      return Response.json(
        {
          success: false,
          error:
            "Order ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------------------------
    // BODY
    // ----------------------------------------------------------

    let body;

    try {
      body =
        await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          error:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------------------------
    // DATABASE
    // ----------------------------------------------------------

    await connectDB();

    const order =
      await findOrder(
        identifier
      );

    if (!order) {
      return Response.json(
        {
          success: false,
          error:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================================
    // STATUS UPDATE
    // ==========================================================

    if (
      body.status !== undefined
    ) {
      const nextStatus =
        String(
          body.status
        )
          .trim()
          .toLowerCase();

      if (
        !ALLOWED_STATUSES.includes(
          nextStatus
        )
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Invalid order status.",
          },
          {
            status: 400,
          }
        );
      }

      // --------------------------------------------------------
      // CANCEL
      // --------------------------------------------------------

      if (
        nextStatus ===
        "cancelled"
      ) {
        const reason =
          String(
            body.cancellationReason ||
              ""
          )
            .trim()
            .slice(0, 500);

        if (!reason) {
          return Response.json(
            {
              success: false,
              error:
                "Cancellation reason is required.",
            },
            {
              status: 400,
            }
          );
        }

        order.status =
          "cancelled";

        order.cancelledAt =
          new Date();

        order.cancellationReason =
          reason;
      } else {
        order.status =
          nextStatus;

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

          if (
            order.estimatedPreparationMinutes
          ) {
            order.estimatedReadyAt =
              now;
          }
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
      }
    }

    // ==========================================================
    // PAYMENT UPDATE
    // ==========================================================

    if (
      body.paymentStatus !==
      undefined
    ) {
      const nextPaymentStatus =
        String(
          body.paymentStatus
        )
          .trim()
          .toLowerCase();

      if (
        !ALLOWED_PAYMENT_STATUSES.includes(
          nextPaymentStatus
        )
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Invalid payment status.",
          },
          {
            status: 400,
          }
        );
      }

      order.payment.status =
        nextPaymentStatus;

      if (
        nextPaymentStatus ===
        "paid"
      ) {
        const method =
          String(
            body.paymentMethod ||
              ""
          )
            .trim()
            .toLowerCase();

        if (
          !ALLOWED_PAYMENT_METHODS.includes(
            method
          )
        ) {
          return Response.json(
            {
              success: false,
              error:
                "A valid payment method is required.",
            },
            {
              status: 400,
            }
          );
        }

        order.payment.method =
          method;

        order.payment.amount =
          Number(
            order.total || 0
          );

        order.payment.paidAt =
          new Date();

        // Keep bill synchronized.
        order.bill.status =
          "paid";

        order.bill.amount =
          Number(
            order.total || 0
          );

        order.bill.paidAt =
          new Date();
      }

      if (
        nextPaymentStatus ===
        "pending"
      ) {
        order.payment.amount =
          0;

        order.payment.method =
          null;

        order.payment.paidAt =
          null;

        order.bill.status =
          "generated";

        order.bill.paidAt =
          null;
      }

      if (
        nextPaymentStatus ===
        "failed"
      ) {
        order.payment.paidAt =
          null;
      }

      if (
        nextPaymentStatus ===
        "refunded"
      ) {
        order.payment.paidAt =
          order.payment.paidAt ||
          new Date();
      }
    }

    // ==========================================================
    // PAYMENT METHOD ONLY
    // ==========================================================

    if (
      body.paymentMethod !==
        undefined &&
      body.paymentStatus ===
        undefined
    ) {
      const method =
        String(
          body.paymentMethod ||
            ""
        )
          .trim()
          .toLowerCase();

      if (
        !ALLOWED_PAYMENT_METHODS.includes(
          method
        )
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Invalid payment method.",
          },
          {
            status: 400,
          }
        );
      }

      order.payment.method =
        method;
    }

    // ==========================================================
    // TRANSACTION ID
    // ==========================================================

    if (
      body.transactionId !==
      undefined
    ) {
      order.payment.transactionId =
        String(
          body.transactionId ||
            ""
        )
          .trim()
          .slice(0, 100);
    }

    // ==========================================================
    // SAVE
    // ==========================================================

    await order.save();

    return Response.json({
      success: true,
      message:
        "Order updated successfully.",
      order:
        serializeOrder(order),
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/orders/[id] error:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to update order.",
      },
      {
        status: 500,
      }
    );
  }
}