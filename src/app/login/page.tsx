import Image from "next/image";
import Link from "next/link";
import { AppIcon } from "@/components/AppIcon";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { signInWithGoogle } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; error?: string; next?: string }>;
}) {
  const { account, error, next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <main className="auth-page clay-auth-page">
      <Link className="auth-back" href="/" aria-label="홈으로 돌아가기">
        <AppIcon name="arrow-left" />
      </Link>
      <section className="auth-visual" aria-hidden="true">
        <span className="auth-visual-orb" />
        <Image
          src="/images/ui/clay-login-profile.png"
          alt=""
          width={124}
          height={124}
          priority
        />
        <p>나의 식사 기록</p>
      </section>
      <section className="auth-card">
        <p className="auth-kicker">CALORIE CALCULATOR</p>
        <h1>식사 기록을<br />안전하게 이어가세요</h1>
        <p>Google 계정으로 로그인하면 목표와 지난 기록을 어느 기기에서나 확인할 수 있어요.</p>
        <ul className="auth-benefits">
          <li><AppIcon name="clipboard" size={18} /> 저장한 식사 기록 관리</li>
          <li><AppIcon name="history" size={18} /> 최근 7일 섭취 흐름 확인</li>
        </ul>
        {account === "deleted" && (
          <p className="success">회원 탈퇴가 완료되었습니다.</p>
        )}
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
        <small className="auth-note">로그인 없이도 칼로리 계산을 3회 체험할 수 있어요.</small>
        <Link className="auth-privacy-link" href="/privacy">
          개인정보·데이터 이용 안내
        </Link>
      </section>
    </main>
  );
}
