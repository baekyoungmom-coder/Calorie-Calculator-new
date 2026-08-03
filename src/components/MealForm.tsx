"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FoodSearchField, type FoodSuggestion } from "@/components/FoodSearchField";
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
  const [publicFood, setPublicFood] = useState<FoodSuggestion | null>(null);
  const [publicAmount, setPublicAmount] = useState("");
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
  const isPublicFood = (publicFood?.displayName ?? publicFood?.name) === foodName;
  const isManualMode = manualEntry && !selectedFood && !isPublicFood;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!foodName.trim()) {
      setError("음식 이름을 입력해 주세요.");
      return;
    }
    if (!selectedFood && !isManualMode && !isPublicFood) {
      setError("정확한 계산을 위해 검색 결과에서 음식을 선택해 주세요.");
      return;
    }
    if (isManualMode && !manualAmount.trim()) {
      setError("직접 입력할 음식의 양을 입력해 주세요.");
      return;
    }
    if (selectedFood?.basisGrams && (!Number.isFinite(grams) || grams < 1 || grams > 5000)) {
      setError("섭취량은 1~5,000g 사이로 입력해 주세요.");
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

    const enteredPublicAmount = Number(publicAmount);
    if (
      isPublicFood &&
      (!Number.isFinite(enteredPublicAmount) || enteredPublicAmount <= 0 || enteredPublicAmount > 10000)
    ) {
      setError("섭취량을 0보다 큰 값으로 입력해 주세요.");
      return;
    }

    const publicCalories = isPublicFood && publicFood?.basisAmount
      ? Math.round((publicFood.calories * enteredPublicAmount) / publicFood.basisAmount)
      : null;

    setSubmitting(true);
    const draft: MealDraft = {
      trialId: createTrialId(),
      inputType,
      foodName: isPublicFood
        ? (publicFood?.name ?? foodName.trim())
        : (selectedFood?.name ?? foodName.trim()),
      amount: isManualMode
        ? manualAmount.trim()
        : isPublicFood
          ? `${enteredPublicAmount.toLocaleString("ko-KR")}${publicFood?.basisUnit ?? "g"}`
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
    if (isPublicFood && publicFood && publicCalories !== null) {
      draft.estimatedCalories = publicCalories;
      draft.confidence = "medium";
      draft.reason = `${publicFood.sourceLabel ?? "공공 영양 DB"}의 ${publicFood.basisAmount}${publicFood.basisUnit} 기준 ${publicFood.calories.toLocaleString("ko-KR")} kcal 값을 바탕으로 ${enteredPublicAmount.toLocaleString("ko-KR")}${publicFood.basisUnit} 섭취량을 계산한 추정치예요.`;
    }
    setDraft(draft);
    router.push("/result");
  }

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <div className="form-card-heading">
        <span aria-hidden="true">
          <Image
            src={inputType === "photo" ? "/images/ui/clay-camera.png" : "/images/ui/clay-notepad.png"}
            alt=""
            width={48}
            height={48}
          />
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
      {inputType === "photo" && (
        <p className="flow-note">
          사진을 참고해 음식 이름을 입력하면 공공 영양 DB에서 기준 칼로리와 단위를 찾아 계산해요.
        </p>
      )}
      <FoodSearchField
        value={foodName}
        onChange={(value) => {
          setFoodName(value);
          setPublicFood(null);
          setError("");
        }}
        onSelect={(food) => {
          if (food.source === "public" && food.basisAmount && food.basisUnit) {
            setPublicFood(food);
            setPublicAmount(String(food.basisAmount));
          } else {
            setPublicFood(null);
            setPublicAmount("");
            if (food.basisGrams) setGrams(food.basisGrams);
          }
          setManualEntry(false);
          setManualAmount("");
          setManualCalories("");
          setError("");
        }}
        noResultsMessage="칼로리 자료에서 일치하는 음식을 찾지 못했어요."
        usePublicDb
      />
      {foodName.trim() &&
        !selectedFood &&
        !isPublicFood &&
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
      ) : isPublicFood && publicFood ? (
        <label>
          섭취량
          <span className="calorie-input-wrap">
            <input
              type="number"
              inputMode="decimal"
              min="0.1"
              max="10000"
              step="0.1"
              value={publicAmount}
              onChange={(event) => setPublicAmount(event.target.value)}
              required
            />
            <small>{publicFood.basisUnit}</small>
          </span>
          <small className="field-help">
            공공 영양 DB의 {publicFood.basisAmount}{publicFood.basisUnit} 기준 {Math.round(publicFood.calories).toLocaleString("ko-KR")} kcal 값을 사용해 계산해요.
          </small>
        </label>
      ) : selectedFood?.basisGrams ? (
        <label>
          섭취량
          <span className="calorie-input-wrap">
            <input type="number" inputMode="decimal" min="1" max="5000" step="1" value={grams} onChange={(event) => setGrams(Number(event.target.value))} required />
            <small>g</small>
          </span>
          <small className="field-help">공식 데이터의 {selectedFood.basisGrams.toLocaleString("ko-KR")}g당 {Math.round(selectedFood.calories).toLocaleString("ko-KR")} kcal 기준으로 계산해요.</small>
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
