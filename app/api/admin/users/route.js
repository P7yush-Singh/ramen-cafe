import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Order from "@/models/Order";

import {
  requireUserAccess,
  getUserRole,
  ROLES,
} from "@/lib/admin-auth";

// ============================================================
// CONSTANTS
// ============================================================

const MANAGED_ROLES = [
  ROLES.ADMIN,
  ROLES.OWNER,
  ROLES.STAFF,
];

const FILTER_ROLES = [
  ROLES.CUSTOMER,
  ROLES.ADMIN,
  ROLES.OWNER,
  ROLES.STAFF,
];

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// ============================================================
// HELPERS
// ============================================================

function cleanText(value, maxLength = 100) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
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
// ROLE CREATION PERMISSION
// ============================================================

function canCreateRole(
  actorRole,
  targetRole
) {
  // ----------------------------------------------------------
  // ADMIN
  // ----------------------------------------------------------

  if (
    actorRole === ROLES.ADMIN
  ) {
    return MANAGED_ROLES.includes(
      targetRole
    );
  }

  // ----------------------------------------------------------
  // OWNER
  // ----------------------------------------------------------

  if (
    actorRole === ROLES.OWNER
  ) {
    return [
      ROLES.OWNER,
      ROLES.STAFF,
    ].includes(targetRole);
  }

  // ----------------------------------------------------------
  // STAFF / CUSTOMER
  // ----------------------------------------------------------

  return false;
}

// ============================================================
// GET /api/admin/users
// ============================================================

export async function GET(request) {
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
    // QUERY PARAMETERS
    // ========================================================

    const { searchParams } =
      new URL(request.url);

    const search =
      cleanText(
        searchParams.get("search"),
        100
      );

    const role =
      cleanText(
        searchParams.get("role"),
        30
      ).toLowerCase();

    const status =
      cleanText(
        searchParams.get("status"),
        30
      ).toLowerCase();

    const pageValue =
      Number(
        searchParams.get("page")
      );

    const limitValue =
      Number(
        searchParams.get("limit")
      );

    const page =
      Number.isInteger(pageValue) &&
      pageValue > 0
        ? pageValue
        : 1;

    const limit =
      Number.isInteger(limitValue) &&
      limitValue > 0
        ? Math.min(
            limitValue,
            MAX_LIMIT
          )
        : DEFAULT_LIMIT;

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // FILTER
    // ========================================================

    const filter = {};

    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (search) {
      const searchRegex =
        new RegExp(
          search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ),
          "i"
        );

      filter.$or = [
        {
          name: searchRegex,
        },
        {
          email: searchRegex,
        },
        {
          phone: searchRegex,
        },
      ];
    }

    // --------------------------------------------------------
    // ROLE FILTER
    // --------------------------------------------------------

    if (
      FILTER_ROLES.includes(role)
    ) {
      filter.role = role;
    }

    // --------------------------------------------------------
    // STATUS FILTER
    // --------------------------------------------------------

    if (
      status === "active"
    ) {
      filter.isActive = true;
    }

    if (
      status === "inactive"
    ) {
      filter.isActive = false;
    }

    // ========================================================
    // COUNTS
    // ========================================================

    const [
      totalUsers,
      totalCustomers,
      totalAdmins,
      totalOwners,
      totalStaff,
      activeUsers,
      inactiveUsers,
    ] = await Promise.all([
      User.countDocuments({}),

      User.countDocuments({
        role: ROLES.CUSTOMER,
      }),

      User.countDocuments({
        role: ROLES.ADMIN,
      }),

      User.countDocuments({
        role: ROLES.OWNER,
      }),

      User.countDocuments({
        role: ROLES.STAFF,
      }),

      User.countDocuments({
        isActive: true,
      }),

      User.countDocuments({
        isActive: false,
      }),
    ]);

    // ========================================================
    // PAGINATION
    // ========================================================

    const filteredCount =
      await User.countDocuments(
        filter
      );

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          filteredCount / limit
        )
      );

    const safePage =
      Math.min(
        page,
        totalPages
      );

    const skip =
      (safePage - 1) *
      limit;

    // ========================================================
    // USERS
    // ========================================================

    const users =
      await User.find(filter)
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
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean();

    // ========================================================
    // USER IDS
    // ========================================================

    const userIds =
      users.map(
        (user) => user._id
      );

    // ========================================================
    // ORDER STATISTICS
    // ========================================================

    const orderStats =
      userIds.length > 0
        ? await Order.aggregate([
            {
              $match: {
                userId: {
                  $in: userIds,
                },
              },
            },

            {
              $group: {
                _id: "$userId",

                orderCount: {
                  $sum: 1,
                },

                totalSpent: {
                  $sum: "$total",
                },
              },
            },
          ])
        : [];

    // ========================================================
    // STATS MAP
    // ========================================================

    const statsMap =
      new Map();

    for (
      const stat of orderStats
    ) {
      if (!stat._id) {
        continue;
      }

      statsMap.set(
        stat._id.toString(),
        {
          orderCount:
            Number(
              stat.orderCount || 0
            ),

          totalSpent:
            Number(
              stat.totalSpent || 0
            ),
        }
      );
    }

    // ========================================================
    // FINAL USERS
    // ========================================================

    const result =
      users.map((user) => {
        const stats =
          statsMap.get(
            user._id.toString()
          ) || {
            orderCount: 0,
            totalSpent: 0,
          };

        return {
          ...serializeUser(user),

          orderCount:
            stats.orderCount,

          totalSpent:
            stats.totalSpent,
        };
      });

    // ========================================================
    // RESPONSE
    // ========================================================

    return Response.json({
      success: true,

      users: result,

      counts: {
        total:
          totalUsers,

        customers:
          totalCustomers,

        admins:
          totalAdmins,

        owners:
          totalOwners,

        staff:
          totalStaff,

        active:
          activeUsers,

        inactive:
          inactiveUsers,
      },

      pagination: {
        page:
          safePage,

        limit,

        total:
          filteredCount,

        totalPages,

        hasNextPage:
          safePage <
          totalPages,

        hasPreviousPage:
          safePage > 1,
      },

      permissions: {
        actorRole,

        canCreateAdmin:
          actorRole ===
          ROLES.ADMIN,

        canCreateOwner:
          [
            ROLES.ADMIN,
            ROLES.OWNER,
          ].includes(
            actorRole
          ),

        canCreateStaff:
          [
            ROLES.ADMIN,
            ROLES.OWNER,
          ].includes(
            actorRole
          ),
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/users error:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to load users.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// POST /api/admin/users
// ============================================================

export async function POST(request) {
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
    // INPUT
    // ========================================================

    const name =
      cleanText(
        body.name,
        100
      );

    const email =
      normalizeEmail(
        body.email
      );

    const phone =
      cleanText(
        body.phone,
        30
      );

    const role =
      cleanText(
        body.role,
        30
      ).toLowerCase();

    const password =
      String(
        body.password || ""
      );

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!name) {
      return Response.json(
        {
          success: false,
          error:
            "Name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return Response.json(
        {
          success: false,
          error:
            "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!role) {
      return Response.json(
        {
          success: false,
          error:
            "Role is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !MANAGED_ROLES.includes(
        role
      )
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Only admin, owner, or staff accounts can be created from this endpoint.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !password ||
      password.length < 8
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // ROLE PERMISSION
    // ========================================================

    if (
      !canCreateRole(
        actorRole,
        role
      )
    ) {
      if (
        actorRole ===
          ROLES.OWNER &&
        role === ROLES.ADMIN
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Owner cannot create an admin.",
          },
          {
            status: 403,
          }
        );
      }

      return Response.json(
        {
          success: false,
          error:
            "You are not allowed to create this role.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // DUPLICATE EMAIL
    // ========================================================

    const existingUser =
      await User.findOne({
        email,
      }).lean();

    if (existingUser) {
      return Response.json(
        {
          success: false,
          error:
            "A user with this email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    // ========================================================
    // CREATE USER
    // ========================================================

    const user =
      await User.create({
        name,
        email,
        phone,
        password,
        role,
        isActive:
          body.isActive !==
          false,
      });

    // ========================================================
    // RESPONSE
    // ========================================================

    return Response.json(
      {
        success: true,

        message:
          "User created successfully.",

        user:
          serializeUser(user),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/users error:",
      error
    );

    // --------------------------------------------------------
    // DUPLICATE KEY
    // --------------------------------------------------------

    if (
      error?.code === 11000
    ) {
      return Response.json(
        {
          success: false,
          error:
            "A user with this email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    return Response.json(
      {
        success: false,
        error:
          "Unable to create user.",
      },
      {
        status: 500,
      }
    );
  }
}