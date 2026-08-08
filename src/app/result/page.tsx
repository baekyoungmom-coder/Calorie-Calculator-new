"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { AppIcon } from "@/components/AppIcon";
import {
  MealDraft,
  MEAL_LABELS,
  clearDraft,
  estimateMeal,
  getDraft,
  setDraft,
} from "@/lib/meals";
import { resolveResultCalories } from "@/lib/result-draft";

const confidenceLabels = { low: "낮음", medium: "보통", high: "높음" };

type TrialPayload = {
  message?: string;
  data?: {
    mode: "guest" | "authenticated";
    limit: number | null;
    used: number | null;
    remaining: number | null;
    alreadyConsumed: boolean;
  };
  error?: { code?: string };
};

type TrialAccess =
  | { status: "checking" }
  | {
      status: "allowed";
      mode: "guest" | "authenticated";
      limit: number | null;
      used: number | null;
      remaining: number | null;
    }
  | { status: "blocked" }
  | { status: "error"; message: string };

export default function ResultPage() {
  const router = useRouter();
  const [draft, setDraftState] = useState<MealDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialAccess, setTrialAccess] = useState<TrialAccess>({ status: "checking" });
  const [trialCheckVersion, setTrialCheckVersion] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState<MealDraft | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);
  const estimate = useMemo(() => (draft ? estimateMeal(draft) : null), [draft]);

  useEffect(() => {
    setDraftState(getDraft());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!draft) return;

    let active = true;
    const trialId = draft.trialId;
    setTrialAccess({ status: "checking" });

    async function checkTrialAccess() {
      try {
        const response = await fetch("/api/guest-trials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trialId }),
        });
        const payload = await response.json() as TrialPayload;
        if (!active) return;

        if (!response.ok) {
          if (payload.error?.code === "GUEST_TRIAL_LIMIT_REACHED") {
            setTrialAccess({ status: "blocked" });
            return;
          }

          setTrialAccess({
            status: "error",
            message: payload.message ?? "체험 가능 여부를 확인하지 못했습니다.",
          });
          return;
        }

        if (!payload.data) {
          setTrialAccess({
            status: "error",
            message: "체험 가능 여부를 확인하지 못했습니다.",
          });
          return;
        }

        setTrialAccess({
          status: "allowed",
          mode: payload.data.mode,
          limit: payload.data.limit,
          used: payload.data.used,
          remaining: payload.data.remaining,
        });
      } catch {
        if (active) {
          setTrialAccess({
            status: "error",
            message: "체험 가능 여부를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          });
        }
      }
    }

    void checkTrialAccess();
    return () => {
      active = false;
    };
  }, [draft?.trialId, trialCheckVersion]);

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

  if (trialAccess.status === "checking") {
    return (
      <main className="shell">
        <p className="status-message">게스트 체험 가능 여부를 확인하고 있어요…</p>
      </main>
    );
  }

  if (trialAccess.status === "blocked") {
    return (
      <main className="shell">
        <Header title="체험 안내" backHref="/record" />
        <section className="empty-state trial-limit-state">
          <span aria-hidden="true">3</span>
          <h1>게스트 체험 3회를 모두 사용했어요</h1>
          <p>로그인하면 제한 없이 결과를 확인하고 식사 기록도 저장할 수 있어요.</p>
          <Link className="primary-button" href="/login?next=/result">
            Google로 로그인하고 계속하기
          </Link>
          <Link className="text-link" href="/">홈으로 돌아가기</Link>
        </section>
      </main>
    );
  }

  if (trialAccess.status === "error") {
    return (
      <main className="shell">
        <Header title="결과 확인" backHref="/record" />
        <section className="empty-state trial-check-error">
          <span aria-hidden="true">!</span>
          <h1>체험 가능 여부를 확인하지 못했어요</h1>
          <p>{trialAccess.message}</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setTrialAccess({ status: "checking" });
              setTrialCheckVersion((version) => version + 1);
            }}
          >
            다시 시도하기
          </button>
        </section>
      </main>
    );
  }

  const {
    estimatedCalories,
    finalCalories: calories,
  } = resolveResultCalories(draft, estimate.estimatedCalories);
  const confidence = draft.confidence ?? estimate.confidence;
  const reason = draft.reason ?? estimate.reason;
  const hasUserFinalCalories = draft.finalCalories !== undefined;

  function beginEditing() {
    if (!draft) return;

    setEditSnapshot({ ...draft });
    setEditing(true);
    setEditMessage("");
    setSaveError("");
  }

  function completeEditing() {
    if (!draft) return;

    if (!draft.foodName.trim()) {
      setSaveError("음식 이름을 입력해 주세요.");
      return;
    }
    if (!draft.amount.trim()) {
      setSaveError("음식 양을 입력해 주세요.");
      return;
    }
    if (
      !Number.isInteger(calories) ||
      calories < 0 ||
      calories > 10000
    ) {
      setSaveError("최종 칼로리를 0~10,000 사이의 정수로 입력해 주세요.");
      return;
    }

    const confirmedDraft = {
      ...draft,
      foodName: draft.foodName.trim(),
      amount: draft.amount.trim(),
      finalCalories: calories,
    };
    setDraftState(confirmedDraft);
    setDraft(confirmedDraft);
    setEditSnapshot(null);
    setEditing(false);
    setEditMessage("수정 내용을 최종값에 반영했어요.");
    setSaveError("");
  }

  function cancelEditing() {
    if (editSnapshot) {
      setDraftState(editSnapshot);
    }
    setEditSnapshot(null);
    setEditing(false);
    setEditMessage("");
    setSaveError("");
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setSaveError("");
    setRequiresLogin(false);

    try {
      const response = await fetch("/api/meal-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputType: draft.inputType,
          mealType: draft.mealType,
          foodName: draft.foodName,
          amount: draft.amount,
          memo: draft.memo,
          estimatedCalories,
          finalCalories: calories,
          confidence,
          estimateReason: reason,
          recordedAt: draft.recordedAt,
          recordedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const payload = await response.json() as { message?: string; error?: { code?: string } };
      if (!response.ok) {
        const unauthenticated = payload.error?.code === "UNAUTHORIZED";
        setRequiresLogin(unauthenticated);
        setSaveError(unauthenticated ? "기록을 저장하려면 먼저 로그인해 주세요." : payload.message ?? "기록을 저장하지 못했습니다.");
        return;
      }
      clearDraft();
      setSaved(true);
      window.setTimeout(() => router.push("/today"), 700);
    } catch {
      setSaveError("기록을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="shell result-page">
      <Header title="결과 확인" backHref={draft.inputType === "photo" ? "/record/photo" : "/record/text"} />
      <section className="result-review-banner">
        <span aria-hidden="true"><AppIcon name="sparkles" size={25} /></span>
        <div>
          <p>계산 완료</p>
          <strong>저장하기 전에 내용을 확인해 주세요</strong>
        </div>
      </section>
      {trialAccess.mode === "guest" && (
        <p className="guest-trial-status" role="status">
          {trialAccess.remaining === 0
            ? "게스트 체험 3/3 · 이번 체험까지 이용할 수 있어요. 다음부터 로그인이 필요합니다."
            : `게스트 체험 ${trialAccess.used}/${trialAccess.limit} · ${trialAccess.remaining}회 남음`}
        </p>
      )}
      <section className="result-hero">
        <p>
          {draft.calorieSource === "manual"
            ? "직접 입력한 칼로리"
            : hasUserFinalCalories
              ? "최종 섭취 칼로리"
              : "예상 섭취 칼로리"}
        </p>
        {editing ? (
          <label className="calorie-edit">
            <input
              type="number"
              min="0"
              max="10000"
              value={calories}
              onChange={(event) =>
                setDraftState({
                  ...draft,
                  finalCalories: Number(event.target.value),
                })
              }
            />
            <span>kcal</span>
          </label>
        ) : (
          <h1>{calories.toLocaleString()} <span>kcal</span></h1>
        )}
        {draft.calorieSource === "manual" ? (
          <span className="confidence manual">사용자 직접 입력</span>
        ) : hasUserFinalCalories ? (
          <span className="confidence manual">사용자 수정</span>
        ) : (
          <span className={`confidence ${confidence}`}>
            신뢰도 {confidenceLabels[confidence]}
          </span>
        )}
        <small>
          {draft.calorieSource === "manual"
            ? "칼로리 자료에 없는 음식으로 직접 확인한 값입니다."
            : hasUserFinalCalories
              ? `원래 추정 ${estimatedCalories.toLocaleString()} kcal를 보존하고 사용자가 확인한 최종값을 표시합니다.`
              : "칼로리는 입력 정보를 바탕으로 한 추정치입니다."}
        </small>
      </section>
      <section className="detail-card">
        <div>
          <span>음식</span>
          {editing ? (
            <input
              value={draft.foodName}
              maxLength={60}
              onChange={(event) =>
                setDraftState({ ...draft, foodName: event.target.value })
              }
            />
          ) : <strong>{draft.foodName}</strong>}
        </div>
        <div>
          <span>양</span>
          {editing ? (
            <input
              value={draft.amount}
              maxLength={30}
              onChange={(event) =>
                setDraftState({ ...draft, amount: event.target.value })
              }
            />
          ) : <strong>{draft.amount}</strong>}
        </div>
        <div><span>식사</span><strong>{MEAL_LABELS[draft.mealType]}</strong></div>
        {estimate.matchedFoodName && estimate.caloriesPerServing !== null && (
          <div>
            <span>계산 기준</span>
            <strong>
              1인분 {Math.round(estimate.caloriesPerServing).toLocaleString()} kcal
              {estimate.servings !== null &&
                ` × ${estimate.servings.toLocaleString("ko-KR")}`}
            </strong>
          </div>
        )}
        <div><span>기록 시간</span><strong>{new Date(draft.recordedAt).toLocaleString("ko-KR")}</strong></div>
      </section>
      <p className="reason"><span aria-hidden="true">i</span>{reason}</p>
      {editMessage && <p className="success" role="status">{editMessage}</p>}
      {saved && <p className="success" role="status">기록을 저장했어요. 오늘 기록으로 이동합니다.</p>}
      {saveError && <p className="error" role="alert">{saveError}</p>}
      {requiresLogin && <Link className="secondary-button" href="/login?next=/result">로그인하고 저장하기</Link>}
      <div className="action-stack">
        <button className="primary-button" type="button" onClick={editing ? completeEditing : save} disabled={saved || saving}>
          {editing ? "수정 완료" : saved ? "저장 완료" : saving ? "저장 중…" : "이 기록 저장하기"}
        </button>
        {!saved && (
          <button className="secondary-button" type="button" onClick={editing ? cancelEditing : beginEditing}>
            {editing ? "수정 취소" : "결과 수정하기"}
          </button>
        )}
        <Link className="text-link" href="/record">다시 입력하기</Link>
      </div>
    </main>
  );
}
