"use client";

import { useState } from "react";
import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/account-deletion";

type ApiResponse = {
  success: boolean;
  message: string;
  data: { deleted?: boolean } | null;
  error: { code: string } | null;
};

export function AccountDeletionCard() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canDelete =
    confirmation === ACCOUNT_DELETION_CONFIRMATION &&
    acknowledged &&
    !busy;

  function close() {
    if (busy) return;
    setOpen(false);
    setConfirmation("");
    setAcknowledged(false);
    setError("");
  }

  async function deleteAccount() {
    if (!canDelete) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation, acknowledged }),
      });
      const payload = (await response.json()) as ApiResponse;

      if (!response.ok) {
        setError(payload.message || "회원 탈퇴를 완료하지 못했습니다.");
        return;
      }

      window.location.replace("/login?account=deleted");
    } catch {
      setError("회원 탈퇴를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-deletion-card" aria-labelledby="account-deletion-title">
      <div>
        <p>계정 관리</p>
        <h2 id="account-deletion-title">회원 탈퇴</h2>
        <small>Calorie Calculator 계정과 연결된 정보를 모두 삭제해요.</small>
      </div>

      {open ? (
        <div className="account-deletion-confirm">
          <strong>탈퇴하면 되돌릴 수 없어요.</strong>
          <ul>
            <li>프로필, 목표 칼로리와 모든 식사 기록이 삭제돼요.</li>
            <li>Google 계정 자체는 삭제되지 않아요.</li>
            <li>다시 로그인하면 새로운 계정으로 시작해요.</li>
          </ul>
          <label className="account-deletion-check">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              disabled={busy}
            />
            <span>위 내용을 확인했으며 계정 삭제에 동의합니다.</span>
          </label>
          <label htmlFor="account-deletion-phrase">
            계속하려면 <b>{ACCOUNT_DELETION_CONFIRMATION}</b>를 입력해 주세요.
          </label>
          <input
            id="account-deletion-phrase"
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            disabled={busy}
          />
          {error && <p role="alert">{error}</p>}
          <div className="account-deletion-actions">
            <button
              className="account-deletion-submit"
              type="button"
              onClick={deleteAccount}
              disabled={!canDelete}
            >
              {busy ? "탈퇴 처리 중…" : "계정 영구 삭제"}
            </button>
            <button
              className="account-deletion-cancel"
              type="button"
              onClick={close}
              disabled={busy}
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          className="account-deletion-open"
          type="button"
          onClick={() => setOpen(true)}
        >
          회원 탈퇴 안내 보기
        </button>
      )}
    </section>
  );
}
