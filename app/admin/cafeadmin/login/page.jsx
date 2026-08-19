"use client";

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

export default function CafeAdminLoginPage() {
  const [step, setStep] =
    useState("email");

  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [resendSeconds, setResendSeconds] =
    useState(0);

  const inputRefs =
    useRef([]);

  // ============================================================
  // RESEND TIMER
  // ============================================================

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer =
      setInterval(() => {
        setResendSeconds(
          (current) =>
            Math.max(
              0,
              current - 1
            )
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [resendSeconds]);

  // ============================================================
  // NORMALIZE EMAIL
  // ============================================================

  function normalizeEmail(
    value
  ) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  // ============================================================
  // SEND OTP
  // ============================================================

  async function handleSendOtp(
    event
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail =
      normalizeEmail(email);

    if (!cleanEmail) {
      setError(
        "Please enter your email address."
      );

      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      setError(
        "Please enter a valid email address."
      );

      return;
    }

    setLoading(true);

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

            credentials: "include",

            body: JSON.stringify({
              email: cleanEmail,
            }),
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to send verification code."
        );
      }

      setEmail(cleanEmail);

      setOtp([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      setStep("otp");

      setResendSeconds(30);

      setMessage(
        "Verification code sent to your email."
      );

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (error) {
      setError(
        error?.message ||
          "Unable to send verification code."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // OTP INPUT
  // ============================================================

  function handleOtpChange(
    index,
    value
  ) {
    const digit =
      String(value || "")
        .replace(/\D/g, "")
        .slice(-1);

    const next = [
      ...otp,
    ];

    next[index] = digit;

    setOtp(next);

    if (
      digit &&
      index < 5
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  }

  // ============================================================
  // OTP KEYBOARD
  // ============================================================

  function handleOtpKeyDown(
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

    if (
      event.key === "ArrowLeft" &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < 5
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  }

  // ============================================================
  // OTP PASTE
  // ============================================================

  function handleOtpPaste(
    event
  ) {
    event.preventDefault();

    const pasted =
      event.clipboardData
        ?.getData("text")
        ?.replace(/\D/g, "")
        ?.slice(0, 6) || "";

    if (!pasted) {
      return;
    }

    const next = [
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
          next[index] = digit;
        }
      );

    setOtp(next);

    const focusIndex =
      Math.min(
        pasted.length,
        5
      );

    inputRefs.current[
      focusIndex
    ]?.focus();
  }

  // ============================================================
  // VERIFY OTP
  // ============================================================

  async function handleVerifyOtp(
    event
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const code =
      otp.join("");

    if (code.length !== 6) {
      setError(
        "Please enter the complete 6-digit verification code."
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/auth/verify-otp",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              email,
              otp: code,

              // Important:
              // tells server this is an
              // admin-panel login.
              adminOnly: true,
            }),
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to verify the code."
        );
      }

      if (
        !data.user ||
        ![
          "admin",
          "owner",
          "staff",
        ].includes(
          String(
            data.user.role || ""
          ).toLowerCase()
        )
      ) {
        throw new Error(
          "Your account does not have restaurant administration access."
        );
      }

      window.location.href =
        "/admin";
    } catch (error) {
      setError(
        error?.message ||
          "Unable to verify the code."
      );

      setLoading(false);
    }
  }

  // ============================================================
  // RESEND
  // ============================================================

  async function handleResend() {
    if (
      resendSeconds > 0 ||
      loading
    ) {
      return;
    }

    setError("");
    setMessage("");

    setLoading(true);

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

            credentials: "include",

            body: JSON.stringify({
              email,
            }),
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to resend the code."
        );
      }

      setOtp([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      setResendSeconds(30);

      setMessage(
        "A new verification code has been sent."
      );

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (error) {
      setError(
        error?.message ||
          "Unable to resend the code."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // CHANGE EMAIL
  // ============================================================

  function changeEmail() {
    if (loading) {
      return;
    }

    setStep("email");

    setOtp([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    setError("");
    setMessage("");
  }

  // ============================================================
  // EMAIL SCREEN
  // ============================================================

  if (step === "email") {
    return (
      <main className="min-h-screen bg-[#F5F0E8] px-4 py-8">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B83A2E] text-xl font-semibold text-white shadow-sm">
                麺
              </div>

              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B83A2E]">
                Ramen Cafe
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171513]">
                Staff Portal
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#6B6258]">
                Sign in to manage restaurant
                operations.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#E5DED2] bg-[#FFFDF8] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] sm:p-8">
              <div className="mb-7 flex items-start gap-3 rounded-2xl bg-[#F5F0E8] p-4">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-[#B83A2E]"
                />

                <div>
                  <p className="text-sm font-semibold text-[#171513]">
                    Secure staff login
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#6B6258]">
                    We will send a one-time
                    verification code to your
                    registered email.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="mb-5 flex items-start gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-xs leading-5 text-green-700">
                  <CheckCircle2
                    size={15}
                    className="mt-0.5 shrink-0"
                  />

                  <span>
                    {message}
                  </span>
                </div>
              )}

              <form
                onSubmit={
                  handleSendOtp
                }
              >
                <label className="text-xs font-semibold text-[#171513]">
                  Staff email
                </label>

                <div className="relative mt-2">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9B9186]"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="admin@ramencafe.com"
                    autoComplete="email"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-[#DED6C9] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#B7AEA3] focus:border-[#B83A2E] focus:ring-2 focus:ring-[#B83A2E]/10 disabled:opacity-60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#171513] text-sm font-semibold text-white transition hover:bg-[#2A2724] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight
                        size={17}
                      />
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-[11px] leading-5 text-[#9B9186]">
              Restaurant staff access only.
              <br />
              Customers should use the regular
              customer login.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // OTP SCREEN
  // ============================================================

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-8">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B83A2E] text-xl font-semibold text-white shadow-sm">
              <LockKeyhole
                size={22}
              />
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B83A2E]">
              Verification
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171513]">
              Enter your code
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6B6258]">
              We sent a 6-digit verification
              code to
              <br />

              <strong className="font-semibold text-[#171513]">
                {email}
              </strong>
            </p>
          </div>

          <div className="rounded-[28px] border border-[#E5DED2] bg-[#FFFDF8] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] sm:p-8">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-5 flex items-start gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-xs leading-5 text-green-700">
                <CheckCircle2
                  size={15}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {message}
                </span>
              </div>
            )}

            <form
              onSubmit={
                handleVerifyOtp
              }
            >
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map(
                  (
                    digit,
                    index
                  ) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputRefs.current[
                          index
                        ] =
                          element;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      disabled={loading}
                      onChange={(event) =>
                        handleOtpChange(
                          index,
                          event.target.value
                        )
                      }
                      onKeyDown={(event) =>
                        handleOtpKeyDown(
                          index,
                          event
                        )
                      }
                      onPaste={
                        index === 0
                          ? handleOtpPaste
                          : undefined
                      }
                      className="h-12 w-11 rounded-xl border border-[#DED6C9] bg-white text-center text-xl font-semibold text-[#171513] outline-none transition focus:border-[#B83A2E] focus:ring-2 focus:ring-[#B83A2E]/10 sm:h-14 sm:w-12"
                      aria-label={`Verification digit ${
                        index + 1
                      }`}
                    />
                  )
                )}
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  otp.join("")
                    .length !== 6
                }
                className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#171513] text-sm font-semibold text-white transition hover:bg-[#2A2724] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight
                      size={17}
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-[#E8E1D6] pt-5 text-center">
              <p className="text-xs text-[#6B6258]">
                Didn't receive the code?
              </p>

              <button
                type="button"
                onClick={
                  handleResend
                }
                disabled={
                  resendSeconds > 0 ||
                  loading
                }
                className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#B83A2E] disabled:cursor-not-allowed disabled:text-[#9B9186]"
              >
                <RefreshCw
                  size={13}
                />

                {resendSeconds > 0
                  ? `Resend in ${resendSeconds}s`
                  : "Resend code"}
              </button>
            </div>

            <button
              type="button"
              onClick={
                changeEmail
              }
              disabled={loading}
              className="mt-5 block w-full text-center text-xs font-medium text-[#6B6258] underline underline-offset-4 disabled:opacity-50"
            >
              Use a different email
            </button>
          </div>

          <p className="mt-6 text-center text-[11px] leading-5 text-[#9B9186]">
            Ramen Cafe · Restaurant Administration
          </p>
        </div>
      </div>
    </main>
  );
}