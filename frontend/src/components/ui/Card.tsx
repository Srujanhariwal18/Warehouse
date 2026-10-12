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
      ' bg-graphite border border-surface-border p-5 relative overflow-hidden shadow-lg shadow-black/40'
  } else if (variant === 'subtle') {
    baseStyles += ' bg-graphite/60 border border-surface-border/60'
  } else if (variant === 'ghost') {
    baseStyles += ' bg-transparent'
  } else {
    baseStyles += ` border border-surface-border ${
      elevated ? 'bg-surface shadow-2xl shadow-black/60' : 'bg-graphite shadow-md shadow-black/30'
    }`
  }

  return <div className={`${baseStyles} ${className}`} {...props} />
}
