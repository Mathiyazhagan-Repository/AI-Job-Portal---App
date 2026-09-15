import { Link, useParams } from 'react-router'
import {
  MapPin, Building2, Tag, ArrowRight, Briefcase, Users2, TrendingUp,
  Wallet, Clock, Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { jobs, companies, facets, type Job } from '@/data/mock'
import { titleCase, salaryLPA } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { JobCard } from '@/features/jobs/JobCard'
import {
  PageHeader, SectionHeading, EmptyState, StatCard, MiniStat,
  BarChart, HBarChart, DonutChart, TONE_CLASS, type Tone,
} from '@/components/common'
import { Reveal, Stagger, StaggerItem, ScrambleText } from '@/components/motion'

/**
 * P6 — Category landing.
 *
 * One parameterised SEO template serving three facet families:
 *   /browse/skill/react   /browse/location/bengaluru   /browse/company/northwind-labs
 * The copy block, the heading and the related-facet cloud all derive from
 * the two route params, so a new facet needs no new page.
 */

type FacetType = 'skill' | 'location' | 'company' | 'work-mode' | 'role'

const FACET_META: Record<FacetType, { label: string; icon: React.ElementType; tone: Tone }> = {
  skill: { label: 'Skill', icon: Tag, tone: 'violet' },
  location: { label: 'Location', icon: MapPin, tone: 'sky' },
  company: { label: 'Company', icon: Building2, tone: 'teal' },
  'work-mode': { label: 'Work mode', icon: Home, tone: 'amber' },
  role: { label: 'Role', icon: Briefcase, tone: 'indigo' },
}

/** Turn a URL slug back into something a person would write. */
function humanise(value: string) {
  return value
    .split('-')
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
}

function matches(job: Job, type: FacetType, value: string) {
  const v = value.toLowerCase().replace(/-/g, ' ')
  switch (type) {
    case 'skill':
      return [...job.requiredSkills, ...job.preferredSkills].some(
        (s) => s.toLowerCase() === v || s.toLowerCase().includes(v),
      )
    case 'location':
      return job.location.toLowerCase().includes(v)
    case 'company': {
      const c = companies.find((x) => x.id === job.companyId)
      return Boolean(c && (c.slug === value || c.name.toLowerCase().includes(v)))
    }
    case 'work-mode':
      return job.workMode.replace(/_/g, ' ') === v
    case 'role':
      return job.title.toLowerCase().includes(v)
    default:
      return false
  }
}

function useFacet() {
  const params = useParams<{ type: string; value: string }>()
  const rawType = (params.type ?? 'skill') as FacetType
  const type: FacetType = rawType in FACET_META ? rawType : 'skill'
  const value = params.value ?? 'react'
  const label = humanise(value)

  const results = jobs.filter((j) => matches(j, type, value))
  // if a facet has no fixtures behind it the template still has to read as a
  // real page, so fall back to the full list rather than an empty shell
  const list = results.length ? results : jobs
  const exact = results.length > 0

  const meta = FACET_META[type]

  const related =
    type === 'skill'
      ? [...new Set(jobs.flatMap((j) => j.requiredSkills))].filter(
          (s) => s.toLowerCase() !== value.toLowerCase().replace(/-/g, ' '),
        )
      : type === 'location'
        ? [...new Set(jobs.map((j) => j.location))]
        : [...new Set(jobs.map((j) => j.department))]

  return { type, value, label, list, exact, meta, related }
}

type F = ReturnType<typeof useFacet>

export function Component() {
  const variant = useVariant()
  const f = useFacet()
  const Views = { a: BrowseA, b: BrowseB, c: BrowseC }
  const View = Views[variant] ?? BrowseA
  return <View f={f} />
}
Component.displayName = 'BrowsePage'

/* ══════════════════ shared ══════════════════ */

function relatedHref(f: F, term: string) {
  const slug = term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const type = f.type === 'location' ? 'location' : f.type === 'skill' ? 'skill' : 'role'
  return `/browse/${type}/${slug}`
}

function Breadcrumb({ f }: { f: F }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-ink-3">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li><Link to="/" className="hover:text-ink">Home</Link></li>
        <li aria-hidden>/</li>
        <li><Link to="/jobs" className="hover:text-ink">Jobs</Link></li>
        <li aria-hidden>/</li>
        <li><span className="capitalize">{f.meta.label}</span></li>
        <li aria-hidden>/</li>
        <li aria-current="page" className="font-medium text-ink-2">{f.label}</li>
      </ol>
    </nav>
  )
}

/** The SEO copy block — written from the facet, never model-generated. */
function CopyBlock({ f }: { f: F }) {
  const salaries = f.list.filter((j) => j.salaryVisible)
  const low = salaries.length ? Math.min(...salaries.map((j) => j.salaryMin)) : 0
  const high = salaries.length ? Math.max(...salaries.map((j) => j.salaryMax)) : 0

  return (
    <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-ink-2">
      <p>
        <span className="font-medium text-ink">{f.list.length} open roles</span> matching{' '}
        <span className="font-medium text-ink">{f.label}</span>
        {f.type === 'location' ? ' in and around this city' : ''}. Every posting on Kairo carries a
        salary band, a named hiring team and an explicit list of hard requirements, so you can tell
        before you apply whether you are actually eligible.
        {salaries.length > 0 && (
          <>
            {' '}
            Published bands here run from{' '}
            <span className="font-medium text-ink">{salaryLPA(low, high, true)}</span>.
          </>
        )}
      </p>
      <p>
        Match scores are explanatory, not gatekeeping: the model ranks and shows its working, and a
        person at the company reads every shortlist before anyone is moved forward.
      </p>
    </div>
  )
}

function RelatedCloud({ f }: { f: F }) {
  const tones: Tone[] = ['indigo', 'sky', 'violet', 'fuchsia', 'teal', 'amber', 'emerald', 'rose']
  return (
    <ul className="flex flex-wrap gap-2">
      {f.related.slice(0, 14).map((term, i) => {
        const t = TONE_CLASS[tones[i % tones.length]]
        return (
          <li key={term}>
            <Link
              to={relatedHref(f, term)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-v hover:brightness-95',
                t.bg,
                t.text,
              )}
            >
              {term}
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function Empty() {
  return (
    <EmptyState
      icon={Briefcase}
      title="Nothing open under this facet yet"
      description="New roles are published every day. Browse everything, or set an alert and we will tell you the moment one appears."
      action={{ label: 'Browse all jobs', to: '/jobs' }}
    />
  )
}

/* ══════════════════ A · SEO copy + faceted grid ══════════════════ */

function BrowseA({ f }: { f: F }) {
  const remote = f.list.filter((j) => j.workMode === 'remote').length
  const withBand = f.list.filter((j) => j.salaryVisible).length
  const hiring = new Set(f.list.map((j) => j.companyId)).size
  const fresh = f.list.filter(
    (j) => Date.now() - +new Date(j.postedAt) < 7 * 86400000,
  ).length

  const cards = [
    { tone: 'indigo' as Tone, icon: Briefcase, label: 'Open roles', value: f.list.length,
      caption: `${fresh} posted this week` },
    { tone: 'teal' as Tone, icon: Building2, label: 'Companies hiring', value: hiring,
      caption: 'all domain-verified' },
    { tone: 'emerald' as Tone, icon: Wallet, label: 'With a salary band', value: `${Math.round((withBand / Math.max(f.list.length, 1)) * 100)}%`,
      progress: Math.round((withBand / Math.max(f.list.length, 1)) * 100), caption: 'published up front' },
    { tone: 'amber' as Tone, icon: Home, label: 'Remote-friendly', value: remote,
      caption: 'fully remote postings' },
  ]

  const modeMix = facets.workMode
    .map((m, i) => ({
      label: m.label,
      value: f.list.filter((j) => j.workMode === m.value).length,
      tone: (['sky', 'violet', 'amber'] as Tone[])[i % 3],
    }))
    .filter((d) => d.value > 0)

  const expMix = facets.experience
    .map((e, i) => {
      const [lo, hi] = e.value.endsWith('+')
        ? [Number(e.value.slice(0, -1)), Infinity]
        : e.value.split('-').map(Number)
      return {
        label: e.label,
        value: f.list.filter((j) => j.experienceMin >= lo && j.experienceMin <= hi).length,
        tone: (['indigo', 'teal', 'fuchsia', 'rose'] as Tone[])[i % 4],
      }
    })
    .filter((d) => d.value > 0)

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <Breadcrumb f={f} />

      <div className="mt-3">
        <PageHeader
          icon={f.meta.icon}
          tone={f.meta.tone}
          title={`${f.label} jobs`}
          description={`${f.list.length} open roles · ${hiring} companies hiring${f.exact ? '' : ' · showing everything while this facet fills up'}`}
          actions={
            <Button asChild>
              <Link to="/candidate/alerts">
                Set an alert
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <Reveal className="mt-5 rounded-v border border-line bg-paper p-5 shadow-v-card">
        <CopyBlock f={f} />
      </Reveal>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className={cn('rounded-v border border-line bg-paper p-v-card shadow-v-card lg:col-span-5', modeMix.length === 0 && 'hidden')}>
          <SectionHeading title="How these roles are worked" icon={Home} tone="sky" />
          <div className="flex items-center justify-center py-1">
            <DonutChart
              data={modeMix}
              size={132}
              centerLabel="postings"
              centerValue={String(modeMix.reduce((n, d) => n + d.value, 0))}
            />
          </div>
        </div>
        <div className={cn('rounded-v border border-line bg-paper p-v-card shadow-v-card lg:col-span-7', expMix.length === 0 && 'hidden')}>
          <SectionHeading title="Experience these roles ask for" icon={TrendingUp} tone="fuchsia" />
          <BarChart data={expMix} height={168} />
        </div>
      </div>

      <SectionHeading
        title={`${f.list.length} roles`}
        icon={Briefcase}
        tone={f.meta.tone}
        className="mt-8"
      />

      {f.list.length === 0 ? (
        <Empty />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" whenVisible={false}>
          {f.list.map((j) => (
            <StaggerItem key={j.id}>
              <JobCard job={j} variant="a" showMatch={false} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Reveal className="mt-10 rounded-v border border-line bg-paper p-5 shadow-v-card">
        <SectionHeading title="Related searches" icon={Tag} tone="violet" />
        <RelatedCloud f={f} />
      </Reveal>
    </div>
  )
}

/* ══════════════════ B · facet sidebar + compact list ══════════════════ */

function BrowseB({ f }: { f: F }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <Breadcrumb f={f} />

      <div className="mb-3 mt-2 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">{f.label} jobs</h1>
          <p className="font-mono text-xs text-ink-3">
            {f.list.length} results · facet={f.type} · value={f.value}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link to="/candidate/alerts">Set an alert</Link>
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside>
          <div className="sticky top-20 space-y-4">
            {[
              { title: 'Work mode', rows: facets.workMode },
              { title: 'Job type', rows: facets.jobType },
              { title: 'Experience', rows: facets.experience },
            ].map((group) => (
              <div key={group.title}>
                <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
                  {group.title}
                </h2>
                <ul className="space-y-0.5">
                  {group.rows.map((row) => (
                    <li key={row.value}>
                      <Link
                        to={`/browse/skill/${row.value}`}
                        className="flex items-center justify-between rounded-v-control px-2 py-1 text-sm text-ink-2 transition-v hover:bg-hover hover:text-ink"
                      >
                        <span className="truncate">{row.label}</span>
                        <span className="font-mono text-xs text-ink-3">{row.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <div>
          {f.list.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-line rounded-v border border-line bg-paper">
              {f.list.map((j) => (
                <li key={j.id}>
                  <Link
                    to={`/jobs/${j.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm transition-v hover:bg-hover"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{j.title}</span>
                      <span className="block truncate text-xs text-ink-3">
                        {j.location} · {titleCase(j.workMode)} · {j.department}
                      </span>
                    </span>
                    <span className="hidden w-32 shrink-0 text-right font-mono text-xs text-ink-3 sm:block">
                      {salaryLPA(j.salaryMin, j.salaryMax, j.salaryVisible)}
                    </span>
                    <span className="hidden w-20 shrink-0 text-right font-mono text-xs text-ink-3 md:block">
                      {j.applicants} appl.
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 rounded-v border border-line bg-paper p-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Related searches
            </h2>
            <RelatedCloud f={f} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════ C · display facet name + stat strip ══════════════════ */

function BrowseC({ f }: { f: F }) {
  const hiring = new Set(f.list.map((j) => j.companyId)).size
  const strip = [
    { tone: 'indigo' as Tone, icon: Briefcase, label: 'Open roles', value: f.list.length },
    { tone: 'teal' as Tone, icon: Building2, label: 'Companies', value: hiring },
    { tone: 'fuchsia' as Tone, icon: Users2, label: 'Applicants', value: f.list.reduce((n, j) => n + j.applicants, 0) },
    { tone: 'amber' as Tone, icon: Clock, label: 'Posted this week', value: f.list.filter((j) => Date.now() - +new Date(j.postedAt) < 7 * 86400000).length },
  ]

  const topSkills = [...new Set(f.list.flatMap((j) => j.requiredSkills))]
    .slice(0, 6)
    .map((s, i) => ({
      label: s,
      value: f.list.filter((j) => j.requiredSkills.includes(s)).length,
      tone: (['indigo', 'violet', 'fuchsia', 'sky', 'teal', 'amber'] as Tone[])[i % 6],
    }))

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-14 sm:px-6">
      <Breadcrumb f={f} />

      <h1 className="mt-4 font-display text-display-1 font-semibold tracking-tight text-ink">
        <ScrambleText text={f.label} />
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">
        {f.list.length} open roles, {hiring} companies, every one with a published salary band.
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {strip.map((m) => (
          <MiniStat key={m.label} {...m} />
        ))}
      </div>

      {topSkills.length > 0 && (
        <Reveal className="mt-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            What these roles ask for
          </h2>
          <div className="mt-5">
            <HBarChart data={topSkills} labelWidth="w-32" />
          </div>
        </Reveal>
      )}

      {f.list.length === 0 ? (
        <Empty />
      ) : (
        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2" whenVisible={false}>
          {f.list.map((j) => (
            <StaggerItem key={j.id}>
              <JobCard job={j} variant="c" showMatch={false} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Reveal className="mt-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Keep looking
        </h2>
        <div className="mt-5">
          <RelatedCloud f={f} />
        </div>
      </Reveal>
    </div>
  )
}
