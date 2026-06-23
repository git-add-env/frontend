# API Convention

이 문서는 백엔드 API 요청, 응답 처리, 인증 토큰, React Query 사용 기준을 정리합니다.

## 기본 원칙

- 클라이언트 컴포넌트에서 백엔드 API를 직접 `fetch`하지 않습니다.
- 클라이언트 API 요청은 `apiClient` 또는 React Query hook을 사용합니다.
- 서버 컴포넌트와 route handler에서는 `serverApiClient` 또는 서버 전용 helper를 사용합니다.
- 반복되는 API 요청은 `lib/api/*`의 순수 API 함수와 `hooks/api/*`의 React Query hook으로 분리합니다.
- API 응답 타입과 요청 payload 타입은 분리해서 선언합니다.

## 공통 응답 형식

백엔드 API는 JSend 기반 공통 응답 형식을 사용합니다.

```json
{
  "status": "success",
  "data": {}
}
```

`lib/api/api-fetch.ts`의 `apiFetch`가 이 wrapper를 처리합니다.

- `status: "success"`이면 `data`만 반환합니다.
- `status: "fail"` 또는 `status: "error"`이면 `ApiFetchError`를 던집니다.
- token이 있으면 `Authorization: Bearer {token}` header를 자동으로 붙입니다.
- JSON 요청에는 기본적으로 `Content-Type: application/json`을 붙입니다.
- `FormData` 요청에는 `Content-Type`을 직접 설정하지 않습니다.

## 클라이언트 API

브라우저에서는 `apiClient`를 사용합니다.

```ts
import { apiClient } from "@/lib/api/api-client"

type MeetingListResponse = {
  meetings: Meeting[]
}

const data = await apiClient<MeetingListResponse>("/api/meetings")
```

기본값은 `auth: true`입니다.

```ts
await apiClient("/api/public/meetings", {
  auth: false,
})
```

인증 요청 흐름은 다음과 같습니다.

```txt
NextAuth session.accessToken 조회
→ Authorization header 자동 추가
→ 401 응답 시 /api/auth/refresh 호출
→ accessToken 갱신
→ 원래 요청 1회 재시도
```

refresh token은 클라이언트 코드에서 직접 다루지 않습니다.
프론트 내부 route인 `/api/auth/refresh`가 백엔드 refresh API 호출을 중계합니다.

## 서버 API

서버에서 백엔드 API를 호출할 때는 `serverApiClient`를 사용합니다.

```ts
import { serverApiClient } from "@/lib/api/server-api-client"

const data = await serverApiClient<ResponseData>("/api/users/me")
```

- `BACKEND_API_URL`을 사용합니다.
- `getServerSession(authOptions)`에서 `accessToken`을 읽습니다.
- 기본적으로 `cache: "no-store"`가 적용됩니다.

## 내부 Route Handler

Next.js 내부 route handler는 다음 상황에서 사용합니다.

- 백엔드 secret 또는 server-only 환경 변수가 필요한 경우
- NextAuth JWT/session 정보를 읽어야 하는 경우
- 백엔드 `Set-Cookie`를 브라우저 응답으로 전달해야 하는 경우
- 클라이언트에서 직접 호출하면 안 되는 API를 프록시해야 하는 경우

예시:

```txt
app/api/auth/refresh/route.ts
app/api/auth/onboarding/route.ts
```

## React Query

서버 상태는 TanStack Query로 관리합니다.

- 공통 query/mutation은 `hooks/api/use-api-query.ts`를 사용합니다.
- query key는 `hooks/api/query-keys.ts`에 추가해서 재사용합니다.
- 도메인별 API는 별도 hook으로 감쌉니다.
- mutation 성공 후에는 관련 query를 invalidate합니다.
- 로딩, 에러, 빈 상태 UI를 함께 고려합니다.

```ts
import { useApiMutation, useApiQuery } from "@/hooks/api/use-api-query"

const query = useApiQuery<ResponseData>(["resource"], "/api/resource")

const mutation = useApiMutation<CreateResponse, CreatePayload>("/api/resource", {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["resource"] })
  },
})
```

도메인 hook 예시:

```ts
export function useMeetingMembersQuery(meetingId: number) {
  return useApiQuery<MeetingMembersResponse>(
    queryKeys.meetings.members(meetingId),
    `/api/meetings/${meetingId}/members`,
  )
}
```

## API 함수 위치

순수 API 함수는 `lib/api`에 둡니다.

```txt
lib/api/meetings.ts
lib/api/dashboard.ts
lib/api/mypage.ts
```

React Query hook은 `hooks/api` 또는 도메인별 hook 위치에 둡니다.

```txt
hooks/api/use-api-query.ts
hooks/auth/use-auth-user-query.ts
```

컴포넌트에서는 가능하면 API path를 직접 조립하지 않고 도메인 hook 또는 API 함수를 사용합니다.

## API 타입 규칙

- API 응답 타입과 요청 payload 타입은 분리합니다.
- 특정 API에만 쓰이는 타입은 해당 `lib/api/*.ts` 파일 가까이에 둡니다.
- 여러 API에서 공유되는 응답/요청 타입은 도메인 타입 또는 공통 타입으로 분리합니다.
- 일반 타입 작성 규칙은 `docs/PROJECT_GUIDE.md`의 타입 작성 규칙을 따릅니다.

## 에러 처리

- catch 블록을 비워두지 않습니다.
- 사용자에게 보여줄 메시지는 사람이 이해할 수 있는 문장으로 변환합니다.
- 에러 객체를 그대로 화면에 노출하지 않습니다.
- 예상 가능한 에러는 분기 처리합니다.
- 사용자 액션 실패는 가능하면 toast로 알려줍니다.

```ts
try {
  await createMeeting(payload)
  notify.success("모임이 생성되었습니다.")
} catch {
  notify.error("모임 생성에 실패했습니다.")
}
```

## 인증 관련 파일

```txt
lib/auth/options.ts              # NextAuth callback, JWT/session 저장
lib/auth/backend.ts              # 백엔드 auth API 연동
lib/auth/user.ts                 # 현재 유저 조회, refresh, logout helper
app/api/auth/refresh/route.ts    # refresh token 중계 route
app/api/auth/onboarding/route.ts # 온보딩 내부 route
hooks/useAuthUser.ts             # 화면에서 쓰는 현재 유저 hook
```
