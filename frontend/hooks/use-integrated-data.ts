"use client"

import * as React from "react"

// Minimal shape consumed by content page
type TableActivity = {
  id: string
  title: string
  category?: string
  status?: string
  budget?: number
  owner?: { id?: string; name?: string }
  start?: Date
  end?: Date
}

export function useIntegratedData() {
  const [activities] = React.useState<TableActivity[]>([])
  const [hasData] = React.useState(false)
  return { activities, hasData }
}


