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

export async function POST(
  request
) {
  try {
    const body =
      await request.json();

    const email =
      normalizeEmail(
        body.email
      );

    const otp =
      String(
        body.otp || ""
      ).trim();

    if (!email || !otp) {
      return Response.json(
        {
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
          error:
            "OTP must contain 6 digits.",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

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
          error:
            "OTP expired or not found. Please request a new code.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Maximum 5 attempts.
     */

    if (
      otpRecord.attempts >=
      5
    ) {
      otpRecord.consumed =
        true;

      await otpRecord.save();

      return Response.json(
        {
          error:
            "Too many incorrect attempts. Please request a new code.",
        },
        {
          status: 429,
        }
      );
    }

    const incomingHash =
      hashValue(otp);

    if (
      incomingHash !==
      otpRecord.codeHash
    ) {
      otpRecord.attempts += 1;

      await otpRecord.save();

      return Response.json(
        {
          error:
            "Invalid verification code.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // OTP VALID
    // =================================================

    otpRecord.consumed =
      true;

    await otpRecord.save();

    // =================================================
    // FIND OR CREATE USER
    // =================================================

    let user =
      await User.findOne({
        email,
      });

    if (!user) {
      user = await User.create({
        email,

        name: email
          .split("@")[0]
          .replace(
            /[._-]/g,
            " "
          ),

        role: "customer",

        isActive: true,

        lastLoginAt:
          new Date(),
      });
    } else {
      user.lastLoginAt =
        new Date();

      await user.save();
    }

    // =================================================
    // CREATE SESSION
    // =================================================

    await createSession(
      user._id
    );

    return Response.json({
      success: true,

      user: {
        id: user._id.toString(),

        name: user.name,

        email: user.email,

        phone: user.phone,

        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Verify OTP error:",
      error
    );

    return Response.json(
      {
        error:
          "Unable to verify OTP.",
      },
      {
        status: 500,
      }
    );
  }
}