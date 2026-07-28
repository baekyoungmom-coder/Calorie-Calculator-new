import Link from "next/link";

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
        ←
      </Link>
      <strong>{title}</strong>
      <Link className="home-link" href="/today" aria-label="오늘 기록">
        기록
      </Link>
    </header>
  );
}
