import Link from "next/link";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { signInWithGoogle } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <main className="auth-page">
      <Link className="auth-back" href="/" aria-label="홈으로 돌아가기">
        ←
      </Link>
      <div className="food-decoration food-decoration-top" aria-hidden="true">
        <span>●</span><span>●</span><span>●</span>
      </div>
      <section className="auth-card">
        <p className="auth-kicker">Calorie Calculator</p>
        <h1>반가워요!</h1>
        <p>Google 계정으로 로그인하고 식사 기록을 이어가세요.</p>
        {error === "missing-config" && (
          <p className="error">Supabase 환경변수 설정이 필요합니다.</p>
        )}
        {error === "oauth-init" && (
          <p className="error">Google 로그인을 시작하지 못했습니다. Supabase Google 공급자 설정을 확인해 주세요.</p>
        )}
        {error === "oauth-origin" && (
          <p className="error">로그인에 사용할 앱 주소를 확인하지 못했습니다. 앱 URL 설정을 확인해 주세요.</p>
        )}
        {error === "oauth-provider" && (
          <p className="error">Google에서 로그인이 취소되었거나 거부되었습니다.</p>
        )}
        {error === "oauth-exchange" && (
          <p className="error">로그인 세션을 만들지 못했습니다. 콜백 URL 설정을 확인해 주세요.</p>
        )}
        {error === "oauth-callback" && (
          <p className="error">로그인 콜백에 인증 코드가 없습니다. 리다이렉트 설정을 확인해 주세요.</p>
        )}
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={safeNext} />
          <GoogleLoginButton />
        </form>
        <Link className="guest-link" href="/">
          게스트로 계속하기
        </Link>
      </section>
      <div className="food-decoration food-decoration-bottom" aria-hidden="true">
        <span>●</span><span>●</span>
      </div>
    </main>
  );
}
