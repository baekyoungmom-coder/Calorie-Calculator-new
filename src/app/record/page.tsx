import Link from "next/link";
import Image from "next/image";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";

export default function RecordPage() {
  return (
    <main className="shell record-choice-page">
      <Header title="입력 방식 선택" />
      <PageHero
        eyebrow="새 식사 기록"
        title="한 끼를 기록해볼까요?"
        description="편한 방법을 고르면 음식과 칼로리를 확인하는 단계로 이어져요."
        icon="plus"
        tone="mint"
      />
      <ol className="record-steps" aria-label="식사 기록 순서">
        <li><span>1</span>입력 방법 선택</li>
        <li><span>2</span>음식과 양 확인</li>
        <li><span>3</span>칼로리 수정 후 저장</li>
      </ol>
      <section className="choice-grid">
        <Link className="choice-card photo-card" href="/record/photo">
          <span className="choice-icon clay-choice-icon"><Image src="/images/ui/clay-camera.png" alt="" width={62} height={62} priority /></span>
          <span>
            <strong>사진으로 입력</strong>
            <small>사진을 먼저 담고 음식과 양을 직접 확인해요</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="choice-card" href="/record/text">
          <span className="choice-icon text-icon clay-choice-icon"><Image src="/images/ui/clay-notepad.png" alt="" width={62} height={62} priority /></span>
          <span>
            <strong>직접 입력</strong>
            <small>음식 자료를 검색하고 인분 수로 계산해요</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      </section>
      <BottomNav />
    </main>
  );
}
