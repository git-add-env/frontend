export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  profile: {
    me: ["profile", "me"] as const,
  },
  meetings: {
    list: ["meetings", "list"] as const,
    detail: (meetingId: number) => ["meetings", meetingId, "detail"] as const,

    // 마이페이지 내 모임 목록 (status별). 미지정은 "all".
    mine: (status?: "recruiting" | "active" | "completed") =>
      ["meetings", "mine", status ?? "all"] as const,
    // 내 모임 목록 전체 무효화용 prefix (status 무관).
    mineAll: ["meetings", "mine"] as const,
    bookmarks: ["meetings", "bookmarks"] as const,
    members: (meetingId: number) => ["meetings", meetingId, "members"] as const,
    schedules: (meetingId: number) => ["meetings", meetingId, "schedules"] as const,
    notices: (meetingId: number) => ["meetings", meetingId, "notices"] as const,
    resources: (meetingId: number) => ["meetings", meetingId, "resources"] as const,
  },
  memberProfile: (userId: number) => ["users", userId, "profile"] as const,
}
