import type { ReactNode } from 'react'

export type StatusTone =
  'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'primary'

type StatusBadgeProps = {
  children: ReactNode
  tone?: StatusTone
  size?: 'sm' | 'md'
  showPip?: boolean
}

const tones: Record<StatusTone, { badge: string; pip: string }> = {
  success: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    pip: 'bg-emerald-400',
  },
  warning: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    pip: 'bg-amber-400',
  },
  danger: {
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    pip: 'bg-rose-400',
  },
  info: {
    badge: 'bg-secondary/10 text-secondary border-secondary/25',
    pip: 'bg-secondary',
  },
  primary: {
    badge: 'bg-primary/10 text-primary border-primary/25',
    pip: 'bg-primary',
  },
  neutral: {
    badge: 'bg-surface-2 text-text-secondary border-surface-3',
    pip: 'bg-text-muted',
  },
}

export function StatusBadge({
  children,
  size = 'md',
  showPip = true,
  tone = 'neutral',
}: StatusBadgeProps) {
  const current = tones[tone] ?? tones.neutral
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium tracking-tight rounded-md border ${sizeClasses} ${current.badge}`}
    >
      {showPip && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${current.pip}`}
        />
      )}
      <span>{children}</span>
    </span>
  )
}
