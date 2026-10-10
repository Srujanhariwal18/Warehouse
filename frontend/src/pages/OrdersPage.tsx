import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function OrdersPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        description="Order intake and fulfillment workflows will have a dedicated operational home here."
        eyebrow="Workspace"
        title="Orders"
        action={<StatusBadge>Not connected</StatusBadge>}
      />
      <EmptyState
        description="Orders are not available in this foundation phase. The route and responsive shell are ready for future implementation."
        title="Orders workspace"
      />
    </div>
  )
}
