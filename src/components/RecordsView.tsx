"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MealRecord,
  MEAL_LABELS,
  deleteRecord,
  getRecords,
  isToday,
} from "@/lib/meals";

export function RecordsView({ mode }: { mode: "today" | "all" }) {
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecords(getRecords());
    setReady(true);
  }, []);

  const visibleRecords = useMemo(
    () => (mode === "today" ? records.filter((record) => isToday(record.recordedAt)) : records),
    [mode, records],
  );
  const total = visibleRecords.reduce((sum, record) => sum + record.estimatedCalories, 0);

  function remove(id: string) {
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    deleteRecord(id);
    setRecords((current) => current.filter((record) => record.id !== id));
  }

  if (!ready) return <p className="status-message">기록을 불러오고 있어요…</p>;

  return (
    <>
      <section className="summary-card">
        <p>{mode === "today" ? "오늘 총 섭취량" : "저장된 기록 합계"}</p>
        <h1>{total.toLocaleString()} <span>kcal</span></h1>
        <small>{visibleRecords.length}개의 식사 기록</small>
      </section>

      {visibleRecords.length ? (
        <section className="record-list" aria-label="식사 기록">
          <div className="section-heading">
            <h2>{mode === "today" ? "오늘의 식사" : "이전 식사 기록"}</h2>
            {mode === "today" && <Link href="/mypage">전체 보기</Link>}
          </div>
          {visibleRecords.map((record) => (
            <article className="record-card" key={record.id}>
              <div className={`meal-dot ${record.mealType}`} aria-hidden="true" />
              <div className="record-main">
                <div>
                  <span>{MEAL_LABELS[record.mealType]} · {new Date(record.recordedAt).toLocaleDateString("ko-KR")}</span>
                  <strong>{record.foodName}</strong>
                  <small>{record.amount} · {new Date(record.recordedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</small>
                </div>
                <b>{record.estimatedCalories.toLocaleString()} kcal</b>
              </div>
              <button className="delete-button" type="button" onClick={() => remove(record.id)} aria-label={`${record.foodName} 기록 삭제`}>
                삭제
              </button>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <span aria-hidden="true">○</span>
          <h2>{mode === "today" ? "오늘 기록이 아직 없어요" : "저장된 기록이 없어요"}</h2>
          <p>첫 식사를 기록하면 여기에 차곡차곡 모아드려요.</p>
          <Link className="primary-button" href="/record">식사 기록하기</Link>
        </section>
      )}
    </>
  );
}
