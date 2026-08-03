"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppIcon } from "@/components/AppIcon";
import { FoodSearchField } from "@/components/FoodSearchField";
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
  const [grams, setGrams] = useState(100);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [memo, setMemo] = useState("");
  const [recordedAt, setRecordedAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedFood = useMemo(() => findCalorieFood(foodName), [foodName]);
  const suggestions = useMemo(() => searchCalorieFoods(foodName), [foodName]);
  const isManualMode = manualEntry && !selectedFood;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!foodName.trim()) {
      setError("음식 이름을 입력해 주세요.");
      return;
    }
    if (!selectedFood && !isManualMode) {
      setError("정확한 계산을 위해 검색 결과에서 음식을 선택해 주세요.");
      return;
    }
    if (
      selectedFood?.basisGrams &&
      (!Number.isFinite(grams) || grams < 1 || grams > 5000)
    ) {
      setError("섭취량은 1~5,000g 사이로 입력해 주세요.");
      return;
    }
    if (isManualMode && !manualAmount.trim()) {
      setError("직접 입력할 음식의 양을 입력해 주세요.");
      return;
    }

    const enteredCalories = Number(manualCalories);
    if (
      isManualMode &&
      (!Number.isInteger(enteredCalories) ||
        enteredCalories < 0 ||
        enteredCalories > 10000)
    ) {
      setError("직접 확인한 칼로리를 0~10,000 사이의 정수로 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    const draft: MealDraft = {
      trialId: createTrialId(),
      inputType,
      foodName: selectedFood?.name ?? foodName.trim(),
      amount: isManualMode
        ? manualAmount.trim()
        : selectedFood?.basisGrams
          ? `${grams.toLocaleString("ko-KR")}g`
          : `${servings.toLocaleString("ko-KR")}인분`,
      mealType,
      memo: memo.trim(),
      recordedAt: new Date(recordedAt).toISOString(),
      imageName,
      calorieSource: isManualMode ? "manual" : "catalog",
      foodSourceCode: selectedFood?.sourceCode,
      foodBasisGrams: selectedFood?.basisGrams,
    };
    if (isManualMode) {
      draft.estimatedCalories = enteredCalories;
      draft.confidence = "low";
      draft.reason =
        "칼로리 자료에 없는 음식으로 사용자가 직접 확인해 입력한 값입니다.";
    }
    setDraft(draft);
    router.push("/result");
  }

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <div className="form-card-heading">
        <span aria-hidden="true">
          <AppIcon name={inputType === "photo" ? "camera" : "edit"} size={23} />
        </span>
        <div>
          <p>식사 정보</p>
          <strong>
            {inputType === "photo"
              ? "사진 속 음식과 양을 확인해 주세요"
              : "음식과 드신 양을 입력해 주세요"}
          </strong>
        </div>
      </div>
      <FoodSearchField
        value={foodName}
        onChange={(value) => {
          setFoodName(value);
          setError("");
        }}
        onSelect={(food) => {
          setManualEntry(false);
          setManualAmount("");
          setManualCalories("");
          if (food.basisGrams) setGrams(food.basisGrams);
          setError("");
        }}
        noResultsMessage="칼로리 자료에서 일치하는 음식을 찾지 못했어요."
      />
      {foodName.trim() &&
        !selectedFood &&
        suggestions.length === 0 &&
        !manualEntry && (
          <button
            className="manual-entry-button"
            type="button"
            onClick={() => {
              setManualEntry(true);
              setError("");
            }}
          >
            목록에 없는 음식으로 계속
          </button>
        )}
      {isManualMode ? (
        <>
          <section className="manual-entry-note" aria-label="직접 입력 음식 안내">
            <p>자료에 없는 음식은 직접 확인한 칼로리로 기록할 수 있어요.</p>
            <button
              type="button"
              onClick={() => {
                setManualEntry(false);
                setManualAmount("");
                setManualCalories("");
              }}
            >
              CSV 음식 다시 검색
            </button>
          </section>
          <label>
            음식 양
            <input
              value={manualAmount}
              onChange={(event) => setManualAmount(event.target.value)}
              placeholder="예: 1개, 200g"
              maxLength={30}
              required
            />
          </label>
          <label>
            직접 확인한 칼로리
            <span className="calorie-input-wrap">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="10000"
                step="1"
                value={manualCalories}
                onChange={(event) => setManualCalories(event.target.value)}
                placeholder="예: 380"
                required
              />
              <small>kcal</small>
            </span>
            <small className="field-help">
              영양표시나 직접 확인한 값을 입력해 주세요.
            </small>
          </label>
        </>
      ) : (
        selectedFood?.basisGrams ? (
          <label>
            섭취량
            <span className="calorie-input-wrap">
              <input
                type="number"
                inputMode="decimal"
                min="1"
                max="5000"
                step="1"
                value={grams}
                onChange={(event) => setGrams(Number(event.target.value))}
                required
              />
              <small>g</small>
            </span>
            <small className="field-help">
              공식 데이터의 {selectedFood.basisGrams.toLocaleString("ko-KR")}g당 {Math.round(selectedFood.calories).toLocaleString("ko-KR")} kcal 기준으로 계산해요.
            </small>
          </label>
        ) : (
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
        )
      )}
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
