export function LoadingState() {
  return (
    <div aria-label="Loading" className="grid gap-4" role="status">
      <div className="h-28 animate-pulse rounded-2xl bg-surface-2" />
      <div className="h-28 animate-pulse rounded-2xl bg-surface-2" />
    </div>
  )
}
