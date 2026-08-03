# Calorie Calculator

음식 사진 또는 텍스트로 식사를 기록하고 칼로리를 **추정치**로 제공하는 Next.js 앱입니다. 사용자가 수정한 칼로리 값은 최종값으로 저장합니다.

## 빠른 시작

```bash
npm ci
Copy-Item .env.example .env.local
npm run test:calorie
npm run build
npm run dev
```

`.env.local`에는 실제 서비스 설정값만 넣고 Git에 커밋하지 않습니다. 필요한 변수와 보안 규칙은 [ENVIRONMENT.md](ENVIRONMENT.md)를 참고하세요.

## 식품영양 데이터

`data/source/official-raw-foods.csv`는 공식 원재료성 식품 데이터의 로컬 스냅샷입니다. `npm run generate:calorie-data`가 이 파일을 앱 검색용 카탈로그로 변환합니다. 기준량(g)과 에너지가 모두 있는 식품만 g 계산을 제공하며, 조리 상태가 다른 식품은 별도 항목으로 선택합니다.

운영 환경에서는 `supabase/migrations/20260803110000_add_food_reference_data.sql`의 `foods` 테이블에 공식 데이터를 서버 전용 동기화 작업으로 적재합니다. 사용자 검색 시 외부 API를 직접 호출하지 않습니다.

먼저 `npm run sync:foods:dry-run`으로 변환 건수·식품코드 중복·g 기준량을 DB에 쓰지 않고 검증합니다. Supabase SQL Editor 또는 CLI로 마이그레이션을 적용한 뒤, `npm run sync:foods`, `npm run verify:foods` 순으로 실행해 원재료성 식품을 적재하고 DB의 건수·식품코드·기준량·에너지 표본을 대조합니다. 동기화와 검증 명령은 `.env.local`의 서버 전용 키를 사용하며, 키를 출력하거나 커밋하지 않습니다.

## 다른 컴퓨터에서 이어서 작업하기

Git 번들 백업과 시작 안내를 USB로 옮기는 절차, 무결성 확인, Codex 시작 프롬프트는 [PORTABLE_BACKUP_GUIDE.md](PORTABLE_BACKUP_GUIDE.md)에 정리되어 있습니다.

## 문서

- [AGENTS.md](AGENTS.md) — 작업 원칙과 보안 규칙
- [PROJECT_BRIEF.md](PROJECT_BRIEF.md) — 프로젝트 개요
- [UI_REFERENCE.md](UI_REFERENCE.md) — UI 기준
- [API_CONTRACT.md](API_CONTRACT.md) — API 계약
- [DATA_MODEL.md](DATA_MODEL.md) — 데이터 모델
- [ROUTES_AND_FLOWS.md](ROUTES_AND_FLOWS.md) — 화면 흐름
- [ENVIRONMENT.md](ENVIRONMENT.md) — 환경변수
- [TEST_CHECKLIST.md](TEST_CHECKLIST.md) — 검증 항목
