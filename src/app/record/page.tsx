import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";

export default function RecordPage() {
  return (
    <main className="shell">
      <Header title="입력 방식 선택" />
      <section className="page-intro">
        <p className="eyebrow">새 식사 기록</p>
        <h1>어떻게 기록할까요?</h1>
        <p>지금 편한 방법을 선택하세요. 결과를 저장하기 전에 수정할 수 있어요.</p>
      </section>
      <section className="choice-grid">
        <Link className="choice-card photo-card" href="/record/photo">
          <span className="choice-icon" aria-hidden="true">▣</span>
          <span>
            <strong>사진으로 입력</strong>
            <small>음식 사진을 선택해 시작해요</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="choice-card" href="/record/text">
          <span className="choice-icon text-icon" aria-hidden="true">Aa</span>
          <span>
            <strong>직접 입력</strong>
            <small>음식 이름과 양을 적어요</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      </section>
      <BottomNav />
    </main>
  );
}
