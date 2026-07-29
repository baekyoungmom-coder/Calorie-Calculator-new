"use client";

import { FormEvent, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  findCalorieFood,
  MealDraft,
  MealType,
  searchCalorieFoods,
  SERVING_OPTIONS,
  createTrialId,
  setDraft,
} from "@/lib/meals";

type MealFormProps = {
  inputType: "text" | "photo";
  imageName?: string;
};

export function MealForm({ inputType, imageName }: MealFormProps) {
  const router = useRouter();
  const [foodName, setFoodName] = useState("");
  const [servings, setServings] = useState(1);
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [memo, setMemo] = useState("");
  const [recordedAt, setRecordedAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsId = useId();
  const selectedFood = useMemo(() => findCalorieFood(foodName), [foodName]);
  const suggestions = useMemo(
    () => searchCalorieFoods(foodName),
    [foodName],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!foodName.trim()) {
      setError("음식 이름을 입력하고 목록에서 선택해 주세요.");
      return;
    }
    if (!selectedFood) {
      setError("정확한 계산을 위해 검색 결과에서 음식을 선택해 주세요.");
      return;
    }

    setSubmitting(true);
    const draft: MealDraft = {
      trialId: createTrialId(),
      inputType,
      foodName: selectedFood.name,
      amount: `${servings.toLocaleString("ko-KR")}인분`,
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
      <div className="food-search-field">
        <label htmlFor={`${suggestionsId}-input`}>음식 이름</label>
        <div className="food-search">
          <input
            id={`${suggestionsId}-input`}
            value={foodName}
            onChange={(event) => {
              setFoodName(event.target.value);
              setShowSuggestions(true);
              setError("");
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
            placeholder="예: 김밥, 된장찌개"
            maxLength={60}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls={suggestionsId}
            required
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="food-suggestions"
              id={suggestionsId}
              role="listbox"
              aria-label="음식 검색 결과"
            >
              {suggestions.map((food) => (
                <button
                  key={food.normalizedName}
                  type="button"
                  role="option"
                  aria-selected={
                    food.normalizedName === selectedFood?.normalizedName
                  }
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setFoodName(food.name);
                    setShowSuggestions(false);
                    setError("");
                  }}
                >
                  <span>{food.name}</span>
                  <small>1인분 {Math.round(food.calories).toLocaleString()} kcal</small>
                </button>
              ))}
            </div>
          )}
        </div>
        {foodName && !selectedFood && suggestions.length === 0 && (
          <small className="food-search-help">
            일치하는 음식이 없어요. 다른 이름으로 검색해 주세요.
          </small>
        )}
        {selectedFood && (
          <p className="food-match" role="status">
            <span>선택됨</span>
            {selectedFood.name} · 1인분{" "}
            {Math.round(selectedFood.calories).toLocaleString()} kcal
          </p>
        )}
      </div>
      <label>
        섭취량
        <select
          value={servings}
          onChange={(event) => setServings(Number(event.target.value))}
        >
          {SERVING_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value.toLocaleString("ko-KR")}인분
            </option>
          ))}
        </select>
        <small className="field-help">
          현재 데이터는 1인분 기준이므로 인분 수로 계산해요.
        </small>
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
