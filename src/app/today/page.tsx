import Link from "next/link";
import { Header } from "@/components/Header";
import { RecordsView } from "@/components/RecordsView";
import { WaterTracker } from "@/components/WaterTracker";

export default function TodayPage() {
  const date = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <main className="shell">
      <Header title="오늘 기록" />
      <section className="page-intro compact">
        <p className="eyebrow">{date}</p>
        <h1>오늘도 잘 기록하고 있어요</h1>
      </section>
      <WaterTracker />
      <RecordsView mode="today" />
      <Link className="floating-add" href="/record" aria-label="새 식사 기록">＋</Link>
    </main>
  );
}
