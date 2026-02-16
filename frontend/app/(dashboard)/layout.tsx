import AppShell from "@/components/layout/app-shell"
import { CrmProvider } from "@/contexts/crm-context"
import { AdminStepUpProvider } from "@/components/security/AdminStepUpProvider"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmProvider>
      <AdminStepUpProvider>
        <AppShell>{children}</AppShell>
      </AdminStepUpProvider>
    </CrmProvider>
  )
}
