import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
  badge?: ReactNode
}

export function PageHeader({
  action,
  badge,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          {eyebrow && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border/60 bg-surface px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide text-primary shadow-xs">
              {eyebrow}
            </span>
          )}
          {badge}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>
      {action && (
        <div className="shrink-0 flex items-center gap-3 pt-2 sm:pt-0">
          {action}
        </div>
      )}
    </header>
  )
}
