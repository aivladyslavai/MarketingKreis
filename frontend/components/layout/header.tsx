"use client"

import { Sun, Moon, MonitorCog, Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useModal } from "@/components/ui/modal/ModalProvider"
import { AccountDrawer } from "@/components/account/AccountDrawer"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  type Mode = "auto" | "light" | "dark"
  const [mode, setMode] = useState<Mode>("auto")
  const [mounted, setMounted] = useState(false)
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false)
  const { openModal } = useModal()

  useEffect(() => {
    setMounted(true)
    // Load theme mode from localStorage (auto | light | dark)
    const saved = (localStorage.getItem('themeMode') as Mode | null) || 'auto'
    applyMode(saved)
    // React to system changes if on auto
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const current = (localStorage.getItem('themeMode') as Mode | null) || 'auto'
      if (current === 'auto') applyMode('auto')
    }
    try { mql.addEventListener('change', onChange) } catch { mql.addListener(onChange) }
    return () => { try { mql.removeEventListener('change', onChange) } catch { mql.removeListener(onChange) } }
  }, [])

  const applyMode = (m: Mode) => {
    setMode(m)
    localStorage.setItem('themeMode', m)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = (m === 'dark') || (m === 'auto' && prefersDark)
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.setAttribute('data-theme-mode', m)
  }

  const toggleMode = () => {
    const order: Mode[] = ["auto", "light", "dark"]
    const idx = order.indexOf(mode)
    const next = order[(idx + 1) % order.length]
    applyMode(next)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="sm:hidden h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open menu"
            data-tour="menu-button"
          >
            <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </Button>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white hidden sm:block">
            KABOOM Marketing Platform
          </h2>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              openModal({
                type: "info",
                title: "Nachrichten",
                description: "Sie haben noch keine neuen Nachrichten. Wir werden Sie benachrichtigen, wenn neue Nachrichten vorhanden sind.",
                icon: "info"
              })
            }}
            className="relative h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            data-tour="notifications"
          >
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-kaboom-red rounded-full"></span>
          </Button>

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMode}
              className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={mode === 'auto' ? 'Theme: Auto' : mode === 'light' ? 'Theme: Light' : 'Theme: Dark'}
              data-tour="theme-toggle"
            >
              {mode === "auto" && <MonitorCog className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
              {mode === "light" && <Sun className="h-5 w-5 text-amber-500" />}
              {mode === "dark" && <Moon className="h-5 w-5 text-slate-200" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          {/* User Avatar / Account */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAccountDrawerOpen(true)}
            className="h-9 w-9 rounded-full bg-gradient-to-br from-kaboom-red to-red-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            A
          </Button>
        </div>
      </div>

      {/* Account Drawer */}
      <AccountDrawer 
        isOpen={accountDrawerOpen} 
        onClose={() => setAccountDrawerOpen(false)} 
      />
    </header>
  )
}
