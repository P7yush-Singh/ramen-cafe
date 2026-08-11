import { Resend } from "resend";

import {
  connectDB,
} from "@/lib/mongodb";

import Otp from "@/models/Otp";

import {
  generateOtp,
  getOtpExpiry,
  hashValue,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth-server";

const resend =
  new Resend(
    process.env.RESEND_API_KEY
  );

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

    if (!isValidEmail(email)) {
      return Response.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    /*
     * Prevent OTP spam.
     *
     * One request every 30 seconds.
     */

    const existingOtp =
      await Otp.findOne({
        email,
        consumed: false,
        expiresAt: {
          $gt: new Date(),
        },
      }).sort({
        createdAt: -1,
      });

    if (existingOtp) {
      const secondsSinceLastSend =
        Math.floor(
          (Date.now() -
            new Date(
              existingOtp.lastSentAt
            ).getTime()) /
            1000
        );

      if (
        secondsSinceLastSend <
        30
      ) {
        return Response.json(
          {
            error: `Please wait ${
              30 -
              secondsSinceLastSend
            } seconds before requesting another code.`,
          },
          {
            status: 429,
          }
        );
      }

      /*
       * Invalidate previous OTP.
       */

      existingOtp.consumed =
        true;

      await existingOtp.save();
    }

    // =================================================
    // GENERATE OTP
    // =================================================

    const otp =
      generateOtp();

    const codeHash =
      hashValue(otp);

    await Otp.create({
      email,

      codeHash,

      expiresAt:
        getOtpExpiry(),

      attempts: 0,

      consumed: false,

      lastSentAt: new Date(),
    });

    // =================================================
    // SEND EMAIL
    // =================================================

    const { error } =
      await resend.emails.send({
        from:
          process.env
            .RESEND_FROM_EMAIL,

        to: [email],

        subject:
          "Your Ramen Cafe verification code",

        html: `
          <!DOCTYPE html>
          <html>
            <body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
              <div style="max-width:520px;margin:40px auto;padding:32px;background:#FFFDF8;border-radius:20px;">
                
                <div style="text-align:center;">
                  <div style="display:inline-flex;width:52px;height:52px;border-radius:50%;background:#B83A2E;color:#fff;align-items:center;justify-content:center;font-size:20px;">
                    麺
                  </div>

                  <h1 style="font-size:24px;margin:20px 0 8px;color:#171513;">
                    Ramen Cafe
                  </h1>

                  <p style="color:#6B6258;font-size:14px;">
                    Your verification code
                  </p>
                </div>

                <div style="margin:28px 0;padding:22px;text-align:center;background:#F5F0E8;border-radius:16px;">
                  <p style="margin:0 0 8px;color:#8A8177;font-size:12px;">
                    VERIFICATION CODE
                  </p>

                  <div style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#171513;">
                    ${otp}
                  </div>
                </div>

                <p style="font-size:13px;line-height:1.7;color:#6B6258;">
                  This code expires in 10 minutes.
                  If you did not request this code,
                  you can safely ignore this email.
                </p>

                <p style="margin-top:28px;text-align:center;font-size:11px;color:#8A8177;">
                  Ramen Cafe · ラーメンカフェ
                </p>

              </div>
            </body>
          </html>
        `,
      });

    if (error) {
      console.error(
        "Resend error:",
        error
      );

      return Response.json(
        {
          error:
            "Unable to send verification email.",
        },
        {
          status: 500,
        }
      );
    }

    return Response.json({
      success: true,

      message:
        "Verification code sent.",
    });
  } catch (error) {
    console.error(
      "Send OTP error:",
      error
    );

    return Response.json(
      {
        error:
          "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}