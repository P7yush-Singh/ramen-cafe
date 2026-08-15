"use client";

import Link from "next/link";
import {
  Home,
  Utensils,
  ShoppingBag,
  ReceiptText,
} from "lucide-react";
import { usePathname } from "next/navigation";

const navigation = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Menu",
    href: "/menu",
    icon: Utensils,
  },
  {
    label: "Cart",
    href: "/cart",
    icon: ShoppingBag,
  },
  {
    label: "Bill",
    href: "/bill",
    icon: ReceiptText,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#DED6C9] bg-[#FFFDF8]/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl md:block lg:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-around">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] transition ${
                active
                  ? "text-[#B83A2E]"
                  : "text-[#6B6258] hover:text-[#171513]"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.4 : 1.8}
              />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}