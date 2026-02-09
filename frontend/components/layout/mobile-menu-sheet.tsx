"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ActivitySquare,
  Building2,
  CalendarDays,
  FileBarChart,
  Image as ImageIcon,
  LayoutDashboard,
  LineChart,
  Shield,
  UploadCloud,
  Wallet,
  X,
} from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

type Item = {
  href: string
  label: string
  Icon: React.ComponentType<any>
  requiresAdmin?: boolean
}

const primary: Item[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/crm", label: "CRM", Icon: Building2 },
  { href: "/calendar", label: "Kalender", Icon: CalendarDays },
  { href: "/activities", label: "Aktivitäten", Icon: ActivitySquare },
]

const secondary: Item[] = [
  { href: "/performance", label: "Performance", Icon: LineChart },
  { href: "/budget", label: "Budget & KPIs", Icon: Wallet },
  { href: "/content", label: "Content Hub", Icon: ImageIcon },
  { href: "/reports", label: "Reports", Icon: FileBarChart },
  { href: "/uploads", label: "Uploads", Icon: UploadCloud },
  { href: "/admin", label: "Admin", Icon: Shield, requiresAdmin: true },
]

export default function MobileMenuSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const pathname = usePathname() || "/"
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const visibleSecondary = secondary.filter((i) => (i.requiresAdmin ? isAdmin : true))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="w-full">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-white/10"
            style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">Menü</div>
              <div className="text-[11px] text-slate-400 truncate">Navigation & Bereiche</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
              onClick={() => onOpenChange(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-slate-200" />
            </Button>
          </div>

          <div className="p-4 space-y-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}>
            {/* Primary tabs */}
            <div className="grid grid-cols-2 gap-2">
              {primary.map(({ href, label, Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => onOpenChange(false)}
                    className={[
                      "group rounded-xl border px-3 py-3 flex items-center gap-3 transition-all",
                      "bg-white/5 border-white/10 hover:bg-white/8",
                      active ? "ring-1 ring-kaboom-red/40 border-kaboom-red/30" : "",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "h-10 w-10 rounded-xl flex items-center justify-center border transition-colors",
                        active ? "bg-kaboom-red/15 border-kaboom-red/30" : "bg-white/5 border-white/10",
                      ].join(" ")}
                    >
                      <Icon className={["h-5 w-5", active ? "text-kaboom-red" : "text-slate-200"].join(" ")} />
                    </div>
                    <div className="min-w-0">
                      <div className={["text-sm font-medium truncate", active ? "text-white" : "text-slate-100"].join(" ")}>
                        {label}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{active ? "Aktuell" : "Öffnen"}</div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Secondary list */}
            <div className="space-y-1">
              <div className="px-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Mehr</div>
              <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                {visibleSecondary.map(({ href, label, Icon }) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => onOpenChange(false)}
                      className={[
                        "flex items-center gap-3 px-3 py-3 border-b border-white/10 last:border-b-0",
                        "text-slate-100 hover:bg-white/8 transition-colors",
                        active ? "bg-kaboom-red/10" : "",
                      ].join(" ")}
                    >
                      <Icon className={["h-5 w-5", active ? "text-kaboom-red" : "text-slate-300"].join(" ")} />
                      <span className="text-sm font-medium">{label}</span>
                      {active && <span className="ml-auto text-[11px] text-kaboom-red">Aktuell</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

