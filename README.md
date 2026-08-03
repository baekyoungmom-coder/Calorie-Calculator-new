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
