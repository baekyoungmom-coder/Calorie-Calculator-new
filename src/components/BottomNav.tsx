"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/today", label: "기록", icon: "▤" },
  { href: "/record", label: "새 기록", icon: "＋" },
  { href: "/mypage", label: "마이페이지", icon: "♙" },
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
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
