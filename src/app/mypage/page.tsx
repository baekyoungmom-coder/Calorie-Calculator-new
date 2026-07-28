import Link from "next/link";
import { Header } from "@/components/Header";
import { RecordsView } from "@/components/RecordsView";

export default function MyPage() {
  return (
    <main className="shell">
      <Header title="지난 기록" />
      <section className="profile-card">
        <div className="avatar" aria-hidden="true">G</div>
        <div>
          <strong>게스트 사용자</strong>
          <p>이 브라우저에 안전하게 보관 중</p>
        </div>
        <Link href="/record">새 기록</Link>
      </section>
      <RecordsView mode="all" />
    </main>
  );
}
