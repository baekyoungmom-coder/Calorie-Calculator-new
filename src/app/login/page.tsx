import Link from "next/link";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { signInWithGoogle } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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
        {error === "oauth" && (
          <p className="error">로그인하지 못했습니다. 다시 시도해 주세요.</p>
        )}
        <form action={signInWithGoogle}>
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
