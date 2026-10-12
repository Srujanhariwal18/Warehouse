import type { InputHTMLAttributes, ReactNode } from 'react'

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: ReactNode
  helperText?: string
  error?: string
}

export function TextInput({
  className = '',
  error,
  helperText,
  icon,
  label,
  ...props
}: TextInputProps) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-text-secondary">
      <span className="flex items-center justify-between">
        <span className="text-text-primary font-medium">{label}</span>
        {error && (
          <span className="font-mono text-[11px] text-danger">{error}</span>
        )}
      </span>
      <div className="relative flex items-center">
        {icon && (
          <span className="pointer-events-none absolute left-3 text-text-muted">
            {icon}
          </span>
        )}
        <input
          className={`h-10 w-full rounded-lg border bg-white text-sm text-text-primary placeholder:text-text-muted shadow-xs transition-colors focus:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
            icon ? 'pl-9 pr-3' : 'px-3'
          } ${
            error
              ? 'border-danger/60 focus:border-danger focus-visible:ring-danger'
              : 'border-surface-border hover:border-slate-300'
          } ${className}`}
          {...props}
        />
      </div>
      {helperText && !error && (
        <span className="text-[11px] text-text-muted">{helperText}</span>
      )}
    </label>
  )
}
