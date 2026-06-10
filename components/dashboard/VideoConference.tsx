import { Button } from "@/components/ui/button"
import { Video, VideoOff } from "lucide-react"

type VideoConferenceProps = {
    // 모임 상태 enum: "RECRUITING" | "ACTIVE" | "COMPLETED"
    status?: string
    // 모임장 여부 (모임장은 회의 시작, 멤버는 참여)
    isLeader?: boolean
    // 모임장이 회의를 시작해서 진행 중인지 (멤버 분기용)
    meetingActive?: boolean
    // 회의 시작/참여 요청 처리 중 (버튼 비활성 + 문구 변경)
    busy?: boolean
    // 회의 시작/참여 클릭 핸들러
    onClick?: () => void
}

export function VideoConference({
    status = "ACTIVE",
    isLeader = true,
    meetingActive = false,
    busy = false,
    onClick,
}: VideoConferenceProps) {
    // 활동중일 때만 화상 회의 가능 (DB-003)
    const isActive = status === "ACTIVE"

    // 모임장: 활동중이면 바로 시작 가능
    // 멤버: 활동중 + 모임장이 회의를 시작한 경우에만 참여 가능
    const canUseVideo = isActive && (isLeader || meetingActive)

    // 버튼 문구: 모임장이고 아직 회의 시작 전이면 '시작하기',
    // 그 외(회의 진행 중 모임장 재입장 / 멤버 참여)는 '참여하기'
    const activeLabel =
        isLeader && !meetingActive ? "화상 회의 시작하기" : "화상 회의 참여하기"

    return (
        <Button
            variant={canUseVideo ? "default" : "secondary"}
            disabled={!canUseVideo || busy}
            onClick={onClick}
        >
            {canUseVideo ? <Video /> : <VideoOff />}
            {busy ? "연결 중..." : canUseVideo ? activeLabel : "회의 준비중"}
        </Button>
    )
}
