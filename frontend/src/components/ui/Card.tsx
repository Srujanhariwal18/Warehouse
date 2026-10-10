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
      ' bg-surface border border-surface-border p-5 relative overflow-hidden'
  } else if (variant === 'subtle') {
    baseStyles += ' bg-surface/40 border border-surface-border/60'
  } else if (variant === 'ghost') {
    baseStyles += ' bg-transparent'
  } else {
    baseStyles += ` border border-surface-border ${
      elevated ? 'bg-surface-2 shadow-2xl shadow-black/40' : 'bg-surface'
    }`
  }

  return <div className={`${baseStyles} ${className}`} {...props} />
}
