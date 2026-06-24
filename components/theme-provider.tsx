"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// 다크모드 미지원 — 브라우저·OS 설정과 무관하게 항상 라이트 테마로 강제한다.
// forcedTheme="light" + enableColorScheme 으로 .dark 클래스가 절대 적용되지 않고
// 네이티브 컨트롤(스크롤바·폼 등)도 라이트로 렌더된다.
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      forcedTheme="light"
      enableSystem={false}
      enableColorScheme
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
