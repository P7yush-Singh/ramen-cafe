import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getServerUser } from "@/lib/auth-server";

export async function GET(
  request,
  { params }
) {
  try {
    // =====================================================
    // AUTH
    // =====================================================

    const user =
      await getServerUser();

    if (!user) {
      return Response.json(
        {
          success: false,
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    // =====================================================
    // PARAMS
    // =====================================================

    const { orderNumber } =
      await params;

    if (!orderNumber) {
      return Response.json(
        {
          success: false,
          error:
            "Order number is required.",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedOrderNumber =
      String(orderNumber)
        .trim()
        .toUpperCase();

    // =====================================================
    // DATABASE
    // =====================================================

    await connectDB();

    // =====================================================
    // FIND USER'S ORDER ONLY
    // =====================================================

    const order =
      await Order.findOne({
        orderNumber:
          normalizedOrderNumber,

        userId: user._id,
      }).lean();

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

    // =====================================================
    // RESPONSE
    // =====================================================

    return Response.json({
      success: true,

      order: {
        id:
          order._id.toString(),

        orderNumber:
          order.orderNumber,

        customer:
          order.customer,

        tableId:
          order.tableId,

        items:
          order.items,

        subtotal:
          order.subtotal,

        taxRate:
          order.taxRate,

        taxAmount:
          order.taxAmount,

        total:
          order.total,

        status:
          order.status,

        estimatedPreparationMinutes:
          order.estimatedPreparationMinutes,

        estimatedReadyAt:
          order.estimatedReadyAt,

        // ===============================================
        // BILL
        // ===============================================

        bill: {
          status:
            order.bill?.status ||
            "not_requested",

          billNumber:
            order.bill?.billNumber ||
            null,

          amount:
            order.bill?.amount ??
            order.total,

          requestedAt:
            order.bill?.requestedAt ||
            null,

          generatedAt:
            order.bill?.generatedAt ||
            null,

          paidAt:
            order.bill?.paidAt ||
            null,
        },

        // ===============================================
        // PAYMENT
        // ===============================================

        payment: {
          status:
            order.payment?.status ||
            "pending",

          amount:
            order.payment?.amount ??
            0,

          method:
            order.payment?.method ||
            null,

          transactionId:
            order.payment?.transactionId ||
            null,

          paidAt:
            order.payment?.paidAt ||
            null,
        },

        // ===============================================
        // RECEIPT
        // ===============================================

        receipt: {
          sentAt:
            order.receipt?.sentAt ||
            null,
        },

        // ===============================================
        // TIMESTAMPS
        // ===============================================

        createdAt:
          order.createdAt,

        updatedAt:
          order.updatedAt,

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
      },
    });
  } catch (error) {
    console.error(
      "Get order error:",
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