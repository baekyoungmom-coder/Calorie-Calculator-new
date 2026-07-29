import { Header } from "@/components/Header";
import { MealForm } from "@/components/MealForm";
import { AppIcon } from "@/components/AppIcon";

export default function TextRecordPage() {
  return (
    <main className="shell">
      <Header title="직접 입력" backHref="/record" />
      <section className="page-intro compact">
        <p className="eyebrow">텍스트 기록</p>
        <h1>무엇을 드셨나요?</h1>
        <p>음식을 검색해 선택하고 드신 인분 수를 알려주세요.</p>
      </section>
      <p className="flow-note"><AppIcon name="edit" size={17} /> 음식 이름과 양을 적으면 추정 칼로리를 확인할 수 있어요.</p>
      <MealForm inputType="text" />
    </main>
  );
}
