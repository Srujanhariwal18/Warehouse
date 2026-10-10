import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant =
  'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-[#0d1317] font-semibold hover:bg-primary/90 shadow-[0_0_16px_rgba(34,211,197,0.22)] active:scale-[0.99] disabled:bg-primary/40 disabled:text-[#0d1317]/50',
  secondary:
    'border border-surface-3 bg-surface text-text-primary hover:border-primary/50 hover:bg-surface-2 active:scale-[0.99] disabled:opacity-50',
  ghost:
    'text-text-secondary hover:bg-surface-2 hover:text-text-primary active:scale-[0.99] disabled:opacity-50',
  outline:
    'border border-surface-3 bg-transparent text-text-primary hover:border-text-secondary hover:bg-surface-2 active:scale-[0.99] disabled:opacity-50',
  danger:
    'border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20 hover:border-danger active:scale-[0.99] disabled:opacity-50',
}

const sizes = {
  sm: 'h-8 px-2.5 text-xs rounded-lg gap-1.5',
  md: 'min-h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'min-h-12 px-6 text-base rounded-xl gap-2.5',
}

export function Button({
  className = '',
  size = 'md',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 motion-reduce:transition-none disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
