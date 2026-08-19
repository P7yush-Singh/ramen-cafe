import {
  connectDB,
} from "@/lib/mongodb";

import User from "@/models/User";
import Otp from "@/models/Otp";

import {
  createSession,
  hashValue,
  normalizeEmail,
} from "@/lib/auth-server";

// ============================================================
// ADMIN ROLES
// ============================================================

const ADMIN_ROLES = [
  "admin",
  "owner",
  "staff",
];

// ============================================================
// POST /api/auth/verify-otp
// ============================================================

export async function POST(
  request
) {
  try {
    // ========================================================
    // 1. READ REQUEST
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

    const email =
      normalizeEmail(
        body.email
      );

    const otp =
      String(
        body.otp || ""
      ).trim();

    // Important:
    // Admin login page sends this as true.
    const adminOnly =
      body.adminOnly === true;

    // ========================================================
    // 2. VALIDATION
    // ========================================================

    if (!email || !otp) {
      return Response.json(
        {
          success: false,
          error:
            "Email and OTP are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return Response.json(
        {
          success: false,
          error:
            "OTP must contain 6 digits.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 3. DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // 4. FIND ACTIVE OTP
    // ========================================================

    const otpRecord =
      await Otp.findOne({
        email,

        consumed: false,

        expiresAt: {
          $gt: new Date(),
        },
      }).sort({
        createdAt: -1,
      });

    if (!otpRecord) {
      return Response.json(
        {
          success: false,
          error:
            "OTP expired or not found. Please request a new code.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 5. MAXIMUM ATTEMPTS
    // ========================================================

    if (
      Number(
        otpRecord.attempts || 0
      ) >= 5
    ) {
      otpRecord.consumed =
        true;

      await otpRecord.save();

      return Response.json(
        {
          success: false,
          error:
            "Too many incorrect attempts. Please request a new code.",
        },
        {
          status: 429,
        }
      );
    }

    // ========================================================
    // 6. VERIFY OTP
    // ========================================================

    const incomingHash =
      hashValue(otp);

    if (
      incomingHash !==
      otpRecord.codeHash
    ) {
      otpRecord.attempts =
        Number(
          otpRecord.attempts || 0
        ) + 1;

      await otpRecord.save();

      return Response.json(
        {
          success: false,
          error:
            "Invalid verification code.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // 7. FIND EXISTING USER
    // ========================================================

    const user =
      await User.findOne({
        email,
      });

    // ========================================================
    // 8. ADMIN LOGIN AUTHORIZATION
    // ========================================================

    if (adminOnly) {
      // ------------------------------------------------------
      // Admin account must already exist.
      // We DO NOT create admin accounts here.
      // ------------------------------------------------------

      if (!user) {
        otpRecord.consumed =
          true;

        await otpRecord.save();

        return Response.json(
          {
            success: false,
            error:
              "No restaurant staff account exists for this email.",
          },
          {
            status: 403,
          }
        );
      }

      // ------------------------------------------------------
      // Check role
      // ------------------------------------------------------

      const role =
        String(
          user.role || ""
        )
          .trim()
          .toLowerCase();

      if (
        !ADMIN_ROLES.includes(
          role
        )
      ) {
        otpRecord.consumed =
          true;

        await otpRecord.save();

        return Response.json(
          {
            success: false,
            error:
              "This account does not have restaurant administration access.",
          },
          {
            status: 403,
          }
        );
      }

      // ------------------------------------------------------
      // Check active status
      // ------------------------------------------------------

      if (
        user.isActive ===
        false
      ) {
        otpRecord.consumed =
          true;

        await otpRecord.save();

        return Response.json(
          {
            success: false,
            error:
              "This staff account is inactive. Please contact the administrator.",
          },
          {
            status: 403,
          }
        );
      }
    }

    // ========================================================
    // 9. CONSUME OTP
    // ========================================================

    otpRecord.consumed =
      true;

    await otpRecord.save();

    // ========================================================
    // 10. NORMAL CUSTOMER LOGIN
    // ========================================================
    //
    // This keeps your existing customer OTP flow working.
    //
    // Admin login NEVER creates a user.
    //
    // Customer login can still create a customer account.
    // ========================================================

    let authenticatedUser =
      user;

    if (
      !authenticatedUser
    ) {
      authenticatedUser =
        await User.create({
          email,

          name: email
            .split("@")[0]
            .replace(
              /[._-]/g,
              " "
            ),

          role:
            "customer",

          isActive:
            true,

          lastLoginAt:
            new Date(),
        });
    } else {
      authenticatedUser.lastLoginAt =
        new Date();

      await authenticatedUser.save();
    }

    // ========================================================
    // 11. CREATE SESSION
    // ========================================================

    await createSession(
      authenticatedUser._id
    );

    // ========================================================
    // 12. RESPONSE
    // ========================================================

    return Response.json({
      success: true,

      user: {
        id:
          authenticatedUser._id.toString(),

        name:
          authenticatedUser.name,

        email:
          authenticatedUser.email,

        phone:
          authenticatedUser.phone,

        role:
          authenticatedUser.role,
      },
    });
  } catch (error) {
    console.error(
      "Verify OTP error:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to verify OTP.",
      },
      {
        status: 500,
      }
    );
  }
}