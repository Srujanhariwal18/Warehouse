export const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatInr(value: number) {
  return inrFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatDate(value: string) {
  if (!value) return ''
  const parsed = value.includes('T')
    ? new Date(value)
    : new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    const fallback = new Date(value)
    if (Number.isNaN(fallback.getTime())) return value
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(fallback)
  }
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}
