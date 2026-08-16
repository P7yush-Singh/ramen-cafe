import { connectDB } from "@/lib/mongodb";
import { getServerUser } from "@/lib/auth-server";

import User from "@/models/User";
import Order from "@/models/Order";

// ============================================================
// ADMIN AUTH
// ============================================================

async function requireAdmin() {
  const user = await getServerUser();

  if (!user) {
    return {
      user: null,
      response: Response.json(
        {
          success: false,
          error: "Authentication required.",
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
          error: "Admin access required.",
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
    _id: user._id?.toString(),

    name: user.name || "",

    email: user.email || "",

    phone: user.phone || "",

    role: user.role || "customer",

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
// GET /api/admin/users
// ============================================================

export async function GET(request) {
  try {
    // --------------------------------------------------------
    // ADMIN AUTH
    // --------------------------------------------------------

    const auth =
      await requireAdmin();

    if (auth.response) {
      return auth.response;
    }

    // --------------------------------------------------------
    // QUERY
    // --------------------------------------------------------

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
            50
          )
        : 20;

    // --------------------------------------------------------
    // DATABASE
    // --------------------------------------------------------

    await connectDB();

    // --------------------------------------------------------
    // FILTER
    // --------------------------------------------------------

    const filter = {};

    // Search
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

    // Role
    if (
      role === "customer" ||
      role === "admin"
    ) {
      filter.role = role;
    }

    // Status
    if (status === "active") {
      filter.isActive = true;
    }

    if (status === "inactive") {
      filter.isActive = false;
    }

    // --------------------------------------------------------
    // COUNTS
    // --------------------------------------------------------

    const [
      totalUsers,
      totalCustomers,
      totalAdmins,
      activeUsers,
      inactiveUsers,
    ] = await Promise.all([
      User.countDocuments({}),

      User.countDocuments({
        role: "customer",
      }),

      User.countDocuments({
        role: "admin",
      }),

      User.countDocuments({
        isActive: true,
      }),

      User.countDocuments({
        isActive: false,
      }),
    ]);

    // --------------------------------------------------------
    // PAGINATION COUNT
    // --------------------------------------------------------

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
      (safePage - 1) * limit;

    // --------------------------------------------------------
    // USERS
    // --------------------------------------------------------

    const users =
      await User.find(filter)
        .select(
          "name email phone role isActive lastLoginAt createdAt updatedAt"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean();

    // --------------------------------------------------------
    // USER IDS
    // --------------------------------------------------------

    const userIds =
      users.map(
        (user) => user._id
      );

    // --------------------------------------------------------
    // ORDER STATISTICS
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // CREATE STATS MAP
    // --------------------------------------------------------

    const statsMap =
      new Map();

    for (
      const stat of orderStats
    ) {
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

    // --------------------------------------------------------
    // FINAL USERS
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

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

        active:
          activeUsers,

        inactive:
          inactiveUsers,
      },

      pagination: {
        page: safePage,

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