"use client"

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to dashboard
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="text-center">
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-3 sm:mb-4">
          Marketing Kreis Platform
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}