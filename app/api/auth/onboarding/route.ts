import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { completeSocialOnboarding } from "@/lib/auth/backend"
import { authOptions } from "@/lib/auth/options"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.tempToken) {
    return NextResponse.json({ message: "온보딩 세션이 없습니다." }, { status: 401 })
  }

  const body = (await request.json()) as {
    nickname?: string
    job?: string
  }

  if (!body.nickname || !body.job) {
    return NextResponse.json({ message: "닉네임과 직종을 입력해주세요." }, { status: 400 })
  }

  const result = await completeSocialOnboarding({
    tempToken: session.tempToken,
    nickname: body.nickname,
    job: body.job,
  })

  // 클라이언트는 이 응답을 받은 뒤 useSession().update(result)로 NextAuth 세션을 갱신합니다.
  return NextResponse.json(result)
}
