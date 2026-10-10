import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/ui/BrandMark'

export function FoundationPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-main px-6 py-12 text-primary">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-16 h-72 w-72 rounded-full bg-secondary/8 blur-3xl"
      />
      <section className="relative w-full max-w-3xl rounded-3xl border border-surface-3 bg-surface/80 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-12">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="font-display text-xl font-semibold tracking-tight">
            Invora
          </span>
        </div>
        <div className="mt-20 max-w-xl sm:mt-28">
          <p className="font-mono text-xs uppercase tracking-[0.24em]">
            Frontend foundation
          </p>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight text-text-primary sm:text-6xl">
            Inventory, in control.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-text-secondary sm:text-lg">
            The foundation is ready for a focused, dependable inventory
            experience.
          </p>
          <Link
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-main hover:bg-primary/90"
            to="/app/dashboard"
          >
            Open workspace
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
        <div className="mt-16 flex items-center gap-3 border-t border-surface-3 pt-5 text-sm text-text-muted">
          <span className="h-2 w-2 rounded-full bg-success" />
          Foundation ready
        </div>
      </section>
    </main>
  )
}
