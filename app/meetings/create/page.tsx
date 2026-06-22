import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { MeetingCreate } from "@/components/meeting/MeetingCreate"
import { authOptions } from "@/lib/auth/options"

export default async function MeetingCreatePage() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    redirect("/landing")
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1184px]">
        <MeetingCreate />
      </div>
    </main>
  )
}
