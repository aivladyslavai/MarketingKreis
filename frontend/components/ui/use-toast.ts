"use client"

export type Toast = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
}

export function useToast() {
  return {
    toast: (_t: Toast) => {},
    dismiss: (_id?: string) => {},
  }
}

export const toast = (_t: Toast) => {}



