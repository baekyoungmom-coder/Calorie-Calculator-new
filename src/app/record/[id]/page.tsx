"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FoodSearchField } from "@/components/FoodSearchField";
import { Header } from "@/components/Header";
import {
  estimateMeal,
  findCalorieFood,
  MealType,
  parseServingMultiplier,
  SERVING_OPTIONS,
} from "@/lib/meals";

type RecordDetail = {
  id: string;
  inputType: "photo" | "text" | "both";
  mealType: MealType;
  foodName: string;
  amount: string;
  memo: string | null;
  estimatedCalories: number;
  finalCalories: number;
  confidence: "low" | "medium" | "high";
  reason: string | null;
  recordedAt: string;
  recordedTimezone: string;
};

function toLocalInputValue(value: string) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function RecordDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [calorieMessage, setCalorieMessage] = useState("");
  const [calculationServings, setCalculationServings] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/meal-records/${id}`);
        const payload = await response.json() as { message?: string; data?: { record?: RecordDetail } };
        if (!response.ok || !payload.data?.record) {
          setError(payload.message ?? "기록을 불러오지 못했습니다.");
          return;
        }
        const loadedRecord = payload.data.record;
        const detectedServings = parseServingMultiplier(loadedRecord.amount);
        setRecord(loadedRecord);
        setCalculationServings(
          detectedServings !== null &&
            SERVING_OPTIONS.some((option) => option === detectedServings)
            ? detectedServings
            : 1,
        );
      } catch {
        setError("기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!record) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/meal-records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...record,
          estimateReason: record.reason,
          recordedAt: new Date(record.recordedAt).toISOString(),
          recordedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "기록을 수정하지 못했습니다.");
        return;
      }
      router.push("/today");
      router.refresh();
    } catch {
      setError("기록을 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  const selectedFood = record ? findCalorieFood(record.foodName) : null;
  const catalogEstimate =
    record && selectedFood
      ? estimateMeal({
          trialId: record.id,
          inputType: record.inputType === "photo" ? "photo" : "text",
          foodName: selectedFood.name,
          amount: `${calculationServings.toLocaleString("ko-KR")}인분`,
          mealType: record.mealType,
          memo: record.memo ?? "",
          recordedAt: record.recordedAt,
        })
      : null;

  function applyCatalogCalories() {
    if (!record || !catalogEstimate) return;

    setRecord({
      ...record,
      foodName: selectedFood?.name ?? record.foodName,
      estimatedCalories: catalogEstimate.estimatedCalories,
      finalCalories: catalogEstimate.estimatedCalories,
      confidence: catalogEstimate.confidence,
      reason: catalogEstimate.reason,
    });
    setCalorieMessage(
      `CSV 계산값 ${catalogEstimate.estimatedCalories.toLocaleString()} kcal를 적용했어요.`,
    );
    setError("");
  }

  if (loading) return <main className="shell"><p className="status-message">기록을 불러오고 있어요…</p></main>;

  if (!record) {
    return (
      <main className="shell">
        <Header title="기록 수정" backHref="/today" />
        <section className="empty-state">
          <span aria-hidden="true">!</span>
          <h1>기록을 열 수 없어요</h1>
          <p>{error || "로그인 상태와 기록 정보를 확인해 주세요."}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <Header title="기록 수정" backHref="/today" />
      <section className="page-intro compact">
        <p className="eyebrow">저장된 기록</p>
        <h1>내용을 수정할 수 있어요</h1>
      </section>
      <form className="form-stack" onSubmit={submit}>
        <FoodSearchField
          value={record.foodName}
          onChange={(foodName) => {
            setRecord({
              ...record,
              foodName,
              confidence: "low",
              reason:
                "사용자가 음식명을 수정했으며 최종 칼로리는 직접 확인한 값이에요.",
            });
            setCalorieMessage("");
          }}
          onSelect={() => setCalorieMessage("")}
        />
        <label>음식 양<input value={record.amount} maxLength={30} onChange={(event) => {
          const amount = event.target.value;
          const detectedServings = parseServingMultiplier(amount);
          setRecord({
            ...record,
            amount,
            confidence: "low",
            reason:
              "사용자가 음식 양을 수정했으며 최종 칼로리는 직접 확인한 값이에요.",
          });
          if (
            detectedServings !== null &&
            SERVING_OPTIONS.some((option) => option === detectedServings)
          ) {
            setCalculationServings(detectedServings);
          }
          setCalorieMessage("");
        }} />
          <small className="field-help">기존에 기록한 음식 양은 그대로 보존돼요.</small>
        </label>
        {selectedFood && (
          <>
            <label>CSV 재계산 인분
              <select
                value={calculationServings}
                onChange={(event) => {
                  setCalculationServings(Number(event.target.value));
                  setCalorieMessage("");
                }}
              >
                {SERVING_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value.toLocaleString("ko-KR")}인분
                  </option>
                ))}
              </select>
              <small className="field-help">
                기존 음식 양은 바꾸지 않고 계산 기준으로만 사용해요.
              </small>
            </label>
            <section className="calorie-recalculate" aria-label="CSV 칼로리 다시 계산">
              <p>
                {selectedFood.name} 1인분{" "}
                {Math.round(selectedFood.calories).toLocaleString()} kcal ×{" "}
                {calculationServings.toLocaleString("ko-KR")}
              </p>
              {catalogEstimate && (
              <button type="button" onClick={applyCatalogCalories}>
                계산값 {catalogEstimate.estimatedCalories.toLocaleString()} kcal 적용
              </button>
              )}
              <small>
                적용 버튼을 누르기 전까지 현재 최종 칼로리는 유지돼요.
              </small>
            </section>
          </>
        )}
        <label>식사 종류
          <select value={record.mealType} onChange={(event) => setRecord({ ...record, mealType: event.target.value as MealType })}>
            <option value="breakfast">아침</option><option value="lunch">점심</option><option value="dinner">저녁</option><option value="snack">간식</option>
          </select>
        </label>
        <label>최종 칼로리<input type="number" min="0" max="10000" value={record.finalCalories} onChange={(event) => {
          setRecord({ ...record, finalCalories: Number(event.target.value) });
          setCalorieMessage("");
        }} /></label>
        <label>기록 날짜와 시간<input type="datetime-local" value={toLocalInputValue(record.recordedAt)} onChange={(event) => {
          const value = event.target.value;
          if (value) setRecord({ ...record, recordedAt: new Date(value).toISOString() });
        }} /></label>
        <label>메모 <span className="optional">선택</span><textarea rows={3} maxLength={200} value={record.memo ?? ""} onChange={(event) => setRecord({ ...record, memo: event.target.value || null })} /></label>
        {calorieMessage && <p className="success" role="status">{calorieMessage}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={saving}>{saving ? "저장 중…" : "수정 내용 저장하기"}</button>
      </form>
    </main>
  );
}
