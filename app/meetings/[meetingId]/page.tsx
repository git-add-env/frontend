import { MeetingDetail } from "@/components/meeting/MeetingDetail"

type MeetingDetailPageProps = {
  params: Promise<{
    meetingId: string
  }>
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { meetingId } = await params
  const parsedMeetingId = parseMeetingId(meetingId)

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-[1184px] flex-col gap-8">
        <MeetingDetail meetingId={parsedMeetingId} />
      </div>
    </main>
  )
}

function parseMeetingId(value: string) {
  const meetingId = Number(value)

  return Number.isFinite(meetingId) ? meetingId : undefined
}
