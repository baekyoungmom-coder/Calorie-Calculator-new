"use client";

import { useState } from "react";

export function GoogleLoginButton({ next }: { next: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callbackOrigin: window.location.origin, next }),
    });
    const payload = (await response.json()) as {
      data?: { url?: string };
    };

    if (!response.ok || !payload.data?.url) {
      setError("Google 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setPending(false);
      return;
    }

    window.location.assign(payload.data.url);
  }

  return (
    <>
      <button className="google-button" type="button" onClick={signIn} disabled={pending}>
      <span className="google-mark" aria-hidden="true">G</span>
      {pending ? "로그인 페이지 여는 중…" : "Google로 로그인"}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </>
  );
}
