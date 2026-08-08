import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { RecordsView } from "@/components/RecordsView";
import { WaterTracker } from "@/components/WaterTracker";
import { AppIcon } from "@/components/AppIcon";
import { PageHero } from "@/components/PageHero";

export default function TodayPage() {
  const date = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <main className="shell today-page">
      <Header title="오늘 기록" />
      <PageHero
        eyebrow={date}
        title="오늘의 식사를 모아봐요"
        description="기록한 식사와 하루 총 섭취 칼로리를 한눈에 확인해요."
        icon="clipboard"
        tone="sky"
        compact
      />
      <WaterTracker />
      <section className="today-workspace" aria-label="오늘 기록 요약과 식사 목록">
        <RecordsView mode="today" />
      </section>
      <Link className="floating-add" href="/record" aria-label="새 식사 기록"><AppIcon name="plus" /></Link>
      <BottomNav />
    </main>
  );
}
