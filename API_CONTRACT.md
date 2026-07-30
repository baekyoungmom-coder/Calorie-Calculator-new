# API 계약서

확인하지 않은 주소와 응답 구조를 임의로 작성하지 않는다.
실제 구현 전 공식 문서와 Postman 또는 개발 환경에서 확인한다.

## 1. 칼로리 추정

### 앱 내부 Route

POST /api/calories/estimate

### 목적

사용자가 입력한 음식 사진, 음식 이름, 양, 식사 종류를 바탕으로 칼로리 추정 결과를 반환한다.

### 외부 서비스

- 이미지 분석이 필요한 경우: 실제 선택한 비전/멀티모달 API
- 텍스트 기반 추정이 필요한 경우: 실제 선택한 추정 로직 또는 LLM API

### 요청 예시

```json
{
  "mealType": "lunch",
  "foodName": "김밥",
  "amount": "1줄",
  "memo": "참치 김밥",
  "imageUrl": "optional",
  "imageFile": "optional"
}
```

### 응답 예시

```json
{
  "success": true,
  "data": {
    "estimatedCalories": 420,
    "confidence": "medium",
    "reason": "입력된 음식명과 양을 기준으로 추정했습니다.",
    "items": [
      {
        "name": "김밥",
        "amount": "1줄",
        "calories": 420
      }
    ]
  }
}
```

## 2. 식사 기록 저장

### 앱 내부 Route

POST /api/meal-records

### 목적

사용자의 식사 기록과 추정 칼로리를 저장한다.

### 외부 서비스

- Supabase 또는 프로젝트의 실제 DB 저장 방식

### 요청 예시

```json
{
  "inputType": "text",
  "mealType": "dinner",
  "foodName": "샐러드",
  "amount": "1그릇",
  "memo": "드레싱 적게",
  "estimatedCalories": 180,
  "finalCalories": 180,
  "confidence": "medium",
  "estimateReason": "입력한 음식 이름과 양을 기준으로 추정했어요.",
  "recordedAt": "2026-07-27T12:34:56Z",
  "recordedTimezone": "Asia/Seoul"
}
```

### 응답 예시

```json
{
  "success": true,
  "data": {
    "record": {}
  }
}
```

### 전체 기록 조회

GET /api/meal-records

로그인한 사용자의 기록을 최신 기록 시각 순으로 조회한다.

### 게스트 체험 사용

`POST /api/guest-trials`

- 로그인 사용자는 제한 없이 허용한다.
- 게스트는 서로 다른 `trialId` 기준으로 최대 3회까지 허용한다.
- 같은 `trialId`를 다시 요청하면 횟수를 중복 차감하지 않는다.
- 3회 소진 후 새 요청에는 `429 GUEST_TRIAL_LIMIT_REACHED`를 반환한다.
- 쿠키에는 음식이나 사용자 정보가 아닌 체험 ID만 저장한다.

## 3. 오늘 기록 조회

### 앱 내부 Route

GET /api/meal-records/today

### 목적

오늘 저장된 식사 기록과 총 섭취 칼로리를 조회한다.

### Query

- `timezone`: 사용자의 IANA 기기 시간대. 예: `Asia/Seoul`

### 외부 서비스

- Supabase 또는 프로젝트의 실제 DB 조회 방식

### 응답 예시

```json
{
  "success": true,
  "data": {
    "date": "2026-07-27",
    "totalCalories": 1320,
    "records": []
  }
}
```

## 4. 식사 기록 상세 조회

### 앱 내부 Route

GET /api/meal-records/:id

### 목적

선택한 식사 기록의 상세 정보를 조회한다.

### 응답 예시

```json
{
  "success": true,
  "data": {
    "id": "generated-id",
    "foodName": "김밥",
    "amount": "1줄",
    "mealType": "lunch",
    "estimatedCalories": 420,
    "finalCalories": 420,
    "inputType": "text",
    "confidence": "medium",
    "recordedTimezone": "Asia/Seoul",
    "memo": "참치 김밥",
    "recordedAt": "2026-07-27T12:34:56Z"
  }
}
```

## 5. 식사 기록 수정

### 앱 내부 Route

PATCH /api/meal-records/:id

### 목적

사용자가 저장된 식사 기록을 수정한다.

### 요청 예시

```json
{
  "inputType": "text",
  "foodName": "참치 김밥",
  "amount": "1줄",
  "mealType": "lunch",
  "memo": "드레싱 제외",
  "estimatedCalories": 410,
  "finalCalories": 410,
  "confidence": "medium",
  "recordedAt": "2026-07-27T13:00:00Z",
  "recordedTimezone": "Asia/Seoul"
}
```

### 응답 예시

```json
{
  "success": true,
  "data": {
    "id": "generated-id",
    "updatedAt": "2026-07-27T13:00:00Z"
  }
}
```

## 6. 식사 기록 삭제

### 앱 내부 Route

DELETE /api/meal-records/:id

### 목적

사용자가 저장한 식사 기록을 삭제한다.

### 응답 예시

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

## 6.1 전체 식사 기록 삭제

### 앱 내부 Route

DELETE /api/meal-records

### 목적

로그인한 사용자가 저장한 식사 기록을 모두 삭제한다. 목표 칼로리와 로그인 계정은 유지한다.
연결된 칼로리 추정 기록은 데이터베이스의 연쇄 삭제 규칙에 따라 함께 삭제한다.

### 응답 예시

```json
{
  "success": true,
  "data": {
    "deletedCount": 3
  }
}
```

## 7. 사용자 프로필 조회

### 앱 내부 Route

GET /api/me

### 목적

현재 로그인한 사용자의 이름, 이메일, 프로필 정보를 조회한다.

### 외부 서비스

- Supabase Auth 또는 실제 인증 제공자

### 응답 예시

```json
{
  "success": true,
  "data": {
    "userId": "supabase-user-id",
    "name": "사용자 이름",
    "email": "user@example.com",
    "avatarUrl": "optional"
  }
}
```

## 7.1 회원 탈퇴

### 앱 내부 Route

DELETE /api/account

### 목적

현재 로그인한 사용자의 Auth 계정과 연결 데이터를 영구 삭제하고 현재 세션을 정리한다.
요청에는 정확한 확인 문구와 삭제 동의가 모두 포함되어야 한다.

### 요청 예시

```json
{
  "confirmation": "회원 탈퇴",
  "acknowledged": true
}
```

### 응답 예시

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

## 8. 관리자 통계

### 앱 내부 Route

GET /api/admin/stats

### 목적

관리자가 전체 사용자 수, 기록 수, 입력 방식 통계, 오류 로그를 확인한다.

### 접근 조건

- 관리자 권한 확인 필요
- 일반 사용자는 접근 불가

### 응답 예시

```json
{
  "success": true,
  "data": {
    "totalUsers": 0,
    "totalMealRecords": 0,
    "photoInputCount": 0,
    "textInputCount": 0,
    "recentErrors": []
  }
}
```

## 9. 검증 규칙

- 입력 방식은 사진 입력 또는 텍스트 입력 중 하나 이상이어야 한다.
- 사진 입력 시 이미지 파일 또는 이미지 URL이 필요하다.
- 텍스트 입력 시 `foodName`과 `amount`는 필수다.
- `mealType`은 `breakfast`, `lunch`, `dinner`, `snack` 중 하나여야 한다.
- `foodName`은 너무 길지 않게 제한한다.
- `amount`는 숫자 또는 사람이 읽을 수 있는 양 표현을 허용하되 비어 있으면 안 된다.
- `memo`는 선택 입력이며 길이 제한을 둔다.
- `estimatedCalories`는 0 이상의 숫자여야 한다.
- `finalCalories`는 0 이상의 숫자여야 하며, 사용자가 수정하면 이 값을 최종값으로 사용한다.
- `recordedAt`은 ISO 8601 형식의 날짜/시간이어야 한다.
- `recordedTimezone`은 기록 시점 기기의 IANA 시간대여야 한다.
- 저장 및 수정 요청은 현재 로그인한 사용자의 데이터만 허용한다.
- 사진과 텍스트를 함께 보낼 경우 둘 다 검증한다.
- 입력값이 부족하면 칼로리 계산 대신 보완 입력을 요청한다.

## 10. 앱이 사용할 정규화 응답

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "error": null
}
```

### 규칙

- `success`는 성공 여부를 나타낸다.
- `message`는 사람이 읽을 수 있는 짧은 설명이다.
- `data`는 성공 시 결과를 담는다.
- `error`는 실패 시만 사용한다.
- 실패 응답도 같은 형태를 유지한다.

예시:

```json
{
  "success": false,
  "message": "입력값이 올바르지 않습니다.",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

## 11. 공통 규칙

- 응답은 성공 여부를 먼저 구분한다.
- 저장 성공과 실패는 별도로 처리한다.
- 사진 업로드와 텍스트 입력을 모두 지원한다.
- 실제 경로, 필드명, 상태 코드는 구현 전 반드시 공식 문서와 개발 환경에서 확인한다.
- 아직 확인하지 않은 외부 API 주소는 확정값처럼 적지 않는다.
- DB에 저장하는 데이터와 화면에만 쓰는 데이터는 구분한다.
