import { ArrowUpRight, Boxes, Package, Rows3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'

const previewCards = [
  { label: 'Inventory', value: '—', icon: Boxes },
  { label: 'Open orders', value: '—', icon: Package },
  { label: 'Low stock', value: '—', icon: Rows3 },
]

export function DashboardPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        description="A calm operational overview will live here once the inventory data layer is connected."
        eyebrow="Overview"
        title="Dashboard"
        action={<StatusBadge tone="success">Foundation preview</StatusBadge>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {previewCards.map(({ icon: Icon, label, value }) => (
          <Card className="p-5" key={label}>
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-sm">{label}</span>
              <Icon aria-hidden="true" size={18} />
            </div>
            <p className="mt-7 font-display text-3xl font-semibold text-text-primary">
              {value}
            </p>
            <p className="mt-2 text-xs text-text-muted">
              Data coming in a later phase
            </p>
          </Card>
        ))}
      </div>
      <Card className="p-1">
        <EmptyState
          description="This placeholder confirms the application shell and navigation are ready. Real metrics and activity will be introduced later."
          title="Your operational overview is next"
          action={
            <span className="inline-flex items-center gap-2 text-xs font-medium text-primary">
              Planned surface <ArrowUpRight aria-hidden="true" size={14} />
            </span>
          }
        />
      </Card>
    </div>
  )
}
