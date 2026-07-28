import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <div className="landing-orb" aria-hidden="true">
        <span>●</span>
      </div>
      <p className="eyebrow">하루 한 끼부터 가볍게</p>
      <h1>Calorie<br />Calculator</h1>
      <p className="lead">
        사진을 올리거나 직접 입력하고,
        <br />
        오늘의 식사를 간편하게 기록하세요.
      </p>
      <div className="action-stack">
        <Link className="primary-button" href="/record/photo">
          <span>사진으로 시작하기</span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="secondary-button" href="/record/text">
          직접 입력하기
        </Link>
      </div>
      <nav className="quick-nav" aria-label="기록 메뉴">
        <Link href="/record">입력 방식 보기</Link>
        <Link href="/today">오늘 기록</Link>
        <Link href="/mypage">지난 기록</Link>
      </nav>
      <p className="privacy-note">기록은 이 브라우저에만 저장됩니다.</p>
    </main>
  );
}
