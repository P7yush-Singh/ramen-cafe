import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getServerUser } from "@/lib/auth-server";

export async function GET(request, { params }) {
  try {
    // =====================================================
    // AUTH
    // =====================================================

    const user = await getServerUser();

    if (!user) {
      return Response.json(
        {
          success: false,
          error: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    // =====================================================
    // PARAMS
    // =====================================================

    const { orderNumber } = await params;

    if (!orderNumber) {
      return Response.json(
        {
          success: false,
          error: "Order number is required.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // DATABASE
    // =====================================================

    await connectDB();

    // =====================================================
    // FIND ORDER
    // =====================================================

    const order = await Order.findOne({
      orderNumber: String(orderNumber).trim().toUpperCase(),
      userId: user._id,
    }).lean();

    // =====================================================
    // NOT FOUND
    // =====================================================

    if (!order) {
      return Response.json(
        {
          success: false,
          error: "Order not found.",
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
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return Response.json(
      {
        success: false,
        error: "Unable to load order.",
      },
      {
        status: 500,
      }
    );
  }
}