# ENVIRONMENT.md

## 목적

Calorie Calculator 앱의 개발 및 배포 환경에서 필요한 설정값을 정리한다.

## 환경 변수

### 인증
- NEXT_PUBLIC_SUPABASE_URL=
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
- NEXT_PUBLIC_APP_URL=http://localhost:3000 (요청 도메인을 확인할 수 없을 때만 사용하는 폴백)
- SUPABASE_SECRET_KEY=

### 칼로리 추정
- OPENAI_API_KEY=
- VISION_API_KEY=

### 저장소 / 업로드
- NEXT_PUBLIC_STORAGE_BUCKET=

### 선택 사항
- NEXT_PUBLIC_APP_URL=
- NODE_ENV=

## 규칙

- 민감한 값은 `.env.example`에 실제 값 없이 기입한다.
- 운영 비밀키는 저장소에 커밋하지 않는다.
- 브라우저에 노출되는 값은 `NEXT_PUBLIC_` 접두사를 사용한다.
- 서버 전용 비밀값은 클라이언트 코드에서 직접 읽지 않는다.
- 없는 값은 런타임에 명확한 오류로 안내한다.
