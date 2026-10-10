import type { InputHTMLAttributes } from 'react'

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export function TextInput({ className = '', label, ...props }: TextInputProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-text-secondary">
      {label}
      <input
        className={`h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none ${className}`}
        {...props}
      />
    </label>
  )
}
