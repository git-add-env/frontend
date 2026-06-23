import Link from "next/link"

// 브랜드 아이콘(GitHub)은 lucide v1에서 제거돼 인라인 SVG로 처리
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5A10 10 0 0 0 22 12 10 10 0 0 0 12 2z" />
    </svg>
  )
}

// Footer _ Desktop 디자인 (모여ON 푸터)
export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        {/* 왼쪽: 브랜드 + 태그라인 + 저작권 */}
        <div className="flex flex-col items-start gap-1">
          <Link
            href="/landing"
            className="inline-flex items-start gap-1 text-lg font-bold"
          >
            <span className="text-foreground">
              모여<span className="text-[#1abcfe]">ON</span>
            </span>
            <span
              className="mt-1 size-1.5 rounded-full bg-[#1abcfe]"
              aria-hidden="true"
            />
          </Link>
          <p className="text-sm text-muted-foreground">
            비대면 협업을 위한 개발자 팀 매칭 &amp; 화상회의 플랫폼.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            © 2026 모여ON. All rights reserved.
          </p>
        </div>

        {/* 오른쪽: GitHub 링크 */}
        <Link
          href="https://github.com/git-add-env/frontend"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub 저장소"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border-2 border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <GithubIcon className="size-4" />
          GitHub
        </Link>
      </div>
    </footer>
  )
}
