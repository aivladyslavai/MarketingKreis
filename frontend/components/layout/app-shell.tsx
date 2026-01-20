"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ModalProvider } from "@/components/ui/modal/ModalProvider"
import ChatWidget from "@/components/chat/chat-widget"
import { sync } from "@/lib/sync"
import CommandPalette from "@/components/command-palette"
import MobileNav from "@/components/layout/mobile-nav"
import OnboardingTour from "@/components/onboarding/onboarding-tour"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const toggleSidebar = () => setSidebarCollapsed((v) => !v)

  // Swipe-to-open for mobile sidebar
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (typeof window === "undefined") return
    if (window.innerWidth >= 768) return // only on mobile
    if (mobileMenuOpen) return
    if (e.touches.length !== 1) return

    const touch = e.touches[0]
    // only start gesture very close to the left edge
    if (touch.clientX > 24) return

    touchStartXRef.current = touch.clientX
    touchStartYRef.current = touch.clientY
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (typeof window === "undefined") return
    if (window.innerWidth >= 768) return
    if (mobileMenuOpen) return
    if (touchStartXRef.current == null || touchStartYRef.current == null) return

    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartXRef.current
    const dy = touch.clientY - touchStartYRef.current

    // simple horizontal swipe-right detection
    const horizontalEnough = Math.abs(dx) > 40
    const verticalStable = Math.abs(dy) < 40

    if (dx > 0 && horizontalEnough && verticalStable) {
      setMobileMenuOpen(true)
    }

    touchStartXRef.current = null
    touchStartYRef.current = null
  }

  // react to feature flags
  useEffect(() => {
    const read = () => {
      try { return JSON.parse(localStorage.getItem("featureFlags") || "{}") } catch { return {} }
    }
    const apply = (ff: Record<string, boolean>) => {
      setFlags(ff)
      if (ff.compactSidebar) {
        setSidebarCollapsed(true)
      }
      try {
        document.documentElement.classList.toggle('mk-reduced-motion', !!ff.reducedMotion)
      } catch {}
    }
    apply(read())
    const onStorage = (e: StorageEvent) => {
      if (e.key === "featureFlags") {
        try { apply(JSON.parse(e.newValue || "{}")) } catch {}
      }
    }
    const onCustom = () => apply(read())
    window.addEventListener("storage", onStorage)
    window.addEventListener("mk:flags", onCustom as any)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("mk:flags", onCustom as any)
    }
  }, [])

  // Allow MobileNav "Menu" button to open the drawer.
  useEffect(() => {
    const onOpen = () => setMobileMenuOpen(true)
    try {
      window.addEventListener("mk:open-mobile-menu", onOpen as any)
      return () => window.removeEventListener("mk:open-mobile-menu", onOpen as any)
    } catch {
      return
    }
  }, [])

  // Auto refresh (global)
  useEffect(() => {
    let id: any
    if (flags.autoRefresh) {
      id = setInterval(() => {
        try { sync.refreshAll() } catch {}
      }, 60_000)
    }
    return () => { if (id) clearInterval(id) }
  }, [flags.autoRefresh])

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (!mobileMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen])

  const bgStyle = useMemo(() => {
    if (!flags.gridBackground) return undefined
    const line = 'rgba(148,163,184,0.12)'
    return {
      backgroundImage: `
        linear-gradient(to right, var(--mk-grid-color, ${line}) 1px, transparent 1px),
        linear-gradient(to bottom, var(--mk-grid-color, ${line}) 1px, transparent 1px)
      `,
      backgroundSize: '24px 24px',
    } as React.CSSProperties
  }, [flags.gridBackground])

  return (
    <ModalProvider>
      <div
        className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 overflow-x-hidden"
        style={bgStyle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sidebar */}
        <div className="hidden md:block">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[70] md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="close-mobile-menu"
            />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
              {/* Reuse Sidebar at full width for mobile */}
              <Sidebar variant="drawer" isCollapsed={false} onToggle={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div 
          className={`
            transition-all duration-300 ease-in-out
            ml-0
            ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
          `}
        >
          {/* DEV ribbon */}
          {flags.devRibbon && (
            <div className="fixed right-3 top-3 z-[60] select-none">
              <div className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white text-xs font-semibold px-3 py-1 shadow-lg">
                DEV
              </div>
            </div>
          )}
          {/* Header */}
          <Header onMenuClick={() => setMobileMenuOpen(true)} />

          {/* Page Content */}
          <main className="p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6 lg:pb-8 md:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto w-full min-w-0">
              {children}
            </div>
          </main>
          <OnboardingTour />
          <ChatWidget />
          <div data-tour="mobile-nav">
            <MobileNav />
          </div>
          <CommandPalette />
        </div>
      </div>
    </ModalProvider>
  )
}







