import { Boxes } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

export function InventoryPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        description="Inventory records, stock levels and warehouse organization will be built on this surface."
        eyebrow="Workspace"
        title="Inventory"
      />
      <EmptyState
        description="No inventory data is connected yet. This is intentionally a placeholder for the upcoming inventory experience."
        title="Inventory workspace"
        action={
          <span className="inline-flex items-center gap-2 text-xs text-text-muted">
            <Boxes aria-hidden="true" size={15} />
            Planned feature
          </span>
        }
      />
    </div>
  )
}
