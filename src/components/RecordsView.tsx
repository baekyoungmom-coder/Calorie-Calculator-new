"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MEAL_LABELS, MealType } from "@/lib/meals";

const MEAL_EMOJIS = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍗",
  snack: "🍎",
};

type SavedMealRecord = {
  id: string;
  mealType: MealType;
  foodName: string;
  amount: string;
  finalCalories: number;
  recordedAt: string;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data: { records?: SavedMealRecord[]; totalCalories?: number } | null;
  error: { code: string } | null;
};

export function RecordsView({ mode }: { mode: "today" | "all" }) {
  const [records, setRecords] = useState<SavedMealRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const url = mode === "today"
      ? `/api/meal-records/today?timezone=${encodeURIComponent(timeZone)}`
      : "/api/meal-records";

    async function load() {
      try {
        const response = await fetch(url, { signal: controller.signal });
        const payload = (await response.json()) as ApiResponse;
        if (!response.ok) {
          setNeedsLogin(payload.error?.code === "UNAUTHORIZED");
          setError(payload.message || "기록을 불러오지 못했습니다.");
          return;
        }
        setRecords(payload.data?.records ?? []);
      } catch (loadError) {
        if ((loadError as Error).name !== "AbortError") {
          setError("기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      } finally {
        setReady(true);
      }
    }

    void load();
    return () => controller.abort();
  }, [mode]);

  const total = useMemo(
    () => records.reduce((sum, record) => sum + record.finalCalories, 0),
    [records],
  );

  async function remove(id: string) {
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    setError("");
    try {
      const response = await fetch(`/api/meal-records/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok) {
        setError(payload.message || "기록을 삭제하지 못했습니다.");
        return;
      }
      setRecords((current) => current.filter((record) => record.id !== id));
    } catch {
      setError("기록을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  if (!ready) return <p className="status-message">기록을 불러오고 있어요…</p>;

  return (
    <>
      <section className="summary-card">
        <p>{mode === "today" ? "오늘 총 섭취량" : "저장된 기록 합계"}</p>
        <h1>{total.toLocaleString()} <span>kcal</span></h1>
        <small>{records.length}개의 식사 기록</small>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      {records.length ? (
        <section className={`record-list ${mode === "today" ? "today-list" : ""}`} aria-label="식사 기록">
          <div className="section-heading">
            <h2>{mode === "today" ? "오늘의 식사" : "이전 식사 기록"}</h2>
            {mode === "today" && <Link href="/mypage">전체 보기</Link>}
          </div>
          {records.map((record) => (
            <article className={`record-card ${record.mealType}`} key={record.id}>
              <div className={`meal-dot ${record.mealType}`} aria-hidden="true" />
              <div className="record-main">
                <div>
                  <span>{MEAL_LABELS[record.mealType]} <i className="meal-emoji" aria-hidden="true">{MEAL_EMOJIS[record.mealType]}</i></span>
                  <strong>{record.foodName}</strong>
                  <small>{record.amount} · {new Date(record.recordedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</small>
                </div>
                <b>{record.finalCalories.toLocaleString()} kcal</b>
              </div>
              <Link className="record-edit-link" href={`/record/${record.id}`}>수정</Link>
              <button className="delete-button" type="button" onClick={() => remove(record.id)} aria-label={`${record.foodName} 기록 삭제`}>
                삭제
              </button>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <span aria-hidden="true">○</span>
          <h2>{needsLogin ? "로그인하고 기록을 관리하세요" : mode === "today" ? "오늘 기록이 아직 없어요" : "저장된 기록이 없어요"}</h2>
          <p>{needsLogin ? "저장한 식사 기록은 로그인한 계정에서만 볼 수 있어요." : "첫 식사를 기록하면 여기에 차곡차곡 모아드려요."}</p>
          <Link className="primary-button" href={needsLogin ? "/login" : "/record"}>{needsLogin ? "로그인하기" : "식사 기록하기"}</Link>
        </section>
      )}
    </>
  );
}
