import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-3xl font-semibold">Seite nicht gefunden</h2>
      <p className="text-muted-foreground">Die angeforderte Seite existiert nicht oder wurde verschoben.</p>
      <Link href="/dashboard">
        <Button className="bg-blue-600 hover:bg-blue-700">Zurück zum Dashboard</Button>
      </Link>
    </div>
  )
}
