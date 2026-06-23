import { notFound } from "next/navigation"

import { MeetingCreate } from "@/components/meeting/MeetingCreate"

type MeetingEditPageProps = {
  params: Promise<{
    meetingId: string
  }>
}

export default async function MeetingEditPage({ params }: MeetingEditPageProps) {
  const { meetingId } = await params
  const parsedMeetingId = parseMeetingId(meetingId)

  if (parsedMeetingId === undefined) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] py-10">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <MeetingCreate meetingId={parsedMeetingId} />
      </div>
    </main>
  )
}

function parseMeetingId(value: string) {
  if (!/^[1-9]\d*$/.test(value)) {
    return undefined
  }

  return Number(value)
}
