import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useReducedMotion } from 'motion/react'
import { Search, MapPin, ArrowRight, Check } from 'lucide-react'
import {
  FileText, ChartPie, Route, ShieldCheck, Sparkles, ListOrdered, Keyboard, History,
} from '@animateicons/react/lucide'
import { cn } from '@/lib/utils'
import { TONE_CLASS, type Tone } from '@/components/common'
import type { AnimatedIconHandle } from '@/components/common/NavIcon'
import { Button } from '@/components/ui/button'
import { MatchPrism, AIProvenanceChip } from '@/components/brand'
import { CompanyMark } from '@/features/jobs/JobCard'
import { companies, categories, jobs } from '@/data/mock'
import { buildBreakdown } from '@/lib/scoring'
import { compact } from '@/lib/format'

/**
 * Shared blocks. All three Home variants rearrange THESE — they don't
 * reimplement them (DESIGN.md §6.5: variants differ in composition,
 * never in logic).
 */

export const ROLE_WORDS = [
  'Frontend Engineer',
  'Data Analyst',
  'Product Designer',
  'DevOps Lead',
  'Backend Engineer',
]

export const DEMO_BREAKDOWN = buildBreakdown({
  skills: 92,
  experience: 85,
  location: 100,
  education: 90,
  title: 82,
  preferences: 85,
})

/* ══════════════════ Search bar ══════════════════ */

export function HeroSearch({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const big = size === 'lg'
  return (
    <form
      className={cn(
        'flex flex-col gap-2 rounded-v border border-line bg-paper p-2 shadow-lg sm:flex-row',
        big && 'p-2.5',
      )}
      onSubmit={(e) => e.preventDefault()}
      role="search"
    >
      <div className="flex min-w-0 flex-[1.6] items-center gap-2 px-3">
        <Search className="size-4.5 shrink-0 text-ink-3" aria-hidden />
        <input
          type="search"
          placeholder="Job title, skill or company"
          aria-label="Job title, skill or company"
          className={cn('w-full bg-transparent text-ink placeholder:text-ink-3 outline-none', big ? 'h-12' : 'h-10')}
        />
      </div>
      <div className="hidden w-px self-stretch bg-line sm:block" />
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
        <MapPin className="size-4.5 shrink-0 text-ink-3" aria-hidden />
        <input
          type="text"
          placeholder="City or remote"
          aria-label="Location"
          className={cn('w-full bg-transparent text-ink placeholder:text-ink-3 outline-none', big ? 'h-12' : 'h-10')}
        />
      </div>
      <Button size={big ? 'lg' : 'md'} asChild className="shrink-0">
        <Link to="/jobs">
          Search jobs
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </form>
  )
}

/* ══════════════════ Live counter ══════════════════ */

export function LiveCount({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-center gap-2 text-sm text-ink-2', className)}>
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      <span className="font-mono tnum font-semibold text-ink">12,480</span> open roles ·
      <span className="font-mono tnum font-semibold text-ink">{compact(146000)}</span> applications
      tracked
    </p>
  )
}

/* ══════════════════ The explainability demo — the product's thesis ══════ */

export function MatchDemo({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="mb-1">
        <AIProvenanceChip what="scored this match" />
        <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink">
          Every score opens into its reasoning
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
          Other platforms hand recruiters a percentage. We hand them the weighting behind it — the
          same breakdown for the top-ranked candidate and the last one. Click{' '}
          <span className="font-medium text-brand-600">Why this score</span>.
        </p>
      </div>
      <MatchPrism
        score={87}
        breakdown={DEMO_BREAKDOWN}
        matchedSkills={['React', 'TypeScript', 'Node.js', 'AWS']}
        missingSkills={['GraphQL', 'Kubernetes']}
        meetsHardRequirements
        size="lg"
        defaultExpanded
      />
    </div>
  )
}

/* ══════════════════ Category tiles ══════════════════ */

export function CategoryTiles({ columns = 3 }: { columns?: number }) {
  return (
    <ul className={cn('grid gap-2', columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2')}>
      {categories.map((c) => (
        <li key={c.name}>
          <Link
            to="/jobs"
            className="group flex items-center justify-between gap-2 rounded-v-control border border-line px-3 py-2.5 transition-v hover:brightness-95"
            style={{ backgroundColor: `oklch(0.97 0.03 ${c.hue})` }}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: `oklch(0.6 0.18 ${c.hue})` }}
                aria-hidden
              />
              <span className="truncate text-sm font-medium text-ink">{c.name}</span>
            </span>
            <span
              className="shrink-0 font-mono tnum text-xs font-semibold"
              style={{ color: `oklch(0.45 0.15 ${c.hue})` }}
            >
              {c.count}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/* ══════════════════ Company strip ══════════════════ */

export function CompanyStrip({ limit = 6 }: { limit?: number }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-4">
      {companies.slice(0, limit).map((c) => (
        <li key={c.id}>
          <Link
            to={`/companies/${c.slug}`}
            className="flex items-center gap-2 text-sm text-ink-2 transition-colors hover:text-ink"
          >
            <CompanyMark company={c} size={28} />
            <span className="font-medium">{c.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/**
 * The same logos, scrolling.
 *
 * The list is rendered twice and the track translates by exactly -50%, so the
 * second copy lands where the first began and the loop has no seam. Both
 * copies are in the DOM, so the duplicate is hidden from screen readers and
 * only the first is reachable by keyboard — otherwise every company would be
 * announced and tabbed through twice.
 *
 * It pauses on hover, and reduced motion stops it outright and lets the strip
 * scroll normally instead: a marquee a reader cannot stop is the exact thing
 * WCAG 2.2.2 is about.
 */
export function CompanyMarquee({ speed = 38 }: { speed?: number }) {
  const row = (clone: boolean) => (
    <ul
      className="flex shrink-0 items-center gap-12 pr-12"
      aria-hidden={clone || undefined}
    >
      {companies.map((c) => (
        <li key={c.id}>
          <Link
            to={`/companies/${c.slug}`}
            tabIndex={clone ? -1 : undefined}
            className="flex flex-col items-start gap-1 transition-opacity hover:opacity-80"
          >
            <div className="flex items-center gap-2 text-ink h-8">
              <CompanyMark company={c} size={36} />
              {!c.logoUrl && (
                <span className="font-display font-semibold text-xl tracking-tight whitespace-nowrap">
                  {c.name}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-ink-3 underline decoration-line underline-offset-4 hover:text-brand-600 transition-colors">
              {c.openJobs} jobs
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="group relative overflow-hidden">
      {/* the edges fade so logos enter and leave rather than being cut off */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-paper to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-paper to-transparent" aria-hidden />

      <div
        className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ animationDuration: `${speed}s` }}
      >
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}

/* ══════════════════ Audience toggle content ══════════════════ */

export const AUDIENCE = {
  candidate: {
    title: 'Stop guessing why you were passed over',
    points: [
      { text: 'One profile, parsed from your resume, powers every match', icon: FileText },
      { text: 'See the exact weighting behind every recommendation', icon: ChartPie },
      { text: 'Track each application through all nine pipeline stages', icon: Route },
      { text: 'Nothing about your age, gender or photo ever reaches the model', icon: ShieldCheck },
    ],
    cta: { label: 'Create your profile', to: '/register' },
    secondary: { label: 'Browse jobs first', to: '/jobs' },
  },
  recruiter: {
    title: 'A ranked shortlist you can defend in a meeting',
    points: [
      { text: 'AI drafts the job description — you edit and publish it', icon: Sparkles },
      { text: 'Candidates ranked with a visible score breakdown, not a black box', icon: ListOrdered },
      { text: 'Triage 200 applicants without lifting your hands off the keyboard', icon: Keyboard },
      { text: 'Full audit trail: who moved whom, when, and why', icon: History },
    ],
    cta: { label: 'Post a job', to: '/recruiter/jobs/new' },
    secondary: { label: 'See applicant triage', to: '/recruiter/jobs/j1/applicants' },
  },
}

/** One pass down the list, then a beat before it runs again. */
const AUDIENCE_CYCLE_MS = 3600

export function AudiencePanel({ which }: { which: keyof typeof AUDIENCE }) {
  const a = AUDIENCE[which]
  const reduced = useReducedMotion() ?? false
  const icons = useRef<(AnimatedIconHandle | null)[]>([])

  // `isAnimated` only arms the icon's own hover. To run continuously the
  // handles have to be driven, staggered so the four read top to bottom.
  // Re-keyed on `which`, or switching audience would leave the old panel's
  // handles in the array and animate elements that no longer exist.
  useEffect(() => {
    if (reduced) return
    const play = () =>
      icons.current.forEach((h, i) => window.setTimeout(() => h?.startAnimation(), i * 260))
    play()
    const id = window.setInterval(play, AUDIENCE_CYCLE_MS)
    return () => clearInterval(id)
  }, [which, reduced])

  useEffect(() => {
    icons.current = []
  }, [which])

  return (
    <div className="animate-rise">
      <h3 className="text-2xl font-semibold tracking-tight text-ink">{a.title}</h3>
      <ul className="mt-6 space-y-3">
        {a.points.map((p, i) => (
          <li key={i} className="group flex gap-3.5 items-start rounded-xl border border-line bg-paper p-3 shadow-sm transition-all hover:bg-canvas/50">
            <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg shadow-sm', which === 'candidate' ? 'bg-tone-violet-vivid text-white' : 'bg-tone-indigo-vivid text-white')}>
              <p.icon
                ref={(h: AnimatedIconHandle | null) => { icons.current[i] = h }}
                className="size-5"
                aria-hidden
              />
            </span>
            <span className="text-[14px] font-medium leading-snug text-ink-2 group-hover:text-ink transition-colors">
              {p.text}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to={a.cta.to}>
            {a.cta.label}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button variant="secondary" asChild size="lg">
          <Link to={a.secondary.to}>{a.secondary.label}</Link>
        </Button>
      </div>
    </div>
  )
}

/* ══════════════════ How it works ══════════════════ */

export const STEPS = [
  { n: '01', title: 'Upload once', body: 'Your resume is parsed into a structured profile — skills, experience, education — in about four seconds.' },
  { n: '02', title: 'Get ranked matches', body: 'Every open role is scored against your profile across six weighted components. You see all six.' },
  { n: '03', title: 'Track every stage', body: 'Applied through hired, with a timestamped history of who moved you and why.' },
]

const STEP_TONES: Tone[] = ['indigo', 'violet', 'emerald']

export function StepList({ variant = 'a' }: { variant?: 'a' | 'b' | 'c' }) {
  return (
    <ol className={cn('grid gap-6', variant === 'c' ? 'md:grid-cols-3' : 'sm:grid-cols-3')}>
      {STEPS.map((s, i) => {
        const t = STEP_TONES[i % STEP_TONES.length]
        return (
          <li key={s.n} className="relative rounded-v border border-line bg-paper p-5 shadow-v-card">
            <span className={cn('absolute inset-x-0 top-0 h-1 rounded-t-v', TONE_CLASS[t].rail)} aria-hidden />
            <span
              className={cn(
                'mt-1 grid size-11 place-items-center rounded-v-control font-mono font-bold',
                TONE_CLASS[t].bg,
                TONE_CLASS[t].text,
                variant === 'c' ? 'text-2xl' : 'text-xl',
              )}
            >
              {s.n}
            </span>
            <h3 className="mt-3 font-semibold text-ink">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{s.body}</p>
          </li>
        )
      })}
    </ol>
  )
}

export const featuredJobs = jobs.slice(0, 4)
