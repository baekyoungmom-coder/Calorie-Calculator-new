import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { RecordsView } from "@/components/RecordsView";
import { createClient } from "@/lib/supabase/server";
import { AppIcon } from "@/components/AppIcon";

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
    <main className="shell">
      <Header title="마이페이지" />
      <section className="profile-card">
        <div className="avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</div>
        <div>
          <strong>{name}</strong>
          <p>{user?.email ?? "로그인하면 기록을 안전하게 저장할 수 있어요."}</p>
        </div>
        <Link className="profile-record-link" href="/record"><AppIcon name="plus" size={16} /> 새 기록</Link>
      </section>
      <RecordsView mode="all" />
      <BottomNav />
    </main>
  );
}
