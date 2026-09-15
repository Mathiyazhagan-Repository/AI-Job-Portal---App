import { Link, useParams } from 'react-router'
import { MapPin, Users2, Globe, BadgeCheck, Building2, ArrowLeft, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { companies, jobs } from '@/data/mock'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/overlay'
import {
  Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent,
} from '@/components/ui/controls'
import { CompanyMark, JobCard } from '@/features/jobs/JobCard'
import { EmptyState } from '@/components/common'
import { Reveal, Stagger, StaggerItem, Parallax } from '@/components/motion'

/** P5 — Company page. */

const CULTURE = [
  { title: 'How we work', body: 'Small teams with end-to-end ownership. Written proposals before big changes, so decisions survive the people who made them.' },
  { title: 'Hiring process', body: 'Intro call, a paid take-home you keep, a systems conversation, then a team round. Four steps, roughly two weeks, and we tell you where you stand at each one.' },
  { title: 'Working hours', body: 'Core hours 11:00–17:00 IST. Outside that, work when you think best. No meetings on Wednesdays.' },
]

export function Component() {
  const { slug } = useParams()
  const variant = useVariant()
  const company = companies.find((c) => c.slug === slug) ?? companies[0]
  const openJobs = jobs.filter((j) => j.companyId === company.id)

  const facts: [string, React.ReactNode][] = [
    ['Industry', company.industry],
    ['Company size', company.size + ' employees'],
    ['Headquarters', company.location],
    ['Website', <span key="w" className="text-brand-600">{company.slug}.example</span>],
    ['Open roles', String(openJobs.length)],
  ]

  const verified = (
    <Tooltip content="A platform admin checked this company's domain and registration document before it could post jobs (PRD Part 23).">
      <span
        className={cn(
          'inline-flex cursor-help items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
          company.verified ? 'bg-brand-50 text-brand-700' : 'bg-subtle text-ink-3',
        )}
      >
        {company.verified ? <BadgeCheck className="size-3.5" /> : <Building2 className="size-3.5" />}
        {company.verified ? 'Verified employer' : 'Not yet verified'}
      </span>
    </Tooltip>
  )

  const jobsList = (
    <>
      {openJobs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No open roles right now"
          description="This company has no live postings. Create a job alert and we'll tell you the moment one appears."
          action={{ label: 'Create an alert', to: '/candidate/alerts' }}
        />
      ) : (
        <Stagger as="ul" className="space-y-3" whenVisible={false}>
          {openJobs.map((j) => (
            <StaggerItem as="li" key={j.id}>
              <JobCard job={j} variant={variant} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </>
  )

  const cultureBlock = (
    <div className="space-y-6">
      {CULTURE.map((c) => (
        <div key={c.title}>
          <h3 className="font-semibold text-ink">{c.title}</h3>
          <p className="mt-1.5 leading-relaxed text-ink-2">{c.body}</p>
        </div>
      ))}
    </div>
  )

  const factList = (
    <dl className="space-y-2.5 text-sm">
      {facts.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="text-ink-3">{k}</dt>
          <dd className="text-right font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  )

  /* ── C · long-scroll story ── */
  if (variant === 'c') {
    return (
      <div>
        <div className="relative h-64 overflow-hidden sm:h-80">
          <Parallax strength={60} className="absolute inset-0">
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(135deg, oklch(0.92 0.07 ${company.logoHue}), oklch(0.98 0.02 ${company.logoHue}))`,
              }}
            />
          </Parallax>
        </div>

        <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
          <div className="-mt-16 rounded-v bg-paper p-8 shadow-xl sm:p-10">
            <div className="flex flex-wrap items-start gap-5">
              <CompanyMark company={company} size={72} />
              <div className="min-w-0 flex-1">
                <h1 className="font-display tracking-tight text-display-2 font-semibold leading-tight text-ink">
                  {company.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-ink-2">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden />
                    {company.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users2 className="size-4" aria-hidden />
                    {company.size}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="size-4 fill-warning text-warning" aria-hidden />
                    {company.rating}
                  </span>
                  {verified}
                </div>
              </div>
            </div>
            <p className="mt-6 text-lg leading-relaxed text-ink-2">{company.about}</p>
          </div>

          <Reveal className="py-20">
            <h2 className="font-display tracking-tight text-3xl font-semibold text-ink">
              How it is to work here
            </h2>
            <div className="mt-8 text-lg">{cultureBlock}</div>
          </Reveal>

          <Reveal className="pb-24">
            <h2 className="font-display tracking-tight text-3xl font-semibold text-ink">
              {openJobs.length} open {openJobs.length === 1 ? 'role' : 'roles'}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {openJobs.map((j) => (
                <JobCard key={j.id} job={j} variant="c" />
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    )
  }

  /* ── B · persistent split ── */
  if (variant === 'b') {
    return (
      <div className="mx-auto max-w-[1300px] px-4 py-6 sm:px-6">
        <Link to="/companies" className="inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink">
          <ArrowLeft className="size-3.5" aria-hidden /> All companies
        </Link>

        <div className="mt-3 grid gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-v border border-line bg-paper p-4 shadow-v-card">
              <CompanyMark company={company} size={44} />
              <h1 className="mt-3 text-lg font-semibold text-ink">{company.name}</h1>
              <div className="mt-1.5">{verified}</div>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{company.about}</p>
              <div className="mt-4 border-t border-line pt-4">{factList}</div>
              <Button size="sm" variant="secondary" className="mt-4 w-full">
                <Globe className="size-4" />
                Visit website
              </Button>
            </div>
          </aside>

          <div className="min-w-0">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Open roles ({openJobs.length})
            </h2>
            <div className="divide-y divide-line border-y border-line">
              {openJobs.map((j) => (
                <JobCard key={j.id} job={j} variant="b" />
              ))}
            </div>

            <h2 className="mb-2 mt-8 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Culture
            </h2>
            <div className="text-sm">{cultureBlock}</div>
          </div>
        </div>
      </div>
    )
  }

  /* ── A · cover + tabs ── */
  return (
    <div>
      <div
        className="h-40"
        style={{
          background: `linear-gradient(135deg, oklch(0.94 0.05 ${company.logoHue}), oklch(0.98 0.02 ${company.logoHue}))`,
        }}
        aria-hidden
      />
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <Reveal className="-mt-10 flex flex-wrap items-end gap-4">
          <div className="rounded-v bg-paper p-2 shadow-md">
            <CompanyMark company={company} size={64} />
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{company.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {company.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users2 className="size-4" aria-hidden />
                {company.size}
              </span>
              {verified}
            </div>
          </div>
          <Button variant="secondary" size="sm">
            <Globe className="size-4" />
            Website
          </Button>
        </Reveal>

        <div className="mt-8 grid gap-8 pb-16 lg:grid-cols-[1fr_280px]">
          <Tabs defaultValue="overview" className="min-w-0">
            <TabsListUnderline>
              <TabsTriggerUnderline value="overview">Overview</TabsTriggerUnderline>
              <TabsTriggerUnderline value="jobs">Jobs ({openJobs.length})</TabsTriggerUnderline>
              <TabsTriggerUnderline value="culture">Culture</TabsTriggerUnderline>
            </TabsListUnderline>

            <TabsContent value="overview" className="pt-6">
              <p className="leading-relaxed text-ink-2">{company.about}</p>
              <h2 className="mt-8 text-lg font-semibold text-ink">Latest roles</h2>
              <div className="mt-4">{jobsList}</div>
            </TabsContent>

            <TabsContent value="jobs" className="pt-6">
              {jobsList}
            </TabsContent>

            <TabsContent value="culture" className="pt-6">
              {cultureBlock}
            </TabsContent>
          </Tabs>

          <aside>
            <div className="sticky top-24 rounded-v border border-line bg-paper p-v-card shadow-v-card">
              <h2 className="text-sm font-semibold text-ink">Company facts</h2>
              <div className="mt-3">{factList}</div>
              <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-sm">
                <Star className="size-4 fill-warning text-warning" aria-hidden />
                <span className="font-medium text-ink">{company.rating}</span>
                <span className="text-ink-3">employee rating</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

Component.displayName = 'CompanyDetailPage'
