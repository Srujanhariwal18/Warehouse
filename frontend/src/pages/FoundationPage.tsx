import { ArrowRight, Terminal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/ui/BrandMark'

export function FoundationPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-main px-6 py-12 text-text-primary">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-16 h-80 w-80 rounded-full bg-secondary/10 blur-3xl"
      />
      <section className="relative w-full max-w-3xl rounded-2xl border border-surface-3 bg-surface-1/90 p-8 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-12">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="font-display text-xl font-bold tracking-tight text-text-primary">
            INVORA
          </span>
          <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
            v2.0 // INDUSTRIAL
          </span>
        </div>
        <div className="mt-16 max-w-xl sm:mt-24">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
            // OPERATIONS INTELLIGENCE
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-6xl">
            Inventory, in precision control.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-text-secondary sm:text-lg">
            High-density warehouse operations intelligence, multi-facility
            telemetry, and real-time stock orchestration.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-[#11171B] shadow-sm shadow-primary/20 transition-all hover:bg-primary-hover hover:shadow-primary/30"
              to="/app/dashboard"
            >
              Enter Operations Console
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </div>
        <div className="mt-16 flex items-center justify-between border-t border-surface-3 pt-5 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="font-mono">TELEMETRY SYSTEM ONLINE</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Terminal className="text-primary" size={13} />
            <span>DESKTOP COMMAND SUITE</span>
          </div>
        </div>
      </section>
    </main>
  )
}
