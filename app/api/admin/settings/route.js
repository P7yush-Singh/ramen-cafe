import mongoose from "mongoose";

import {
  connectDB,
} from "@/lib/mongodb";

import {
  getServerUser,
} from "@/lib/auth-server";

import RestaurantSettings from "@/models/RestaurantSettings";

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
// AUTHORIZATION
// ============================================================

async function requireSettingsAccess() {
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
    String(
      user.role || ""
    )
      .trim()
      .toLowerCase();

  // ----------------------------------------------------------
  // SETTINGS ACCESS
  // ----------------------------------------------------------

  if (
    role !== "admin" &&
    role !== "owner"
  ) {
    return {
      user: null,

      response:
        errorResponse(
          "Only Admin or Owner can access restaurant settings.",
          403
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

function cleanText(
  value,
  maxLength = 500
) {
  return String(
    value ?? ""
  )
    .trim()
    .slice(0, maxLength);
}

function normalizeEmail(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

function isValidEmail(
  email
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function normalizeEmailList(
  value
) {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  const unique =
    new Set();

  for (
    const item of value
  ) {
    const email =
      normalizeEmail(
        item
      );

    if (
      email &&
      isValidEmail(email)
    ) {
      unique.add(email);
    }
  }

  return Array.from(
    unique
  );
}

function normalizeNumber(
  value,
  fallback
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : fallback;
}

// ============================================================
// SERIALIZE SETTINGS
// ============================================================

function serializeSettings(
  settings
) {
  return {
    id:
      settings._id
        ? settings._id.toString()
        : null,

    restaurantName:
      settings.restaurantName ||
      "Ramen Cafe",

    tagline:
      settings.tagline ||
      "",

    email:
      settings.email ||
      "",

    phone:
      settings.phone ||
      "",

    address:
      settings.address ||
      "",

    taxRate:
      Number(
        settings.taxRate ?? 5
      ),

    minPreparationMinutes:
      Number(
        settings.minPreparationMinutes ??
          15
      ),

    maxPreparationMinutes:
      Number(
        settings.maxPreparationMinutes ??
          25
      ),

    billRequestsEnabled:
      settings.billRequestsEnabled !==
      false,

    billOwnerEmails:
      Array.isArray(
        settings.billOwnerEmails
      )
        ? settings.billOwnerEmails
        : [],

    billStaffEmails:
      Array.isArray(
        settings.billStaffEmails
      )
        ? settings.billStaffEmails
        : [],

    updatedAt:
      settings.updatedAt ||
      null,
  };
}

// ============================================================
// GET /api/admin/settings
// ============================================================

export async function GET() {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    const auth =
      await requireSettingsAccess();

    if (auth.response) {
      return auth.response;
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // GET SETTINGS
    // ========================================================

    let settings =
      await RestaurantSettings.findOne(
        {
          settingsKey: "main",
        }
      ).lean();

    // ========================================================
    // CREATE DEFAULT SETTINGS
    // ========================================================

    if (!settings) {
      const created =
        await RestaurantSettings.create(
          {
            settingsKey: "main",
            updatedBy:
              mongoose.Types.ObjectId.isValid(
                auth.user._id
              )
                ? auth.user._id
                : null,
          }
        );

      settings =
        created.toObject();
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return successResponse({
      settings:
        serializeSettings(
          settings
        ),

      account: {
        id:
          auth.user._id
            ? String(
                auth.user._id
              )
            : null,

        name:
          auth.user.name ||
          "",

        email:
          auth.user.email ||
          "",

        phone:
          auth.user.phone ||
          "",

        role:
          auth.user.role ||
          "",
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/settings error:",
      error
    );

    return errorResponse(
      "Unable to load restaurant settings.",
      500
    );
  }
}

// ============================================================
// PATCH /api/admin/settings
// ============================================================

export async function PATCH(
  request
) {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    const auth =
      await requireSettingsAccess();

    if (auth.response) {
      return auth.response;
    }

    // ========================================================
    // BODY
    // ========================================================

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
        "Invalid settings data.",
        400
      );
    }

    // ========================================================
    // NORMALIZE RESTAURANT DATA
    // ========================================================

    const restaurantName =
      cleanText(
        body.restaurantName,
        100
      );

    const tagline =
      cleanText(
        body.tagline,
        200
      );

    const email =
      normalizeEmail(
        body.email
      );

    const phone =
      cleanText(
        body.phone,
        20
      );

    const address =
      cleanText(
        body.address,
        500
      );

    // ========================================================
    // VALIDATE EMAIL
    // ========================================================

    if (
      email &&
      !isValidEmail(email)
    ) {
      return errorResponse(
        "Please enter a valid restaurant email.",
        400
      );
    }

    // ========================================================
    // TAX
    // ========================================================

    const taxRate =
      normalizeNumber(
        body.taxRate,
        5
      );

    if (
      taxRate < 0 ||
      taxRate > 100
    ) {
      return errorResponse(
        "Tax rate must be between 0 and 100.",
        400
      );
    }

    // ========================================================
    // PREPARATION TIME
    // ========================================================

    const minPreparationMinutes =
      Math.floor(
        normalizeNumber(
          body.minPreparationMinutes,
          15
        )
      );

    const maxPreparationMinutes =
      Math.floor(
        normalizeNumber(
          body.maxPreparationMinutes,
          25
        )
      );

    if (
      minPreparationMinutes <
        1 ||
      minPreparationMinutes >
        180
    ) {
      return errorResponse(
        "Minimum preparation time must be between 1 and 180 minutes.",
        400
      );
    }

    if (
      maxPreparationMinutes <
        1 ||
      maxPreparationMinutes >
        180
    ) {
      return errorResponse(
        "Maximum preparation time must be between 1 and 180 minutes.",
        400
      );
    }

    if (
      minPreparationMinutes >
      maxPreparationMinutes
    ) {
      return errorResponse(
        "Minimum preparation time cannot be greater than maximum preparation time.",
        400
      );
    }

    // ========================================================
    // BILL REQUEST
    // ========================================================

    const billRequestsEnabled =
      body.billRequestsEnabled !==
      false;

    const billOwnerEmails =
      normalizeEmailList(
        body.billOwnerEmails
      );

    const billStaffEmails =
      normalizeEmailList(
        body.billStaffEmails
      );

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // UPDATE
    // ========================================================

    const settings =
      await RestaurantSettings.findOneAndUpdate(
        {
          settingsKey: "main",
        },
        {
          $set: {
            restaurantName,

            tagline,

            email,

            phone,

            address,

            taxRate,

            minPreparationMinutes,

            maxPreparationMinutes,

            billRequestsEnabled,

            billOwnerEmails,

            billStaffEmails,

            updatedBy:
              mongoose.Types.ObjectId.isValid(
                auth.user._id
              )
                ? auth.user._id
                : null,
          },

          $setOnInsert: {
            settingsKey: "main",
          },
        },
        {
          new: true,

          upsert: true,

          runValidators: true,
        }
      );

    // ========================================================
    // RESPONSE
    // ========================================================

    return successResponse({
      message:
        "Restaurant settings updated successfully.",

      settings:
        serializeSettings(
          settings
        ),
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/settings error:",
      error
    );

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      error?.name ===
      "ValidationError"
    ) {
      return errorResponse(
        "Settings validation failed.",
        400
      );
    }

    // ========================================================
    // DUPLICATE
    // ========================================================

    if (
      error?.code === 11000
    ) {
      return errorResponse(
        "Restaurant settings already exist. Please refresh and try again.",
        409
      );
    }

    return errorResponse(
      "Unable to update restaurant settings.",
      500
    );
  }
}