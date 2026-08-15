import { getServerUser } from "@/lib/auth-server";

// ============================================================
// ROLES
// ============================================================

export const ROLES = {
  ADMIN: "admin",
  OWNER: "owner",
  STAFF: "staff",
  CUSTOMER: "customer",
};

// ============================================================
// ROLE NORMALIZER
// ============================================================

export function getUserRole(user) {
  return String(
    user?.role || ""
  )
    .trim()
    .toLowerCase();
}

// ============================================================
// PERMISSIONS
// ============================================================

export const PERMISSIONS = {
  dashboard: [
    ROLES.ADMIN,
    ROLES.OWNER,
  ],

  orders: [
    ROLES.ADMIN,
    ROLES.OWNER,
    ROLES.STAFF,
  ],

  products: [
    ROLES.ADMIN,
    ROLES.OWNER,
    ROLES.STAFF,
  ],

  tables: [
    ROLES.ADMIN,
    ROLES.OWNER,
  ],

  users: [
    ROLES.ADMIN,
    ROLES.OWNER,
  ],
};

// ============================================================
// CHECK PERMISSION
// ============================================================

export function hasPermission(
  user,
  permission
) {
  if (!user) {
    return false;
  }

  const role =
    getUserRole(user);

  const allowedRoles =
    PERMISSIONS[
      permission
    ] || [];

  return allowedRoles.includes(
    role
  );
}

// ============================================================
// GENERIC PERMISSION CHECK
// ============================================================

export async function requirePermission(
  permission
) {
  const user =
    await getServerUser();

  // ----------------------------------------------------------
  // NOT LOGGED IN
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // INACTIVE ACCOUNT
  // ----------------------------------------------------------

  if (
    user.isActive ===
    false
  ) {
    return {
      user,

      response: Response.json(
        {
          success: false,
          error:
            "Your account is inactive.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  // ----------------------------------------------------------
  // PERMISSION
  // ----------------------------------------------------------

  if (
    !hasPermission(
      user,
      permission
    )
  ) {
    return {
      user,

      response: Response.json(
        {
          success: false,
          error:
            "You are not authorized to access this resource.",
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
// DASHBOARD
// ============================================================

export async function requireDashboardAccess() {
  return requirePermission(
    "dashboard"
  );
}

// ============================================================
// ORDERS
// ============================================================

export async function requireOrderAccess() {
  return requirePermission(
    "orders"
  );
}

// ============================================================
// PRODUCTS
// ============================================================

export async function requireProductAccess() {
  return requirePermission(
    "products"
  );
}

// ============================================================
// TABLES
// ============================================================

export async function requireTableAccess() {
  return requirePermission(
    "tables"
  );
}

// ============================================================
// USERS
// ============================================================

export async function requireUserAccess() {
  return requirePermission(
    "users"
  );
}