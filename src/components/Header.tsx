import Link from "next/link";
import { AppIcon } from "./AppIcon";

export function Header({
  title,
  backHref = "/",
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <header className="topbar">
      <Link className="back-link" href={backHref} aria-label="이전 화면">
        <AppIcon name="arrow-left" />
      </Link>
      <strong>{title}</strong>
      <Link className="home-link" href="/today" aria-label="오늘 기록">
        <AppIcon name="clipboard" size={19} />
      </Link>
    </header>
  );
}
