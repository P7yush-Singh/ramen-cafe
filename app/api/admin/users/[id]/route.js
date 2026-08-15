import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getServerUser } from "@/lib/auth-server";

import User from "@/models/User";
import Order from "@/models/Order";

// ============================================================
// ADMIN AUTH
// ============================================================

async function requireAdmin() {
  const user =
    await getServerUser();

  if (!user) {
    return {
      user: null,
      response: Response.json(
        {
          success: false,
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const isAdmin =
    user.role === "admin" ||
    user.isAdmin === true ||
    (process.env.ADMIN_EMAIL &&
      user.email &&
      user.email.toLowerCase() ===
        process.env.ADMIN_EMAIL.toLowerCase());

  if (!isAdmin) {
    return {
      user: null,
      response: Response.json(
        {
          success: false,
          error:
            "Admin access required.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

// ============================================================
// PARAMETER
// ============================================================

async function getUserId(params) {
  const resolvedParams =
    await params;

  return String(
    resolvedParams?.id || ""
  ).trim();
}

// ============================================================
// VALIDATE OBJECT ID
// ============================================================

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(
    id
  );
}

// ============================================================
// GET SINGLE USER
// ============================================================

export async function GET(
  request,
  { params }
) {
  try {
    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    const auth =
      await requireAdmin();

    if (auth.response) {
      return auth.response;
    }

    // --------------------------------------------------------
    // ID
    // --------------------------------------------------------

    const id =
      await getUserId(params);

    if (!id) {
      return Response.json(
        {
          success: false,
          error:
            "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidObjectId(id)
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid user ID.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // DATABASE
    // --------------------------------------------------------

    await connectDB();

    // --------------------------------------------------------
    // USER
    // --------------------------------------------------------

    const user =
      await User.findById(id)
        .select(
          "name email phone role isActive lastLoginAt createdAt updatedAt"
        )
        .lean();

    if (!user) {
      return Response.json(
        {
          success: false,
          error:
            "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------------
    // ORDER STATISTICS
    // --------------------------------------------------------

    const [
      orderStats,
      recentOrders,
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            userId:
              new mongoose.Types.ObjectId(
                id
              ),
          },
        },

        {
          $group: {
            _id: null,

            orderCount: {
              $sum: 1,
            },

            totalSpent: {
              $sum: "$total",
            },
          },
        },
      ]),

      Order.find({
        userId:
          new mongoose.Types.ObjectId(
            id
          ),
      })
        .select(
          "orderNumber status tableId total paymentStatus createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .lean(),
    ]);

    const stats =
      orderStats[0] || {
        orderCount: 0,
        totalSpent: 0,
      };

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return Response.json({
      success: true,

      user: {
        _id:
          user._id.toString(),

        name:
          user.name || "",

        email:
          user.email || "",

        phone:
          user.phone || "",

        role:
          user.role || "customer",

        isActive:
          user.isActive !== false,

        lastLoginAt:
          user.lastLoginAt ||
          null,

        createdAt:
          user.createdAt ||
          null,

        updatedAt:
          user.updatedAt ||
          null,

        orderCount:
          Number(
            stats.orderCount || 0
          ),

        totalSpent:
          Number(
            stats.totalSpent || 0
          ),
      },

      recentOrders:
        recentOrders.map(
          (order) => ({
            _id:
              order._id.toString(),

            orderNumber:
              order.orderNumber,

            status:
              order.status,

            tableId:
              order.tableId,

            total:
              Number(
                order.total || 0
              ),

            paymentStatus:
              order.paymentStatus,

            createdAt:
              order.createdAt,
          })
        ),
    });
  } catch (error) {
    console.error(
      "GET /api/admin/users/[id] error:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to load user.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// PATCH USER
// ============================================================
//
// Currently supported:
// - isActive
//
// We intentionally DO NOT allow an admin to change another
// user's role from this endpoint yet.
// This prevents accidental privilege escalation.
//
// ============================================================

export async function PATCH(
  request,
  { params }
) {
  try {
    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    const auth =
      await requireAdmin();

    if (auth.response) {
      return auth.response;
    }

    // --------------------------------------------------------
    // ID
    // --------------------------------------------------------

    const id =
      await getUserId(params);

    if (!id) {
      return Response.json(
        {
          success: false,
          error:
            "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidObjectId(id)
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid user ID.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // BODY
    // --------------------------------------------------------

    const body =
      await request.json();

    // --------------------------------------------------------
    // ONLY isActive IS EDITABLE
    // --------------------------------------------------------

    if (
      typeof body.isActive !==
      "boolean"
    ) {
      return Response.json(
        {
          success: false,
          error:
            "isActive must be a boolean.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // PREVENT SELF DEACTIVATION
    // --------------------------------------------------------

    if (
      auth.user?._id &&
      auth.user._id.toString() ===
        id &&
      body.isActive === false
    ) {
      return Response.json(
        {
          success: false,
          error:
            "You cannot deactivate your own admin account.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // DATABASE
    // --------------------------------------------------------

    await connectDB();

    // --------------------------------------------------------
    // FIND USER
    // --------------------------------------------------------

    const existingUser =
      await User.findById(id);

    if (!existingUser) {
      return Response.json(
        {
          success: false,
          error:
            "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------------
    // PREVENT DEACTIVATING LAST ADMIN
    // --------------------------------------------------------

    if (
      existingUser.role ===
        "admin" &&
      body.isActive === false
    ) {
      const activeAdminCount =
        await User.countDocuments({
          role: "admin",
          isActive: true,
        });

      if (
        activeAdminCount <= 1
      ) {
        return Response.json(
          {
            success: false,
            error:
              "You cannot deactivate the last active admin.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // --------------------------------------------------------
    // UPDATE
    // --------------------------------------------------------

    existingUser.isActive =
      body.isActive;

    await existingUser.save();

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return Response.json({
      success: true,

      user: {
        _id:
          existingUser._id.toString(),

        name:
          existingUser.name || "",

        email:
          existingUser.email || "",

        phone:
          existingUser.phone || "",

        role:
          existingUser.role ||
          "customer",

        isActive:
          existingUser.isActive !==
          false,

        lastLoginAt:
          existingUser.lastLoginAt ||
          null,

        createdAt:
          existingUser.createdAt ||
          null,
      },
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/users/[id] error:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to update user.",
      },
      {
        status: 500,
      }
    );
  }
}