import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-main shadow-lg shadow-primary/10 hover:bg-primary/90 disabled:bg-primary/40',
  secondary:
    'border border-surface-3 bg-surface-2 text-text-primary hover:border-primary/50 hover:bg-surface-3 disabled:opacity-50',
  ghost:
    'text-text-secondary hover:bg-surface-2 hover:text-text-primary disabled:opacity-50',
}

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
