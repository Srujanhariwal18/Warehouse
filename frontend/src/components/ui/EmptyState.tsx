import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-3 px-6 py-16 text-center">
      <div className="mb-4 rounded-2xl bg-primary/10 p-3 text-primary">
        <Inbox aria-hidden="true" size={22} />
      </div>
      <h2 className="font-display text-lg font-semibold text-text-primary">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
