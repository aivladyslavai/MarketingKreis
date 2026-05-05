"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Shield,
  Users,
  X,
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
  { href: "/team", label: "Team", icon: Users },
  { href: "/admin", label: "Admin", icon: Shield },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  variant?: "fixed" | "drawer"
}

export function Sidebar({ isCollapsed, onToggle, variant = "fixed" }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin" || user?.role === "owner"
  const isCompanyAdmin = user?.role === "admin" || user?.role === "owner"
  const perms = (user as any)?.section_permissions || {}
  const allow = (section: string) => !(perms && typeof perms === "object" && perms[section] === false)
  const sectionForHref = (href: string) => {
    if (href.startsWith("/crm")) return "crm"
    if (href.startsWith("/calendar")) return "calendar"
    if (href.startsWith("/activities")) return "activities"
    if (href.startsWith("/performance")) return "performance"
    if (href.startsWith("/budget")) return "budget"
    if (href.startsWith("/content")) return "content"
    if (href.startsWith("/reports")) return "reports"
    if (href.startsWith("/uploads")) return "uploads"
    if (href.startsWith("/team")) return "team"
    if (href.startsWith("/admin")) return "admin"
    return "dashboard"
  }
  const visibleNavItems = navItems.filter((i) => {
    const sec = sectionForHref(i.href)
    if (sec === "admin") return isAdmin
    if (sec === "team") return isCompanyAdmin
    return allow(sec)
  })
  const isDrawer = variant === "drawer"

  return (
    <aside 
      className={`
        ${isDrawer ? 'relative h-full' : 'fixed left-0 top-0 h-[100dvh]'}
        ${isDrawer ? 'w-full' : (isCollapsed ? 'w-20' : 'w-64')} 
        bg-background dark:bg-kaboom-black
        border-r border-border shadow-xl overflow-hidden z-50 
        transition-all duration-300 ease-in-out
      `}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      data-tour="sidebar"
    >
      {/* Subtle brand wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-kaboom-red/[0.04] via-transparent to-transparent pointer-events-none" aria-hidden="true"></div>
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Logo Section */}
        <div className={`${isCollapsed ? 'p-3' : 'p-5'} border-b border-border transition-all duration-300`}>
          <Link href="/dashboard" className="group block">
            <div className={`
              relative rounded-xl border border-border bg-card hover:border-kaboom-red/40
              transition-all duration-300 overflow-hidden
              ${isCollapsed ? 'p-2.5' : 'p-3'}
            `}>
              <div className="relative flex items-center gap-3">
                <div className="relative flex-shrink-0 h-9 w-9 rounded-md bg-kaboom-black flex items-center justify-center font-display font-extrabold text-[13px] leading-none text-kaboom-white">
                  KA<span className="text-kaboom-red">·</span>B
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <div className="text-base font-display font-extrabold tracking-tight whitespace-nowrap text-foreground">
                      Marketing<span className="text-kaboom-red">Kreis</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-semibold tracking-[0.18em] uppercase whitespace-nowrap">
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
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 px-3">
              Navigation
            </h2>
          )}
          <nav className="space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group relative flex items-center rounded-lg transition-all duration-200
                    ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
                    ${isActive
                      ? "bg-kaboom-red text-kaboom-white shadow-md shadow-kaboom-red/25"
                      : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-kaboom-black dark:bg-kaboom-white rounded-r-full"></div>
                  )}
                  <SafeIcon
                    Icon={item.icon as any}
                    className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isActive ? 'text-kaboom-white' : 'text-foreground/60 group-hover:text-foreground'}`}
                  />
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Toggle Button */}
        <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-border transition-all duration-300`}>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className={`
              w-full text-muted-foreground hover:text-foreground hover:bg-secondary
              transition-all duration-200
              ${isDrawer ? 'justify-start' : (isCollapsed ? 'justify-center px-2' : 'justify-start')}
            `}
          >
            {isDrawer ? (
              <>
                <X className="h-4 w-4 mr-2" />
                <span className="text-xs">Schließen</span>
              </>
            ) : isCollapsed ? (
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





