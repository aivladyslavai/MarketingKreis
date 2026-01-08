import AppShell from "@/components/layout/app-shell"
import { CrmProvider } from "@/contexts/crm-context"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmProvider>
      <AppShell>{children}</AppShell>
    </CrmProvider>
  )
}
