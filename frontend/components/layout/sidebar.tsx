"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  ActivitySquare,
  LineChart,
  Wallet,
  Image as ImageIcon,
  FileBarChart,
  UploadCloud,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"

function SafeIcon({ Icon, className }: { Icon?: React.ComponentType<any>, className?: string }) {
  if (!Icon) {
    return <div className={className} />
  }
  return <Icon className={className} />
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm", label: "CRM", icon: Building2 },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/activities", label: "Aktivitäten", icon: ActivitySquare },
  { href: "/performance", label: "Performance", icon: LineChart },
  { href: "/budget", label: "Budget & KPIs", icon: Wallet },
  { href: "/content", label: "Content Hub", icon: ImageIcon },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/uploads", label: "Uploads", icon: UploadCloud },
  { href: "/admin", label: "Admin", icon: Shield },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <aside 
      className={`
        fixed left-0 top-0 h-screen 
        ${isCollapsed ? 'w-20' : 'w-64'} 
        bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 
        border-r border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-50 
        transition-all duration-300 ease-in-out
      `}
      data-tour="sidebar"
    >
      {/* Subtle Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-kaboom-red/5 via-transparent to-blue-500/5 opacity-50"></div>
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Logo Section */}
        <div className={`${isCollapsed ? 'p-4' : 'p-6'} border-b border-slate-200 dark:border-white/10 transition-all duration-300`}>
          <Link href="/dashboard" className="group block">
            <div className={`
              relative rounded-xl bg-gradient-to-r from-kaboom-red/15 to-transparent 
              border border-kaboom-red/20 hover:border-kaboom-red/40 
              transition-all duration-300 overflow-hidden
              ${isCollapsed ? 'p-3' : 'p-4'}
            `}>
              <div className="relative flex items-center gap-3">
                <div className="relative flex-shrink-0 h-8 w-8 rounded-md bg-kaboom-red/30" />
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <div className="text-xl font-black tracking-tight whitespace-nowrap text-slate-900 dark:text-white">
                      <span>Marketing</span>
                      <span className="text-kaboom-red">Kreis</span>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-white/40 font-semibold tracking-widest uppercase whitespace-nowrap">
                      Powered by KA BOOM
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'} py-4 transition-all duration-300`}>
          {!isCollapsed && (
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/30 mb-3 px-3">
              Navigation
            </h2>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group relative flex items-center rounded-lg transition-all duration-200
                    ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
                    ${isActive
                      ? "bg-kaboom-red text-white shadow-lg shadow-kaboom-red/30"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5"
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900 dark:bg-white rounded-r-full"></div>
                  )}
                  
                  {/* Icon */}
                  <SafeIcon Icon={item.icon as any} className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 text-slate-600 dark:text-white/70`} />
                  
                  {/* Label */}
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Toggle Button */}
        <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-slate-200 dark:border-white/10 transition-all duration-300`}>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className={`
              w-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5 
              transition-all duration-200
              ${isCollapsed ? 'justify-center px-2' : 'justify-start'}
            `}
          >
            {isCollapsed ? (
              <span className="text-sm">›</span>
            ) : (
              <>
                <span className="mr-2">‹</span>
                <span className="text-xs">Ausblenden</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}





