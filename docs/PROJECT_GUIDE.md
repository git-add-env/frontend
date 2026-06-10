# Project Guide

이 문서는 프로젝트 전체 구조와 협업 기준을 빠르게 파악하기 위한 공통 가이드입니다.
세부 규칙은 주제별 문서로 분리합니다.

## 문서 구조

- `AGENTS.md`: 사람과 AI가 함께 작업할 때 지켜야 하는 최상위 협업 규칙
- `.claude/PROJECT.md`: Claude 작업 시 참고하는 프로젝트 지침
- `docs/PROJECT_GUIDE.md`: 프로젝트 구조, 기술 스택, 공통 개발 원칙
- `docs/API_CONVENTION.md`: API 요청, 응답, 인증, React Query 규칙
- `docs/GIT_WORKFLOW.md`: 브랜치, 커밋, PR, 검증 명령어 규칙
- `docs/UI_RULES.md`: 컴포넌트 위치, UI 작성, toast, 접근성 규칙

규칙이 겹칠 때는 `AGENTS.md`를 우선합니다.
Claude 전용 작업 맥락은 `.claude/PROJECT.md`를 참고합니다.
상세 예시나 도메인별 설명은 `docs/*` 문서에 둡니다.

## 기술 스택

| 구분 | 기술 | 용도 |
| --- | --- | --- |
| Framework | Next.js App Router | 라우팅, 서버 컴포넌트, route handler |
| Language | TypeScript | 타입 안정성 |
| UI | React, shadcn/ui, Radix UI | 화면 구성과 기본 UI |
| Styling | Tailwind CSS | 유틸리티 기반 스타일링 |
| Server State | TanStack Query | API 캐싱, 동기화, mutation |
| Client State | Zustand | 클라이언트 전역 상태 |
| Auth | NextAuth | 소셜 로그인, 세션 관리 |
| API Client | `apiClient`, `serverApiClient` | 백엔드 API 공통 요청 |
| Toast | Sonner wrapper, `notify` | 사용자 알림 |
| Package Manager | npm | 의존성 관리 |

## 폴더 구조

```txt
app/                    # Next.js 라우팅, page, layout, route handler
components/
  common/               # 여러 화면에서 함께 쓰는 공용 컴포넌트
  dashboard/            # dashboard 화면 전용 컴포넌트
  meeting/              # meeting/meetings 도메인 전용 컴포넌트
  mypage/               # mypage 화면 전용 컴포넌트
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

## 개발 원칙

- 새 기능을 만들기 전에 기존 helper, hook, store, provider를 먼저 확인합니다.
- 같은 역할의 코드를 화면마다 중복 구현하지 않습니다.
- page 파일은 얇게 유지하고 실제 UI는 도메인 컴포넌트로 분리합니다.
- API 요청, 인증 토큰, toast, 전역 상태는 공통 모듈을 통해 처리합니다.
- 서버에서 처리 가능한 데이터 조회는 서버 컴포넌트 또는 서버 함수에서 처리합니다.
- 클라이언트 전역 상태는 Zustand, 서버 상태는 TanStack Query로 관리합니다.
- 변경 후 검증 기준은 `docs/GIT_WORKFLOW.md`의 PR 전 확인 섹션을 따릅니다.

## 코드 스타일

- TypeScript와 React 기준으로 작성합니다.
- 문자열은 쌍따옴표를 사용합니다.
- 세미콜론은 사용하지 않습니다.
- 들여쓰기는 스페이스 2칸을 사용합니다.
- 불필요한 주석, 사용하지 않는 import, 변수, 함수, console은 제거합니다.
- 파일 하나에 너무 많은 역할을 넣지 않습니다.

## Import 순서

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

## 네이밍

| 대상 | 규칙 | 예시 |
| --- | --- | --- |
| 컴포넌트 파일 | `PascalCase.tsx` | `LoginDialog.tsx` |
| hook, store, utility 파일 | `kebab-case.ts` | `use-auth-user-query.ts` |
| React 컴포넌트 | named export | `export function LoginDialog` |
| hook | `useSomething` | `useAuthUser` |
| Zustand store hook | `useSomethingStore` | `useAuthStore` |
| 이벤트 핸들러 | `handle` 접두사 | `handleSubmit` |
| boolean 상태 | 의미가 드러나는 이름 | `isLoading`, `hasError`, `canSubmit` |

## 타입 작성 규칙

- `any`는 사용하지 않습니다.
- 불가피하게 타입을 바로 알 수 없으면 `unknown`을 사용하고 좁혀서 처리합니다.
- 컴포넌트 props, hook 반환 타입, API payload에는 타입 이름을 붙입니다.
- 여러 화면에서 공유되는 도메인 타입은 `types/`로 이동합니다.
- 특정 도메인 안에서만 쓰이는 타입은 관련 파일 가까이에 둡니다.
- 백엔드 enum성 문자열은 union type 또는 constants로 관리합니다.

```ts
export const MEETING_STATUS = ["RECRUITING", "ACTIVE", "COMPLETED"] as const
export type MeetingStatus = (typeof MEETING_STATUS)[number]
```

## 환경 변수

- 실제 값은 `.env.local`에 둡니다.
- 공유가 필요한 키 이름은 `.env.example`에 추가합니다.
- 클라이언트에 노출되는 값만 `NEXT_PUBLIC_` 접두사를 사용합니다.
- secret, private key, refresh token은 클라이언트 환경 변수로 두지 않습니다.

## 주요 명령어

```bash
npm run dev
npm run build
npm run format
```

## 관련 문서

- Claude 지침: [`.claude/PROJECT.md`](../.claude/PROJECT.md)
- API 규칙: [`API_CONVENTION.md`](./API_CONVENTION.md)
- Git/PR 규칙: [`GIT_WORKFLOW.md`](./GIT_WORKFLOW.md)
- UI 규칙: [`UI_RULES.md`](./UI_RULES.md)
