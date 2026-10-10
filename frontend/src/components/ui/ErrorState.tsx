import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

type ErrorStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export function ErrorState({ action, description, title }: ErrorStateProps) {
  return (
    <div
      aria-live="assertive"
      className="flex flex-col items-center justify-center rounded-2xl border border-danger/30 bg-danger/5 px-6 py-16 text-center"
      role="alert"
    >
      <div className="mb-4 rounded-2xl bg-danger/10 p-3 text-danger">
        <AlertCircle aria-hidden="true" size={22} />
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
