"use client"

import * as React from "react"

export function useErrorHandler() {
  return (error: unknown) => {
    // minimal stub for testing environment
    // eslint-disable-next-line no-console
    console.error(error)
  }
}

