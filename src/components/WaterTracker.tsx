"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type WaterEntry = {
  id: string;
  amount: number;
  recordedAt: string;
};

type WaterStore = Record<string, WaterEntry[]>;

const STORAGE_KEY = "calorie-calculator-water-records";
const DAILY_GOAL = 2000;

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function readWaterStore(): WaterStore {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as WaterStore;
  } catch {
    return {};
  }
}

export function WaterTracker() {
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntries(readWaterStore()[todayKey()] ?? []);
    setReady(true);
  }, []);

  const total = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.amount, 0),
    [entries],
  );
  const progress = Math.min(100, Math.round((total / DAILY_GOAL) * 100));

  function persist(nextEntries: WaterEntry[]) {
    const store = readWaterStore();
    store[todayKey()] = nextEntries;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    setEntries(nextEntries);
  }

  function addWater(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0 || amount > 5000) return;

    persist([
      ...entries,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        amount: Math.round(amount),
        recordedAt: new Date().toISOString(),
      },
    ]);
  }

  function submitCustomAmount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(customAmount);
    addWater(amount);
    if (amount > 0 && amount <= 5000) setCustomAmount("");
  }

  function undoLastEntry() {
    if (!entries.length) return;
    persist(entries.slice(0, -1));
  }

  return (
    <section className="water-card" aria-labelledby="water-title">
      <div className="water-heading">
        <div>
          <p className="water-kicker">오늘의 수분</p>
          <h2 id="water-title">물 섭취량</h2>
        </div>
        <span className="water-goal">목표 {DAILY_GOAL.toLocaleString()}ml</span>
      </div>

      <div className="water-total" aria-live="polite">
        <strong>{ready ? total.toLocaleString() : "—"}</strong>
        <span>ml</span>
        <small>{ready ? `${progress}% 달성` : "기록 불러오는 중"}</small>
      </div>

      <div className="water-progress" aria-label={`목표의 ${progress}% 달성`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="water-actions" aria-label="물 빠른 기록">
        <button type="button" onClick={() => addWater(250)}>+ 250ml</button>
        <button type="button" onClick={() => addWater(500)}>+ 500ml</button>
        <button
          className="water-undo"
          type="button"
          onClick={undoLastEntry}
          disabled={!entries.length}
        >
          마지막 기록 취소
        </button>
      </div>

      <form className="water-custom-form" onSubmit={submitCustomAmount}>
        <label htmlFor="water-amount">직접 입력</label>
        <div>
          <input
            id="water-amount"
            type="number"
            inputMode="numeric"
            min="1"
            max="5000"
            placeholder="예: 330"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
          />
          <span>ml</span>
          <button type="submit" disabled={!customAmount}>추가</button>
        </div>
      </form>
    </section>
  );
}
