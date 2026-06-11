import { VideoMeetingRoom } from "@/components/meeting/VideoMeetingRoom"

type VideoMeetingPageProps = {
  searchParams: Promise<{
    meetingId?: string
    roomId?: string
  }>
}

export default async function VideoMeetingPage({
  searchParams,
}: VideoMeetingPageProps) {
  const params = await searchParams

  return (
    <VideoMeetingRoom
      meetingId={params.meetingId}
      roomId={params.roomId}
    />
  )
}
