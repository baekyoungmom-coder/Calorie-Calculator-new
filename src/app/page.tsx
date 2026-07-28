import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const name =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "사용자";
  const avatarUrl =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture;

  return (
    <main className="landing">
      <div className="landing-fruit landing-fruit-top" aria-hidden="true">
        <span>●</span><span>●</span><span>●</span>
      </div>
      <p className="landing-brand">
        <span>칼로리</span>
        <strong>계산기</strong>
      </p>
      <h1>오늘 먹은 음식,<br />간편하게 기록해보세요.</h1>
      <p className="lead">
        사진을 찍거나 직접 입력하여<br />
        식단과 칼로리를 똑똑하게 관리하세요.
      </p>
      <div className="action-stack">
        <Link className="landing-photo-button" href="/record/photo">
          <span aria-hidden="true">▣</span>
          사진으로 시작
        </Link>
        <Link className="landing-text-button" href="/record/text">
          <span aria-hidden="true">✎</span>
          직접 입력 시작
        </Link>
      </div>
      {user ? (
        <section className="landing-user" aria-label="로그인한 사용자">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="landing-user-fallback" aria-hidden="true">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <strong>{name}</strong>
            <small>{user.email}</small>
          </div>
          <form action={signOut}>
            <button type="submit">로그아웃</button>
          </form>
        </section>
      ) : (
        <Link className="login-link" href="/login">
          로그인 / 계속하기 ↗
        </Link>
      )}
      <nav className="quick-nav" aria-label="기록 메뉴">
        <Link href="/today">오늘 기록</Link>
        <Link href="/mypage">지난 기록</Link>
      </nav>
      <div className="landing-fruit landing-fruit-bottom" aria-hidden="true">
        <span>●</span><span>●</span>
      </div>
    </main>
  );
}
