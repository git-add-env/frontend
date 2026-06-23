# Git Workflow

이 문서는 브랜치, 커밋, PR, 검증 명령어 기준을 정리합니다.

## 브랜치 전략

기본 브랜치 흐름은 다음을 기준으로 합니다.

```txt
main
└── develop
    ├── feature/meeting-filter
    ├── fix/card-render-error
    └── docs/project-guide
```

- `main`: 배포 기준 브랜치
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발
- `fix/*`: 버그 수정
- `docs/*`: 문서 수정
- `refactor/*`: 동작 변경이 없는 구조 개선
- `chore/*`: 설정, 의존성, 기타 관리 작업

작업 브랜치는 팀 합의에 따라 `develop`에서 생성하는 것을 기본으로 합니다.
긴급 수정이나 별도 운영 규칙이 있는 경우에는 PR 본문에 기준 브랜치를 명시합니다.

## 브랜치 이름

브랜치 이름은 소문자와 하이픈을 사용합니다.

```txt
feature/livekit-video-chat
feature/meeting-create-form
fix/auth-refresh-token
docs/project-guide
refactor/meeting-card
chore/eslint-config
```

## 커밋 메시지

커밋 메시지는 다음 형식을 사용합니다.

```txt
{type}: {변경 내용 요약}
```

| Type | 용도 | 예시 |
| --- | --- | --- |
| `feat` | 새 기능 | `feat: add meeting live room entry` |
| `fix` | 버그 수정 | `fix: refresh expired access token` |
| `docs` | 문서 수정 | `docs: reorganize project docs` |
| `style` | UI 스타일 변경 | `style: adjust meeting card layout` |
| `refactor` | 리팩터링 | `refactor: split meeting detail components` |
| `chore` | 설정, 의존성, 기타 | `chore: update eslint config` |
| `test` | 테스트 추가/수정 | `test: add auth refresh tests` |

커밋은 가능한 한 하나의 의도를 담습니다.
서로 관련 없는 변경은 커밋을 나눕니다.

## PR 기준

PR은 기본적으로 `develop`을 대상으로 보냅니다.
프로젝트 운영상 `main`으로 바로 보내야 하는 경우 PR 본문에 이유를 적습니다.

PR에는 다음 내용을 포함합니다.

```md
## Summary
- 변경한 기능 또는 문서 요약

## Test
- npm run typecheck
- npm run lint

## Notes
- 리뷰어가 알아야 할 결정 사항 또는 남은 작업
```

## PR 전 확인

가능하면 PR 전에 다음 명령어를 실행합니다.

```bash
npm run typecheck
npm run lint
```

화면 영향이 크거나 Next.js route/server component를 수정했다면 아래도 고려합니다.

```bash
npm run build
```

## 코드 리뷰 기준

리뷰에서는 다음을 우선 확인합니다.

- 기능 요구사항이 충족됐는가
- 기존 공통 helper, hook, provider를 재사용했는가
- API 요청이 `apiClient`, `serverApiClient`, React Query hook을 통해 처리되는가
- page 파일이 과도하게 두꺼워지지 않았는가
- 컴포넌트 위치가 도메인 기준에 맞는가
- 타입이 명확하고 `any`를 사용하지 않았는가
- 로딩, 에러, 빈 상태가 필요한 범위에서 처리됐는가
- 사용자 액션 실패가 toast나 안내 UI로 전달되는가

## 충돌과 기존 변경

- 다른 사람이 만든 변경을 임의로 되돌리지 않습니다.
- unrelated 변경은 건드리지 않습니다.
- 같은 파일에서 충돌이 나면 변경 의도를 확인한 뒤 최소 범위로 해결합니다.
- 큰 리팩터링은 기능 PR과 분리합니다.

## 문서 업데이트

공통 패턴이 추가되거나 바뀌면 관련 문서를 함께 수정합니다.

- 프로젝트 구조/공통 원칙 변경: `docs/PROJECT_GUIDE.md`
- API/auth/query 규칙 변경: `docs/API_CONVENTION.md`
- 브랜치/커밋/PR 규칙 변경: `docs/GIT_WORKFLOW.md`
- UI/component/toast 규칙 변경: `docs/UI_RULES.md`
