import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant =
  'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-primary to-[#1D4ED8] text-white font-medium hover:from-[#1D4ED8] hover:to-[#1E40AF] shadow-xs active:scale-[0.99] disabled:opacity-50',
  secondary:
    'border border-surface-border bg-white text-text-primary hover:bg-surface-secondary hover:border-slate-300 shadow-xs active:scale-[0.99] disabled:opacity-50',
  ghost:
    'text-text-secondary hover:bg-surface-secondary hover:text-text-primary active:scale-[0.99] disabled:opacity-50',
  outline:
    'border border-surface-border bg-white text-text-primary hover:border-slate-300 hover:bg-surface-secondary shadow-xs active:scale-[0.99] disabled:opacity-50',
  danger:
    'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 active:scale-[0.99] disabled:opacity-50',
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
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 motion-reduce:transition-none cursor-pointer disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
