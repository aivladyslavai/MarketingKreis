// Utility helpers


import { type ClassValue } from "clsx"
import clsx from "clsx"

export function cn(...inputs: ClassValue[]) {
  // Lightweight className combiner without tailwind-merge to avoid dependency
  return clsx(inputs)
}



