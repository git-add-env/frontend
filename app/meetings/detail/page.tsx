import { MeetingDetail } from "@/components/meeting/MeetingDetail"

type MeetingDetailPageProps = {
  searchParams: Promise<{
    meetingId?: string
  }>
}

export default async function MeetingDetailPage({ searchParams }: MeetingDetailPageProps) {
  const { meetingId } = await searchParams
  const parsedMeetingId = parseMeetingId(meetingId)

  return (
    <main className="min-h-screen bg-[#f7f9fb] px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-[1184px] flex-col gap-8">
        <MeetingDetail meetingId={parsedMeetingId} />
      </div>
    </main>
  )
}

function parseMeetingId(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const meetingId = Number(value)

  return Number.isFinite(meetingId) ? meetingId : undefined
}
