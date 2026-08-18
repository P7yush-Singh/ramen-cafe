import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Order from "@/models/Order";

import {
  requireUserAccess,
  getUserRole,
  ROLES,
} from "@/lib/admin-auth";

// ============================================================
// HELPERS
// ============================================================

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(
    id
  );
}

async function getUserId(params) {
  const resolvedParams =
    await params;

  return String(
    resolvedParams?.id || ""
  ).trim();
}

function cleanText(
  value,
  maxLength = 100
) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function serializeUser(user) {
  return {
    _id: user._id
      ? user._id.toString()
      : null,

    name: user.name || "",

    email: user.email || "",

    phone: user.phone || "",

    role:
      user.role ||
      ROLES.CUSTOMER,

    isActive:
      user.isActive !== false,

    lastLoginAt:
      user.lastLoginAt || null,

    createdAt:
      user.createdAt || null,

    updatedAt:
      user.updatedAt || null,
  };
}

// ============================================================
// ROLE CHANGE PERMISSION
// ============================================================

function canChangeRole(
  actorRole,
  currentRole,
  nextRole
) {
  // ----------------------------------------------------------
  // ADMIN
  // ----------------------------------------------------------

  if (
    actorRole === ROLES.ADMIN
  ) {
    if (
      ![
        ROLES.ADMIN,
        ROLES.OWNER,
        ROLES.STAFF,
      ].includes(nextRole)
    ) {
      return {
        allowed: false,

        error:
          "Invalid target role.",
      };
    }

    return {
      allowed: true,
    };
  }

  // ----------------------------------------------------------
  // OWNER
  // ----------------------------------------------------------

  if (
    actorRole === ROLES.OWNER
  ) {
    // Owner cannot modify an admin.
    if (
      currentRole ===
        ROLES.ADMIN ||
      nextRole === ROLES.ADMIN
    ) {
      return {
        allowed: false,

        error:
          "Owner cannot create, promote, demote, or modify an admin.",
      };
    }

    if (
      ![
        ROLES.OWNER,
        ROLES.STAFF,
      ].includes(nextRole)
    ) {
      return {
        allowed: false,

        error:
          "Owner can only manage owner and staff roles.",
      };
    }

    return {
      allowed: true,
    };
  }

  // ----------------------------------------------------------
  // STAFF / CUSTOMER
  // ----------------------------------------------------------

  return {
    allowed: false,

    error:
      "You are not authorized to manage users.",
  };
}

// ============================================================
// GET /api/admin/users/[id]
// ============================================================

export async function GET(
  request,
  { params }
) {
  try {
    // ========================================================
    // AUTHORIZATION
    // ========================================================

    const auth =
      await requireUserAccess();

    if (auth.response) {
      return auth.response;
    }

    const actorRole =
      getUserRole(auth.user);

    // ========================================================
    // USER ID
    // ========================================================

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

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // USER
    // ========================================================

    const user =
      await User.findById(id)
        .select(
          [
            "name",
            "email",
            "phone",
            "role",
            "isActive",
            "lastLoginAt",
            "createdAt",
            "updatedAt",
          ].join(" ")
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

    // ========================================================
    // OBJECT ID
    // ========================================================

    const userObjectId =
      new mongoose.Types.ObjectId(
        id
      );

    // ========================================================
    // ORDER DATA
    // ========================================================

    const [
      orderStats,
      recentOrders,
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            userId:
              userObjectId,
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
          userObjectId,
      })
        .select(
          [
            "orderNumber",
            "status",
            "tableId",
            "total",
            "paymentStatus",
            "paymentMethod",
            "createdAt",
          ].join(" ")
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

    // ========================================================
    // RESPONSE
    // ========================================================

    return Response.json({
      success: true,

      user: {
        ...serializeUser(user),

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

            paymentMethod:
              order.paymentMethod ||
              null,

            createdAt:
              order.createdAt,
          })
        ),

      permissions: {
        actorRole,

        targetRole:
          user.role ||
          ROLES.CUSTOMER,

        canChangeRole:
          !(
            actorRole ===
              ROLES.OWNER &&
            user.role ===
              ROLES.ADMIN
          ),

        canManageStatus:
          !(
            actorRole ===
              ROLES.OWNER &&
            user.role ===
              ROLES.ADMIN
          ),
      },
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
// PATCH /api/admin/users/[id]
// ============================================================
//
// Supported fields:
//
// role
// isActive
//
// ============================================================

export async function PATCH(
  request,
  { params }
) {
  try {
    // ========================================================
    // AUTHORIZATION
    // ========================================================

    const auth =
      await requireUserAccess();

    if (auth.response) {
      return auth.response;
    }

    const actorRole =
      getUserRole(auth.user);

    // ========================================================
    // USER ID
    // ========================================================

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

    // ========================================================
    // REQUEST BODY
    // ========================================================

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

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // FIND USER
    // ========================================================

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

    const currentRole =
      getUserRole(
        existingUser
      );

    // ========================================================
    // SELF CHECK
    // ========================================================

    const actorId =
      auth.user?._id
        ? auth.user._id.toString()
        : null;

    const isSelf =
      actorId === id;

    // ========================================================
    // ROLE UPDATE
    // ========================================================

    if (
      body.role !== undefined
    ) {
      const nextRole =
        cleanText(
          body.role,
          30
        ).toLowerCase();

      // ------------------------------------------------------
      // VALID TARGET ROLE
      // ------------------------------------------------------

      if (
        ![
          ROLES.ADMIN,
          ROLES.OWNER,
          ROLES.STAFF,
        ].includes(
          nextRole
        )
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Invalid target role.",
          },
          {
            status: 400,
          }
        );
      }

      // ------------------------------------------------------
      // SAME ROLE
      // ------------------------------------------------------

      if (
        nextRole ===
        currentRole
      ) {
        // Nothing to change.
      } else {
        // ----------------------------------------------------
        // SELF ROLE CHANGE
        // ----------------------------------------------------

        if (isSelf) {
          return Response.json(
            {
              success: false,
              error:
                "You cannot change your own role.",
            },
            {
              status: 400,
            }
          );
        }

        // ----------------------------------------------------
        // PERMISSION
        // ----------------------------------------------------

        const permission =
          canChangeRole(
            actorRole,
            currentRole,
            nextRole
          );

        if (
          !permission.allowed
        ) {
          return Response.json(
            {
              success: false,
              error:
                permission.error,
            },
            {
              status: 403,
            }
          );
        }

        // ----------------------------------------------------
        // LAST ACTIVE ADMIN
        // ----------------------------------------------------

        if (
          currentRole ===
            ROLES.ADMIN &&
          nextRole !==
            ROLES.ADMIN
        ) {
          const activeAdminCount =
            await User.countDocuments(
              {
                role:
                  ROLES.ADMIN,

                isActive:
                  true,
              }
            );

          if (
            activeAdminCount <=
            1
          ) {
            return Response.json(
              {
                success:
                  false,

                error:
                  "You cannot remove the role from the last active admin.",
              },
              {
                status: 400,
              }
            );
          }
        }

        existingUser.role =
          nextRole;
      }
    }

    // ========================================================
    // ACTIVE STATUS UPDATE
    // ========================================================

    if (
      body.isActive !==
      undefined
    ) {
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

      // ------------------------------------------------------
      // SELF DEACTIVATION
      // ------------------------------------------------------

      if (
        isSelf &&
        body.isActive ===
          false
      ) {
        return Response.json(
          {
            success: false,
            error:
              "You cannot deactivate your own account.",
          },
          {
            status: 400,
          }
        );
      }

      // ------------------------------------------------------
      // OWNER CANNOT MODIFY ADMIN STATUS
      // ------------------------------------------------------

      if (
        actorRole ===
          ROLES.OWNER &&
        currentRole ===
          ROLES.ADMIN
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Owner cannot modify an admin account.",
          },
          {
            status: 403,
          }
        );
      }

      // ------------------------------------------------------
      // LAST ACTIVE ADMIN
      // ------------------------------------------------------

      if (
        currentRole ===
          ROLES.ADMIN &&
        body.isActive ===
          false
      ) {
        const activeAdminCount =
          await User.countDocuments(
            {
              role:
                ROLES.ADMIN,

              isActive:
                true,
            }
          );

        if (
          activeAdminCount <=
          1
        ) {
          return Response.json(
            {
              success:
                false,

              error:
                "You cannot deactivate the last active admin.",
            },
            {
              status: 400,
            }
          );
        }
      }

      existingUser.isActive =
        body.isActive;
    }

    // ========================================================
    // CHECK SUPPORTED FIELDS
    // ========================================================

    if (
      body.role ===
        undefined &&
      body.isActive ===
        undefined
    ) {
      return Response.json(
        {
          success: false,
          error:
            "No supported fields were provided. Supported fields: role, isActive.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // SAVE
    // ========================================================

    await existingUser.save();

    // ========================================================
    // RESPONSE
    // ========================================================

    return Response.json({
      success: true,

      message:
        "User updated successfully.",

      user:
        serializeUser(
          existingUser
        ),
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