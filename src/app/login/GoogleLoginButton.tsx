"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export function GoogleLoginButton() {
  const { pending } = useFormStatus();
  const [callbackOrigin, setCallbackOrigin] = useState("");

  useEffect(() => {
    setCallbackOrigin(window.location.origin);
  }, []);

  return (
    <>
      <input type="hidden" name="callbackOrigin" value={callbackOrigin} />
      <button className="google-button" type="submit" disabled={pending}>
      <span className="google-mark" aria-hidden="true">G</span>
      {pending ? "로그인 페이지 여는 중…" : "Google로 로그인"}
      </button>
    </>
  );
}
