"use client"

import * as React from "react"
import { type Activity } from "@/components/circle/radial-circle"
import { useActivities } from "@/hooks/use-activities"

// Thin adapter to satisfy imports expecting a different hook name
export function useCrmActivities() {
  const { activities } = useActivities()
  return { activities, loading: false, error: null as string | null }
}


