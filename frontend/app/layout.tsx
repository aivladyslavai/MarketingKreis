import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { NetworkDebugPatch } from "@/components/feature-flags/NetworkDebugPatch"
// import { CRMProvider } from "@/contexts/crm-context" // TEMP DISABLED

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Marketing Kreis Platform",
  description: "Swiss Marketing Management Platform",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className="dark" data-theme-mode="dark" suppressHydrationWarning style={{ colorScheme: "dark" }}>
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body className={`${inter.className} min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased`}>
        <NetworkDebugPatch />
        {children}
      </body>
    </html>
  )
}