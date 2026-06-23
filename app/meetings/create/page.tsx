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
    <main className="min-h-screen bg-[#f7f9fb] py-10">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <MeetingCreate />
      </div>
    </main>
  )
}
