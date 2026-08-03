# 다른 컴퓨터에서 시작하기

이 안내서는 프로젝트 전체 Git 이력과 작업 안내를 USB 등 이동식 저장장치로 전달할 때 사용합니다. 실제 API 키와 `.env.local`은 포함하지 않습니다.

## 옮길 파일

아래 두 파일만 복사합니다.

1. `Calorie-Calculator-<commit>.bundle` — 전체 Git 이력 백업
2. `PORTABLE_BACKUP_GUIDE.md` — 이 안내서 및 Codex 시작 프롬프트

번들 파일명 속 `<commit>`은 백업을 만든 시점의 `git rev-parse --short HEAD` 값으로 바꿉니다.

## 백업 만들기

깨끗한 작업 트리에서 다음을 실행합니다. 커밋되지 않은 변경사항이나 `.env.local`은 번들에 들어가지 않습니다.

```powershell
git status --short
git bundle create "Calorie-Calculator-$(git rev-parse --short HEAD).bundle" --all
git bundle verify "Calorie-Calculator-$(git rev-parse --short HEAD).bundle"
```

`git status --short` 출력에 의도하지 않은 파일이 있으면 먼저 검토하거나 커밋합니다. `git bundle verify`가 성공해야 USB에 복사합니다.

## 새 컴퓨터에서 복원하기

USB의 두 파일을 임의 폴더에 복사한 뒤, 다음처럼 새 저장소를 만듭니다.

```powershell
git clone "Calorie-Calculator-<commit>.bundle" "Calorie Calculator"
Set-Location "Calorie Calculator"
git log -1 --oneline
npm ci
Copy-Item .env.example .env.local
```

`.env.local`에는 별도 보관한 실제 값만 입력합니다. 이 파일을 USB, Git, 채팅 또는 문서에 복사하지 않습니다. 환경변수 이름은 `.env.example`과 `ENVIRONMENT.md`를 확인합니다.

## 초기 검증

환경변수를 입력한 뒤 아래 명령을 순서대로 실행합니다.

```powershell
npm run test:calorie
npm run build
npm run dev
```

테스트와 빌드가 성공한 뒤 주요 화면 이동과 식사 기록 저장을 확인합니다. 검증 기준은 `TEST_CHECKLIST.md`를 따릅니다.

## Codex에 붙여 넣을 시작 프롬프트

```text
Calorie Calculator 프로젝트를 이어서 개발해 주세요.

먼저 AGENTS.md, README.md, PROJECT_BRIEF.md, UI_REFERENCE.md, API_CONTRACT.md,
ENVIRONMENT.md, TEST_CHECKLIST.md를 읽고 현재 Git 상태와 최근 커밋을 확인하세요.

비밀값은 읽거나 출력하지 말고, .env.local은 커밋하지 마세요. 실제 구현이 문서의
환경변수와 일치하는지도 확인하세요.

작업 전후로 관련 테스트를 실행하고 npm run build로 검증하세요. 요청 범위 안에서만
수정하며, 사용자 소유의 기존 미커밋 변경은 덮어쓰지 마세요. 기능을 변경하면 관련
MD 문서도 함께 최신화하고, 검증이 끝난 변경만 명확한 커밋 메시지로 커밋하세요.
```
