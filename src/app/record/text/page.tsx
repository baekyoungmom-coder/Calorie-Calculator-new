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
        description="음식을 검색해 선택하고 드신 인분 수를 알려주세요."
        icon="edit"
        imageSrc="/images/ui/clay-notepad.png"
        tone="peach"
        compact
      />
      <MealForm inputType="text" />
    </main>
  );
}
