---
name: start-task
description: GitHub Issue 번호로 브랜치를 생성하고 체크아웃한다.
  작업 시작, 브랜치 만들어줘, 이슈에서 브랜치, start task 요청 시 사용.
---

## 사용법

사용자가 이슈 번호를 제공하면:

1. `gh issue view`로 이슈 정보를 가져온다
2. 이슈 제목에서 type과 브랜치명을 자동 생성한다
3. develop 기반으로 브랜치를 생성하고 체크아웃한다

## 브랜치 명명 규칙

```
{type}/{설명-kebab-case}
```

- 이슈 제목의 `feat:`, `fix:` 등에서 type 추출
- feat → `feature/`, fix → `fix/`
- 한글 설명은 핵심 키워드만 영문 kebab-case로 변환

**예시:**
- 이슈 "feat: 대시보드 필터링" → `feature/dashboard-filtering`
- 이슈 "fix: SSE 연결 끊김" → `fix/sse-connection-drop`

## 실행 순서

```bash
# 1. 이슈 정보 조회
gh issue view {issue_number} --json title,labels

# 2. develop 최신화
git checkout develop
git pull origin develop

# 3. 브랜치 생성 + 체크아웃
git checkout -b {type}/{description}
```

## 주의사항

- 변경사항이 있으면 경고하고 중단
- 같은 이름 브랜치가 있으면 확인받기
- 완료 후 브랜치명과 작업 시작 안내 출력
