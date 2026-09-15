import * as React from 'react'
import { Link } from 'react-router'
import { Monitor, Tablet, Smartphone, ExternalLink, Link2, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VARIANTS, VARIANT_META, type Variant } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/layouts/Logo'
import { Textarea } from '@/components/ui/input'

/**
 * DESIGN.md §6.7 — the comparison gallery.
 *
 * This is how the design decision actually gets made: not by reading the
 * blueprint, but by looking at three real, running screens side by side.
 */

const PAGES = [
  { path: '/', label: 'Home', group: 'Public', built: true },
  { path: '/jobs', label: 'Jobs list', group: 'Public', built: true },
  { path: '/jobs/j1', label: 'Job detail', group: 'Public', built: true },
  { path: '/register', label: 'Register', group: 'Public', built: true },
  { path: '/pricing', label: 'Pricing', group: 'Public', built: true },
  { path: '/companies', label: 'Companies', group: 'Public', built: true },
  { path: '/companies/northwind-labs', label: 'Company page', group: 'Public', built: true },
  { path: '/onboarding', label: 'Onboarding + Parse Theatre', group: 'Candidate', built: true },
  { path: '/assessment/at1', label: 'Assessment', group: 'Candidate', built: true },
  { path: '/login', label: 'Login', group: 'Public', built: true },
  { path: '/candidate', label: 'Candidate dashboard', group: 'Candidate', built: true },
  { path: '/candidate/applications', label: 'Applications tracker', group: 'Candidate', built: true },
  { path: '/recruiter', label: 'Recruiter dashboard', group: 'Recruiter', built: true },
  { path: '/recruiter/jobs/j1/applicants', label: 'Applicant triage ⭐', group: 'Recruiter', built: true },
  { path: '/recruiter/jobs/new', label: 'AI job editor ⭐', group: 'Recruiter', built: true },
  { path: '/admin', label: 'Admin dashboard', group: 'Admin', built: true },
]

const WIDTHS = {
  desktop: { w: 1440, icon: Monitor, label: 'Desktop' },
  tablet: { w: 834, icon: Tablet, label: 'Tablet' },
  mobile: { w: 390, icon: Smartphone, label: 'Mobile' },
}

type Device = keyof typeof WIDTHS

export function Component() {
  const [page, setPage] = React.useState(PAGES[8].path)
  const [device, setDevice] = React.useState<Device>('desktop')
  const [notes, setNotes] = React.useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('kairo.variantNotes') ?? '{}')
    } catch {
      return {}
    }
  })
  const [nonce, setNonce] = React.useState(0)

  // All three frames must be visible at once — that is the whole point of
  // this screen — so the scale is derived from the viewport, not fixed.
  const [avail, setAvail] = React.useState(() =>
    typeof window === 'undefined' ? 1440 : window.innerWidth,
  )
  React.useEffect(() => {
    const on = () => setAvail(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  const saveNote = (v: Variant, text: string) => {
    const next = { ...notes, [`${page}:${v}`]: text }
    setNotes(next)
    try {
      localStorage.setItem('kairo.variantNotes', JSON.stringify(next))
    } catch {
      /* private mode */
    }
  }

  const current = PAGES.find((p) => p.path === page)!
  const groups = [...new Set(PAGES.map((p) => p.group))]

  return (
    <div className="min-h-dvh bg-canvas">
      {/* ── Control bar ── */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <span className="hidden h-5 w-px bg-line sm:block" />
          <div>
            <h1 className="text-sm font-semibold text-ink">Design direction comparison</h1>
            <p className="text-xs text-ink-3">One page, three directions, side by side</p>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-ink-3">Page</span>
              <select
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="h-9 rounded-v-control border border-line bg-paper px-2 text-sm text-ink outline-none focus:border-brand-500"
              >
                {groups.map((g) => (
                  <optgroup key={g} label={g}>
                    {PAGES.filter((p) => p.group === g).map((p) => (
                      <option key={p.path} value={p.path}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <div className="flex rounded-v-control border border-line bg-paper p-0.5">
              {(Object.keys(WIDTHS) as Device[]).map((d) => {
                const W = WIDTHS[d]
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    aria-pressed={device === d}
                    title={`${W.label} — ${W.w}px`}
                    className={cn(
                      'grid size-8 place-items-center rounded-[calc(var(--v-radius-control)-2px)] transition-colors',
                      device === d ? 'bg-brand-600 text-white' : 'text-ink-3 hover:bg-hover',
                    )}
                  >
                    <W.icon className="size-4" aria-hidden />
                    <span className="sr-only">{W.label}</span>
                  </button>
                )
              })}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setNonce((n) => n + 1)}
              aria-label="Reload all three frames"
            >
              <RotateCw className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── The three frames ── */}
      <div className="overflow-x-auto p-4 sm:p-6">
        <div className="flex justify-center gap-5">
          {VARIANTS.map((v) => {
            const meta = VARIANT_META[v]
            const src = `${page}${page.includes('?') ? '&' : '?'}v=${v}`
            const width = WIDTHS[device].w
            // (viewport − page padding − two gaps) / three frames
            const perFrame = (avail - 56 - 40) / 3
            const scale = Math.min(1, Math.max(0.24, perFrame / width))

            return (
              <section key={v} className="flex flex-col" style={{ width: width * scale }}>
                <header className="mb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-md bg-brand-600 font-mono text-xs font-bold text-white">
                      {v.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-ink">{meta.name}</h2>
                      <p className="truncate text-xs text-ink-3">{meta.tagline}</p>
                    </div>
                    <a
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto rounded p-1.5 text-ink-3 transition-colors hover:bg-hover hover:text-ink"
                      aria-label={`Open direction ${v.toUpperCase()} full screen`}
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </div>
                  <p className="mt-1.5 text-xs leading-snug text-ink-2">{meta.note}</p>
                </header>

                {/* the live frame */}
                <div
                  className="overflow-hidden rounded-v border border-line bg-paper shadow-md"
                  style={{ height: 760 * scale + 8 }}
                >
                  <div className="flex items-center gap-2 border-b border-line bg-subtle px-2.5 py-1.5">
                    <span className="flex gap-1">
                      <i className="size-2 rounded-full bg-line-strong" />
                      <i className="size-2 rounded-full bg-line-strong" />
                      <i className="size-2 rounded-full bg-line-strong" />
                    </span>
                    <span className="truncate font-mono text-[10px] text-ink-3">{src}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(location.origin + src)}
                      className="ml-auto text-ink-3 hover:text-ink"
                      aria-label="Copy this variant's link"
                    >
                      <Link2 className="size-3" />
                    </button>
                  </div>
                  <iframe
                    key={`${src}-${nonce}`}
                    src={src}
                    title={`${current.label} — Direction ${v.toUpperCase()}`}
                    style={{
                      width,
                      height: 760,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left',
                      border: 0,
                    }}
                  />
                </div>

                {/* per-variant notes, persisted locally */}
                <div className="mt-3">
                  <label className="text-xs font-medium text-ink-3">
                    Your notes on {meta.name}
                  </label>
                  <Textarea
                    rows={3}
                    value={notes[`${page}:${v}`] ?? ''}
                    onChange={(e) => saveNote(v, e.target.value)}
                    placeholder="What works? What breaks at mobile? Does the reasoning stay obvious?"
                    className="mt-1 text-xs"
                  />
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {/* ── Scoring guidance ── */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h2 className="text-lg font-semibold text-ink">Choosing a winner</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            Score each direction 1–5 on the axes below. The expected outcome is a{' '}
            <strong className="font-medium text-ink">mixed</strong> result — C for public and
            onboarding, A for the candidate console, B for recruiter triage and admin. That is a
            legitimate answer, not a failure to decide: all three share one token set and one
            component library, so a per-role map is the deliverable.
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ['Comprehension', 'Does a first-time user understand the screen in under 5 seconds?'],
              ['Throughput', 'How many actions per minute can an expert perform?'],
              ['Explainability', 'Is the why behind every AI output still one click away? A direction that fails this is disqualified regardless of score.'],
              ['Mobile', 'Does it survive below 768px without a redesign?'],
              ['Build cost', 'How much work remains to production-harden it?'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-v border border-line p-4">
                <dt className="font-medium text-ink">{k}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/">Back to the app</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/styleguide">Open the style guide</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

Component.displayName = 'VariantGallery'
