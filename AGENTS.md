# AGENTS.md

이 문서는 이 프론트엔드 저장소에서 사람과 AI가 함께 작업할 때 가장 먼저 확인해야 하는 최상위 협업 규칙입니다.
상세한 예시와 주제별 규칙은 `docs/` 문서에 두고, 이 파일은 작업 판단에 필요한 핵심 기준만 유지합니다.

## 문서 우선순위

규칙이 겹치거나 판단이 애매하면 아래 순서를 따릅니다.

1. `AGENTS.md`: 반드시 지켜야 하는 최상위 작업 원칙
2. `docs/PROJECT_GUIDE.md`: 프로젝트 구조, 기술 스택, 코드 스타일, 타입 작성
3. `docs/API_CONVENTION.md`: API 요청, 인증, React Query, 에러 처리
4. `docs/UI_RULES.md`: 컴포넌트 위치, UI 작성, toast, 접근성, provider
5. `docs/GIT_WORKFLOW.md`: 브랜치, 커밋, PR, 검증 명령

새 공통 패턴을 추가하거나 기존 규칙을 바꾸면 관련 `docs/` 문서도 함께 업데이트합니다.

## 핵심 원칙

- 기존 구조를 먼저 확인하고 이미 있는 helper, hook, store, provider, UI 컴포넌트를 우선 사용합니다.
- 같은 역할의 코드를 화면마다 중복 구현하지 않습니다.
- page 파일은 얇게 유지하고, 실제 UI와 로직은 도메인 컴포넌트나 공통 모듈로 분리합니다.
- API 요청, 인증 토큰, toast, 전역 상태는 직접 구현하지 말고 공통 모듈을 통해 처리합니다.
- 서버에서 처리 가능한 데이터 조회는 서버 컴포넌트 또는 서버 함수에서 처리합니다.
- 변경 후 가능하면 `npm run typecheck`와 `npm run lint`를 실행합니다.

## 작업 전 확인

- 파일을 수정하기 전에 관련 도메인의 기존 컴포넌트, hook, API helper, store를 먼저 찾습니다.
- API/auth/query 작업은 `docs/API_CONVENTION.md`를 확인합니다.
- UI/component/toast 작업은 `docs/UI_RULES.md`를 확인합니다.
- 폴더 구조, 네이밍, 타입 작성, 환경변수 작업은 `docs/PROJECT_GUIDE.md`를 확인합니다.
- 브랜치, 커밋, PR, 검증 절차는 `docs/GIT_WORKFLOW.md`를 확인합니다.

## 코드 스타일 요약

- TypeScript와 React를 기준으로 작성합니다.
- 문자열은 쌍따옴표를 사용하고 세미콜론은 사용하지 않습니다.
- 들여쓰기는 스페이스 2칸을 사용합니다.
- 사용하지 않는 import, 변수, 함수, console은 제거합니다.
- `any`는 사용하지 않습니다. 타입을 바로 알 수 없으면 `unknown`을 사용하고 좁혀서 처리합니다.
- import 순서, 네이밍, 파일 위치 기준은 `docs/PROJECT_GUIDE.md`를 따릅니다.

## 컴포넌트와 UI

- 공용 UI는 `components/common`, 도메인 전용 UI는 해당 도메인 폴더, 기본 UI는 `components/ui`에 둡니다.
- React 컴포넌트는 named export를 사용합니다.
- props 타입은 컴포넌트 바로 위에 `type ComponentNameProps`로 선언합니다.
- 복잡한 조건식과 긴 JSX는 읽기 쉬운 변수나 작은 컴포넌트로 분리합니다.
- shadcn/ui와 기존 `components/ui`를 우선 사용하고, className 조합은 `cn()`을 사용합니다.
- 버튼, 입력, 다이얼로그에는 적절한 label, title, aria 속성을 둡니다.
- 세부 작성 기준은 `docs/UI_RULES.md`를 따릅니다.

## 클라이언트와 서버 경계

- `useState`, `useEffect`, event handler, 브라우저 API, React Query, Zustand가 필요한 파일에만 `"use client"`를 붙입니다.
- 클라이언트 컴포넌트에서 백엔드 API를 직접 `fetch`하지 않습니다.
- 클라이언트 API 호출은 `apiClient` 또는 React Query hook을 사용합니다.
- 서버 API 호출은 `serverApiClient`를 사용합니다.
- 서버 상태는 TanStack Query로 관리하고, Zustand는 클라이언트 전역 상태에만 사용합니다.

## API와 인증

- 백엔드 API의 공통 응답 wrapper는 `lib/api/api-fetch.ts`가 처리합니다.
- 반복되는 API 요청은 `hooks/api/use-api-query.ts`와 도메인별 hook으로 감쌉니다.
- query key는 `hooks/api/query-keys.ts`에 추가해서 재사용합니다.
- toast는 `sonner`를 직접 import하지 말고 `@/lib/notify`의 `notify` helper를 사용합니다.
- 소셜 인증은 NextAuth callback에서 백엔드 `/api/auth/social-login`을 호출하는 흐름을 따릅니다.
- 온보딩 요청 body와 검증 기준은 `docs/API_CONVENTION.md`와 관련 auth 파일을 확인합니다.

## 환경변수

- 실제 값은 `.env.local`에 둡니다.
- 공유가 필요한 키 이름은 `.env.example`에 추가합니다.
- 클라이언트에 노출되는 값에만 `NEXT_PUBLIC_` 접두사를 사용합니다.
- secret, private key, refresh token은 클라이언트 환경변수로 저장하지 않습니다.

## Git과 검증

- 다른 사람이 만든 변경을 임의로 되돌리지 않습니다.
- unrelated 변경은 건드리지 않습니다.
- 가능하면 작은 단위로 변경하고, 관련 없는 리팩터링은 분리합니다.
- PR 전에는 가능하면 아래 명령을 실행합니다.

```bash
npm run typecheck
npm run lint
```
