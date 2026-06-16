import { MeetingCreate } from "@/components/meeting/MeetingCreate"

type MeetingEditPageProps = {
  params: Promise<{
    meetingId: string
  }>
}

export default async function MeetingEditPage({ params }: MeetingEditPageProps) {
  const { meetingId } = await params
  const parsedMeetingId = parseMeetingId(meetingId)

  return (
    <main className="min-h-screen bg-[#f7f9fb] px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1184px]">
        <MeetingCreate meetingId={parsedMeetingId} />
      </div>
    </main>
  )
}

function parseMeetingId(value: string) {
  const meetingId = Number(value)

  return Number.isFinite(meetingId) ? meetingId : undefined
}
