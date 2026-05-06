import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { NetworkDebugPatch } from "@/components/feature-flags/NetworkDebugPatch"
import { ThemeProvider } from "@/components/theme-provider"
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
    <html lang="de" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='mk_theme';var s=localStorage.getItem(k)||'system';var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s==='system'?(d?'dark':'light'):s;var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.setAttribute('data-theme-mode',t);r.style.colorScheme=t==='dark'?'dark':'light';}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-[100dvh] overflow-x-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased`}>
        <ThemeProvider>
          <NetworkDebugPatch />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}