export function LoadingState({
  message = 'SYNCHRONIZING TELEMETRY STREAM...',
}: {
  message?: string
}) {
  return (
    <div
      aria-label="Loading workspace telemetry"
      className="flex flex-col items-center justify-center py-16 text-center"
      role="status"
    >
      <div className="relative mb-5 flex h-12 w-12 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-xl bg-primary/10" />
        <div className="relative h-9 w-9 rounded-lg border border-primary/30 bg-surface flex items-center justify-center shadow-xs">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
      <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
        {message}
      </p>
      <div className="mt-6 w-48 h-1 overflow-hidden rounded-full bg-surface-2 border border-surface-3">
        <div className="h-full w-24 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse" />
      </div>
    </div>
  )
}
