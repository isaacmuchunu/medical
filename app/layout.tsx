import { Inter } from "next/font/google"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/app/providers"
import { cn } from "@/lib/utils"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.className
      )}>
        <Providers>
          <div className="flex">
            <Sidebar className="w-64 border-r bg-white" />
            <div className="flex-1">
              <Header />
              <main className="flex-1 p-8">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
