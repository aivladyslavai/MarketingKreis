"use client"

import * as React from "react"
import { type Activity } from "@/components/circle/radial-circle"

const ACTIVITIES_STORAGE_KEY = 'marketing-kreis-activities'

// Mock данные по умолчанию
const defaultMockActivities: Activity[] = [
  {
    id: '1',
    title: 'Frühlingskampagne',
    category: 'VERKAUFSFOERDERUNG',
    status: 'ACTIVE',
    weight: 80,
    budgetCHF: 25000,
    expectedLeads: 150,
    start: new Date(2024, 2, 15), // March 15, 2024
    end: new Date(2024, 4, 15), // May 15, 2024
    ownerId: 'user1',
    owner: { name: 'Max Mustermann' },
    notes: 'Fokus auf neue Produktlinie',
  },
  {
    id: '2',
    title: 'Brand Awareness Q2',
    category: 'IMAGE',
    status: 'PLANNED',
    weight: 60,
    budgetCHF: 40000,
    expectedLeads: 80,
    start: new Date(2024, 3, 1), // April 1, 2024
    end: new Date(2024, 5, 30), // June 30, 2024
    ownerId: 'user2',
    owner: { name: 'Anna Weber' },
  },
  {
    id: '3',
    title: 'Recruiting Drive',
    category: 'EMPLOYER_BRANDING',
    status: 'ACTIVE',
    weight: 70,
    budgetCHF: 15000,
    expectedLeads: 50,
    start: new Date(2024, 1, 1), // February 1, 2024
    end: new Date(2024, 7, 31), // August 31, 2024
    ownerId: 'user1',
    owner: { name: 'Max Mustermann' },
  },
  {
    id: '4',
    title: 'Newsletter Campaign',
    category: 'KUNDENPFLEGE',
    status: 'PLANNED',
    weight: 30,
    budgetCHF: 8000,
    expectedLeads: 25,
    start: new Date(2024, 3, 15), // April 15, 2024
    ownerId: 'user3',
    owner: { name: 'Sophie Schmidt' },
  },
  {
    id: '5',
    title: 'Sommerkampagne Vorbereitung',
    category: 'VERKAUFSFOERDERUNG',
    status: 'PLANNED',
    weight: 90,
    budgetCHF: 35000,
    expectedLeads: 200,
    start: new Date(2024, 5, 1), // June 1, 2024
    ownerId: 'user2',
    owner: { name: 'Anna Weber' },
  },
  {
    id: '6',
    title: 'Webinar Series',
    category: 'IMAGE',
    status: 'PLANNED',
    weight: 65,
    budgetCHF: 12000,
    expectedLeads: 75,
    start: new Date(2024, 4, 10), // May 10, 2024
    ownerId: 'user3',
    owner: { name: 'Sophie Schmidt' },
  },
]

// Функция для загрузки активностей из localStorage
const loadActivitiesFromStorage = (): Activity[] => {
  if (typeof window === 'undefined') return defaultMockActivities
  
  try {
    const stored = localStorage.getItem(ACTIVITIES_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Преобразуем даты из строк обратно в Date объекты
      return parsed.map((activity: any) => ({
        ...activity,
        start: activity.start ? new Date(activity.start) : undefined,
        end: activity.end ? new Date(activity.end) : undefined,
      }))
    }
  } catch (error) {
    console.warn('Не удалось загрузить активности из localStorage:', error)
  }
  
  return defaultMockActivities
}

// Функция для сохранения активностей в localStorage
const saveActivitiesToStorage = (activities: Activity[]) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities))
  } catch (error) {
    console.warn('Не удалось сохранить активности в localStorage:', error)
  }
}

export function useActivities() {
  const [activities, setActivities] = React.useState<Activity[]>(() => loadActivitiesFromStorage())

  // Сохраняем активности при каждом изменении
  React.useEffect(() => {
    saveActivitiesToStorage(activities)
  }, [activities])

  // Добавляем функции в window для тестирования (только в dev mode)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).clearActivities = () => {
        localStorage.removeItem(ACTIVITIES_STORAGE_KEY)
        setActivities(defaultMockActivities)
        console.log('✅ Активности сброшены к исходным данным')
      }
      
      (window as any).showStoredActivities = () => {
        const stored = localStorage.getItem(ACTIVITIES_STORAGE_KEY)
        console.log('📋 Сохраненные активности:', stored ? JSON.parse(stored) : 'Нет данных')
      }
    }
  }, [])

  const addActivity = React.useCallback((activity: Activity) => {
    setActivities(prev => [...prev, activity])
  }, [])

  const updateActivity = React.useCallback((activityId: string, updates: Partial<Activity>) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === activityId
          ? { ...activity, ...updates }
          : activity
      )
    )
  }, [])

  const deleteActivity = React.useCallback((activityId: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== activityId))
  }, [])

  const moveActivity = React.useCallback((activityId: string, newDate: Date) => {
    updateActivity(activityId, { start: newDate })
  }, [updateActivity])

  // Функция для сброса к изначальным данным
  const resetToDefaults = React.useCallback(() => {
    setActivities(defaultMockActivities)
  }, [])

  return {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    moveActivity,
    resetToDefaults,
  }
}
