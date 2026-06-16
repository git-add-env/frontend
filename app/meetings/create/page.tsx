import { MeetingCreate } from "@/components/meeting/MeetingCreate"

export default function MeetingCreatePage() {
  return (
    <main className="min-h-screen bg-[#f7f9fb] px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1184px]">
        <MeetingCreate />
      </div>
    </main>
  )
}
