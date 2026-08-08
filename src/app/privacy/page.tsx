import Link from "next/link";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";

const LAST_UPDATED = "2026년 7월 30일";

export default function PrivacyPage() {
  return (
    <main className="shell privacy-page">
      <Header title="데이터 이용 안내" backHref="/mypage" />
      <PageHero
        eyebrow="개인정보·데이터"
        title="어떤 정보를 어떻게 쓰나요?"
        description="현재 앱 구현을 기준으로 저장되는 정보와 사용자가 관리할 수 있는 범위를 안내해요."
        icon="user"
        tone="lavender"
        compact
      />

      <section className="privacy-highlight" aria-labelledby="privacy-summary-title">
        <p>한눈에 보기</p>
        <h1 id="privacy-summary-title">기록에 필요한 정보만 사용해요</h1>
        <ul>
          <li>식사 기록은 로그인한 사용자 본인만 조회하도록 제한돼요.</li>
          <li>사진 파일은 현재 서버에 업로드하거나 저장하지 않아요.</li>
          <li>식사 기록은 수정·삭제하고 목표 칼로리는 수정·해제할 수 있어요.</li>
        </ul>
      </section>

      <section className="privacy-section" aria-labelledby="privacy-purpose-title">
        <p>01</p>
        <h2 id="privacy-purpose-title">사용 목적과 저장 항목</h2>
        <dl>
          <div>
            <dt>로그인과 프로필</dt>
            <dd>Google 로그인으로 받은 사용자 ID, 이름, 이메일, 프로필 이미지 주소와 최근 로그인 시각을 계정 확인에 사용해요.</dd>
          </div>
          <div>
            <dt>식사 기록</dt>
            <dd>입력 방식, 식사 종류, 음식명, 양, 선택 메모, 추정·최종 칼로리, 기록 시각과 기기 시간대를 저장해 기록 조회와 통계에 사용해요.</dd>
          </div>
          <div>
            <dt>하루 목표</dt>
            <dd>사용자가 직접 입력한 목표 칼로리를 오늘 섭취량과 비교하는 데 사용해요.</dd>
          </div>
          <div>
            <dt>게스트 체험</dt>
            <dd>체험 횟수 확인을 위한 무작위 결과 ID를 브라우저 쿠키에 최대 1년 동안 저장해요. 음식명이나 계정 정보는 이 쿠키에 넣지 않아요.</dd>
          </div>
        </dl>
      </section>

      <section className="privacy-section" aria-labelledby="privacy-device-title">
        <p>02</p>
        <h2 id="privacy-device-title">사진과 브라우저 임시 데이터</h2>
        <dl>
          <div>
            <dt>음식 사진</dt>
            <dd>선택한 사진은 미리보기를 위해 현재 브라우저에서만 표시하며 서비스 서버로 전송하거나 식사 기록에 저장하지 않아요.</dd>
          </div>
          <div>
            <dt>작성 중인 기록</dt>
            <dd>결과 화면 이동과 로그인 복귀를 위해 작성 중인 음식 정보를 브라우저 세션에 임시 보관해요. 저장을 마치면 제거되며 브라우저 세션이 끝나도 사라져요.</dd>
          </div>
        </dl>
      </section>

      <section className="privacy-section" aria-labelledby="privacy-retention-title">
        <p>03</p>
        <h2 id="privacy-retention-title">보관과 삭제</h2>
        <ul>
          <li>식사 기록은 자동 삭제되지 않으며 사용자가 개별 기록을 삭제할 때까지 보관돼요.</li>
          <li>마이페이지에서 저장된 모든 식사 기록을 한 번에 삭제할 수 있어요.</li>
          <li>하루 목표는 사용자가 해제하거나 변경할 때까지 보관돼요.</li>
          <li>계정 프로필은 로그인과 기록 연결을 위해 계정을 사용하는 동안 보관돼요.</li>
          <li>회원 탈퇴를 완료하면 계정 프로필과 연결된 기록이 함께 삭제돼요.</li>
        </ul>
      </section>

      <section className="privacy-section" aria-labelledby="privacy-provider-title">
        <p>04</p>
        <h2 id="privacy-provider-title">서비스 제공에 사용하는 외부 서비스</h2>
        <dl>
          <div>
            <dt>Google</dt>
            <dd>사용자가 선택한 Google 계정으로 로그인하는 데 사용해요.</dd>
          </div>
          <div>
            <dt>Supabase</dt>
            <dd>로그인 인증과 사용자별 프로필·식사 기록·목표 칼로리 저장에 사용해요.</dd>
          </div>
          <div>
            <dt>Vercel</dt>
            <dd>웹 앱을 제공하고 서버 요청을 처리하는 호스팅 환경으로 사용해요.</dd>
          </div>
        </dl>
      </section>

      <section className="privacy-section" aria-labelledby="privacy-rights-title">
        <p>05</p>
        <h2 id="privacy-rights-title">사용자가 할 수 있는 일</h2>
        <ul>
          <li>식사 기록의 음식명, 양, 칼로리, 시간과 메모 수정</li>
          <li>개별 식사 기록 삭제</li>
          <li>저장된 모든 식사 기록 삭제</li>
          <li>하루 목표 칼로리 수정 또는 해제</li>
          <li>마이페이지에서 회원 탈퇴</li>
          <li>마이페이지에서 로그아웃</li>
        </ul>
      </section>

      <section className="privacy-draft-note" aria-labelledby="privacy-release-title">
        <h2 id="privacy-release-title">정식 공개 전 확인 사항</h2>
        <p>
          이 페이지는 현재 구현을 설명하는 데이터 이용 안내입니다. 정식 공개 전에는
          운영자 정보와 문의 방법, 정확한 보유기간, 처리 위탁·국외 이전 상세,
          이용자 문의 절차를 확정한 개인정보처리방침이 필요해요.
        </p>
      </section>

      <footer className="privacy-footer">
        <small>마지막 수정: {LAST_UPDATED}</small>
        <Link href="/mypage">마이페이지로 돌아가기</Link>
      </footer>
    </main>
  );
}
