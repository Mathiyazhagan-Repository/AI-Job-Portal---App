import * as React from 'react'
import { Link } from 'react-router'
import {
  ArrowRight, CalendarDays, ClipboardCheck, MessageSquare, Sparkles, Target,
  Send, Eye, Bookmark, Clock, TrendingUp, Zap, FileText, Award, Flame, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { candidate, jobs, applications, interviews, notifications, jobById } from '@/data/mock'
import { useApplicationStore } from '@/store/applications'
import { STAGES } from '@/lib/pipeline'
import { relativeTime, timeOfDay, shortDate } from '@/lib/format'
import { JobCard } from '@/features/jobs/JobCard'
import { StageRail, StagePill, ScoreRing, AIProvenanceChip } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/controls'
import {
  StatCard, MiniStat, SectionHeading, Kbd,
  AreaChart, HBarChart, DonutChart, RadialGauge, StackedBar, type Tone,
  SeriesChart, ChartTypePicker, type ChartType,
} from '@/components/common'
import { Stagger, StaggerItem, Reveal, AnimatedNumber } from '@/components/motion'
import { useProfileStore } from '@/store/profile'
import { useInterviewCount } from '@/pages/candidate/Interviews'
import { useSavedJobCount } from '@/pages/candidate/SavedJobs'
import { useAuth } from '@/store/auth'

/**
 * C1 — Candidate dashboard.
 *
 * Direction A is the colourful direction: every metric owns a hue from
 * the categorical palette and keeps it across its card, its chart and
 * its legend, so colour still says *which metric* rather than decorating.
 */

const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']

function useDashboardData() {
  const { token } = useAuth()
  const topMatches = [...jobs].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)).slice(0, 3)
  const active = applications.filter((a) => !STAGES[a.stage].terminal)

  const funnel = [
    { label: 'Applied', count: applications.length },
    { label: 'In review', count: applications.filter((a) => ['screening', 'shortlisted'].includes(a.stage)).length },
    { label: 'Assessment', count: applications.filter((a) => a.stage === 'assessment').length },
    { label: 'Interview', count: applications.filter((a) => a.stage.includes('interview')).length },
  ]

  const statusMix = [
    { label: 'In progress', value: active.length, tone: 'indigo' as Tone },
    { label: 'Interviewing', value: 1, tone: 'violet' as Tone },
    { label: 'Not moved forward', value: 1, tone: 'rose' as Tone },
  ]

  const [activity, setActivity] = React.useState({
    labels: MONTHS,
    series: [
      { label: 'Applications sent', tone: 'indigo' as Tone, points: [0, 0, 0, 0, 0, 0] },
      { label: 'Profile views by recruiters', tone: 'fuchsia' as Tone, points: [0, 0, 0, 0, 0, 0] },
    ],
  })

  const [skillDemand, setSkillDemand] = React.useState([
    { label: 'React', value: 92, tone: 'indigo' as Tone, hint: '48 jobs' },
    { label: 'TypeScript', value: 86, tone: 'violet' as Tone, hint: '41 jobs' },
    { label: 'Node.js', value: 64, tone: 'teal' as Tone, hint: '29 jobs' },
    { label: 'GraphQL', value: 31, tone: 'amber' as Tone, hint: '18 jobs' },
    { label: 'Kubernetes', value: 12, tone: 'rose' as Tone, hint: '9 jobs' },
  ])

  React.useEffect(() => {
    let isActive = true
    if (!token) return
    fetch('http://localhost:8000/api/analytics/candidate', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!isActive || !data) return
        if (data.activity) setActivity(data.activity)
        if (data.skillDemand) setSkillDemand(data.skillDemand)
      })
      .catch(() => {})
    return () => { isActive = false }
  }, [token])

  return {
    topMatches, active, funnel, activity, statusMix, skillDemand,
    upcoming: interviews, unread: notifications.filter((n) => !n.read),
  }
}

type Data = ReturnType<typeof useDashboardData>

export function Component() {
  const { applicationCount } = useApplicationStore()
  const interviewCount = useInterviewCount()
  const savedJobCount = useSavedJobCount()
  const variant = useVariant()
  const data = useDashboardData()
  const Views = { a: DashA, b: DashB, c: DashC }
  const View = Views[variant] ?? DashA
  return <View {...data} applicationCount={applicationCount} interviewCount={interviewCount} savedJobCount={savedJobCount} />
}
Component.displayName = 'CandidateDashboard'

/* ══════════════════ shared blocks ══════════════════ */

function ProfileStrength({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const done = candidate.sections.filter((s) => s.complete).length
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
            Profile strength
          </p>
          <p
            className={cn(
              'mt-1 font-mono tnum font-bold leading-none text-ink',
              size === 'lg' ? 'text-5xl' : 'text-4xl',
            )}
          >
            {candidate.profileCompletion}
            <span className="text-2xl text-ink-3">%</span>
          </p>
        </div>
        <ScoreRing score={candidate.profileCompletion} size={size === 'lg' ? 'lg' : 'md'} />
      </div>

      <div className="mt-4 flex gap-1" role="img" aria-label={`${done} of ${candidate.sections.length} profile sections complete`}>
        {candidate.sections.map((s) => (
          <span
            key={s.name}
            title={`${s.name} — ${s.complete ? 'complete' : 'incomplete'}`}
            className={cn('h-1.5 flex-1 rounded-full', s.complete ? 'bg-brand-600' : 'bg-line')}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-3">
        {done} of {candidate.sections.length} sections complete
      </p>

      {/* the actual checklist — fills the card and makes the % actionable */}
      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {candidate.sections.map((sec) => (
          <li key={sec.name} className="flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                'grid size-4 shrink-0 place-items-center rounded-full',
                sec.complete ? 'bg-tone-emerald-bg text-tone-emerald' : 'bg-subtle text-ink-3',
              )}
              aria-hidden
            >
              {sec.complete ? <Check className="size-2.5 stroke-[3]" /> : <span className="size-1 rounded-full bg-current" />}
            </span>
            <span className={cn('truncate', sec.complete ? 'text-ink-2' : 'text-ink-3')}>
              {sec.name}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4">
        <div className="rounded-v-control bg-brand-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
            <Target className="size-3.5" aria-hidden />
            Do this next
          </p>
          <p className="mt-1.5 text-sm font-medium text-ink">{candidate.nextBestAction.label}</p>
          <p className="mt-0.5 text-xs text-ink-2">{candidate.nextBestAction.detail}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <Button size="xs" asChild>
              <Link to="/candidate/profile">Add skills</Link>
            </Button>
            <span className="font-mono text-xs font-semibold text-score-elite">
              {candidate.nextBestAction.impact}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApplicationRow({ app, dense }: { app: (typeof applications)[number]; dense?: boolean }) {
  const job = jobById(app.jobId)!
  return (
    <Link
      to="/candidate/applications"
      className={cn(
        'flex items-center gap-3 rounded-v-control transition-v hover:bg-hover',
        dense ? 'px-2 py-1.5' : 'p-2',
      )}
    >
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate font-medium text-ink', dense && 'text-sm')}>
          {job.title}
        </span>
        <span className="block truncate text-xs text-ink-3">{job.location}</span>
      </span>
      <StageRail stage={app.stage} size="sm" />
      <StagePill stage={app.stage} size="sm" />
    </Link>
  )
}

function UpcomingInterviews({ upcoming }: { upcoming: Data['upcoming'] }) {
  return (
    <ul className="space-y-2">
      {upcoming.map((iv) => {
        const job = jobById(iv.jobId)!
        return (
          <li key={iv.id} className="rounded-v-control border border-line p-3 transition-v hover:border-tone-violet-vivid/40">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{job.title}</p>
                <p className="text-xs text-ink-3">{STAGES[iv.stage].label}</p>
              </div>
              <span className="shrink-0 rounded-v-control bg-tone-violet-bg px-2 py-1 text-center">
                <span className="block font-mono text-sm font-bold leading-none text-tone-violet">
                  {new Date(iv.at).getDate()}
                </span>
                <span className="block text-[10px] uppercase text-tone-violet">
                  {new Date(iv.at).toLocaleDateString('en-IN', { month: 'short' })}
                </span>
              </span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-2">
              <Clock className="size-3.5" aria-hidden />
              {timeOfDay(iv.at)} · {iv.duration} min · {iv.mode}
              <span className="ml-auto text-ink-3">IST</span>
            </p>
          </li>
        )
      })}
    </ul>
  )
}

const Tile = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-v border-[length:var(--v-card-border)] border-line bg-paper p-v-card shadow-v-card',
      className,
    )}
    {...p}
  />
)

/**
 * "Your activity" — one dataset, nine ways of reading it.
 *
 * The type lives in component state rather than the URL: it is a way of
 * looking, not a different screen, so it should not be something you can
 * accidentally send someone in a link.
 */
function ActivityCard({ activity }: { activity: Data['activity'] }) {
  const [type, setType] = React.useState<ChartType>('area')

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold text-ink">Your activity</h2>
          <p className="text-sm text-ink-2">
            Applications sent vs recruiter profile views · 6 months
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone="success" size="sm">
            <TrendingUp className="size-3" aria-hidden />
            views up 29%
          </Badge>
          <ChartTypePicker value={type} onChange={setType} />
        </div>
      </div>
      <SeriesChart series={activity.series} labels={activity.labels} type={type} height={230} />
    </>
  )
}

/* ══════════════════ A · colourful bento ══════════════════ */

function DashA({ topMatches, active, funnel, activity, statusMix, skillDemand, upcoming, unread, applicationCount, interviewCount, savedJobCount }: Data & { applicationCount: number; interviewCount: number; savedJobCount: number }) {
  const profile = useProfileStore()
  const name = profile.data.name || candidate.name
  const firstName = name.split(' ')[0]

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
      {/* ── greeting band ── */}
      <header className="relative overflow-hidden rounded-v border border-line bg-paper p-5 shadow-v-card sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(60% 120% at 0% 0%, rgba(99,102,241,0.10), transparent 60%), radial-gradient(50% 120% at 100% 0%, rgba(217,70,239,0.08), transparent 60%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-600">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Good afternoon, {firstName}
            </h1>
            <p className="mt-1 text-sm text-ink-2">
              {active.length} active applications · {upcoming.length} interviews this week · 1 assessment due
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link to="/candidate/resumes">
                <FileText className="size-4" />
                Check ATS score
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/candidate/jobs">
                Find jobs
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── colourful KPI row ── */}
      <Stagger className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" whenVisible={false}>
        {[
          { tone: 'indigo' as Tone, icon: Send, label: 'Applications', value: applicationCount, badge: { text: '+2', direction: 'up' as const }, progress: 62, caption: 'this month', to: '/candidate/applications' },
          { tone: 'fuchsia' as Tone, icon: Eye, label: 'Profile views', value: 18, badge: { text: '+29%', direction: 'up' as const }, progress: 78, caption: 'by recruiters, 30 days' },
          { tone: 'violet' as Tone, icon: CalendarDays, label: 'Interviews', value: interviewCount, badge: { text: 'this week' }, progress: 50, caption: 'next in 2 days', to: '/candidate/interviews' },
          { tone: 'emerald' as Tone, icon: Target, label: 'Best match', value: '90%', badge: { text: 'Excellent' }, progress: 90, caption: 'Senior React Developer' },
          { tone: 'amber' as Tone, icon: ClipboardCheck, label: 'Assessment due', value: '3d', badge: { text: 'due soon', direction: 'flat' as const }, progress: 35, caption: 'Verdant Studio' },
          { tone: 'teal' as Tone, icon: Bookmark, label: 'Saved jobs', value: savedJobCount, badge: { text: '1 closing' }, progress: 40, caption: 'act before Friday', to: '/candidate/saved' },
        ].map((s) => (
          <StaggerItem key={s.label}>
            <StatCard {...s} />
          </StaggerItem>
        ))}
      </Stagger>

      {/* ── charts + rails ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* activity — the reader picks how to look at it */}
        <Tile className="lg:col-span-8">
          <ActivityCard activity={activity} />
        </Tile>

        {/* profile strength */}
        <Tile className="lg:col-span-4">
          <ProfileStrength />
        </Tile>

        {/* pipeline funnel as a stacked bar + list */}
        <Tile className="lg:col-span-5">
          <SectionHeading
            title="Where your applications are"
            action={{ label: 'Track all', to: '/candidate/applications' }}
          />
          <StackedBar data={statusMix} height={12} />
          <div className="mt-4 space-y-0.5">
            {active.map((app) => (
              <ApplicationRow key={app.id} app={app} />
            ))}
          </div>
        </Tile>

        {/* skill demand — horizontal bars */}
        <Tile className="lg:col-span-4">
          <div className="mb-4">
            <h2 className="font-semibold text-ink">Your skills vs the market</h2>
            <p className="text-sm text-ink-2">Share of matching jobs asking for each</p>
          </div>
          <HBarChart data={skillDemand} labelWidth="w-24" suffix="%" />
          <p className="mt-3 rounded-v-control bg-tone-amber-bg p-2.5 text-xs leading-relaxed text-tone-amber">
            <strong className="font-semibold">GraphQL and Kubernetes</strong> are the two gaps
            costing you the most matches right now.
          </p>
        </Tile>

        {/* upcoming */}
        <Tile className="lg:col-span-3">
          <SectionHeading title="Coming up" action={{ label: 'All', to: '/candidate/interviews' }} />
          <UpcomingInterviews upcoming={upcoming} />
        </Tile>

        {/* top matches */}
        <Tile className="lg:col-span-8">
          <SectionHeading
            title="Top matches today"
            action={{ label: 'See all', to: '/candidate/jobs' }}
          />
          <Stagger className="space-y-2.5" whenVisible={false}>
            {topMatches.map((job) => (
              <StaggerItem key={job.id}>
                <JobCard job={job} variant="a" showReason className="shadow-none" />
              </StaggerItem>
            ))}
          </Stagger>
        </Tile>

        {/* assistant panel — the one gradient-bordered surface */}
        <div className="lg:col-span-4">
          <div className="h-full rounded-v bg-gradient-to-br from-tone-indigo-vivid via-tone-violet-vivid to-tone-fuchsia-vivid p-px shadow-v-card">
            <div className="flex h-full flex-col rounded-[calc(var(--v-radius)-1px)] bg-paper p-v-card">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-tone-indigo-vivid to-tone-fuchsia-vivid text-white shadow-sm">
                  <Sparkles className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-ink">What we noticed</h2>
                  <p className="text-xs text-ink-3">Grounded in your profile and applications</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-v-control bg-tone-fuchsia-bg p-3">
                  <Badge tone="accent" size="sm">Profile</Badge>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    Recruiter views jumped <strong className="font-semibold text-ink">29%</strong> after
                    you added TypeScript. Two more skills would put you in{' '}
                    <strong className="font-semibold text-ink">3× more searches</strong>.
                  </p>
                  <Button size="xs" className="mt-2.5" asChild>
                    <Link to="/candidate/profile">Add skills</Link>
                  </Button>
                </div>

                <div className="rounded-v-control bg-tone-amber-bg p-3">
                  <Badge tone="warning" size="sm">Deadline</Badge>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    Your Verdant Studio design exercise is due in{' '}
                    <strong className="font-semibold text-ink">3 days</strong>. It takes 90 minutes
                    and you get one attempt.
                  </p>
                  <Button size="xs" className="mt-2.5" asChild>
                    <Link to="/assessment/at1">Start it</Link>
                  </Button>
                </div>

                <div className="rounded-v-control bg-tone-sky-bg p-3">
                  <Badge tone="brand" size="sm">Market</Badge>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    <strong className="font-semibold text-ink">34 open roles</strong> match every hard
                    requirement on your profile right now — 11 of them were posted this week.
                  </p>
                  <Button size="xs" className="mt-2.5" asChild>
                    <Link to="/candidate/jobs">See the matches</Link>
                  </Button>
                </div>
              </div>

              {/* the tile is as tall as the job list beside it, so the leftover
                  space carries the numbers behind the observations rather than
                  sitting empty */}
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
                {[
                  { label: 'Profile views', value: '18', hint: '30 days', tone: 'fuchsia' as Tone },
                  { label: 'Response rate', value: '80%', hint: '4 of 5', tone: 'emerald' as Tone },
                  { label: 'Match-ready', value: '34', hint: 'roles', tone: 'sky' as Tone },
                ].map((m) => (
                  <div key={m.label} className="rounded-v-control bg-subtle px-2.5 py-2">
                    <dd
                      className="font-mono tnum text-lg font-semibold leading-none"
                      style={{ color: `var(--color-tone-${m.tone})` }}
                    >
                      {m.value}
                    </dd>
                    <dt className="mt-1 truncate text-[11px] leading-tight text-ink-3">
                      {m.label}
                    </dt>
                    <p className="truncate text-[10px] text-ink-3">{m.hint}</p>
                  </div>
                ))}
              </dl>

              <div className="mt-auto pt-4">
                <AIProvenanceChip
                  what="wrote these two observations"
                  cannot="It reads only your own profile and applications. It cannot see other candidates, and it never decides an outcome."
                />
              </div>
            </div>
          </div>
        </div>

        {/* activity feed strip — fills the row rather than leaving dead space */}
        <Tile className="lg:col-span-12">
          <SectionHeading
            title="Recent activity"
            action={{ label: 'All notifications', to: '/candidate/notifications' }}
          />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { tone: 'violet' as Tone, icon: CalendarDays, label: 'Interview scheduled', value: 'in 2 days' },
              { tone: 'amber' as Tone, icon: ClipboardCheck, label: 'Assessment assigned', value: '3 days left' },
              { tone: 'fuchsia' as Tone, icon: Sparkles, label: 'New job matches', value: '6 today' },
              { tone: 'teal' as Tone, icon: MessageSquare, label: 'Recruiter replied', value: 'yesterday' },
            ].map((m) => (
              <MiniStat key={m.label} {...m} />
            ))}
          </div>
        </Tile>
      </div>
    </div>
  )
}

/* ══════════════════ B · console feed (unchanged) ══════════════════ */

function DashB({ topMatches, active, funnel, upcoming, unread }: Data) {
  const feed = [
    ...unread.map((n) => ({ id: n.id, at: n.at, kind: n.type, title: n.title, body: n.body })),
    ...active.map((a) => ({
      id: a.id,
      at: a.lastUpdate,
      kind: 'stage',
      title: `${jobById(a.jobId)!.title} → ${STAGES[a.stage].label}`,
      body: a.history.at(-1)?.note ?? `Moved by ${a.history.at(-1)?.by}`,
    })),
  ].sort((x, y) => +new Date(y.at) - +new Date(x.at))

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <h1 className="text-base font-semibold text-ink">Your day</h1>
        <p className="flex items-center gap-1 text-xs text-ink-3">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd> to jump anywhere
        </p>
      </div>

      <div className="grid gap-6 py-3 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <div className="divide-y divide-line border-y border-line">
            {feed.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-2">
                <span className="w-16 shrink-0 font-mono text-[11px] text-ink-3">
                  {relativeTime(f.at)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{f.title}</span>
                  <span className="block truncate text-xs text-ink-3">{f.body}</span>
                </span>
                <Button size="xs" variant="ghost">
                  Open
                </Button>
              </div>
            ))}
          </div>

          <h2 className="mb-1 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-3">
            Top matches
          </h2>
          <div className="divide-y divide-line border-y border-line">
            {topMatches.map((job) => (
              <JobCard key={job.id} job={job} variant="b" />
            ))}
          </div>

          <h2 className="mb-1 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-3">
            Active applications
          </h2>
          <div className="border-y border-line">
            {active.map((app) => (
              <ApplicationRow key={app.id} app={app} dense />
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-md border border-line p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Profile</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono tnum text-2xl font-bold text-ink">
                {candidate.profileCompletion}%
              </span>
              <span className="text-xs text-ink-3">complete</span>
            </div>
            <Progress value={candidate.profileCompletion} className="mt-2" />
            <p className="mt-2 text-xs text-ink-2">{candidate.nextBestAction.label}</p>
            <Button size="xs" variant="secondary" className="mt-2 w-full" asChild>
              <Link to="/candidate/profile">Edit profile</Link>
            </Button>
          </div>

          <div className="rounded-md border border-line p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Funnel</p>
            <HBarChart
              data={funnel.map((f, i) => ({
                label: f.label,
                value: f.count,
                tone: (['indigo', 'sky', 'teal', 'violet'] as Tone[])[i],
              }))}
              labelWidth="w-20"
            />
          </div>

          <div className="rounded-md border border-line p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Upcoming</p>
            <UpcomingInterviews upcoming={upcoming} />
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ══════════════════ C · story rails (unchanged) ══════════════════ */

function DashC({ topMatches, active, upcoming }: Data) {
  const profile = useProfileStore()
  const name = profile.data.name || candidate.name
  const firstName = name.split(' ')[0]
  const hero = topMatches[0]
  return (
    <div className="pb-10">
      <div className="mx-auto max-w-[1200px] px-4 pt-10 sm:px-6">
        <p className="text-sm font-medium text-brand-600">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="font-display tracking-tight mt-1 text-display-2 font-semibold text-ink">
          Morning, {firstName}.
        </h1>
        <p className="mt-3 text-lg text-ink-2">One role stood out for you today.</p>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <div className="overflow-hidden rounded-v bg-paper shadow-xl">
          <div className="grid gap-8 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-600">
                Match of the day
              </p>
              <h2 className="font-display tracking-tight mt-2 text-3xl font-semibold leading-tight text-ink">
                {hero.title}
              </h2>
              <p className="mt-2 text-ink-2">
                {hero.location} · {hero.department}
              </p>
              <p className="mt-4 flex items-start gap-2 text-sm text-accent-700">
                <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
                {hero.recommendationReason}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to={`/jobs/${hero.id}`}>
                    View and apply
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary">
                  Save for later
                </Button>
              </div>
            </div>
            <ScoreRing score={hero.matchScore!} size="xl" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6">
        <div className="rounded-v bg-paper p-8 shadow-lg">
          <ProfileStrength size="lg" />
        </div>
      </div>

      <Rail title="More matches for you" href="/candidate/jobs">
        {topMatches.map((job) => (
          <div key={job.id} className="w-[340px] shrink-0">
            <JobCard job={job} variant="c" showReason />
          </div>
        ))}
      </Rail>

      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2">
        <div className="rounded-v bg-paper p-6 shadow-lg">
          <SectionHeading
            title="Where you stand"
            action={{ label: 'All applications', to: '/candidate/applications' }}
          />
          <div className="space-y-1">
            {active.map((app) => (
              <ApplicationRow key={app.id} app={app} />
            ))}
          </div>
        </div>

        <div className="rounded-v bg-paper p-6 shadow-lg">
          <SectionHeading
            title="Coming up"
            action={{ label: 'Calendar', to: '/candidate/interviews' }}
          />
          <UpcomingInterviews upcoming={upcoming} />
        </div>
      </div>
    </div>
  )
}

function Rail({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="py-6">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 pb-4 sm:px-6">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <Link
          to={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          See all
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 pb-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  )
}
