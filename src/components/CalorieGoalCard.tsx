"use client";

import { FormEvent, useEffect, useState } from "react";

const MIN_DAILY_CALORIE_GOAL = 500;
const MAX_DAILY_CALORIE_GOAL = 10000;

type ProfilePayload = {
  success: boolean;
  message: string;
  data: { dailyCalorieGoal?: number | null } | null;
  error: { code: string } | null;
};

export function CalorieGoalCard({ todayCalories }: { todayCalories: number }) {
  const [goal, setGoal] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadGoal() {
      try {
        const response = await fetch("/api/me", { signal: controller.signal });
        const payload = (await response.json()) as ProfilePayload;
        if (!response.ok) {
          setError(payload.message || "목표 칼로리를 불러오지 못했습니다.");
          return;
        }

        const loadedGoal = payload.data?.dailyCalorieGoal ?? null;
        setGoal(loadedGoal);
        setDraft(loadedGoal ? String(loadedGoal) : "");
        setEditing(loadedGoal === null);
      } catch (loadError) {
        if ((loadError as Error).name !== "AbortError") {
          setError("목표 칼로리를 불러오지 못했습니다.");
        }
      } finally {
        setReady(true);
      }
    }

    void loadGoal();
    return () => controller.abort();
  }, []);

  async function updateGoal(nextGoal: number | null) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyCalorieGoal: nextGoal }),
      });
      const payload = (await response.json()) as ProfilePayload;
      if (!response.ok) {
        setError(payload.message || "목표 칼로리를 저장하지 못했습니다.");
        return;
      }

      const savedGoal = payload.data?.dailyCalorieGoal ?? null;
      setGoal(savedGoal);
      setDraft(savedGoal ? String(savedGoal) : "");
      setEditing(savedGoal === null);
      setMessage(payload.message);
    } catch {
      setError("목표 칼로리를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextGoal = Number(draft);
    if (
      !Number.isInteger(nextGoal) ||
      nextGoal < MIN_DAILY_CALORIE_GOAL ||
      nextGoal > MAX_DAILY_CALORIE_GOAL
    ) {
      setError(
        `앱 입력 범위인 ${MIN_DAILY_CALORIE_GOAL.toLocaleString("ko-KR")}~${MAX_DAILY_CALORIE_GOAL.toLocaleString("ko-KR")}kcal 사이의 정수를 입력해 주세요.`,
      );
      return;
    }

    void updateGoal(nextGoal);
  }

  if (!ready) {
    return (
      <section className="summary-card goal-card" aria-busy="true">
        <p>하루 목표 칼로리</p>
        <h1 className="goal-loading">불러오는 중…</h1>
      </section>
    );
  }

  if (editing || goal === null) {
    return (
      <section className="summary-card goal-card">
        <p>하루 목표 칼로리</p>
        <h1 className="goal-editor-title">
          {goal === null ? "목표를 설정해 주세요" : "목표 수정"}
        </h1>
        <form className="goal-form" onSubmit={save}>
          <label>
            <span className="sr-only">하루 목표 칼로리</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_DAILY_CALORIE_GOAL}
              max={MAX_DAILY_CALORIE_GOAL}
              step="1"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="예: 2000"
              required
            />
            <small>kcal</small>
          </label>
          <button type="submit" disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </button>
        </form>
        <small className="goal-help">직접 정한 하루 목표를 입력해 주세요.</small>
        {message && <p className="success" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {goal !== null && (
          <button
            className="goal-cancel-button"
            type="button"
            onClick={() => {
              setDraft(String(goal));
              setEditing(false);
              setError("");
            }}
          >
            취소
          </button>
        )}
      </section>
    );
  }

  const percentage = Math.round((todayCalories / goal) * 100);
  const difference = goal - todayCalories;
  const progressWidth = Math.min(Math.max(percentage, 0), 100);

  return (
    <section className="summary-card goal-card">
      <p>오늘 섭취량 · 하루 목표</p>
      <h1>
        {todayCalories.toLocaleString()}{" "}
        <span>/ {goal.toLocaleString()} kcal</span>
      </h1>
      <small>
        {difference >= 0
          ? `${difference.toLocaleString()}kcal 남았어요`
          : `목표보다 ${Math.abs(difference).toLocaleString()}kcal 더 기록했어요`}
      </small>
      <div
        className={`goal-progress ${difference < 0 ? "over" : ""}`}
        role="progressbar"
        aria-label="오늘 목표 칼로리 진행률"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(todayCalories, goal)}
        aria-valuetext={`${percentage}% · ${goal.toLocaleString()}kcal 중 ${todayCalories.toLocaleString()}kcal`}
      >
        <i style={{ width: `${progressWidth}%` }} />
      </div>
      <div className="goal-actions">
        <button
          type="button"
          onClick={() => {
            setEditing(true);
            setMessage("");
          }}
        >
          목표 수정
        </button>
        <button type="button" onClick={() => void updateGoal(null)} disabled={saving}>
          목표 해제
        </button>
      </div>
      {message && <p className="success" role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
