"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import AdminBottomNav from "@/components/admin/AdminBottomNav";

const metadata = {
  title: "Ramen Cafe - Admin",
}

const SIDEBAR_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Tables",
    href: "/admin/tables",
    icon: Store,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}) {
  const pathname =
    usePathname();

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  // ==========================================================
  // CLOSE MOBILE MENU ON ROUTE CHANGE
  // ==========================================================

  useEffect(() => {
    setMobileMenuOpen(
      false
    );
  }, [pathname]);

  // ==========================================================
  // ACTIVE ROUTE
  // ==========================================================

  function isActive(href) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  async function handleLogout() {
    try {
      /*
       * We are keeping this intentionally
       * compatible with your existing auth
       * architecture.
       *
       * When your logout API is finalized,
       * only this function needs to change.
       */

      const response =
        await fetch(
          "/api/auth/logout",
          {
            method: "POST",
            credentials:
              "include",
          }
        );

      if (
        response.ok
      ) {
        window.location.href =
          "/login";
        return;
      }

      /*
       * Fallback:
       *
       * If logout API does not exist yet,
       * don't break the admin interface.
       */

      window.location.href =
        "/login";
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      window.location.href =
        "/login";
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#171513]">
      {/* ======================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[250px] border-r border-[#DED6C9] bg-[#FFFDF8] lg:flex lg:flex-col">
        {/* BRAND */}

        <div className="flex h-20 items-center border-b border-[#E8E1D6] px-6">
          <Link
            href="/admin"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#171513] text-white">
              <span className="text-lg">
                🍜
              </span>
            </div>

            <div>
              <p className="text-sm font-bold tracking-[0.08em]">
                RAMEN CAFE
              </p>

              <p className="mt-0.5 text-[9px] font-semibold tracking-[0.2em] text-[#B83A2E]">
                ADMIN PANEL
              </p>
            </div>
          </Link>
        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9B9186]">
            Management
          </p>

          <div className="space-y-1">
            {SIDEBAR_ITEMS.map(
              ({
                label,
                href,
                icon: Icon,
              }) => {
                const active =
                  isActive(
                    href
                  );

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition ${
                      active
                        ? "bg-[#171513] text-white"
                        : "text-[#655D54] hover:bg-[#F5F0E8] hover:text-[#171513]"
                    }`}
                  >
                    <Icon
                      size={17}
                      strokeWidth={
                        active
                          ? 2.3
                          : 1.8
                      }
                    />

                    <span className="flex-1 text-xs font-semibold">
                      {label}
                    </span>

                    {active && (
                      <ChevronRight
                        size={14}
                        className="opacity-60"
                      />
                    )}
                  </Link>
                );
              }
            )}
          </div>
        </nav>

        {/* USER / LOGOUT */}

        <div className="border-t border-[#E8E1D6] p-3">
          <div className="mb-2 rounded-2xl bg-[#F5F0E8] p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8A8177]">
              Restaurant
            </p>

            <p className="mt-1 text-xs font-semibold">
              Admin Workspace
            </p>
          </div>

          <button
            onClick={
              handleLogout
            }
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold text-[#655D54] transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut
              size={17}
            />

            Logout
          </button>
        </div>
      </aside>

      {/* ======================================================
          MOBILE HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-[#DED6C9] bg-[#FFFDF8]/95 px-4 backdrop-blur-xl lg:hidden">
        <Link
          href="/admin"
          className="flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#171513] text-sm">
            🍜
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.08em]">
              RAMEN CAFE
            </p>

            <p className="text-[8px] font-semibold tracking-[0.16em] text-[#B83A2E]">
              ADMIN
            </p>
          </div>
        </Link>

        <button
          onClick={() =>
            setMobileMenuOpen(
              true
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DED6C9] bg-[#FFFDF8]"
          aria-label="Open admin menu"
        >
          <Menu
            size={18}
          />
        </button>
      </header>

      {/* ======================================================
          MOBILE DRAWER
      ====================================================== */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          {/* BACKDROP */}

          <button
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close menu"
          />

          {/* DRAWER */}

          <aside className="absolute right-0 top-0 flex h-full w-[290px] flex-col bg-[#FFFDF8] shadow-2xl">
            <div className="flex h-20 items-center justify-between border-b border-[#E8E1D6] px-5">
              <div>
                <p className="text-sm font-bold tracking-[0.08em]">
                  ADMIN MENU
                </p>

                <p className="mt-1 text-[9px] tracking-[0.15em] text-[#B83A2E]">
                  RAMEN CAFE
                </p>
              </div>

              <button
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DED6C9]"
              >
                <X
                  size={17}
                />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              <p className="px-3 pb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9B9186]">
                Management
              </p>

              <div className="space-y-1">
                {SIDEBAR_ITEMS.map(
                  ({
                    label,
                    href,
                    icon: Icon,
                  }) => {
                    const active =
                      isActive(
                        href
                      );

                    return (
                      <Link
                        key={href}
                        href={
                          href
                        }
                        className={`flex items-center gap-3 rounded-xl px-3 py-3.5 ${
                          active
                            ? "bg-[#171513] text-white"
                            : "text-[#655D54]"
                        }`}
                      >
                        <Icon
                          size={18}
                        />

                        <span className="text-xs font-semibold">
                          {
                            label
                          }
                        </span>
                      </Link>
                    );
                  }
                )}
              </div>
            </nav>

            <div className="border-t border-[#E8E1D6] p-4">
              <button
                onClick={
                  handleLogout
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-3 text-xs font-semibold text-red-600"
              >
                <LogOut
                  size={16}
                />

                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="lg:pl-[250px]">
        <div className="min-h-screen pb-[86px] lg:pb-0">
          {children}
        </div>
      </div>

      {/* ======================================================
          MOBILE BOTTOM NAV
      ====================================================== */}

      <AdminBottomNav />
    </div>
  );
}