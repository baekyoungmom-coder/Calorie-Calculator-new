import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { AppIcon } from "@/components/AppIcon";

export default function RecordPage() {
  return (
    <main className="shell">
      <Header title="입력 방식 선택" />
      <section className="page-intro">
        <p className="eyebrow">새 식사 기록</p>
        <h1>한 끼를 기록해볼까요?</h1>
        <p>어떤 방식이든 마지막에 음식과 칼로리를 직접 확인하고 수정할 수 있어요.</p>
      </section>
      <ol className="record-steps" aria-label="식사 기록 순서">
        <li><span>1</span>입력 방법 선택</li>
        <li><span>2</span>음식과 양 확인</li>
        <li><span>3</span>칼로리 수정 후 저장</li>
      </ol>
      <section className="choice-grid">
        <Link className="choice-card photo-card" href="/record/photo">
          <span className="choice-icon"><AppIcon name="camera" size={25} /></span>
          <span>
            <strong>사진으로 입력</strong>
            <small>사진을 선택한 뒤 음식과 양을 확인해요</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="choice-card" href="/record/text">
          <span className="choice-icon text-icon"><AppIcon name="edit" size={23} /></span>
          <span>
            <strong>직접 입력</strong>
            <small>음식 이름을 찾아 양을 바로 적어요</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      </section>
      <BottomNav />
    </main>
  );
}
