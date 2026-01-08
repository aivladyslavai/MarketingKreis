"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function ErrorView({ message, reset }: { message?: string; reset?: () => void }) {
  const router = useRouter()
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-4">
      <h2 className="text-2xl font-semibold">Something went wrong!</h2>
      {message && <p className="text-muted-foreground max-w-md">{message}</p>}
      <div className="flex gap-2">
        {reset && (
          <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700">Try again</Button>
        )}
        <Button variant="outline" onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    </div>
  )
}


