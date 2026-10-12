import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean
  variant?: 'default' | 'subtle' | 'ghost' | 'metric'
}

export function Card({
  className = '',
  elevated = false,
  variant = 'default',
  ...props
}: CardProps) {
  let baseStyles = 'rounded-xl transition-all'

  if (variant === 'metric') {
    baseStyles +=
      ' bg-white border border-surface-border p-5 relative overflow-hidden shadow-xs'
  } else if (variant === 'subtle') {
    baseStyles += ' bg-surface-secondary/70 border border-surface-border/80'
  } else if (variant === 'ghost') {
    baseStyles += ' bg-transparent'
  } else {
    baseStyles += ` border border-surface-border ${
      elevated ? 'bg-white shadow-md shadow-slate-200/60' : 'bg-white shadow-xs'
    }`
  }

  return <div className={`${baseStyles} ${className}`} {...props} />
}
