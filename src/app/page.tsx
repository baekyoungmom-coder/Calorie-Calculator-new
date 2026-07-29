import Link from "next/link";
import Image from "next/image";
import { AppIcon } from "@/components/AppIcon";
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
    "게스트";
  const avatarUrl =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture;
  const date = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <main className="landing dashboard-home">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-date">{date}</p>
          <h1>오늘의 식사를<br />가볍게 기록해요.</h1>
        </div>
        {user ? (
          <form action={signOut}>
            <button className="dashboard-account" type="submit" aria-label="로그아웃">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
              )}
            </button>
          </form>
        ) : (
          <Link className="dashboard-login-button" href="/login">
            <span className="clay-login-avatar"><Image src="/images/ui/clay-login-profile.png" alt="" width={44} height={44} /></span>
            <span>로그인</span>
          </Link>
        )}
      </header>

      <section className="dashboard-summary" aria-label="오늘 기록 안내">
        <div>
          <p>오늘의 식사 기록</p>
          <strong>한 끼씩, 편안하게</strong>
          <small>칼로리는 항상 추정치이며 저장 전 직접 수정할 수 있어요.</small>
        </div>
        <span className="dashboard-summary-icon"><AppIcon name="sparkles" size={32} /></span>
      </section>

      <section className="dashboard-actions" aria-labelledby="quick-record-title">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">빠른 기록</p>
            <h2 id="quick-record-title">어떻게 기록할까요?</h2>
          </div>
          <Link href="/record">전체 보기</Link>
        </div>
        <div className="dashboard-action-grid">
          <Link className="dashboard-action photo" href="/record/photo">
            <span className="dashboard-action-icon clay-action-icon">
              <Image src="/images/ui/clay-camera.png" alt="" width={78} height={78} priority />
            </span>
            <strong>사진으로 기록</strong>
            <small>사진을 선택한 뒤 음식과 양을 확인해요</small>
            <b className="action-arrow"><AppIcon name="arrow-right" size={20} /></b>
          </Link>
          <Link className="dashboard-action text" href="/record/text">
            <span className="dashboard-action-icon clay-action-icon">
              <Image src="/images/ui/clay-notepad.png" alt="" width={78} height={78} priority />
            </span>
            <strong>직접 입력</strong>
            <small>음식 이름과 양을 바로 적어요</small>
            <b className="action-arrow"><AppIcon name="arrow-right" size={20} /></b>
          </Link>
        </div>
      </section>

      <section className="dashboard-history" aria-labelledby="history-title">
        <div className="dashboard-history-heading">
          <p className="eyebrow">기록 살펴보기</p>
          <h2 id="history-title">오늘 기록과 지난 식사</h2>
        </div>
        <div className="dashboard-history-links">
          <Link className="history-card history-card-today" href="/today">
            <Image className="history-card-icon" src="/images/ui/clay-calendar.png" alt="" width={78} height={78} />
            <span className="history-card-copy"><strong>오늘 기록</strong><small>저장한 식사를 오늘 기록에서 확인해요.</small></span>
            <span className="history-arrow"><AppIcon name="arrow-right" size={19} /></span>
          </Link>
          <Link className="history-card history-card-past" href="/mypage">
            <Image className="history-card-icon" src="/images/ui/clay-clock.png" alt="" width={78} height={78} />
            <span className="history-card-copy"><strong>지난 기록</strong><small>과거 식사 기록을 확인해요.</small></span>
            <span className="history-arrow"><AppIcon name="arrow-right" size={19} /></span>
          </Link>
        </div>
      </section>

      {user ? (
        <p className="dashboard-user-note">{name}님으로 로그인되어 있어요.</p>
      ) : (
        <Link className="dashboard-login-note" href="/login">로그인하면 식사 기록을 안전하게 이어갈 수 있어요. <span aria-hidden="true">→</span></Link>
      )}
    </main>
  );
}
