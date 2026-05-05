"use client"

import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useModal } from "@/components/ui/modal/ModalProvider"
import { AccountDrawer } from "@/components/account/AccountDrawer"
import { usePathname } from "next/navigation"
import { NotificationsPanel } from "@/components/content/NotificationsPanel"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false)
  const { openModal, closeModal } = useModal()
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
    <header
      className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl shadow-sm"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* KA BOOM corporate brand stripe */}
      <div className="kaboom-brand-band" aria-hidden="true" />
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden h-11 w-11 rounded-full hover:bg-secondary transition-colors"
              aria-label="Open menu"
              data-tour="menu-button"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </Button>
            <div className="hidden sm:flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-md bg-kaboom-black text-kaboom-white font-display font-extrabold tracking-tight text-sm">
                KA<span className="text-kaboom-red">·</span>BOOM
              </span>
              <span className="text-sm font-semibold text-foreground/80 tracking-tight">
                Marketing Platform
              </span>
            </div>
            <div className="sm:hidden text-sm font-semibold text-foreground truncate max-w-[55vw]">
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
                  type: "custom",
                  title: "Nachrichten",
                  content: (
                    <div className="space-y-4">
                      <NotificationsPanel />
                      <div className="flex justify-end gap-2">
                        <Button
                          className="h-11 bg-white text-slate-900 hover:bg-white/90 dark:bg-white dark:text-slate-900"
                          onClick={closeModal}
                        >
                          OK
                        </Button>
                      </div>
                    </div>
                  ),
                })
              }}
              className="relative h-11 w-11 sm:h-9 sm:w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              data-tour="notifications"
            >
              <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
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
      </div>

      {/* Account Drawer */}
      <AccountDrawer 
        isOpen={accountDrawerOpen} 
        onClose={() => setAccountDrawerOpen(false)} 
      />
    </header>
  )
}
