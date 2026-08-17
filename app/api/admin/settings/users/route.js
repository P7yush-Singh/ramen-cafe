import { connectDB } from "@/lib/mongodb";
import { getServerUser } from "@/lib/auth-server";
import User from "@/models/User";

// ============================================================
// CONSTANTS
// ============================================================

const VALID_ROLES = [
  "customer",
  "staff",
  "owner",
  "admin",
];

const ROLE_PERMISSIONS = {
  admin: [
    "admin",
    "owner",
    "staff",
    "customer",
  ],

  owner: [
    "owner",
    "staff",
    "customer",
  ],

  staff: [],

  customer: [],
};

// ============================================================
// RESPONSE HELPERS
// ============================================================

function successResponse(
  data = {},
  status = 200
) {
  return Response.json(
    {
      success: true,
      ...data,
    },
    {
      status,
      headers: {
        "Cache-Control":
          "no-store",
      },
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
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

// ============================================================
// NORMALIZE ROLE
// ============================================================

function normalizeRole(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

// ============================================================
// NORMALIZE EMAIL
// ============================================================

function normalizeEmail(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

// ============================================================
// EMAIL VALIDATION
// ============================================================

function isValidEmail(
  email
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

// ============================================================
// GET USER ID
// ============================================================

function getUserId(
  user
) {
  if (!user?._id) {
    return "";
  }

  return String(
    user._id
  );
}

// ============================================================
// AUTHORIZATION
// ============================================================

async function getAuthorizedUser() {
  const user =
    await getServerUser();

  if (!user) {
    return {
      user: null,

      response:
        errorResponse(
          "Authentication required.",
          401
        ),
    };
  }

  const role =
    normalizeRole(
      user.role
    );

  // ----------------------------------------------------------
  // ONLY ADMIN / OWNER
  // ----------------------------------------------------------

  if (
    role !== "admin" &&
    role !== "owner"
  ) {
    return {
      user: null,

      response:
        errorResponse(
          "You do not have permission to manage user roles.",
          403
        ),
    };
  }

  return {
    user,

    role,

    response: null,
  };
}

// ============================================================
// SERIALIZE USER
// ============================================================

function serializeUser(
  user
) {
  return {
    id:
      user._id
        ? String(user._id)
        : "",

    name:
      user.name || "",

    email:
      user.email || "",

    phone:
      user.phone || "",

    role:
      normalizeRole(
        user.role
      ) || "customer",

    isActive:
      user.isActive !== false,

    createdAt:
      user.createdAt ||
      null,

    lastLoginAt:
      user.lastLoginAt ||
      null,
  };
}

// ============================================================
// GET
//
// /api/admin/settings/users?email=example@email.com
// ============================================================

export async function GET(
  request
) {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    const auth =
      await getAuthorizedUser();

    if (auth.response) {
      return auth.response;
    }

    // ========================================================
    // EMAIL
    // ========================================================

    const {
      searchParams,
    } = new URL(
      request.url
    );

    const email =
      normalizeEmail(
        searchParams.get(
          "email"
        )
      );

    if (!email) {
      return errorResponse(
        "Email address is required.",
        400
      );
    }

    if (
      !isValidEmail(email)
    ) {
      return errorResponse(
        "Please enter a valid email address.",
        400
      );
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    const user =
      await User.findOne({
        email,
      })
        .select(
          "name email phone role isActive createdAt lastLoginAt"
        )
        .lean();

    if (!user) {
      return errorResponse(
        "No user found with this email address.",
        404
      );
    }

    const currentRole =
      normalizeRole(
        user.role
      ) || "customer";

    return successResponse({
      user:
        serializeUser(
          user
        ),

      allowedRoles:
        ROLE_PERMISSIONS[
          auth.role
        ] || [],
    });
  } catch (error) {
    console.error(
      "GET /api/admin/settings/users error:",
      error
    );

    return errorResponse(
      "Unable to find user.",
      500
    );
  }
}

// ============================================================
// PATCH
//
// Change role
// ============================================================

export async function PATCH(
  request
) {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    const auth =
      await getAuthorizedUser();

    if (auth.response) {
      return auth.response;
    }

    const actor =
      auth.user;

    const actorRole =
      normalizeRole(
        auth.role
      );

    // ========================================================
    // BODY
    // ========================================================

    let body;

    try {
      body =
        await request.json();
    } catch {
      return errorResponse(
        "Invalid request body.",
        400
      );
    }

    // ========================================================
    // EMAIL
    // ========================================================

    const email =
      normalizeEmail(
        body?.email
      );

    if (!email) {
      return errorResponse(
        "Email address is required.",
        400
      );
    }

    if (
      !isValidEmail(email)
    ) {
      return errorResponse(
        "Please enter a valid email address.",
        400
      );
    }

    // ========================================================
    // NEW ROLE
    // ========================================================

    const newRole =
      normalizeRole(
        body?.role
      );

    if (
      !VALID_ROLES.includes(
        newRole
      )
    ) {
      return errorResponse(
        "Invalid role selected.",
        400
      );
    }

    // ========================================================
    // CHECK ACTOR PERMISSION
    // ========================================================

    const allowedRoles =
      ROLE_PERMISSIONS[
        actorRole
      ] || [];

    if (
      !allowedRoles.includes(
        newRole
      )
    ) {
      return errorResponse(
        `Your ${actorRole} account cannot assign the ${newRole} role.`,
        403
      );
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    const targetUser =
      await User.findOne({
        email,
      });

    if (!targetUser) {
      return errorResponse(
        "No user found with this email address.",
        404
      );
    }

    const targetRole =
      normalizeRole(
        targetUser.role
      ) || "customer";

    // ========================================================
    // PREVENT SELF ROLE CHANGE
    // ========================================================

    const actorId =
      getUserId(
        actor
      );

    const targetId =
      getUserId(
        targetUser
      );

    if (
      actorId &&
      targetId &&
      actorId === targetId
    ) {
      return errorResponse(
        "You cannot change your own role.",
        400
      );
    }

    // ========================================================
    // OWNER SECURITY
    //
    // Owner CANNOT touch an Admin account.
    // ========================================================

    if (
      actorRole === "owner" &&
      targetRole === "admin"
    ) {
      return errorResponse(
        "Owners cannot modify an Admin account.",
        403
      );
    }

    // ========================================================
    // OWNER CANNOT CREATE / PROMOTE ADMIN
    // ========================================================

    if (
      actorRole === "owner" &&
      newRole === "admin"
    ) {
      return errorResponse(
        "Owners cannot assign the Admin role.",
        403
      );
    }

    // ========================================================
    // ADMIN CAN MANAGE ALL ROLES
    // ========================================================

    if (
      actorRole === "admin" &&
      !allowedRoles.includes(
        newRole
      )
    ) {
      return errorResponse(
        "You are not allowed to assign this role.",
        403
      );
    }

    // ========================================================
    // NO CHANGE
    // ========================================================

    if (
      targetRole === newRole
    ) {
      return errorResponse(
        `This user is already a ${newRole}.`,
        400
      );
    }

    // ========================================================
    // UPDATE
    // ========================================================

    const previousRole =
      targetRole;

    targetUser.role =
      newRole;

    await targetUser.save();

    // ========================================================
    // RESPONSE
    // ========================================================

    return successResponse({
      message:
        `${targetUser.name || targetUser.email} is now ${newRole}.`,

      user:
        serializeUser(
          targetUser
        ),

      previousRole,

      newRole,
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/settings/users error:",
      error
    );

    // ========================================================
    // MONGOOSE ENUM ERROR
    // ========================================================

    if (
      error?.name ===
      "ValidationError"
    ) {
      return errorResponse(
        "The selected role is not supported by the User model. Make sure the User schema includes customer, staff, owner and admin, then restart the server.",
        500
      );
    }

    return errorResponse(
      "Unable to update user role.",
      500
    );
  }
}