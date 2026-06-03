# 모여ON - Project Guidelines

개발 모임 협업 플랫폼

## 프로젝트 규칙

> 상세 내용: [docs/PROJECT_GUIDE.md](../docs/PROJECT_GUIDE.md)

### 코드 스타일

- 쌍따옴표, 세미콜론 없음, 들여쓰기 2칸
- 컴포넌트 파일: PascalCase.tsx / hook, store, util: kebab-case.ts
- 컴포넌트는 named export, props 타입은 `type ComponentNameProps`로 선언
- `"use client"`는 필요한 파일에만
- 클라이언트에서 직접 `fetch` 금지 → `apiClient` 또는 React Query hook 사용

### API 호출

```tsx
// 클라이언트: apiClient (Authorization 자동, data만 반환)
const data = await apiClient<ResponseType>("/api/endpoint")

// 서버: serverApiClient
const data = await serverApiClient<ResponseType>("/api/endpoint")

// 유저 조회
const { user, isAuthenticated } = useAuthUser()
```

### 네이밍 (팀 확정)

- 모임 = `meeting` / 화상 회의 = `conference`
- 모임장 = `isLeader` / 프로필 이미지 = `profileImage` / ID = `id`
- category, status 값은 영문 대문자

### Git

- 브랜치: `main → develop → feature/ 또는 fix/`
- 커밋: `{type}: {내용}` (feat, fix, style, refactor, chore, docs)
- PR 24시간 내 리뷰

---

## Rules

1. 코드 작성 시 `docs/PROJECT_GUIDE.md` 규칙을 따른다
2. 쌍따옴표, 세미콜론 없음, 들여쓰기 2칸
3. API 호출은 `apiClient` / `serverApiClient` 패턴을 사용한다
4. API 필드명은 팀 확정 네이밍을 따른다
5. 불확실한 기술적 결정은 제안만 하고 팀 논의를 유도한다
6. 한국어로 응답한다

## Context

- Framework: Next.js App Router + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- State: React Query (서버) + Zustand (클라이언트)
- Auth: NextAuth
- Package Manager: npm
