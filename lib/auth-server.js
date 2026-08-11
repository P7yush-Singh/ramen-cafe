import crypto from "crypto";

import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Session from "@/models/Session";

// =====================================================
// CONSTANTS
// =====================================================

const SESSION_COOKIE =
  "ramen_session";

const SESSION_DURATION =
  7 * 24 * 60 * 60 * 1000;

const OTP_DURATION =
  10 * 60 * 1000;

// =====================================================
// HASH
// =====================================================

export function hashValue(value) {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
}

// =====================================================
// GENERATE RANDOM OTP
// =====================================================

export function generateOtp() {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
}

// =====================================================
// GENERATE SESSION TOKEN
// =====================================================

export function generateSessionToken() {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

// =====================================================
// NORMALIZE EMAIL
// =====================================================

export function normalizeEmail(
  email
) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

// =====================================================
// VALIDATE EMAIL
// =====================================================

export function isValidEmail(
  email
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

// =====================================================
// CREATE SESSION
// =====================================================

export async function createSession(
  userId
) {
  await connectDB();

  const token =
    generateSessionToken();

  const tokenHash =
    hashValue(token);

  const expiresAt =
    new Date(
      Date.now() +
        SESSION_DURATION
    );

  await Session.create({
    tokenHash,
    userId,
    expiresAt,
  });

  const cookieStore =
    await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    token,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      expires: expiresAt,
    }
  );

  return token;
}

// =====================================================
// GET CURRENT USER
// =====================================================

export async function getServerUser() {
  try {
    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        SESSION_COOKIE
      )?.value;

    if (!token) {
      return null;
    }

    const tokenHash =
      hashValue(token);

    await connectDB();

    const session =
      await Session.findOne({
        tokenHash,
        expiresAt: {
          $gt: new Date(),
        },
      }).populate("userId");

    if (!session) {
      return null;
    }

    if (
      !session.userId ||
      !session.userId.isActive
    ) {
      return null;
    }

    return session.userId;
  } catch (error) {
    console.error(
      "getServerUser error:",
      error
    );

    return null;
  }
}

// =====================================================
// DELETE SESSION
// =====================================================

export async function deleteSession() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE
    )?.value;

  if (token) {
    await connectDB();

    await Session.deleteOne({
      tokenHash:
        hashValue(token),
    });
  }

  cookieStore.set(
    SESSION_COOKIE,
    "",
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      expires: new Date(0),
    }
  );
}

// =====================================================
// OTP EXPIRY
// =====================================================

export function getOtpExpiry() {
  return new Date(
    Date.now() +
      OTP_DURATION
  );
}