// admin Component
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BarChart3,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  ShoppingBag,
  Store,
} from "lucide-react";

const NAV_ITEMS = [
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
    label: "Menu",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Tables",
    href: "/admin/tables",
    icon: Store,
  },
];

export default function AdminBottomNav() {
  const pathname =
    usePathname();

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

  return (
    <>
      {/* =====================================================
          MOBILE / TABLET BOTTOM NAV
      ====================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#DED6C9] bg-[#FFFDF8]/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-[68px] max-w-xl items-center justify-around">
          {NAV_ITEMS.map(
            ({
              label,
              href,
              icon: Icon,
            }) => {
              const active =
                isActive(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 transition ${
                    active
                      ? "text-[#B83A2E]"
                      : "text-[#81786D]"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                      active
                        ? "bg-[#F5E3DE]"
                        : ""
                    }`}
                  >
                    <Icon
                      size={19}
                      strokeWidth={
                        active
                          ? 2.4
                          : 1.8
                      }
                    />
                  </span>

                  <span
                    className={`text-[9px] font-semibold ${
                      active
                        ? "text-[#B83A2E]"
                        : "text-[#81786D]"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            }
          )}

          {/* MORE */}

          <Link
            href="/admin/more"
            className={`flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 ${
              pathname.startsWith(
                "/admin/more"
              )
                ? "text-[#B83A2E]"
                : "text-[#81786D]"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                pathname.startsWith(
                  "/admin/more"
                )
                  ? "bg-[#F5E3DE]"
                  : ""
              }`}
            >
              <MoreHorizontal
                size={19}
              />
            </span>

            <span className="text-[9px] font-semibold">
              More
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}