"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Building2, CalendarDays, ActivitySquare, FileBarChart } from "lucide-react"

const items = [
  { href: "/dashboard", label: "Home", Icon: LayoutDashboard },
  { href: "/crm", label: "CRM", Icon: Building2 },
  { href: "/calendar", label: "Kalender", Icon: CalendarDays },
  { href: "/activities", label: "Aktivität", Icon: ActivitySquare },
  { href: "/reports", label: "Reports", Icon: FileBarChart },
]

export default function MobileNav() {
  const pathname = usePathname()
  return (
    <nav
      className="
        md:hidden fixed bottom-0 left-0 right-0 z-[60]
        backdrop-blur-2xl bg-white/90 dark:bg-slate-950/90
        border-t border-slate-200/80 dark:border-slate-800/80
        shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]
      "
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
      }}
    >
      <ul className="mx-auto max-w-[480px] grid grid-cols-5 gap-0.5 px-2 py-1.5">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <li key={href} className="flex justify-center">
              <Link
                href={href}
                className={`
                  relative inline-flex flex-col items-center justify-center rounded-xl w-full py-1.5 transition-all duration-200
                  ${active
                    ? "text-kaboom-red"
                    : "text-slate-500 dark:text-slate-400 active:scale-95"}
                `}
                aria-current={active ? "page" : undefined}
              >
                <div className={`
                  relative p-1.5 rounded-xl transition-all duration-200
                  ${active ? "bg-kaboom-red/10 dark:bg-kaboom-red/20" : ""}
                `}>
                  <Icon className={`h-5 w-5 ${active ? "text-kaboom-red" : ""}`} />
                  {active && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-kaboom-red animate-pulse" />
                  )}
                </div>
                <span className={`text-[10px] mt-0.5 font-medium truncate max-w-full px-0.5 ${active ? "text-kaboom-red" : ""}`}>
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}



