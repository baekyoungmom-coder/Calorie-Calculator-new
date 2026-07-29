"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon } from "./AppIcon";

const items = [
  { href: "/today", label: "기록", icon: "clipboard" as const },
  { href: "/record", label: "새 기록", icon: "plus" as const },
  { href: "/mypage", label: "마이페이지", icon: "user" as const },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href === "/record" && pathname.startsWith("/record"));

        return (
          <Link
            className={isActive ? "active" : undefined}
            href={item.href}
            key={item.href}
          >
            <span className="bottom-nav-icon"><AppIcon name={item.icon} size={21} /></span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
