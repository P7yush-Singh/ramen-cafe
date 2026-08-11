"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import {
  isAuthenticated,
} from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] =
    useState("");

  const [redirect, setRedirect] =
    useState("/");

  const [isSending, setIsSending] =
    useState(false);

  const [isCheckingAuth, setIsCheckingAuth] =
    useState(true);

  const [error, setError] =
    useState("");

  // ===================================================
  // INITIALIZE LOGIN PAGE
  // ===================================================

  useEffect(() => {
    async function initializeLogin() {
      try {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const redirectUrl =
          params.get("redirect");

        /*
         * Preserve the complete redirect URL.
         *
         * Example:
         *
         * /checkout?table=T04
         *
         * becomes:
         *
         * /login?redirect=%2Fcheckout%3Ftable%3DT04
         */

        const safeRedirect =
          redirectUrl || "/";

        setRedirect(
          safeRedirect
        );

        // ------------------------------------------------
        // CHECK REAL SERVER SESSION
        // ------------------------------------------------

        /*
         * IMPORTANT:
         *
         * isAuthenticated() is async.
         *
         * We MUST await it.
         */

        const authenticated =
          await isAuthenticated();

        if (authenticated) {
          window.location.replace(
            safeRedirect
          );

          return;
        }
      } catch (error) {
        console.error(
          "Login initialization error:",
          error
        );
      } finally {
        setIsCheckingAuth(false);
      }
    }

    initializeLogin();
  }, []);

  // ===================================================
  // SEND OTP
  // ===================================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError("");

    const cleanEmail =
      email.trim().toLowerCase();

    // ------------------------------------------------
    // EMAIL VALIDATION
    // ------------------------------------------------

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

    setIsSending(true);

    try {
      // ------------------------------------------------
      // SEND OTP
      // ------------------------------------------------

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
              email:
                cleanEmail,
            }),
          }
        );

      const data =
        await response.json();

      // ------------------------------------------------
      // API ERROR
      // ------------------------------------------------

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to send verification code."
        );

        setIsSending(false);

        return;
      }

      // ------------------------------------------------
      // SAVE LOGIN STATE FOR VERIFY PAGE
      // ------------------------------------------------

      sessionStorage.setItem(
        "ramen-auth-email",
        cleanEmail
      );

      sessionStorage.setItem(
        "ramen-auth-redirect",
        redirect
      );

      // ------------------------------------------------
      // MOVE TO VERIFY
      // ------------------------------------------------

      const verifyUrl =
        `/verify?redirect=${encodeURIComponent(
          redirect
        )}`;

      window.location.replace(
        verifyUrl
      );
    } catch (error) {
      console.error(
        "Send OTP error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );

      setIsSending(false);
    }
  }

  // ===================================================
  // AUTH CHECK LOADING
  // ===================================================

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F0E8] px-4">

        <div className="text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#B83A2E] text-lg text-white">
            麺
          </div>

          <p className="mt-4 text-sm text-[#6B6258]">
            Checking your session...
          </p>

        </div>

      </main>
    );
  }

  // ===================================================
  // LOGIN UI
  // ===================================================

  return (
    <main className="min-h-screen bg-[#F5F0E8]">

      {/* ================================================
          HEADER
      ================================================= */}

      <header className="border-b border-[#E5DED2]">

        <div className="mx-auto flex h-20 max-w-[1100px] items-center justify-between px-4 sm:px-8">

          {/* BACK */}

          <Link
            href={redirect || "/"}
            className="flex items-center gap-2 text-sm font-medium text-[#6B6258] transition hover:text-[#171513]"
          >
            <ArrowLeft
              size={17}
            />

            Back
          </Link>

          {/* LOGO */}

          <Link
            href="/"
            className="text-center"
          >
            <p className="text-sm font-semibold tracking-[0.15em]">
              RAMEN CAFE
            </p>

            <p className="text-[8px] tracking-[0.18em] text-[#6B6258]">
              ラーメンカフェ
            </p>
          </Link>

          <div className="w-12" />

        </div>

      </header>

      {/* ================================================
          LOGIN
      ================================================= */}

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">

        <div className="w-full max-w-[430px]">

          {/* BRAND MARK */}

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#B83A2E] text-xl text-white shadow-sm">
            麺
          </div>

          {/* TITLE */}

          <div className="mt-6 text-center">

            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B83A2E]">
              Welcome
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Login to continue
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#6B6258]">
              Enter your email and we'll send
              you a one-time verification code.
            </p>

          </div>

          {/* LOGIN CARD */}

          <div className="mt-8 rounded-3xl border border-[#E5DED2] bg-[#FFFDF8] p-5 shadow-sm sm:p-7">

            <form
              onSubmit={
                handleSubmit
              }
            >

              {/* EMAIL */}

              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold"
              >
                Email address
              </label>

              <div className="relative">

                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8177]"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="you@example.com"
                  disabled={isSending}
                  className="w-full rounded-2xl border border-[#DED6C9] bg-[#FFFDF8] py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#9A9186] focus:border-[#171513] disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

              {/* ERROR */}

              {error && (
                <p className="mt-2 text-xs font-medium text-[#B83A2E]">
                  {error}
                </p>
              )}

              {/* BUTTON */}

              <button
                type="submit"
                disabled={isSending}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#171513] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#B83A2E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending
                  ? "Sending code..."
                  : "Continue with Email"}

                {!isSending && (
                  <ArrowRight
                    size={16}
                  />
                )}

              </button>

            </form>

            {/* SECURITY */}

            <div className="mt-5 flex gap-3 rounded-2xl bg-[#F5F0E8] p-3.5">

              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-[#6B6258]"
              />

              <p className="text-[10px] leading-5 text-[#6B6258]">
                Your email is used to securely
                verify your account and send your
                order updates and bill.
              </p>

            </div>

          </div>

          {/* CONTINUE SHOPPING */}

          <p className="mt-6 text-center text-xs text-[#8A8177]">

            Just browsing?

            <Link
              href={
                redirect !== "/"
                  ? redirect
                  : "/menu"
              }
              className="ml-1 font-medium text-[#171513] underline underline-offset-4"
            >
              Continue to menu
            </Link>

          </p>

        </div>

      </div>

    </main>
  );
}