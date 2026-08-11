"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
} from "lucide-react";

export default function VerifyPage() {
  const [email, setEmail] =
    useState("");

  const [redirect, setRedirect] =
    useState("/");

  const [otp, setOtp] =
    useState([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

  const [error, setError] =
    useState("");

  const [isVerifying, setIsVerifying] =
    useState(false);

  const [isResending, setIsResending] =
    useState(false);

  const [resendTimer, setResendTimer] =
    useState(30);

  const inputRefs =
    useRef([]);

  // =====================================================
  // INITIALIZE
  // =====================================================

  useEffect(() => {
    const storedEmail =
      sessionStorage.getItem(
        "ramen-auth-email"
      );

    const storedRedirect =
      sessionStorage.getItem(
        "ramen-auth-redirect"
      );

    const params =
      new URLSearchParams(
        window.location.search
      );

    const urlRedirect =
      params.get("redirect");

    if (storedEmail) {
      setEmail(
        storedEmail
      );
    }

    setRedirect(
      storedRedirect ||
        urlRedirect ||
        "/"
    );
  }, []);

  // =====================================================
  // RESEND TIMER
  // =====================================================

  useEffect(() => {
    if (resendTimer <= 0) {
      return;
    }

    const timer =
      setInterval(() => {
        setResendTimer(
          (previous) =>
            previous - 1
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [resendTimer]);

  // =====================================================
  // OTP CHANGE
  // =====================================================

  function handleOtpChange(
    index,
    value
  ) {
    const cleanValue =
      value.replace(
        /\D/g,
        ""
      );

    // -----------------------------------------------
    // CLEAR INPUT
    // -----------------------------------------------

    if (!cleanValue) {
      const updated = [
        ...otp,
      ];

      updated[index] = "";

      setOtp(updated);

      return;
    }

    // -----------------------------------------------
    // SET DIGIT
    // -----------------------------------------------

    const updated = [
      ...otp,
    ];

    updated[index] =
      cleanValue.slice(-1);

    setOtp(updated);

    // -----------------------------------------------
    // MOVE NEXT
    // -----------------------------------------------

    if (
      index <
      otp.length - 1
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  }

  // =====================================================
  // KEYBOARD
  // =====================================================

  function handleKeyDown(
    index,
    event
  ) {
    if (
      event.key ===
        "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }
  }

  // =====================================================
  // PASTE OTP
  // =====================================================

  function handlePaste(
    event
  ) {
    event.preventDefault();

    const pasted =
      event.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);

    if (!pasted) {
      return;
    }

    const updated = [
      "",
      "",
      "",
      "",
      "",
      "",
    ];

    pasted
      .split("")
      .forEach(
        (digit, index) => {
          updated[index] =
            digit;
        }
      );

    setOtp(updated);

    const focusIndex =
      Math.min(
        pasted.length,
        5
      );

    inputRefs.current[
      focusIndex
    ]?.focus();
  }

  // =====================================================
  // VERIFY OTP
  // =====================================================

  async function handleVerify(
    event
  ) {
    event.preventDefault();

    setError("");

    const code =
      otp.join("");

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (code.length !== 6) {
      setError(
        "Please enter the complete 6-digit code."
      );

      return;
    }

    if (!email) {
      setError(
        "Your login session has expired. Please login again."
      );

      return;
    }

    setIsVerifying(true);

    try {
      // ---------------------------------------------
      // REAL VERIFY API
      // ---------------------------------------------

      const response =
        await fetch(
          "/api/auth/verify-otp",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body: JSON.stringify({
              email,
              otp: code,
            }),
          }
        );

      const data =
        await response.json();

      // ---------------------------------------------
      // API ERROR
      // ---------------------------------------------

      if (!response.ok) {
        setError(
          data.error ||
            "Invalid verification code."
        );

        setIsVerifying(
          false
        );

        return;
      }

      // ---------------------------------------------
      // SUCCESS
      // ---------------------------------------------

      sessionStorage.removeItem(
        "ramen-auth-email"
      );

      sessionStorage.removeItem(
        "ramen-auth-redirect"
      );

      /*
       * The server has created the
       * HTTP-only authentication cookie.
       *
       * Now return to the original page.
       *
       * Example:
       *
       * /checkout?table=T03
       */

      window.location.href =
        redirect || "/";
    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      setError(
        "Unable to connect to the server. Please try again."
      );

      setIsVerifying(
        false
      );
    }
  }

  // =====================================================
  // RESEND OTP
  // =====================================================

  async function handleResend() {
    if (
      resendTimer > 0 ||
      isResending
    ) {
      return;
    }

    if (!email) {
      setError(
        "Your login session has expired. Please login again."
      );

      return;
    }

    setError("");

    setIsResending(true);

    try {
      const response =
        await fetch(
          "/api/auth/send-otp",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to resend verification code."
        );

        setIsResending(
          false
        );

        return;
      }

      // Clear previous OTP

      setOtp([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      // Focus first field

      inputRefs.current[
        0
      ]?.focus();

      // Restart timer

      setResendTimer(
        30
      );
    } catch (error) {
      console.error(
        "Resend OTP error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setIsResending(
        false
      );
    }
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-[#F5F0E8]">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-[#E5DED2]">

        <div className="mx-auto flex h-20 max-w-[1100px] items-center justify-between px-4 sm:px-8">

          <Link
            href={`/login?redirect=${encodeURIComponent(
              redirect
            )}`}
            className="flex items-center gap-2 text-sm font-medium text-[#6B6258] transition hover:text-[#171513]"
          >
            <ArrowLeft
              size={17}
            />

            Back
          </Link>

          <div className="text-center">

            <p className="text-sm font-semibold tracking-[0.15em]">
              RAMEN CAFE
            </p>

            <p className="text-[8px] tracking-[0.18em] text-[#6B6258]">
              ラーメンカフェ
            </p>

          </div>

          <div className="w-12" />

        </div>

      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">

        <div className="w-full max-w-[430px]">

          {/* =================================================
              ICON
          ================================================= */}

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#B83A2E] text-white">
            <Mail
              size={22}
            />
          </div>

          {/* =================================================
              TITLE
          ================================================= */}

          <div className="mt-6 text-center">

            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
              Verification
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Check your email
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#6B6258]">
              We sent a 6-digit
              verification code to
            </p>

            <p className="mt-1 break-all text-sm font-semibold">
              {email ||
                "your email address"}
            </p>

          </div>

          {/* =================================================
              CARD
          ================================================= */}

          <div className="mt-8 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 shadow-sm sm:p-7">

            <form
              onSubmit={
                handleVerify
              }
            >

              {/* =================================================
                  OTP INPUTS
              ================================================= */}

              <div
                className="flex justify-center gap-2 sm:gap-3"
                onPaste={
                  handlePaste
                }
              >

                {otp.map(
                  (
                    digit,
                    index
                  ) => (
                    <input
                      key={
                        index
                      }
                      ref={(
                        element
                      ) => {
                        inputRefs.current[
                          index
                        ] =
                          element;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={
                        index === 0
                          ? "one-time-code"
                          : "off"
                      }
                      maxLength={1}
                      value={
                        digit
                      }
                      onChange={(
                        event
                      ) =>
                        handleOtpChange(
                          index,
                          event
                            .target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) =>
                        handleKeyDown(
                          index,
                          event
                        )
                      }
                      disabled={
                        isVerifying
                      }
                      className="h-12 w-10 rounded-xl border border-[#DED6C9] bg-[#FFFDF8] text-center text-lg font-semibold outline-none transition focus:border-[#171513] disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:w-12"
                    />
                  )
                )}

              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <p className="mt-4 text-center text-xs font-medium text-[#B83A2E]">
                  {error}
                </p>
              )}

              {/* =================================================
                  VERIFY BUTTON
              ================================================= */}

              <button
                type="submit"
                disabled={
                  isVerifying
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#171513] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#B83A2E] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {isVerifying
                  ? "Verifying..."
                  : "Verify & Continue"}

                {!isVerifying && (
                  <ArrowRight
                    size={16}
                  />
                )}

              </button>

            </form>

            {/* =================================================
                RESEND
            ================================================= */}

            <div className="mt-5 text-center">

              {isResending ? (
                <p className="text-xs text-[#8A8177]">
                  Sending new code...
                </p>
              ) : resendTimer >
                0 ? (
                <p className="text-xs text-[#8A8177]">

                  Resend code in{" "}

                  <span className="font-semibold text-[#171513]">
                    {resendTimer}s
                  </span>

                </p>
              ) : (
                <button
                  type="button"
                  onClick={
                    handleResend
                  }
                  className="text-xs font-semibold text-[#B83A2E] transition hover:text-[#171513]"
                >
                  Resend code
                </button>
              )}

            </div>

          </div>

          {/* =================================================
              SECURITY MESSAGE
          ================================================= */}

          <p className="mx-auto mt-5 max-w-sm text-center text-[10px] leading-5 text-[#8A8177]">
            Your verification code is
            temporary and can only be used
            once. If you did not request a
            code, you can safely ignore this
            message.
          </p>

        </div>

      </div>

    </main>
  );
}