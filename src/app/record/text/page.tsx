import { Header } from "@/components/Header";
import { MealForm } from "@/components/MealForm";
import { PageHero } from "@/components/PageHero";

export default function TextRecordPage() {
  return (
    <main className="shell text-record-page">
      <Header title="직접 입력" backHref="/record" />
      <PageHero
        eyebrow="직접 입력"
        title="무엇을 드셨나요?"
        description="음식을 검색해 선택하고 드신 양을 알려주세요. g 기준 식품은 무게로 계산해요."
        icon="edit"
        tone="peach"
        compact
      />
      <MealForm inputType="text" />
    </main>
  );
}
