"use client";

import { useFormStatus } from "react-dom";

export function GoogleLoginButton() {
  const { pending } = useFormStatus();

  return (
    <button className="google-button" type="submit" disabled={pending}>
      <span className="google-mark" aria-hidden="true">G</span>
      {pending ? "로그인 페이지 여는 중…" : "Google로 로그인"}
    </button>
  );
}
