"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { motion } from "framer-motion"
import {
	LayoutDashboard,
	Briefcase,
	Users,
	TrendingUp,
	Calendar as CalendarIcon,
	Activity,
	FileText,
	BarChart3,
	ArrowRight,
	Sparkles,
	CheckCircle2,
	Clock,
} from "lucide-react"
import { sync } from "@/lib/sync"
import { getCategoryColor } from "@/lib/colors"
import { useCrmOverview } from "@/hooks/use-crm-overview"
import { PageHeader } from "@/components/layout/page-header"
import { useAuth } from "@/hooks/use-auth"

export default function DashboardPage() {
	const { stats, activities, events: calendarEvents, companyGraph, loading: isLoading, updateCalendarEvent } =
		useCrmOverview() as any
	const { user } = useAuth()

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
	}
	const itemVariants = {
		hidden: { opacity: 0, y: 16 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-24 w-full rounded-2xl" />
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
					{[...Array(4)].map((_, i) => (
						<Skeleton key={i} className="h-28 rounded-2xl" />
					))}
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{[...Array(3)].map((_, i) => (
						<Skeleton key={i} className="h-40 rounded-2xl" />
					))}
				</div>
			</div>
		)
	}

	const kpiCards = [
		{ title: "Unternehmen", value: stats?.totalCompanies || stats?.companies || 0, icon: Briefcase, link: "/crm?tab=companies" },
		{ title: "Kontakte", value: stats?.totalContacts || stats?.contacts || 0, icon: Users, link: "/crm?tab=contacts" },
		{ title: "Projekte", value: stats?.totalProjects || stats?.projects || stats?.totalDeals || 0, icon: TrendingUp, link: "/crm?tab=projects" },
		{ title: "Pipeline", value: `${((stats?.pipelineValue || 0) / 1000).toFixed(0)}k CHF`, icon: BarChart3, link: "/crm?tab=projects" },
	]

	const secondaryKpis = [
		{ title: "Aktivitäten", value: stats?.activities || 0, icon: Activity, link: "/activities" },
		{ title: "Kalender Events", value: stats?.events || 0, icon: CalendarIcon, link: "/calendar" },
		{ title: "Content", value: 0, icon: FileText, link: "/content" },
		{ title: "Conversion", value: `${(stats?.conversionRate || 0).toFixed(1)}%`, icon: BarChart3, link: "/performance" },
	]

	const moduleCards = [
		{ title: "CRM", description: `${stats?.totalCompanies || 0} Unternehmen · ${stats?.totalContacts || 0} Kontakte`, link: "/crm", icon: Briefcase },
		{ title: "Marketing Aktivitäten", description: `${stats?.activities || 0} aktive Kampagnen`, link: "/activities", icon: Activity },
		{ title: "Kalender", description: `${stats?.events || 0} anstehende Termine`, link: "/calendar", icon: CalendarIcon },
		{ title: "Performance", description: "Analytics & Reporting", link: "/performance", icon: BarChart3 },
		{ title: "Content Management", description: "Inhalte verwalten", link: "/content", icon: FileText },
	]

	const today = new Date()
	const todayEvents = (calendarEvents || []).filter((e: any) => {
		const d = new Date(e.start as any)
		return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
	}).slice(0, 6)

	const weekEvents = (calendarEvents || []).filter((e: any) => {
		const d = new Date(e.start as any)
		const start = new Date(today)
		const end = new Date(today)
		start.setDate(today.getDate() - today.getDay() + 1)
		end.setDate(start.getDate() + 6)
		return d >= start && d <= end
	}).slice(0, 8)

	return (
		<motion.div className="space-y-6 sm:space-y-7" variants={containerVariants} initial="hidden" animate="visible">
			{/* ── Hero ────────────────────────────────────────────────────────── */}
			<motion.div variants={itemVariants}>
				<PageHeader
					title="Dashboard"
					description={`Willkommen zurück${user?.email ? `, ${user.email.split("@")[0]}` : ""} — hier ist dein Marketing-Überblick auf einen Blick.`}
					icon={LayoutDashboard}
					meta={
						<span className="inline-flex items-center gap-1.5 rounded-full bg-kaboom-black px-2.5 py-0.5 text-[11px] font-extrabold tracking-tight text-kaboom-white">
							KA<span className="text-kaboom-red">·</span>BOOM
						</span>
					}
					actions={
						<Link href="/activities">
							<Button className="gap-2">
								<Sparkles className="h-4 w-4" />
								Neue Aktivität
							</Button>
						</Link>
					}
				/>
			</motion.div>

			{/* ── Primary KPI row (big numbers) ───────────────────────────────── */}
			<motion.div variants={itemVariants}>
				<div id="tour-kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
					{kpiCards.map((card) => {
						const Icon = card.icon
						return (
							<Link key={card.title} href={card.link} className="group">
								<Card className="relative overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-kaboom-red/40 hover:shadow-lg hover:shadow-kaboom-red/10">
									<div
										aria-hidden="true"
										className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--kaboom-red)/0.10),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
									/>
									<CardContent className="relative p-4 sm:p-5">
										<div className="flex items-center justify-between gap-2">
											<div className="min-w-0 flex-1">
												<p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground truncate">
													{card.title}
												</p>
												<p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
													{card.value}
												</p>
											</div>
											<div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-kaboom-red/10 text-kaboom-red ring-1 ring-kaboom-red/20 transition-transform duration-300 group-hover:scale-110">
												<Icon className="h-5 w-5" />
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						)
					})}
				</div>
			</motion.div>

			{/* ── Secondary KPI row (slim) ────────────────────────────────────── */}
			<motion.div variants={itemVariants}>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
					{secondaryKpis.map((card) => {
						const Icon = card.icon
						return (
							<Link key={card.title} href={card.link} className="group">
								<div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-all duration-300 hover:border-kaboom-red/40 hover:bg-secondary">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground/70 group-hover:bg-kaboom-red/10 group-hover:text-kaboom-red transition-colors">
										<Icon className="h-4 w-4" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground truncate">
											{card.title}
										</p>
										<p className="font-display text-base sm:text-lg font-extrabold tracking-tight text-foreground">
											{card.value}
										</p>
									</div>
								</div>
							</Link>
						)
					})}
				</div>
			</motion.div>

			{/* ── Modules ─────────────────────────────────────────────────────── */}
			<motion.div variants={itemVariants}>
				<SectionTitle title="Module" subtitle="Schneller Zugriff auf alle Bereiche" />
				<div id="tour-modules" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
					{moduleCards.map((module) => {
						const Icon = module.icon
						return (
							<Link key={module.title} href={module.link} className="group">
								<Card className="relative overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-kaboom-red/40">
									<div
										aria-hidden="true"
										className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-kaboom-red/0 transition-colors duration-300 group-hover:bg-kaboom-red"
									/>
									<CardContent className="relative p-4 sm:p-5">
										<div className="flex items-center gap-3 sm:gap-4">
											<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-kaboom-red/10 text-kaboom-red ring-1 ring-kaboom-red/20 transition-transform duration-300 group-hover:scale-110">
												<Icon className="h-5 w-5" />
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="font-display text-base font-extrabold tracking-tight text-foreground truncate">
													{module.title}
												</h3>
												<p className="text-xs text-muted-foreground mt-0.5 truncate">
													{module.description}
												</p>
											</div>
											<ArrowRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-kaboom-red group-hover:translate-x-1 shrink-0" />
										</div>
									</CardContent>
								</Card>
							</Link>
						)
					})}
				</div>
			</motion.div>

			{/* ── CRM relations ───────────────────────────────────────────────── */}
			<motion.div variants={itemVariants}>
				<SectionTitle title="CRM Beziehungen" subtitle="Aktivitäten, Termine und Tasks pro Kunde" />
				<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{(companyGraph || []).slice(0, 6).map((item: any) => (
						<Link
							key={item.company.id}
							href={`/activities?company_id=${item.company.id}`}
							className="group rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-kaboom-red/40 hover:bg-secondary"
						>
							<div className="flex items-center gap-2.5">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kaboom-red/10 text-kaboom-red ring-1 ring-kaboom-red/20">
									<Briefcase className="h-4 w-4" />
								</div>
								<div className="font-display text-sm font-extrabold tracking-tight text-foreground truncate">
									{item.company.name}
								</div>
							</div>
							<div className="mt-3 grid grid-cols-5 gap-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
								<MiniStat value={item.contacts.length} label="Kontakte" />
								<MiniStat value={item.projects.length} label="Projekte" />
								<MiniStat value={item.activities.length} label="Aktiv." />
								<MiniStat value={item.events.length} label="Termine" />
								<MiniStat value={item.tasks?.length || 0} label="Tasks" />
							</div>
						</Link>
					))}
					{(!companyGraph || companyGraph.length === 0) && (
						<div className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
							<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-kaboom-red/10 text-kaboom-red ring-1 ring-kaboom-red/20">
								<Briefcase className="h-5 w-5" />
							</div>
							<p className="font-display text-base font-extrabold tracking-tight text-foreground">
								Noch keine Kunden
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Lege deinen ersten Kunden an, um den Marketing-Flow zu starten.
							</p>
							<Link href="/crm" className="mt-3 inline-block">
								<Button className="gap-2">
									<Briefcase className="h-4 w-4" />
									Kunde anlegen
								</Button>
							</Link>
						</div>
					)}
				</div>
			</motion.div>

			{/* ── Today / Week ────────────────────────────────────────────────── */}
			<motion.div variants={itemVariants}>
				<SectionTitle title="Heute & Woche" subtitle="Was kommt als Nächstes?" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
					<TimelineCard
						title="Heute"
						icon={CalendarIcon}
						events={todayEvents}
						emptyLabel="Keine Termine heute"
						formatTime={(d) => new Date(d).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
						onDone={async (id) => {
							await updateCalendarEvent(id, { status: "DONE" })
							sync.emit("calendar:changed")
						}}
						onDelay={async (id) => {
							await updateCalendarEvent(id, { status: "DELAYED" })
							sync.emit("calendar:changed")
						}}
					/>
					<TimelineCard
						title="Diese Woche"
						icon={Clock}
						events={weekEvents}
						emptyLabel="Keine Termine diese Woche"
						formatTime={(d) => new Date(d).toLocaleDateString("de-DE")}
						onDone={async (id) => {
							await updateCalendarEvent(id, { status: "DONE" })
							sync.emit("calendar:changed")
						}}
						onDelay={async (id) => {
							await updateCalendarEvent(id, { status: "DELAYED" })
							sync.emit("calendar:changed")
						}}
					/>
				</div>
			</motion.div>

			{/* ── Recent activities ───────────────────────────────────────────── */}
			<motion.div variants={itemVariants}>
				<SectionTitle title="Letzte Aktivitäten" subtitle="Aktuelle Marketing-Aktivitäten deiner Organisation" />
				<Card className="border-border bg-card">
					<CardContent className="p-3 sm:p-5">
						{activities && activities.length > 0 ? (
							<div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar" role="list">
								{[...(activities as any[])]
									.filter((a) => a.start)
									.sort((a, b) => new Date(b.start as any).getTime() - new Date(a.start as any).getTime())
									.slice(0, 12)
									.map((activity: any) => {
										const color = getCategoryColor(activity.category || "")
										return (
											<div
												key={activity.id}
												className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:bg-secondary"
											>
												<div className="flex items-center gap-3 min-w-0 flex-1">
													<span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
													<div className="min-w-0">
														<p className="font-semibold text-sm text-foreground truncate">{activity.title}</p>
														<p className="text-xs text-muted-foreground truncate">{activity.category || "—"}</p>
													</div>
												</div>
												<div className="text-right whitespace-nowrap flex-shrink-0">
													<p className="text-xs text-muted-foreground">
														{activity.start ? new Date(activity.start as any).toLocaleString("de-DE") : ""}
													</p>
													<p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{activity.status}</p>
												</div>
											</div>
										)
									})}
							</div>
						) : (
							<div className="py-12 text-center">
								<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-kaboom-red/10 text-kaboom-red ring-1 ring-kaboom-red/20">
									<Activity className="h-5 w-5" />
								</div>
								<h3 className="font-display text-lg font-extrabold tracking-tight text-foreground">
									Noch keine Aktivitäten
								</h3>
								<p className="mt-1 text-sm text-muted-foreground">
									Starte mit deiner ersten Marketing-Aktivität.
								</p>
								<Link href="/activities" className="mt-4 inline-block">
									<Button className="gap-2">
										<Sparkles className="h-4 w-4" />
										Neue Aktivität
									</Button>
								</Link>
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</motion.div>
	)
}

// ─── helpers ───────────────────────────────────────────────────────────────

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
	return (
		<div className="mb-3 sm:mb-4 flex items-end justify-between gap-3">
			<div>
				<h2 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
					{title}
				</h2>
				{subtitle ? (
					<p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
				) : null}
			</div>
			<div className="flex-1 max-w-[40%] hidden sm:block border-b border-border/60" aria-hidden="true" />
		</div>
	)
}

function MiniStat({ value, label }: { value: number | string; label: string }) {
	return (
		<div>
			<div className="font-display text-base font-extrabold tracking-tight text-foreground">{value}</div>
			<div className="mt-0.5">{label}</div>
		</div>
	)
}

function TimelineCard({
	title,
	icon: Icon,
	events,
	emptyLabel,
	formatTime,
	onDone,
	onDelay,
}: {
	title: string
	icon: any
	events: any[]
	emptyLabel: string
	formatTime: (d: any) => string
	onDone: (id: number) => void
	onDelay: (id: number) => void
}) {
	return (
		<Card className="border-border bg-card">
			<CardContent className="p-4 sm:p-5">
				<div className="mb-3 flex items-center gap-2.5">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kaboom-red/10 text-kaboom-red ring-1 ring-kaboom-red/20">
						<Icon className="h-4 w-4" />
					</div>
					<h3 className="font-display text-base font-extrabold tracking-tight text-foreground">{title}</h3>
					<span className="ml-auto text-xs text-muted-foreground">{events.length}</span>
				</div>
				{events.length === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
				) : (
					<div className="space-y-2">
						{events.map((e: any) => (
							<div
								key={e.id}
								className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/40 p-2.5 transition-colors hover:bg-secondary"
							>
								<div className="min-w-0 flex-1">
									<p className="font-medium text-sm text-foreground truncate">{e.title}</p>
									<p className="text-xs text-muted-foreground">{formatTime(e.start)}</p>
								</div>
								<div className="flex items-center gap-1.5 flex-shrink-0">
									<button
										type="button"
										onClick={() => onDone(e.id)}
										className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground/70 transition-colors hover:bg-kaboom-red/10 hover:text-kaboom-red hover:border-kaboom-red/30"
									>
										<CheckCircle2 className="h-3 w-3" />
										Done
									</button>
									<button
										type="button"
										onClick={() => onDelay(e.id)}
										className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground/70 transition-colors hover:bg-secondary hidden sm:inline-flex"
									>
										<Clock className="h-3 w-3" />
										Delay
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
