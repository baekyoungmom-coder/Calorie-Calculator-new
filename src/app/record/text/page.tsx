import { Header } from "@/components/Header";
import { MealForm } from "@/components/MealForm";

export default function TextRecordPage() {
  return (
    <main className="shell">
      <Header title="직접 입력" backHref="/record" />
      <section className="page-intro compact">
        <p className="eyebrow">텍스트 기록</p>
        <h1>무엇을 드셨나요?</h1>
        <p>음식을 검색해 선택하고 드신 인분 수를 알려주세요.</p>
      </section>
      <MealForm inputType="text" />
    </main>
  );
}
