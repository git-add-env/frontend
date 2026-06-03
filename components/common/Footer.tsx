import Link from "next/link"
import { Globe, MessageCircle, Mail } from "lucide-react"

// Footer _ Desktop 디자인 (모여ON 푸터) — HeaderTest 톤에 맞춤
export function Footer() {
    return (
        <footer className="w-full border-t border-black/10 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-6 py-10 md:flex-row md:items-start md:justify-between">
                {/* 왼쪽: 로고 + 한 줄 소개 */}
                <div className="flex flex-col gap-2">
                    <Link href="/landing" className="w-fit text-lg font-bold text-[#0a0a0a]">
                        모여<span className="text-[#1abcfe]">ON</span>
                    </Link>
                    <p className="max-w-xs text-sm text-black/50">
                        함께할 사람을 찾는 가장 쉬운 방법. 프로젝트·해커톤·공모전 모임을 한곳에서.
                    </p>
                </div>

                {/* 가운데: 링크 그룹 */}
                <nav className="flex gap-12 text-sm">
                    <div className="flex flex-col gap-2">
                        <span className="font-semibold text-[#0a0a0a]">서비스</span>
                        <Link href="/meetings" className="text-black/60 transition-colors hover:text-[#0a0a0a]">
                            모임 찾기
                        </Link>
                        <Link href="/dashboard" className="text-black/60 transition-colors hover:text-[#0a0a0a]">
                            내 모임
                        </Link>
                        <Link href="/mypage" className="text-black/60 transition-colors hover:text-[#0a0a0a]">
                            마이페이지
                        </Link>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="font-semibold text-[#0a0a0a]">정보</span>
                        <Link href="/landing" className="text-black/60 transition-colors hover:text-[#0a0a0a]">
                            서비스 소개
                        </Link>
                        <Link href="/landing" className="text-black/60 transition-colors hover:text-[#0a0a0a]">
                            이용약관
                        </Link>
                        <Link href="/landing" className="text-black/60 transition-colors hover:text-[#0a0a0a]">
                            개인정보처리방침
                        </Link>
                    </div>
                </nav>

                {/* 오른쪽: SNS 아이콘 */}
                <div className="flex items-center gap-3">
                    <Link href="#" aria-label="웹사이트" className="text-black/50 transition-colors hover:text-[#0a0a0a]">
                        <Globe className="size-5" />
                    </Link>
                    <Link href="#" aria-label="문의" className="text-black/50 transition-colors hover:text-[#0a0a0a]">
                        <MessageCircle className="size-5" />
                    </Link>
                    <Link href="mailto:contact@moyeon.dev" aria-label="이메일" className="text-black/50 transition-colors hover:text-[#0a0a0a]">
                        <Mail className="size-5" />
                    </Link>
                </div>
            </div>

            {/* 하단 카피라이트 */}
            <div className="border-t border-black/10">
                <div className="mx-auto w-full max-w-[1280px] px-6 py-4">
                    <p className="text-xs text-black/40">
                        © 2026 모여ON. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
