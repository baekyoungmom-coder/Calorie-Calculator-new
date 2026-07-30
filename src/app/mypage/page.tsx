import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { RecordsView } from "@/components/RecordsView";
import { createClient } from "@/lib/supabase/server";
import { AppIcon } from "@/components/AppIcon";
import { PageHero } from "@/components/PageHero";
import { signOut } from "@/app/login/actions";
import { AccountDeletionCard } from "@/components/AccountDeletionCard";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const name =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "게스트 사용자";

  return (
    <main className="shell mypage-page">
      <Header title="마이페이지" />
      <PageHero
        eyebrow="나의 식사 리포트"
        title="기록의 흐름을 살펴봐요"
        description="목표 칼로리와 최근 7일의 식사 기록을 함께 확인할 수 있어요."
        icon="user"
        tone="lavender"
        compact
      />
      <section className="profile-card">
        <div className="avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</div>
        <div>
          <strong>{name}</strong>
          <p>{user?.email ?? "로그인하면 기록을 안전하게 저장할 수 있어요."}</p>
        </div>
        <div className="profile-actions">
          <Link className="profile-record-link" href="/record"><AppIcon name="plus" size={16} /> 새 기록</Link>
          {user ? (
            <form action={signOut}>
              <button className="profile-logout-button" type="submit">
                로그아웃
              </button>
            </form>
          ) : (
            <Link className="profile-login-link" href="/login?next=/mypage">
              로그인
            </Link>
          )}
        </div>
      </section>
      <details className="data-guide">
        <summary>
          <span><AppIcon name="user" size={18} /></span>
          <strong>내 데이터는 어떻게 관리되나요?</strong>
        </summary>
        <div>
          <p>최근 7일을 우선 보여주지만 식사 기록은 자동으로 삭제되지 않아요.</p>
          <ul>
            <li>각 기록은 목록에서 직접 수정하거나 삭제할 수 있어요.</li>
            <li>저장된 모든 식사 기록은 마이페이지 아래에서 한 번에 삭제할 수 있어요.</li>
            <li>목표 칼로리는 언제든 수정하거나 해제할 수 있어요.</li>
            <li>선택한 음식 사진 파일은 현재 서버에 저장하지 않아요.</li>
          </ul>
          <Link href="/privacy">개인정보·데이터 이용 안내 보기 <span aria-hidden="true">→</span></Link>
        </div>
      </details>
      <RecordsView mode="all" />
      {user && <AccountDeletionCard />}
      <BottomNav />
    </main>
  );
}
