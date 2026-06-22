import { MeetingConferenceRoom } from "@/components/meeting/MeetingConferenceRoom"

type MeetingConferencePageProps = {
  params: Promise<{
    meetingId: string
  }>
}

export default async function MeetingConferencePage({
  params,
}: MeetingConferencePageProps) {
  const { meetingId } = await params
  const parsedMeetingId = Number(meetingId)

  return (
    <MeetingConferenceRoom
      meetingId={
        Number.isFinite(parsedMeetingId) && parsedMeetingId > 0
          ? parsedMeetingId
          : null
      }
    />
  )
}
