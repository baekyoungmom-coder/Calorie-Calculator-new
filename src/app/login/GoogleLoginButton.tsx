"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";

export function GoogleLoginButton({ next }: { next: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setError("Supabase 설정을 확인해 주세요.");
      return;
    }

    setPending(true);
    setError("");
    const supabase = createBrowserClient(url, key);
    const { data, error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (signInError || !data.url) {
      setError("Google 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setPending(false);
      return;
    }

    window.location.assign(data.url);
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
