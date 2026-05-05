"use client"

import * as React from "react"
import { companiesAPI, contactsAPI, crmAPI, projectsAPI, tasksAPI, type TaskDTO } from "@/lib/api"
import useActivitiesApi, { type Activity } from "@/hooks/use-activities-api"
import { useCalendarApi, type CalendarEvent } from "@/hooks/use-calendar-api"
import { sync } from "@/lib/sync"

export type CrmOverviewCompany = {
  company: any
  contacts: any[]
  projects: any[]
  activities: Activity[]
  events: CalendarEvent[]
  tasks: TaskDTO[]
}

function idOf(value: any): number | null {
  const raw = value?.id ?? value
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function projectCompanyId(project: any): number | null {
  return idOf(project?.company_id ?? project?.companyId ?? project?.company?.id)
}

function contactCompanyId(contact: any): number | null {
  return idOf(contact?.company_id ?? contact?.companyId ?? contact?.company?.id)
}

function eventCompanyId(event: any): number | null {
  return idOf(event?.company_id ?? event?.companyId ?? event?.company?.id)
}

function eventProjectId(event: any): number | null {
  return idOf(event?.project_id ?? event?.deal_id ?? event?.projectId ?? event?.dealId)
}

function eventActivityId(event: any): string | null {
  const raw = event?.activity_id ?? event?.activityId
  return raw == null ? null : String(raw)
}

function activityCompanyId(activity: any): number | null {
  return idOf(activity?.company_id ?? activity?.companyId ?? activity?.company?.id)
}

function activityProjectId(activity: any): number | null {
  return idOf(activity?.project_id ?? activity?.projectId ?? activity?.deal_id ?? activity?.dealId)
}

function taskCompanyId(task: any): number | null {
  return idOf(task?.company_id ?? task?.companyId)
}

function taskProjectId(task: any): number | null {
  return idOf(task?.project_id ?? task?.projectId)
}

function taskActivityId(task: any): string | null {
  const raw = task?.activity_id ?? task?.activityId
  return raw == null ? null : String(raw)
}

export function buildCrmOverviewGraph({
  companies,
  contacts,
  projects,
  activities,
  events,
  tasks,
}: {
  companies: any[]
  contacts: any[]
  projects: any[]
  activities: Activity[]
  events: CalendarEvent[]
  tasks: TaskDTO[]
}): CrmOverviewCompany[] {
  return companies.map((company) => {
    const companyId = idOf(company)
    const companyContacts = contacts.filter((contact) => contactCompanyId(contact) === companyId)
    const companyProjects = projects.filter((project) => projectCompanyId(project) === companyId)
    const projectIds = new Set(companyProjects.map((project) => idOf(project)).filter((id): id is number => id !== null))
    const companyEvents = events.filter((event) => eventCompanyId(event) === companyId || (eventProjectId(event) != null && projectIds.has(eventProjectId(event)!)))
    const activityIds = new Set(companyEvents.map(eventActivityId).filter((id): id is string => Boolean(id)))
    const companyActivities = activities.filter((activity) => activityCompanyId(activity) === companyId || (activityProjectId(activity) != null && projectIds.has(activityProjectId(activity)!)) || activityIds.has(String(activity.id)))
    const allActivityIds = new Set(companyActivities.map((activity) => String(activity.id)))
    const companyTasks = tasks.filter((task) => taskCompanyId(task) === companyId || (taskProjectId(task) != null && projectIds.has(taskProjectId(task)!)) || (taskActivityId(task) != null && allActivityIds.has(taskActivityId(task)!)))

    return {
      company,
      contacts: companyContacts,
      projects: companyProjects,
      activities: companyActivities,
      events: companyEvents,
      tasks: companyTasks,
    }
  })
}

export function useCrmOverview() {
  const [companies, setCompanies] = React.useState<any[]>([])
  const [contacts, setContacts] = React.useState<any[]>([])
  const [projects, setProjects] = React.useState<any[]>([])
  const [crmStats, setCrmStats] = React.useState<any>({})
  const [tasks, setTasks] = React.useState<TaskDTO[]>([])
  const [crmLoading, setCrmLoading] = React.useState(true)
  const { activities, isLoading: activitiesLoading, refresh: refreshActivities } = useActivitiesApi()
  const { events, isLoading: eventsLoading, refresh: refreshCalendar, updateEvent } = useCalendarApi() as any

  const refreshTasks = React.useCallback(async () => {
    const nextTasks = await tasksAPI.list().catch(() => [])
    setTasks(Array.isArray(nextTasks) ? nextTasks : [])
  }, [])

  const refreshCrm = React.useCallback(async () => {
    setCrmLoading(true)
    try {
      const [nextCompanies, nextContacts, nextProjects, nextStats] = await Promise.all([
        companiesAPI.getAll().catch(() => []),
        contactsAPI.getAll().catch(() => []),
        projectsAPI.getAll().catch(() => []),
        crmAPI.getStats().catch(() => ({})),
      ])
      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : [])
      setContacts(Array.isArray(nextContacts) ? nextContacts : [])
      setProjects(Array.isArray(nextProjects) ? nextProjects : [])
      setCrmStats(nextStats || {})
    } finally {
      setCrmLoading(false)
    }
  }, [])

  const refresh = React.useCallback(async () => {
    await Promise.all([
      refreshCrm(),
      Promise.resolve(refreshActivities?.()),
      Promise.resolve(refreshCalendar?.()),
      refreshTasks(),
    ])
  }, [refreshActivities, refreshCalendar, refreshCrm, refreshTasks])

  React.useEffect(() => {
    Promise.all([refreshCrm(), refreshTasks()]).catch(() => {})
  }, [refreshCrm, refreshTasks])

  React.useEffect(() => {
    const unsub = [
      sync.on("global:refresh", refresh),
      sync.on("crm:companies:changed", refreshCrm),
      sync.on("crm:contacts:changed", refreshCrm),
      sync.on("crm:deals:changed", refreshCrm),
      sync.on("activities:changed", refresh),
      sync.on("calendar:changed", refresh),
      sync.on("tasks:changed", refreshTasks),
    ]
    return () => {
      unsub.forEach((fn) => fn?.())
    }
  }, [refresh, refreshCrm, refreshTasks])

  const companyGraph = React.useMemo(
    () => buildCrmOverviewGraph({ companies, contacts, projects, activities: activities || [], events: events || [], tasks }),
    [activities, companies, contacts, events, projects, tasks],
  )

  const stats = React.useMemo(
    () => ({
      companies: companies.length,
      contacts: contacts.length,
      projects: projects.length,
      activities: activities?.length || 0,
      events: events?.length || 0,
      tasks: tasks.length,
      totalCompanies: crmStats?.totalCompanies ?? companies.length,
      totalContacts: crmStats?.totalContacts ?? contacts.length,
      totalProjects: crmStats?.totalProjects ?? projects.length,
      pipelineValue: crmStats?.pipelineValue ?? 0,
      conversionRate: crmStats?.conversionRate ?? 0,
      ...crmStats,
    }),
    [activities?.length, companies.length, contacts.length, crmStats, events?.length, projects.length, tasks.length],
  )

  return {
    companies,
    contacts,
    projects,
    activities: activities || [],
    events: events || [],
    tasks,
    companyGraph,
    stats,
    loading: crmLoading || activitiesLoading || eventsLoading,
    refresh,
    refreshCrm,
    updateCalendarEvent: updateEvent,
    refreshTasks,
  }
}
