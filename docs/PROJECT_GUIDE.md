# Project Guide

## 기술 스택

| 카테고리         | 기술                    | 용도                          |
| ---------------- | ----------------------- | ----------------------------- |
| Framework        | Next.js (App Router)    | SSR/SSG, 라우팅               |
| Language         | TypeScript              | 타입 안전성                   |
| Styling          | Tailwind CSS            | 유틸리티 기반 스타일링        |
| UI Library       | shadcn/ui               | 기본 UI 컴포넌트              |
| Server State     | React Query (TanStack)  | API 캐싱, 동기화              |
| Client State     | Zustand                 | 전역 상태 (인증, UI)          |
| HTTP Client      | Axios                   | API 요청 (apiClient 래핑)     |
| Auth             | NextAuth                | 소셜 로그인, 세션 관리        |
| Video            | LiveKit                 | 실시간 화상회의               |
| Notifications    | SSE                     | 실시간 알림                   |
| Image Upload     | AWS S3 Presigned URL    | 프로필/썸네일 이미지          |
| Linting          | ESLint + Prettier       | 코드 품질 + 스타일 통일       |
| CI               | GitHub Actions          | PR 시 ESLint + 타입 체크      |
| Deploy           | Vercel                  | 프론트엔드 배포               |
| Package Manager  | npm                     | 의존성 관리                   |

---

## 디렉토리 구조

```
app/                          # Next.js App Router 페이지
├── layout.tsx
├── page.tsx
├── landing/
├── login/
├── dashboard/
├── meetings/
├── mypage/
├── onboarding/
└── api/auth/

components/
├── common/                   # 공용 컴포넌트
├── dashboard/                # dashboard 전용
├── meeting/                  # meeting 전용
├── providers/                # 전역 Provider
└── ui/                       # shadcn/ui 기반

hooks/
├── api/                      # React Query 훅, query key
├── auth/                     # 인증 관련 훅
└── useAuthUser.ts

lib/
├── api/                      # apiClient, serverApiClient
├── auth/                     # NextAuth, 백엔드 인증
├── notify.ts
└── utils.ts

stores/                       # Zustand 스토어
types/                        # 타입 정의
docs/                         # 프로젝트 문서
```

---

## 코드 스타일

### 포맷

- 문자열은 쌍따옴표(`"`) 사용
- 세미콜론 사용하지 않음
- 들여쓰기는 스페이스 2칸
- 불필요한 주석 남기지 않음
- 사용하지 않는 import, 변수, 함수, console은 제거
- 파일 하나에 너무 많은 역할 넣지 않음

```ts
const message = "저장되었습니다."
```

### Import 순서

1. React, Next.js, 외부 라이브러리
2. `@/` alias 내부 모듈
3. 상대 경로 모듈
4. type import는 `import type` 사용

```ts
import { useEffect } from "react"
import { useSession } from "next-auth/react"

import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

import type { AppUser } from "@/lib/auth/backend"
```

### 네이밍

| 대상                | 규칙               | 예시                          |
| ------------------- | ------------------ | ----------------------------- |
| 컴포넌트 파일       | PascalCase.tsx     | `LoginDialog.tsx`             |
| hook, store, util   | kebab-case.ts      | `use-auth-user.ts`            |
| React 컴포넌트      | named export       | `export function LoginDialog` |
| hook 이름           | `useSomething`     | `useAuthUser`                 |
| Zustand store hook  | `useSomethingStore`| `useAuthStore`                |
| 이벤트 핸들러       | `handle` 접두사    | `handleSubmit`, `handleClose` |
| boolean 상태        | 의미 드러나게      | `isOpen`, `isLoading`, `hasError`, `canSubmit` |

---

## 컴포넌트 작성 규칙

- props 타입은 컴포넌트 바로 위에 `type ComponentNameProps`로 선언
- props가 3개 이상이면 구조 분해 할당 사용
- 복잡한 조건식은 JSX 안에 쓰지 말고 위에서 변수로 분리
- UI 조합이 길어지면 작은 컴포넌트로 분리
- 여러 페이지에서 재사용되는 UI는 `components/common/`으로 이동

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

---

## 클라이언트 / 서버 컴포넌트

- `useState`, `useEffect`, event handler, 브라우저 API가 필요한 파일에만 `"use client"` 사용
- 서버에서 처리 가능한 데이터 조회는 서버 컴포넌트 또는 서버 함수에서 처리
- 클라이언트 컴포넌트에서 백엔드 API를 직접 `fetch`하지 않음
- 클라이언트 API 호출은 `apiClient` 또는 React Query hook 사용
- 서버 API 호출은 `serverApiClient` 사용

---

## Git

### 브랜치 전략

```
main (배포용 최종)
 └── develop (개발 통합)
      ├── feature/모임-필터링
      └── fix/카드-렌더링-오류
```

### 커밋 컨벤션

```
{type}: {변경 내용 요약}
```

| Type       | 용도           | 예시                                    |
| ---------- | -------------- | --------------------------------------- |
| `feat`     | 새 기능        | feat: 소셜 로그인 기능 추가             |
| `fix`      | 버그 수정      | fix: 카드 컴포넌트 버그 수정            |
| `style`    | 스타일 변경    | style: 버튼 스타일 변경                 |
| `refactor` | 리팩토링       | refactor: 모임 목록 컴포넌트 리팩토링   |
| `chore`    | 설정, 의존성   | chore: ESLint 설정 추가                 |
| `docs`     | 문서 수정      | docs: README 업데이트                   |

### PR 규칙

- PR 올리면 24시간 내 리뷰
- develop 브랜치로 머지

### GitHub Actions

| 트리거       | 동작                    |
| ------------ | ----------------------- |
| PR 올라올 때 | ESLint 검사 + 타입 체크 |
| main 머지    | Vercel 자동 배포 (예정) |

### 환경변수

- `.env.local` → gitignore (실제 값)
- `.env.example` → git 포함 (키 이름만)

---

## API 호출

### 클라이언트 컴포넌트 → `apiClient`

```tsx
import { apiClient } from "@/lib/api/api-client"

// GET
const data = await apiClient<MeetingListResponse>("/api/meetings")

// POST
await apiClient("/api/meetings", {
  method: "POST",
  body: JSON.stringify({ title: "모임 제목" }),
})

// 로그인 불필요 API
await apiClient("/api/public/meetings", { auth: false })
```

- `Authorization: Bearer access_token` 자동 부착
- `{ status, data }`에서 `data`만 반환

### 서버 컴포넌트 → `serverApiClient`

```tsx
import { serverApiClient } from "@/lib/api/server-api-client"
const data = await serverApiClient<ResponseType>("/api/endpoint")
```

### 유저 조회

```tsx
// 클라이언트 → useAuthUser 훅
const { user, isAuthenticated, isLoading } = useAuthUser()

// 서버 → getAuthUser 함수
const user = await getAuthUser()
```

---

## API 네이밍 (팀 확정)

| 용어          | 필드명         | 비고                 |
| ------------- | -------------- | -------------------- |
| 모임          | `meeting`      | gathering 아님       |
| 화상 회의     | `conference`   |                      |
| 모임장 여부   | `isLeader`     | isOwner 아님         |
| 프로필 이미지 | `profileImage` | profileImageUrl 아님 |
| ID            | `id`           | meetingId 아님       |
| 카테고리      | 영문 대문자    | `PROJECT`, `HACKATHON`, `CONTEST` |
| 상태          | 영문 대문자    | `RECRUITING`, `ACTIVE`, `COMPLETED` |

### 응답 형식 (JSend 기반)

| 구분             | HTTP 코드     | status    | code 포함 |
| ---------------- | ------------- | --------- | --------- |
| 성공             | 200, 201      | `success` | X         |
| 클라이언트 잘못  | 400~404, 409  | `fail`    | X         |
| 서버 잘못        | 500           | `error`   | O (500)   |

### 인증

- NextAuth 기반 (AT: session → Authorization 헤더 / RT: HttpOnly Cookie)
- 이미지 업로드: AWS S3 Presigned URL
- 기술스택: `GET /api/tech-stacks` API로 관리
