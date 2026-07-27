"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import {
  MealDraft,
  MEAL_LABELS,
  clearDraft,
  estimateMeal,
  getDraft,
  saveRecord,
} from "@/lib/meals";

const confidenceLabels = { low: "낮음", medium: "보통", high: "높음" };

export default function ResultPage() {
  const router = useRouter();
  const [draft, setDraftState] = useState<MealDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const estimate = useMemo(() => (draft ? estimateMeal(draft) : null), [draft]);

  useEffect(() => {
    setDraftState(getDraft());
    setLoading(false);
  }, []);

  if (loading) {
    return <main className="shell"><p className="status-message">결과를 준비하고 있어요…</p></main>;
  }

  if (!draft || !estimate) {
    return (
      <main className="shell">
        <Header title="결과 확인" backHref="/record" />
        <section className="empty-state">
          <span aria-hidden="true">?</span>
          <h1>확인할 입력이 없어요</h1>
          <p>사진이나 텍스트로 식사를 먼저 입력해 주세요.</p>
          <Link className="primary-button" href="/record">입력하러 가기</Link>
        </section>
      </main>
    );
  }

  const calories = draft.estimatedCalories ?? estimate.estimatedCalories;
  const confidence = draft.confidence ?? estimate.confidence;
  const reason = draft.reason ?? estimate.reason;

  function save() {
    if (!draft) return;
    saveRecord({
      ...draft,
      estimatedCalories: calories,
      confidence,
      reason,
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
    });
    clearDraft();
    setSaved(true);
    window.setTimeout(() => router.push("/today"), 700);
  }

  return (
    <main className="shell">
      <Header title="결과 확인" backHref={draft.inputType === "photo" ? "/record/photo" : "/record/text"} />
      <section className="result-hero">
        <p>예상 섭취 칼로리</p>
        {editing ? (
          <label className="calorie-edit">
            <input
              type="number"
              min="0"
              max="10000"
              value={calories}
              onChange={(event) =>
                setDraftState({ ...draft, estimatedCalories: Number(event.target.value) })
              }
            />
            <span>kcal</span>
          </label>
        ) : (
          <h1>{calories.toLocaleString()} <span>kcal</span></h1>
        )}
        <span className={`confidence ${confidence}`}>신뢰도 {confidenceLabels[confidence]}</span>
        <small>칼로리는 입력 정보를 바탕으로 한 추정치입니다.</small>
      </section>
      <section className="detail-card">
        <div>
          <span>음식</span>
          {editing ? (
            <input value={draft.foodName} onChange={(event) => setDraftState({ ...draft, foodName: event.target.value })} />
          ) : <strong>{draft.foodName}</strong>}
        </div>
        <div>
          <span>양</span>
          {editing ? (
            <input value={draft.amount} onChange={(event) => setDraftState({ ...draft, amount: event.target.value })} />
          ) : <strong>{draft.amount}</strong>}
        </div>
        <div><span>식사</span><strong>{MEAL_LABELS[draft.mealType]}</strong></div>
        <div><span>기록 시간</span><strong>{new Date(draft.recordedAt).toLocaleString("ko-KR")}</strong></div>
      </section>
      <p className="reason"><span aria-hidden="true">i</span>{reason}</p>
      {saved && <p className="success" role="status">기록을 저장했어요. 오늘 기록으로 이동합니다.</p>}
      <div className="action-stack">
        <button className="primary-button" type="button" onClick={editing ? () => setEditing(false) : save} disabled={saved}>
          {editing ? "수정 완료" : saved ? "저장 완료" : "이 기록 저장하기"}
        </button>
        {!saved && (
          <button className="secondary-button" type="button" onClick={() => setEditing(!editing)}>
            {editing ? "수정 취소" : "결과 수정하기"}
          </button>
        )}
        <Link className="text-link" href="/record">다시 입력하기</Link>
      </div>
    </main>
  );
}
