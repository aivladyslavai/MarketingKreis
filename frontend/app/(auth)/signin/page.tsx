"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export const dynamic = "force-dynamic"

function SignInRedirectInner() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const next = params?.get("next") || null
    const target = next ? `/signup?mode=login&next=${encodeURIComponent(next)}` : "/signup?mode=login"
    router.replace(target)
  }, [router, params])

  return null
}

export default function SignInRedirectPage() {
  return (
    <Suspense fallback={null}>
      <SignInRedirectInner />
    </Suspense>
  )
}




