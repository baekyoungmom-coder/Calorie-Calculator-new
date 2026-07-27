# DATA_MODEL.md

## 목적

Calorie Calculator 앱에서 저장해야 하는 데이터 구조를 정의한다.

## 핵심 원칙

- 사용자 계정 기준으로 데이터를 분리한다.
- 사진 입력, 텍스트 입력, 결과 저장을 구분한다.
- 추정값과 확정값을 구분한다.
- 민감한 데이터는 필요한 범위만 저장한다.
- 원본 LLM 응답이나 불필요한 외부 API 전체 응답은 저장하지 않는다.

## 엔터티

### 1. profiles
사용자 프로필 정보

필드 예시:
- id
- name
- email
- avatar_url
- role
- created_at
- last_login_at

### 2. meal_records
식사 기록의 중심 테이블

필드 예시:
- id
- user_id
- input_type : photo / text / both
- meal_type : breakfast / lunch / dinner / snack
- food_name
- amount
- memo
- estimated_calories
- confidence
- recorded_at
- created_at
- updated_at
- status : draft / saved / deleted

### 3. meal_photos
사진 입력을 저장하는 보조 테이블 또는 스토리지 참조

필드 예시:
- id
- meal_record_id
- storage_path
- file_name
- mime_type
- file_size
- created_at

### 4. calorie_estimates
칼로리 추정 결과 저장용 테이블 또는 내역

필드 예시:
- id
- meal_record_id
- estimated_calories
- confidence
- summary_text
- model_name
- model_version
- created_at

### 5. activity_logs
사용자 행동 기록

필드 예시:
- id
- user_id
- action_type
- target_id
- created_at
- metadata

### 6. error_logs
오류 추적용 로그

필드 예시:
- id
- user_id
- error_code
- message
- created_at
- metadata

## 저장하지 않는 것

- API 키
- 비밀번호 원문
- LLM 전체 응답 원문
- 불필요한 외부 API 전체 응답 JSON
- 삭제 요청 후 재저장하지 않아도 되는 민감한 원본 데이터
- 메일 본문 전체

## 관계 규칙

- `profiles.id`는 인증 시스템의 사용자 ID와 연결한다.
- `meal_records.user_id`는 `profiles.id`를 참조한다.
- `meal_photos.meal_record_id`는 `meal_records.id`를 참조한다.
- `calorie_estimates.meal_record_id`는 `meal_records.id`를 참조한다.
- 한 개의 식사 기록은 여러 사진을 가질 수 있지만, 초기 버전에서는 1개 사진만 허용할 수 있다.

## 처리 기준

- 저장 전 입력값 검증을 먼저 수행한다.
- 추정 결과는 저장하되, 원본 응답 전문은 저장하지 않는다.
- 사용자가 수정한 최종값을 별도로 남길 수 있다.
- 관리자 통계는 로그에서 집계하되, 개인 식사 내용은 과도하게 노출하지 않는다.
