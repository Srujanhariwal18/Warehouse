import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean
}

export function Card({
  className = '',
  elevated = false,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-surface-3/80 ${
        elevated ? 'bg-surface-2/85 shadow-xl shadow-black/10' : 'bg-surface/80'
      } ${className}`}
      {...props}
    />
  )
}
