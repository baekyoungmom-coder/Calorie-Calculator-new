import { Header } from "@/components/Header";
import { MealForm } from "@/components/MealForm";

export default function TextRecordPage() {
  return (
    <main className="shell">
      <Header title="직접 입력" backHref="/record" />
      <section className="page-intro compact">
        <p className="eyebrow">텍스트 기록</p>
        <h1>무엇을 드셨나요?</h1>
        <p>예: 김밥 1줄, 샐러드 200g</p>
      </section>
      <MealForm inputType="text" />
    </main>
  );
}
