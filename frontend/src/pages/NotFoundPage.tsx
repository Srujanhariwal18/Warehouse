import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-main px-6 text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          404 / Not found
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-text-primary">
          That surface is not ready.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-secondary">
          The route you requested does not exist in this foundation.
        </p>
        <Link className="mt-7 inline-flex" to="/">
          <Button variant="secondary">
            <ArrowLeft aria-hidden="true" size={16} />
            Return home
          </Button>
        </Link>
      </div>
    </main>
  )
}
