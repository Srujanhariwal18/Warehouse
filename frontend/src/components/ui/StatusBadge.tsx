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
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pip: 'bg-emerald-500',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    pip: 'bg-amber-500',
  },
  danger: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    pip: 'bg-red-500',
  },
  info: {
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    pip: 'bg-cyan-600',
  },
  primary: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    pip: 'bg-primary',
  },
  neutral: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    pip: 'bg-slate-400',
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
