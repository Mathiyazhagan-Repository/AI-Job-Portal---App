import { Link, useRouteError, isRouteErrorResponse } from 'react-router'
import { Search, ShieldOff, Wrench, RefreshCw, Construction, ArrowLeft } from 'lucide-react'
import { PrismMark } from '@/layouts/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

function Shell({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-6 py-16">
      <div className="w-full max-w-lg text-center">
        {icon}
        <h1 className="mt-6 font-display tracking-tight text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {children}
      </div>
    </div>
  )
}

/* ══════════════════ 404 ══════════════════ */

export function NotFoundPage() {
  return (
    <Shell
      icon={
        <div className="relative mx-auto w-fit">
          <PrismMark size={72} className="opacity-90" />
          {/* the beam refracts into nothing */}
          <span className="absolute -right-8 top-1/2 h-px w-8 bg-gradient-to-r from-line-strong to-transparent" />
        </div>
      }
      title="That page refracted into nothing"
    >
      <p className="mt-3 leading-relaxed text-ink-2">
        The link may be old, or the job may have been closed. Try a search instead.
      </p>

      <form className="mt-6 flex gap-2" onSubmit={(e) => e.preventDefault()}>
        <Input placeholder="Search jobs, companies…" aria-label="Search" />
        <Button type="submit">
          <Search className="size-4" />
        </Button>
      </form>

      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        {[
          ['Browse all jobs', '/jobs'],
          ['Your dashboard', '/candidate'],
          ['Recruiter console', '/recruiter'],
          ['Compare designs', '/variants'],
        ].map(([label, to]) => (
          <Button key={to} variant="secondary" asChild>
            <Link to={to}>{label}</Link>
          </Button>
        ))}
      </div>
    </Shell>
  )
}

/* ══════════════════ 403 ══════════════════ */

export function ForbiddenPage() {
  return (
    <Shell
      icon={
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-warning-bg text-warning">
          <ShieldOff className="size-8" aria-hidden />
        </span>
      }
      title="This area isn't for your role"
    >
      <p className="mt-3 leading-relaxed text-ink-2">
        You're signed in as a <strong className="font-medium text-ink">Candidate</strong>. This page
        needs a <strong className="font-medium text-ink">Recruiter</strong> or{' '}
        <strong className="font-medium text-ink">Company Admin</strong> role.
      </p>
      <p className="mt-2 text-sm text-ink-3">
        Access is checked on the server too — the interface isn't the only thing stopping you.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to="/candidate">Go to your dashboard</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </Shell>
  )
}

/* ══════════════════ 500 / error boundary ══════════════════ */

export function ErrorBoundaryPage() {
  const error = useRouteError()
  const ref = Math.random().toString(36).slice(2, 10).toUpperCase()

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  return (
    <Shell
      icon={
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-danger-bg text-danger">
          <Wrench className="size-8" aria-hidden />
        </span>
      }
      title="Something broke on our side"
    >
      <p className="mt-3 leading-relaxed text-ink-2">
        Not your fault. The error has been logged. If you raise a support ticket, quote this
        reference:
      </p>
      <p className="mt-4 inline-block rounded-v-control bg-subtle px-4 py-2 font-mono text-sm font-semibold text-ink">
        {ref}
      </p>
      {error instanceof Error && (
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-sm text-ink-3">Technical detail</summary>
          <pre className="mt-2 overflow-x-auto rounded-v-control bg-subtle p-3 text-left font-mono text-xs text-ink-2">
            {error.message}
          </pre>
        </details>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button onClick={() => location.reload()}>
          <RefreshCw className="size-4" />
          Reload
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </Shell>
  )
}

/* ══════════════════ Maintenance ══════════════════ */

export function MaintenancePage() {
  return (
    <Shell
      icon={
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-50 text-brand-600">
          <Wrench className="size-8" aria-hidden />
        </span>
      }
      title="Back in about 20 minutes"
    >
      <p className="mt-3 leading-relaxed text-ink-2">
        We're running a scheduled database migration. Applications in progress are safe — nothing is
        lost, and no deadlines advance while we're down.
      </p>
      <p className="mt-4 font-mono text-sm text-ink-3">Expected back · 03:20 IST</p>
    </Shell>
  )
}

/* ══════════════════ Honest placeholder ══════════════════ */

/**
 * Used for pages specified in DESIGN.md but not yet built. It states
 * plainly what is missing rather than pretending to be finished — an
 * empty shell that looks complete is worse than one that says so.
 */
export function makePlaceholder(config: {
  title: string
  id: string
  purpose: string
  variants: [string, string, string?]
  back?: { label: string; to: string }
}) {
  function Placeholder() {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {config.back && (
          <Link
            to={config.back.to}
            className="inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {config.back.label}
          </Link>
        )}

        <div className="mt-4 flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-v bg-subtle text-ink-3">
            <Construction className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">{config.title}</h1>
              <Badge tone="outline">{config.id}</Badge>
              <Badge tone="warning">not built yet</Badge>
            </div>
            <p className="mt-2 leading-relaxed text-ink-2">{config.purpose}</p>
          </div>
        </div>

        <div className="mt-8 rounded-v border border-line bg-paper p-v-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-3">
            Specified design directions
          </h2>
          <ol className="mt-3 space-y-3">
            {config.variants.filter(Boolean).map((v, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-brand-50 font-mono text-xs font-bold text-brand-700">
                  {['A', 'B', 'C'][i]}
                </span>
                <p className="text-sm leading-relaxed text-ink-2">{v}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 border-t border-line pt-3 text-xs text-ink-3">
            Full specification in <code className="font-mono">DESIGN.md</code> §11–15. The design
            system, layout shell and every component this page needs are already built — only the
            composition remains.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/variants">See a built page in all three directions</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/styleguide">Style guide</Link>
          </Button>
        </div>
      </div>
    )
  }
  Placeholder.displayName = `Placeholder(${config.id})`
  return { Component: Placeholder }
}
