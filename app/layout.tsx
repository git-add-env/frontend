import { Geist_Mono, Inter } from "next/font/google"

import "@livekit/components-styles"
import "./globals.css"
import Header from "@/components/common/Header"
import { AuthProvider, AuthQuerySync } from "@/components/providers/auth-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { ToastProvider } from "@/components/providers/toast-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Footer } from "@/components/common/Footer"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <AuthProvider>
          <QueryProvider>
            <AuthQuerySync />
            <ThemeProvider>
              <ToastProvider>
                <div className="flex min-h-svh flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </ToastProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
