"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { CalorieGoalCard } from "@/components/CalorieGoalCard";
import { MEAL_LABELS, MealType } from "@/lib/meals";

const MEAL_EMOJIS = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍗",
  snack: "🍎",
};

type SavedMealRecord = {
  id: string;
  inputType: "photo" | "text" | "both";
  mealType: MealType;
  foodName: string;
  amount: string;
  finalCalories: number;
  recordedAt: string;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data: {
    records?: SavedMealRecord[];
    totalCalories?: number;
    deletedCount?: number;
  } | null;
  error: { code: string } | null;
};

type RecordRange = "week" | "all";
const DELETE_ALL_CONFIRMATION = "전체 삭제";

function isDeleteAllConfirmed(value: string) {
  return value.trim().replace(/\s+/g, " ") === DELETE_ALL_CONFIRMATION;
}

function getLocalDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLastSevenDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  const end = new Date(today);
  end.setDate(end.getDate() + 1);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    return {
      key: getLocalDayKey(date),
      label: new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(date),
      dateLabel: new Intl.DateTimeFormat("ko-KR", {
        month: "numeric",
        day: "numeric",
      }).format(date),
    };
  });

  return { start, end, days };
}

function formatRecordTime(recordedAt: string, includeDate: boolean) {
  const options: Intl.DateTimeFormatOptions = includeDate
    ? { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }
    : { hour: "2-digit", minute: "2-digit" };
  return new Intl.DateTimeFormat("ko-KR", options).format(new Date(recordedAt));
}

export function RecordsView({ mode }: { mode: "today" | "all" }) {
  const [records, setRecords] = useState<SavedMealRecord[]>([]);
  const [recordRange, setRecordRange] = useState<RecordRange>("week");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllPhrase, setDeleteAllPhrase] = useState("");
  const [deleteAllBusy, setDeleteAllBusy] = useState(false);
  const [dataActionMessage, setDataActionMessage] = useState("");
  const [dataActionError, setDataActionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const url = mode === "today"
      ? `/api/meal-records/today?timezone=${encodeURIComponent(timeZone)}`
      : "/api/meal-records";

    async function load() {
      setReady(false);
      setError("");
      setNeedsLogin(false);

      try {
        const response = await fetch(url, { signal: controller.signal });
        const payload = (await response.json()) as ApiResponse;
        if (!response.ok) {
          setNeedsLogin(payload.error?.code === "UNAUTHORIZED");
          setError(payload.message || "기록을 불러오지 못했습니다.");
          return;
        }
        setRecords(payload.data?.records ?? []);
        setError("");
        setNeedsLogin(false);
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
  }, [loadVersion, mode]);

  const total = useMemo(
    () => records.reduce((sum, record) => sum + record.finalCalories, 0),
    [records],
  );
  const weekRange = useMemo(getLastSevenDays, []);
  const weekRecords = useMemo(
    () =>
      records.filter((record) => {
        const recordedAt = new Date(record.recordedAt);
        return recordedAt >= weekRange.start && recordedAt < weekRange.end;
      }),
    [records, weekRange],
  );
  const weekTotal = useMemo(
    () => weekRecords.reduce((sum, record) => sum + record.finalCalories, 0),
    [weekRecords],
  );
  const dailyAverage = Math.round(weekTotal / 7);
  const photoRecordCount = weekRecords.filter(
    (record) => record.inputType === "photo" || record.inputType === "both",
  ).length;
  const photoRatio = weekRecords.length
    ? Math.round((photoRecordCount / weekRecords.length) * 100)
    : 0;
  const dailyTotals = useMemo(
    () =>
      weekRange.days.map((day) => ({
        ...day,
        calories: weekRecords
          .filter((record) => getLocalDayKey(new Date(record.recordedAt)) === day.key)
          .reduce((sum, record) => sum + record.finalCalories, 0),
      })),
    [weekRange, weekRecords],
  );
  const highestDailyTotal = Math.max(...dailyTotals.map((day) => day.calories), 0);
  const displayedRecords =
    mode === "all" && recordRange === "week" ? weekRecords : records;
  const deleteAllConfirmed = isDeleteAllConfirmed(deleteAllPhrase);

  function retryLoad() {
    setReady(false);
    setError("");
    setNeedsLogin(false);
    setLoadVersion((version) => version + 1);
  }

  async function remove(id: string) {
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    setError("");
    try {
      const response = await fetch(`/api/meal-records/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok) {
        setNeedsLogin(payload.error?.code === "UNAUTHORIZED");
        setError(payload.message || "기록을 삭제하지 못했습니다.");
        return;
      }
      setRecords((current) => current.filter((record) => record.id !== id));
    } catch {
      setError("기록을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function removeAll() {
    if (!deleteAllConfirmed || deleteAllBusy) return;

    setDeleteAllBusy(true);
    setDataActionError("");
    setDataActionMessage("");

    try {
      const response = await fetch("/api/meal-records", { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok) {
        if (payload.error?.code === "UNAUTHORIZED") setNeedsLogin(true);
        setDataActionError(payload.message || "전체 식사 기록을 삭제하지 못했습니다.");
        return;
      }

      const deletedCount = payload.data?.deletedCount ?? records.length;
      setRecords([]);
      setRecordRange("week");
      setDeleteAllOpen(false);
      setDeleteAllPhrase("");
      setDataActionMessage(`${deletedCount}개의 식사 기록을 삭제했습니다.`);
    } catch {
      setDataActionError("전체 식사 기록을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setDeleteAllBusy(false);
    }
  }

  if (!ready) {
    return (
      <p className="status-message" role="status" aria-live="polite">
        기록을 불러오고 있어요…
      </p>
    );
  }

  if (needsLogin) {
    const next = mode === "today" ? "/today" : "/mypage";

    return (
      <section className="empty-state">
        <span aria-hidden="true">○</span>
        <h2>로그인하고 기록을 관리하세요</h2>
        <p role="alert">{error || "저장한 식사 기록은 로그인한 계정에서만 볼 수 있어요."}</p>
        <Link className="primary-button" href={`/login?next=${next}`}>로그인하기</Link>
      </section>
    );
  }

  if (error && records.length === 0) {
    return (
      <section className="empty-state">
        <span aria-hidden="true">!</span>
        <h2>기록을 불러오지 못했어요</h2>
        <p role="alert">{error}</p>
        <button className="primary-button" type="button" onClick={retryLoad}>
          다시 시도하기
        </button>
      </section>
    );
  }

  return (
    <>
      {mode === "today" ? (
        <section className="summary-card today-summary">
          <span className="summary-card-icon" aria-hidden="true">
            <AppIcon name="sparkles" size={27} />
          </span>
          <div>
            <p>오늘 총 섭취량</p>
            <h1>{total.toLocaleString()} <span>kcal</span></h1>
            <small>{records.length}개의 식사 기록</small>
          </div>
        </section>
      ) : (
        <CalorieGoalCard todayCalories={dailyTotals.at(-1)?.calories ?? 0} />
      )}

      {error && (
        <div className="inline-recovery">
          <p role="alert">{error}</p>
          <button type="button" onClick={retryLoad}>다시 불러오기</button>
        </div>
      )}

      {mode === "all" && (
        <>
          <div className="insights-heading">
            <span aria-hidden="true"><AppIcon name="history" size={20} /></span>
            <div>
              <p>최근 기록 분석</p>
              <h2>7일 식사 리포트</h2>
            </div>
          </div>
          <section className="weekly-stats" aria-label="최근 7일 섭취 통계">
            <article>
              <span>7일 합계</span>
              <strong>{weekTotal.toLocaleString()} <small>kcal</small></strong>
            </article>
            <article>
              <span>하루 평균</span>
              <strong>{dailyAverage.toLocaleString()} <small>kcal</small></strong>
            </article>
            <article>
              <span>기록 횟수</span>
              <strong>{weekRecords.length} <small>회</small></strong>
            </article>
            <article>
              <span>사진 입력</span>
              <strong>{photoRatio} <small>%</small></strong>
            </article>
          </section>

          <section className="weekly-trend" aria-labelledby="weekly-trend-title">
            <div className="section-heading">
              <div>
                <h2 id="weekly-trend-title">7일 섭취 추이</h2>
                <p>{weekRange.days[0].dateLabel}부터 오늘까지</p>
              </div>
              <small>kcal</small>
            </div>
            <div className="weekly-trend-chart">
              {dailyTotals.map((day) => {
                const height = highestDailyTotal
                  ? Math.max((day.calories / highestDailyTotal) * 100, day.calories ? 10 : 4)
                  : 4;
                return (
                  <div
                    className="weekly-trend-day"
                    key={day.key}
                    aria-label={`${day.dateLabel} ${day.calories.toLocaleString()}킬로칼로리`}
                  >
                    <span>{day.calories ? day.calories.toLocaleString() : "0"}</span>
                    <div className="weekly-trend-track">
                      <i style={{ height: `${height}%` }} />
                    </div>
                    <strong>{day.label}</strong>
                  </div>
                );
              })}
            </div>
            <p className="retention-note">기록은 자동 삭제되지 않으며, 아래에서 직접 수정하거나 삭제할 수 있어요.</p>
          </section>

          <div className="record-range" role="group" aria-label="기록 조회 기간">
            <button
              type="button"
              className={recordRange === "week" ? "active" : ""}
              aria-pressed={recordRange === "week"}
              onClick={() => setRecordRange("week")}
            >
              최근 7일
            </button>
            <button
              type="button"
              className={recordRange === "all" ? "active" : ""}
              aria-pressed={recordRange === "all"}
              onClick={() => setRecordRange("all")}
            >
              전체 기록
            </button>
          </div>
        </>
      )}

      {displayedRecords.length ? (
        <section className={`record-list ${mode === "today" ? "today-list" : ""}`} aria-label="식사 기록">
          <div className="section-heading">
            <h2>
              {mode === "today"
                ? "오늘의 식사"
                : recordRange === "week"
                  ? "최근 7일 기록"
                  : "전체 기록"}
            </h2>
            {mode === "today" && <Link href="/mypage">전체 보기</Link>}
          </div>
          {displayedRecords.map((record) => (
            <article className={`record-card ${record.mealType}`} key={record.id}>
              <div className={`meal-dot ${record.mealType}`} aria-hidden="true" />
              <div className="record-main">
                <div>
                  <span>
                    {MEAL_LABELS[record.mealType]}
                    <i className="meal-emoji" aria-hidden="true">{MEAL_EMOJIS[record.mealType]}</i>
                    {mode === "all" && (
                      <i className="input-type">
                        {record.inputType === "photo" ? "사진" : record.inputType === "both" ? "사진+텍스트" : "직접 입력"}
                      </i>
                    )}
                  </span>
                  <strong>{record.foodName}</strong>
                  <small>{record.amount} · {formatRecordTime(record.recordedAt, mode === "all")}</small>
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
          <h2>
            {mode === "today"
              ? "오늘 기록이 아직 없어요"
              : records.length
                ? "최근 7일 기록이 없어요"
                : "저장된 기록이 없어요"}
          </h2>
          <p>
            {mode === "all" && records.length
              ? "이전 기록은 전체 기록에서 확인할 수 있어요."
              : "첫 식사를 기록하면 여기에 차곡차곡 모아드려요."}
          </p>
          {mode === "all" && records.length ? (
            <button className="primary-button" type="button" onClick={() => setRecordRange("all")}>
              전체 기록 보기
            </button>
          ) : (
            <Link className="primary-button" href="/record">식사 기록하기</Link>
          )}
        </section>
      )}

      {mode === "all" && records.length > 0 && (
        <section id="record-data-control" className="record-data-control" aria-labelledby="record-data-control-title">
          <div>
            <p>데이터 관리</p>
            <h2 id="record-data-control-title">모든 식사 기록 삭제</h2>
            <small>목표 칼로리와 로그인 계정은 유지되고, 저장된 식사 기록만 모두 삭제돼요.</small>
          </div>

          {deleteAllOpen ? (
            <div className="delete-all-confirm">
              <strong>삭제한 기록은 되돌릴 수 없어요.</strong>
              <label htmlFor="delete-all-phrase">
                계속하려면 <b>{DELETE_ALL_CONFIRMATION}</b>를 입력해 주세요.
              </label>
              <input
                id="delete-all-phrase"
                type="text"
                value={deleteAllPhrase}
                onChange={(event) => setDeleteAllPhrase(event.target.value)}
                autoComplete="off"
                disabled={deleteAllBusy}
              />
              <p className={`delete-all-status ${deleteAllConfirmed ? "confirmed" : ""}`} aria-live="polite">
                {deleteAllConfirmed ? "삭제 확인 문구가 입력되었습니다." : `확인 문구: ${DELETE_ALL_CONFIRMATION}`}
              </p>
              {dataActionError && <p role="alert">{dataActionError}</p>}
              <div>
                <button
                  className="delete-all-submit"
                  type="button"
                  onClick={removeAll}
                  disabled={!deleteAllConfirmed || deleteAllBusy}
                >
                  {deleteAllBusy ? "삭제하는 중…" : "모든 기록 삭제"}
                </button>
                <button
                  className="delete-all-cancel"
                  type="button"
                  onClick={() => {
                    setDeleteAllOpen(false);
                    setDeleteAllPhrase("");
                    setDataActionError("");
                  }}
                  disabled={deleteAllBusy}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              className="delete-all-open"
              type="button"
              onClick={() => {
                setDeleteAllOpen(true);
                setDataActionMessage("");
              }}
            >
              전체 기록 삭제하기
            </button>
          )}
        </section>
      )}

      {mode === "all" && dataActionMessage && (
        <p className="data-action-success" role="status" aria-live="polite">
          {dataActionMessage}
        </p>
      )}
    </>
  );
}
