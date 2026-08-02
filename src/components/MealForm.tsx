"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  imageDataUrl?: string;
};

export function MealForm({ inputType, imageName, imageDataUrl }: MealFormProps) {
  const router = useRouter();
  const [foodName, setFoodName] = useState("");
  const [servings, setServings] = useState(1);
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
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisNote, setAnalysisNote] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const selectedFood = useMemo(() => findCalorieFood(foodName), [foodName]);
  const suggestions = useMemo(() => searchCalorieFoods(foodName), [foodName]);
  const isManualMode = manualEntry && !selectedFood;

  async function analyzePhoto() {
    if (!imageDataUrl || analyzing) return;
    setAnalyzing(true);
    setAnalysisError("");
    setAnalysisNote("");
    try {
      const response = await fetch("/api/photo-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: { items?: Array<{ name: string; matchedFoodName: string | null; calories: number | null }>; note?: string };
      };
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "사진 분석에 실패했습니다.");
      }
      const items = payload.data?.items || [];
      setAnalysisNote(payload.data?.note || "");
      if (items[0]) {
        setFoodName(items[0].matchedFoodName || items[0].name);
        setError("");
      }
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "사진 분석에 실패했습니다.");
    } finally {
      setAnalyzing(false);
    }
  }

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
        : `${servings.toLocaleString("ko-KR")}인분`,
      mealType,
      memo: memo.trim(),
      recordedAt: new Date(recordedAt).toISOString(),
      imageName,
      calorieSource: isManualMode ? "manual" : "catalog",
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
      <FoodSearchField
        value={foodName}
        onChange={(value) => {
          setFoodName(value);
          setError("");
        }}
        onSelect={() => {
          setManualEntry(false);
          setManualAmount("");
          setManualCalories("");
          setError("");
        }}
        noResultsMessage="칼로리 자료에서 일치하는 음식을 찾지 못했어요."
      />
      {inputType === "photo" && imageDataUrl && (
        <section className="photo-analysis-box" aria-label="사진 음식 분석">
          <button className="secondary-button" type="button" onClick={analyzePhoto} disabled={analyzing}>
            {analyzing ? "사진에서 음식 찾는 중…" : "사진에서 음식 후보 찾기"}
          </button>
          <small>무료 인식 모델의 결과는 추정 후보이며, 저장 전에 음식과 양을 확인해 주세요.</small>
          {analysisNote && <p className="success" role="status">{analysisNote}</p>}
          {analysisError && <p className="error" role="alert">{analysisError}</p>}
        </section>
      )}
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
