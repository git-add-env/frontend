# Project Guide

모여ON 프론트엔드 프로젝트의 공용 개발 가이드입니다.
Codex는 `AGENTS.md`, Claude Code는 `.claude/PROJECT.md`를 함께 참고합니다.

## 기술 스택

| 카테고리        | 기술                   | 용도                         |
| --------------- | ---------------------- | ---------------------------- |
| Framework       | Next.js App Router     | 라우팅, SSR/SSG              |
| Language        | TypeScript             | 타입 안정성                  |
| Styling         | Tailwind CSS           | 유틸리티 기반 스타일링       |
| UI Library      | shadcn/ui, Radix UI    | 기본 UI 컴포넌트             |
| Server State    | TanStack Query         | API 캐싱, 동기화             |
| Client State    | Zustand                | 전역 클라이언트 상태         |
| API Client      | apiClient wrapper      | 공통 API 요청 처리           |
| Auth            | NextAuth               | 소셜 로그인, 세션 관리       |
| Toast           | Sonner                 | 사용자 알림                  |
| Lint/Format     | ESLint, Prettier       | 코드 검사와 포맷             |
| Package Manager | npm                    | 의존성 관리                  |

## 디렉터리 구조

```txt
app/                    # Next.js 라우팅, page, layout, route handler
components/
  common/               # 여러 화면에서 같이 쓰는 공용 컴포넌트
  dashboard/            # dashboard 화면 전용 컴포넌트
  meeting/              # meeting/meetings 화면 전용 컴포넌트
  providers/            # 전역 Provider
  ui/                   # shadcn/ui 기반 기본 UI
hooks/
  api/                  # React Query 공통 hook, query key
  auth/                 # 인증 관련 hook
lib/
  api/                  # apiClient, serverApiClient, fetch wrapper
  auth/                 # NextAuth와 백엔드 인증 연동
constants/              # 화면/도메인에서 쓰는 고정 옵션 데이터
stores/                 # Zustand 전역 클라이언트 상태
types/                  # 전역 타입 확장
docs/                   # 협업용 개발 문서
```

## 코드 스타일

### 포맷

- 문자열은 쌍따옴표(`"`)를 사용한다
- 세미콜론은 사용하지 않는다
- 들여쓰기는 스페이스 2칸을 사용한다
- 불필요한 주석은 남기지 않는다
- 사용하지 않는 import, 변수, 함수, console은 제거한다
- 파일 하나에 너무 많은 역할을 넣지 않는다

```ts
const message = "저장되었습니다."
```

### Import 순서

1. React, Next.js, 외부 라이브러리
2. `@/` alias 내부 모듈
3. 상대 경로 모듈
4. type import는 가능하면 `import type` 사용

```ts
import { useEffect } from "react"
import { useSession } from "next-auth/react"

import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

import type { AppUser } from "@/lib/auth/backend"
```

### 네이밍

| 대상                | 규칙                | 예시                          |
| ------------------- | ------------------- | ----------------------------- |
| 컴포넌트 파일       | PascalCase.tsx      | `LoginDialog.tsx`             |
| hook, store, util   | kebab-case.ts       | `use-auth-user.ts`            |
| React 컴포넌트      | named export        | `export function LoginDialog` |
| hook 이름           | `useSomething`      | `useAuthUser`                 |
| Zustand store hook  | `useSomethingStore` | `useAuthStore`                |
| 이벤트 핸들러       | `handle` 접두사     | `handleSubmit`, `handleClose` |
| boolean 상태        | 의미가 드러나게     | `isOpen`, `isLoading`, `hasError`, `canSubmit` |

## 컴포넌트 작성 규칙

- props 타입은 컴포넌트 바로 위에 `type ComponentNameProps`로 선언한다
- props가 3개 이상이면 구조 분해 할당을 사용한다
- 복잡한 조건식은 JSX 안에 길게 쓰지 말고 위에서 변수로 분리한다
- UI 조합이 길어지면 작은 컴포넌트로 분리한다
- 여러 페이지에서 재사용되는 UI는 `components/common/`으로 이동한다
- `"use client"`는 `useState`, `useEffect`, event handler, 브라우저 API가 필요한 파일에만 붙인다

```tsx
type LoginDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  function handleClose() {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Button onClick={handleClose}>닫기</Button>
    </Dialog>
  )
}
```

## API 호출

### 클라이언트 컴포넌트 → `apiClient`

```tsx
import { apiClient } from "@/lib/api/api-client"

const data = await apiClient<MeetingListResponse>("/api/meetings")

await apiClient("/api/meetings", {
  method: "POST",
  body: JSON.stringify({ title: "모임 제목" }),
})

await apiClient("/api/public/meetings", { auth: false })
```

- 클라이언트에서 백엔드 API를 직접 `fetch`하지 않는다
- 클라이언트 API 호출은 `apiClient` 또는 React Query hook을 사용한다
- `Authorization: Bearer accessToken`은 공통 클라이언트에서 처리한다
- JSend 응답 `{ status, data }`에서 `data`만 반환한다

### 서버 컴포넌트 → `serverApiClient`

```tsx
import { serverApiClient } from "@/lib/api/server-api-client"

const data = await serverApiClient<ResponseType>("/api/endpoint")
```

### 유저 조회

```tsx
const { user, isAuthenticated, isLoading } = useAuthUser()

const user = await getAuthUser()
```

## API 네이밍 (팀 확정)

| 의미             | 필드명         | 비고                                |
| ---------------- | -------------- | ----------------------------------- |
| 모임             | `meeting`      | gathering 아님                      |
| 화상 회의        | `conference`   |                                     |
| 모임장 여부      | `isLeader`     | isOwner 아님                        |
| 프로필 이미지    | `profileImage` | profileImageUrl 아님                |
| ID               | `id`           | meetingId 아님                      |
| 카테고리         | 영문 대문자    | `PROJECT`, `HACKATHON`, `CONTEST`   |
| 상태             | 영문 대문자    | `RECRUITING`, `ACTIVE`, `COMPLETED` |

### 응답 형식 (JSend 기반)

| 구분              | HTTP 코드    | status    | code 포함 |
| ----------------- | ------------ | --------- | --------- |
| 성공              | 200, 201     | `success` | X         |
| 클라이언트 오류   | 400~404, 409 | `fail`    | X         |
| 서버 오류         | 500          | `error`   | O         |

## Git

### 브랜치 전략

```txt
main
└── develop
    ├── feature/meeting-filter
    └── fix/card-render-error
```

- `main`: 배포 기준 브랜치
- `develop`: 개발 통합 브랜치
- 기능 작업: `feature/{description}`
- 버그 수정: `fix/{description}`

### 커밋 컨벤션

```txt
{type}: {변경 내용 요약}
```

| Type       | 용도             | 예시                            |
| ---------- | ---------------- | ------------------------------- |
| `feat`     | 새 기능          | feat: 소셜 로그인 기능 추가     |
| `fix`      | 버그 수정        | fix: 카드 렌더링 오류 수정      |
| `style`    | 스타일 변경      | style: 버튼 스타일 변경         |
| `refactor` | 리팩토링         | refactor: 모임 목록 컴포넌트 분리 |
| `chore`    | 설정, 의존성     | chore: ESLint 설정 추가         |
| `docs`     | 문서 수정        | docs: 프로젝트 가이드 업데이트  |

### PR 규칙

- PR은 `develop` 브랜치로 보낸다
- PR이 열리면 24시간 내 리뷰를 목표로 한다
- PR 전 가능하면 `npm run typecheck`와 `npm run lint`를 실행한다

## 주요 명령어

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run format
```

## 환경변수

- `.env.local`: 실제 값, gitignore 대상
- `.env.example`: 키 이름만 포함, git 포함

## 참고 문서

- `AGENTS.md`: Codex 작업 규칙
- `.claude/PROJECT.md`: Claude Code 작업 규칙
- `docs/frontend-auth-api-guide.md`: 인증/API 요청 가이드
- `docs/toast-guide.md`: toast 사용 가이드
