"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { MealDraft, MealType, setDraft } from "@/lib/meals";

type MealFormProps = {
  inputType: "text" | "photo";
  imageName?: string;
};

export function MealForm({ inputType, imageName }: MealFormProps) {
  const router = useRouter();
  const [foodName, setFoodName] = useState("");
  const [amount, setAmount] = useState("");
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [memo, setMemo] = useState("");
  const [recordedAt, setRecordedAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (inputType === "text" && (!foodName.trim() || !amount.trim())) {
      setError("음식 이름과 양을 모두 입력해 주세요.");
      return;
    }
    if (amount.trim() && /^0(?:\.0+)?(?:\D|$)/.test(amount.trim())) {
      setError("0보다 큰 양을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    const draft: MealDraft = {
      inputType,
      foodName: foodName.trim() || "사진 속 음식",
      amount: amount.trim() || "양 확인 필요",
      mealType,
      memo: memo.trim(),
      recordedAt: new Date(recordedAt).toISOString(),
      imageName,
    };
    setDraft(draft);
    router.push("/result");
  }

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <label>
        음식 이름 {inputType === "photo" && <span className="optional">선택</span>}
        <input
          value={foodName}
          onChange={(event) => setFoodName(event.target.value)}
          placeholder="예: 참치 김밥"
          maxLength={60}
          required={inputType === "text"}
        />
      </label>
      <label>
        음식 양 {inputType === "photo" && <span className="optional">선택</span>}
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="예: 1줄, 200g"
          maxLength={30}
          required={inputType === "text"}
        />
      </label>
      <fieldset>
        <legend>식사 종류</legend>
        <div className="segment">
          {(
            [
              ["breakfast", "아침"],
              ["lunch", "점심"],
              ["dinner", "저녁"],
              ["snack", "간식"],
            ] as const
          ).map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="mealType"
                value={value}
                checked={mealType === value}
                onChange={() => setMealType(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        기록 날짜와 시간
        <input
          type="datetime-local"
          value={recordedAt}
          onChange={(event) => setRecordedAt(event.target.value)}
          required
        />
      </label>
      <label>
        메모 <span className="optional">선택</span>
        <textarea
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="함께 기억하고 싶은 내용을 남겨보세요."
          maxLength={200}
          rows={3}
        />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? "계산 중…" : "칼로리 계산하기"}
      </button>
    </form>
  );
}
