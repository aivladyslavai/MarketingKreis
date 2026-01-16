"use client"

import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useModal } from "@/components/ui/modal/ModalProvider"
import { AccountDrawer } from "@/components/account/AccountDrawer"
import { usePathname } from "next/navigation"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false)
  const { openModal } = useModal()
  const pathname = usePathname() || "/"

  const mobileTitle = (() => {
    const map: Array<{ href: string; label: string }> = [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/crm", label: "CRM" },
      { href: "/calendar", label: "Kalender" },
      { href: "/activities", label: "Aktivitäten" },
      { href: "/uploads", label: "Uploads" },
      { href: "/reports", label: "Reports" },
      { href: "/performance", label: "Performance" },
      { href: "/budget", label: "Budget" },
      { href: "/content", label: "Content" },
      { href: "/admin", label: "Admin" },
    ]
    const hit = map.find((x) => pathname === x.href || (x.href !== "/dashboard" && pathname.startsWith(x.href)))
    return hit?.label || "MarketingKreis"
  })()

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
            className="sm:hidden h-11 w-11 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open menu"
            data-tour="menu-button"
          >
            <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </Button>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white hidden sm:block">
            KABOOM Marketing Platform
          </h2>
          <div className="sm:hidden text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[55vw]">
            {mobileTitle}
          </div>
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
            className="relative h-11 w-11 sm:h-9 sm:w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            data-tour="notifications"
          >
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-kaboom-red rounded-full"></span>
          </Button>

          {/* User Avatar / Account */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAccountDrawerOpen(true)}
            className="h-11 w-11 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-kaboom-red to-red-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-shadow"
            data-tour="user-menu"
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
