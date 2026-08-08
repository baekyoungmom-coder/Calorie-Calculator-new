"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const items = [
  { href: "/today", label: "기록", image: "/images/ui/clay-calendar.png" },
  { href: "/record", label: "새 기록", image: "/images/ui/clay-notepad.png" },
  { href: "/mypage", label: "마이페이지", image: "/images/ui/clay-login-profile.png" },
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
            <span className="bottom-nav-icon"><Image src={item.image} alt="" width={36} height={36} /></span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
