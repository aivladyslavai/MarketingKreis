"use client"

import * as React from "react"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={"animate-pulse rounded-md bg-slate-200/20 dark:bg-slate-700/40 " + className}
      {...props}
    />
  )
}

export default Skeleton

