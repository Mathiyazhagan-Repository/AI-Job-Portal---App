import * as React from 'react'
import { Link } from 'react-router'
import {
  ArrowRight, AlertTriangle, Users, CalendarClock, Timer, Briefcase, Sparkles,
  TrendingUp, Target, Clock3, UserCheck, Trophy, Eye, FileText, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { recruiterKpis, applicants, type Job } from '@/data/mock'
import { relativeTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { ScoreBadge, StagePill } from '@/components/brand'
import {
  StatTile, SectionHeading, FunnelChart, Sparkline, Kbd,
  StatCard, MiniStat, AreaChart, BarChart, HBarChart, DonutChart, RadialGauge, StackedBar,
  TONE_CLASS, type Tone,
} from '@/components/common'
import { Avatar } from '@/components/ui/controls'
import { useAuth } from '@/store/auth'

const TREND = [12, 18, 14, 22, 26, 21, 30, 28, 34, 31, 38, 42]

/* ── Direction A colour data ───────────────────────────────────────── */

const WEEK_LABELS = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8']

const INFLOW = [
  { label: 'Applications', tone: 'indigo' as Tone, points: [148, 172, 161, 205, 238, 219, 274, 312] },
  { label: 'Shortlisted', tone: 'emerald' as Tone, points: [38, 44, 41, 55, 61, 58, 72, 84] },
  { label: 'Interviewed', tone: 'fuchsia' as Tone, points: [11, 14, 12, 18, 21, 19, 24, 28] },
]

const SOURCES = [
  { label: 'Kairo search', value: 42, tone: 'indigo' as Tone },
  { label: 'Job alerts', value: 24, tone: 'amber' as Tone },
  { label: 'Referrals', value: 16, tone: 'emerald' as Tone },
  { label: 'Careers page', value: 11, tone: 'sky' as Tone },
  { label: 'Sourced', value: 7, tone: 'fuchsia' as Tone },
]

const TIME_IN_STAGE = [
  { label: 'Screening', value: 1.4, tone: 'sky' as Tone, hint: 'target 2.0d' },
  { label: 'Assessment', value: 3.1, tone: 'violet' as Tone, hint: 'target 3.0d' },
  { label: 'Interview', value: 4.8, tone: 'fuchsia' as Tone, hint: 'target 4.0d' },
  { label: 'Feedback', value: 2.6, tone: 'amber' as Tone, hint: 'target 1.0d' },
  { label: 'Offer', value: 1.9, tone: 'emerald' as Tone, hint: 'target 2.0d' },
]

const OPEN_MIX = [
  { label: 'Engineering', value: 6, tone: 'indigo' as Tone },
  { label: 'Data', value: 3, tone: 'violet' as Tone },
  { label: 'Design', value: 2, tone: 'fuchsia' as Tone },
  { label: 'Sales', value: 2, tone: 'amber' as Tone },
  { label: 'Ops', value: 1, tone: 'teal' as Tone },
]

type DashboardRow = {
  active_jobs: number
  active_jobs_delta: number
  applicants_this_week: number
  applicants_delta: number
  time_to_shortlist_days: number
  shortlist_delta_days: number
  interviews_scheduled: number
  interviews_delta: number
  interview_to_offer_percent: number
  interview_to_offer_delta: number
  hires_this_quarter: number
  hires_quarter_goal: number
  hires_goal_delta: number
}

const EMPTY_DASHBOARD: DashboardRow = {
  active_jobs: 0,
  active_jobs_delta: 0,
  applicants_this_week: 0,
  applicants_delta: 0,
  time_to_shortlist_days: 0,
  shortlist_delta_days: 0,
  interviews_scheduled: 0,
  interviews_delta: 0,
  interview_to_offer_percent: 0,
  interview_to_offer_delta: 0,
  hires_this_quarter: 0,
  hires_quarter_goal: 0,
  hires_goal_delta: 0,
}

function dashboardKpis(row: DashboardRow) {
  const goalProgress = row.hires_quarter_goal
    ? Math.min(100, Math.round((row.hires_this_quarter / row.hires_quarter_goal) * 100))
    : 0
  return [
    { tone: 'indigo' as Tone, icon: Briefcase, label: 'Active jobs', value: row.active_jobs,
      badge: { text: `${row.active_jobs_delta >= 0 ? '+' : ''}${row.active_jobs_delta}`, direction: row.active_jobs_delta >= 0 ? 'up' as const : 'down' as const }, caption: 'Current published roles', to: '/recruiter/jobs' },
    { tone: 'sky' as Tone, icon: Users, label: 'Applicants this week', value: row.applicants_this_week,
      badge: { text: `${row.applicants_delta >= 0 ? '+' : ''}${row.applicants_delta}`, direction: row.applicants_delta >= 0 ? 'up' as const : 'down' as const }, caption: 'Compared with last week', to: '/recruiter/jobs/j1/applicants' },
    { tone: 'emerald' as Tone, icon: Timer, label: 'Time to shortlist', value: `${row.time_to_shortlist_days}d`,
      badge: { text: `${row.shortlist_delta_days >= 0 ? '+' : ''}${row.shortlist_delta_days}d`, direction: row.shortlist_delta_days <= 0 ? 'down' as const : 'up' as const }, progress: row.time_to_shortlist_days ? 78 : 0, caption: 'Average time' },
    { tone: 'fuchsia' as Tone, icon: CalendarClock, label: 'Interviews scheduled', value: row.interviews_scheduled,
      badge: { text: `${row.interviews_delta >= 0 ? '+' : ''}${row.interviews_delta}`, direction: row.interviews_delta >= 0 ? 'up' as const : 'down' as const }, caption: 'Scheduled interviews', to: '/recruiter/interviews' },
    { tone: 'amber' as Tone, icon: Target, label: 'Interview → offer', value: `${row.interview_to_offer_percent}%`,
      badge: { text: `${row.interview_to_offer_delta >= 0 ? '+' : ''}${row.interview_to_offer_delta}pp`, direction: row.interview_to_offer_delta >= 0 ? 'up' as const : 'down' as const }, progress: row.interview_to_offer_percent, caption: 'Conversion rate' },
    { tone: 'violet' as Tone, icon: Trophy, label: 'Hires this quarter', value: row.hires_this_quarter,
      badge: { text: `goal ${row.hires_quarter_goal}`, direction: 'flat' as const }, progress: goalProgress, caption: `${goalProgress}% of target` },
  ]
}

const INTERVIEWS_WEEK = [
  { label: 'Mon', value: 3, tone: 'indigo' as Tone },
  { label: 'Tue', value: 5, tone: 'violet' as Tone },
  { label: 'Wed', value: 2, tone: 'fuchsia' as Tone },
  { label: 'Thu', value: 6, tone: 'sky' as Tone },
  { label: 'Fri', value: 4, tone: 'teal' as Tone },
]

function useRecruiterDashboard() {
  const { token } = useAuth()
  const [dashboard, setDashboard] = React.useState<DashboardRow>(EMPTY_DASHBOARD)
  const [activeJobs, setActiveJobs] = React.useState<Job[]>([])
  const [activity, setActivity] = React.useState([
    { tone: 'sky' as Tone, icon: Eye, label: 'Job views', value: 0 },
    { tone: 'indigo' as Tone, icon: FileText, label: 'Resumes parsed', value: 0 },
    { tone: 'emerald' as Tone, icon: UserCheck, label: 'Profiles unlocked', value: 0 },
    { tone: 'amber' as Tone, icon: Clock3, label: 'Feedback overdue', value: 0 },
    { tone: 'fuchsia' as Tone, icon: Zap, label: 'AI screens run', value: 0 },
    { tone: 'rose' as Tone, icon: AlertTriangle, label: 'Jobs expiring', value: 0 },
  ])

  React.useEffect(() => {
    let active = true
    void (async () => {
      try {
        if (!token) return
        
        const res = await fetch('http://localhost:8000/api/analytics/recruiter', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        
        if (!active) return
        const dashboardRow = data.dashboard ? { ...EMPTY_DASHBOARD, ...data.dashboard } : EMPTY_DASHBOARD
        const liveJobs = data.activeJobs ?? []
        const applications = data.applications ?? []
        const activeJobsCount = dashboardRow.active_jobs
        const applicantsCount = dashboardRow.applicants_this_week
        
        const activityData = data.activity ?? [
          { tone: 'sky', icon: 'Eye', label: 'Job views', value: 0 },
          { tone: 'indigo', icon: 'FileText', label: 'Resumes parsed', value: 0 },
          { tone: 'emerald', icon: 'UserCheck', label: 'Profiles unlocked', value: 0 },
          { tone: 'amber', icon: 'Clock3', label: 'Feedback overdue', value: 0 },
          { tone: 'fuchsia', icon: 'Zap', label: 'AI screens run', value: 0 },
          { tone: 'rose', icon: 'AlertTriangle', label: 'Jobs expiring', value: 0 },
        ]
        const ICONS: Record<string, any> = { Eye, FileText, UserCheck, Clock3, Zap, AlertTriangle }
        
        setActivity(activityData.map((item: any) => ({
          ...item,
          icon: typeof item.icon === 'string' ? (ICONS[item.icon] || Eye) : item.icon
        })))
        const activeJobRows = liveJobs
          .filter((job) => job.status === 'published')
          .map((job) => ({
            id: job.id,
            title: job.title,
            companyId: job.company_id,
            location: job.location,
            workMode: job.work_mode,
            jobType: job.job_type,
            experienceMin: job.experience_min,
            experienceMax: job.experience_max,
            salaryMin: job.salary_min,
            salaryMax: job.salary_max,
            salaryVisible: job.salary_visible,
            requiredSkills: job.required_skills ?? [],
            preferredSkills: job.preferred_skills ?? [],
            postedAt: job.created_at,
            applicants: job.applicants ?? 0,
            views: job.views ?? 0,
            status: job.status,
            department: job.department ?? '',
            openings: job.openings ?? 1,
            deadline: job.deadline ?? job.created_at,
            description: job.description ?? '',
            responsibilities: job.responsibilities ?? [],
            qualifications: job.qualifications ?? [],
            benefits: job.benefits ?? [],
          })) as Job[]
        setDashboard({
          ...dashboardRow,
        })
        setActiveJobs(activeJobRows.slice(0, 4))
      } catch {
        // Keep the zero-valued dashboard.
      }
    })()
    return () => { active = false }
  }, [token])

  const topApplicants = [...applicants].sort((a, b) => b.score - a.score).slice(0, 5)
  const needsAttention = recruiterKpis.needsAttention.map((item, index) =>
    index === 0
      ? {
          ...item,
          label: `${dashboard.applicants_this_week} applicants`,
          detail: 'Across your published jobs',
        }
      : item,
  )
  const kpiCards = dashboardKpis(dashboard)
  const stats = recruiterKpis.stats.map((stat, index) => {
    const values = [dashboard.active_jobs, dashboard.applicants_this_week, `${dashboard.time_to_shortlist_days} days`, `${dashboard.interview_to_offer_percent}%`]
    const deltas = [dashboard.active_jobs_delta, dashboard.applicants_delta, dashboard.shortlist_delta_days, dashboard.interview_to_offer_delta]
    return { ...stat, value: values[index], delta: deltas[index] }
  })
  return { ...recruiterKpis, needsAttention, stats, kpiCards, activeJobs, topApplicants, activity }
}
type Data = ReturnType<typeof useRecruiterDashboard>

export function Component() {
  const variant = useVariant()
  const data = useRecruiterDashboard()
  const Views = { a: DashA, b: DashB, c: DashC }
  const View = Views[variant] ?? DashA
  return <View {...data} />
}
Component.displayName = 'RecruiterDashboard'

/* ══════════════════ shared ══════════════════ */

const TONE = {
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  danger: 'bg-danger-bg text-danger border-danger/20',
  warning: 'bg-warning-bg text-warning border-warning/20',
  accent: 'bg-accent-50 text-accent-700 border-accent-200',
}

function AttentionList({ items, dense }: { items: Data['needsAttention']; dense?: boolean }) {
  return (
    <ul className={cn('grid gap-2', !dense && 'sm:grid-cols-2')}>
      {items.map((it) => (
        <li key={it.id}>
          <Link
            to={it.href}
            className={cn(
              'flex items-center gap-3 rounded-v-control border transition-transform hover:-translate-y-px',
              TONE[it.tone],
              dense ? 'px-2.5 py-1.5' : 'p-3',
            )}
          >
            <span className="min-w-0 flex-1">
              <span className={cn('block truncate font-semibold', dense ? 'text-sm' : '')}>
                {it.label}
              </span>
              <span className="block truncate text-xs opacity-80">{it.detail}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 opacity-60" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ActiveJobsTable({ jobs: list, dense }: { jobs: Data['activeJobs']; dense?: boolean }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line text-left">
          <th scope="col" className="pb-2 font-medium text-ink-3">Job</th>
          <th scope="col" className="pb-2 text-right font-medium text-ink-3">Applicants</th>
          <th scope="col" className="hidden pb-2 text-right font-medium text-ink-3 sm:table-cell">Views</th>
          <th scope="col" className="pb-2 text-right font-medium text-ink-3">Posted</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {list.map((j) => (
          <tr key={j.id} className="hover:bg-hover">
            <td className={dense ? 'py-1.5' : 'py-2.5'}>
              <Link to={`/recruiter/jobs/${j.id}/applicants`} className="font-medium text-ink hover:text-brand-700">
                {j.title}
              </Link>
              <span className="block text-xs text-ink-3">{j.location}</span>
            </td>
            <td className="text-right font-mono tnum">
              {j.applicants}
              <span className="ml-1 rounded-full bg-brand-50 px-1.5 text-[10px] font-semibold text-brand-700">
                +12
              </span>
            </td>
            <td className="hidden text-right font-mono tnum text-ink-3 sm:table-cell">{j.views}</td>
            <td className="text-right text-xs text-ink-3">{relativeTime(j.postedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TopApplicants({ list, dense }: { list: Data['topApplicants']; dense?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {list.map((a) => (
        <li key={a.id}>
          <Link
            to="/recruiter/jobs/j1/applicants"
            className={cn('flex items-center gap-3 hover:bg-hover', dense ? 'py-1.5' : 'py-2.5')}
          >
            {!dense && <Avatar name={a.name} id={a.id} size="sm" />}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{a.name}</span>
              <span className="block truncate text-xs text-ink-3">{a.headline}</span>
            </span>
            <StagePill stage={a.stage} size="sm" />
            <ScoreBadge score={a.score} meetsHardRequirements={a.meetsHardRequirements} size="sm" />
          </Link>
        </li>
      ))}
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

/* ══════════════════ A · bento ══════════════════ */

function AttentionRowA({ item, tone }: { item: Data['needsAttention'][number]; tone: Tone }) {
  const t = TONE_CLASS[tone]
  return (
    <Link
      to={item.href}
      className="group relative flex items-center gap-3 overflow-hidden rounded-v border border-line bg-paper px-3 py-2.5 transition-v hover-lift"
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', t.rail)} aria-hidden />
      <span className={cn('ml-1 grid size-9 shrink-0 place-items-center rounded-lg', t.bg, t.text)} aria-hidden>
        <AlertTriangle className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{item.label}</span>
        <span className="block truncate text-xs text-ink-3">{item.detail}</span>
      </span>
      <ArrowRight
        className={cn('size-4 shrink-0 transition-transform group-hover:translate-x-0.5', t.text)}
        aria-hidden
      />
    </Link>
  )
}

const ATTENTION_TONES: Tone[] = ['indigo', 'rose', 'fuchsia', 'amber']

function DashA({ needsAttention, funnel, activeJobs, topApplicants, kpiCards, activity }: Data) {
  const activeJobsCount = kpiCards[0]?.value ?? 0
  const applicantsCount = kpiCards[1]?.value ?? 0
  const totalOpen = OPEN_MIX.reduce((n, d) => n + d.value, 0)

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* ── greeting band: colour lands before anything else on the page ── */}
      <header className="relative mb-5 overflow-hidden rounded-v border border-line p-5 sm:p-6">
        <span
          className="absolute inset-0 bg-gradient-to-br from-[var(--color-tone-indigo-bg)] via-[var(--color-tone-violet-bg)] to-[var(--color-tone-sky-bg)]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-[var(--color-tone-fuchsia-vivid)] opacity-15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/80 px-2.5 py-1 text-xs font-medium text-tone-indigo ring-1 ring-[var(--color-tone-indigo)]/20">
              <Sparkles className="size-3.5" aria-hidden />
              {activeJobsCount} active jobs · {applicantsCount} applicants this week
            </span>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
              Recruiting at Northwind
            </h1>
            <p className="mt-1 max-w-xl text-sm text-ink-2">
              Four things need a human decision today. Everything below is ranked, never decided, by the
              model — you stay the one who moves people forward.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link to="/recruiter/jobs/new">Create a job</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/recruiter/candidates">Search candidates</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── KPI row ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* attention queue */}
        <Tile className="lg:col-span-5">
          <SectionHeading title="Needs your attention" icon={AlertTriangle} tone="rose" />
          <div className="grid gap-2">
            {needsAttention.map((it, i) => (
              <AttentionRowA key={it.id} item={it} tone={ATTENTION_TONES[i % ATTENTION_TONES.length]} />
            ))}
          </div>
        </Tile>

        {/* inflow trend */}
        <Tile className="lg:col-span-7">
          <SectionHeading
            title="Pipeline inflow · last 8 weeks"
            icon={TrendingUp}
            tone="indigo"
            action={{ label: 'Analytics', to: '/recruiter/analytics' }}
          />
          <AreaChart series={INFLOW} labels={WEEK_LABELS} height={220} />
        </Tile>

        {/* funnel */}
        <Tile className="lg:col-span-4">
          <SectionHeading title="Stage funnel" icon={Target} tone="violet" />
          <FunnelChart data={funnel} />
        </Tile>

        {/* where applicants come from */}
        <Tile className="lg:col-span-4">
          <SectionHeading title="Where applicants come from" icon={Users} tone="sky" />
          <div className="flex items-center justify-center py-2">
            <DonutChart data={SOURCES} size={148} centerLabel="applicants" centerValue="312" />
          </div>
        </Tile>

        {/* days in each stage */}
        <Tile className="lg:col-span-4">
          <SectionHeading title="Days spent in each stage" icon={Clock3} tone="amber" />
          <HBarChart data={TIME_IN_STAGE} labelWidth="w-24" suffix="d" />
          <p className="mt-3 rounded-v-control bg-[var(--color-tone-amber-bg)] px-3 py-2 text-xs leading-relaxed text-tone-amber">
            Interview feedback is the slow step — 2.6 days against a 1-day target. Three overdue
            feedbacks are holding up three pipeline moves.
          </p>
        </Tile>

        {/* open roles mix */}
        <Tile className="lg:col-span-5">
          <SectionHeading title="Open roles by team" icon={Briefcase} tone="teal" />
          <div className="flex items-baseline gap-2">
            <span className="font-mono tnum text-3xl font-semibold text-ink">{totalOpen}</span>
            <span className="text-sm text-ink-3">roles open across 5 teams</span>
          </div>
          <StackedBar data={OPEN_MIX} height={12} className="mt-3" />
          <div className="mt-4 border-t border-line pt-3">
            <BarChart data={OPEN_MIX} height={132} />
          </div>
        </Tile>

        {/* interviews booked this week */}
        <Tile className="lg:col-span-4">
          <SectionHeading title="Interviews booked this week" icon={CalendarClock} tone="fuchsia" />
          <BarChart data={INTERVIEWS_WEEK} height={168} />
          <p className="mt-3 text-xs leading-relaxed text-ink-3">
            Thursday is the heaviest day. Two panels overlap at 15:30 — both need a second interviewer.
          </p>
        </Tile>

        {/* offer acceptance gauge */}
        <Tile className="lg:col-span-3">
          <SectionHeading title="Offer acceptance" icon={Trophy} tone="emerald" />
          <div className="flex flex-col items-center justify-center py-1">
            <RadialGauge value={82} tone="emerald" size={132} label="82%" sublabel="9 of 11 accepted" />
            <p className="mt-3 text-center text-xs leading-relaxed text-ink-2">
              Two declines both cited compensation. Salary bands are visible on every posting.
            </p>
          </div>
        </Tile>

        {/* active jobs */}
        <Tile className="lg:col-span-7">
          <SectionHeading
            title="Active jobs"
            icon={Briefcase}
            tone="indigo"
            action={{ label: 'All jobs', to: '/recruiter/jobs' }}
          />
          <ActiveJobsTable jobs={activeJobs} />
        </Tile>

        {/* top applicants */}
        <Tile className="lg:col-span-5">
          <SectionHeading
            title="Top-ranked applicants"
            icon={UserCheck}
            tone="fuchsia"
            action={{ label: 'Triage', to: '/recruiter/jobs/j1/applicants' }}
          />
          <TopApplicants list={topApplicants} />
        </Tile>

        {/* activity strip — fills the last row rather than leaving dead space */}
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-3 xl:grid-cols-6">
          {activity.map((m) => (
            <MiniStat key={m.label} {...m} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════ B · task inbox ══════════════════ */

function DashB({ needsAttention, funnel, stats, activeJobs, topApplicants }: Data) {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <h1 className="text-base font-semibold text-ink">Recruiting · Northwind Labs</h1>
        <div className="flex items-center gap-2">
          <p className="flex items-center gap-1 text-xs text-ink-3">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </p>
          <Button size="xs" asChild>
            <Link to="/recruiter/jobs/new">New job</Link>
          </Button>
        </div>
      </div>

      {/* compact stat strip */}
      <div className="grid grid-cols-2 divide-x divide-line border-b border-line py-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="px-3 first:pl-0">
            <p className="text-[11px] uppercase tracking-wide text-ink-3">{s.label}</p>
            <p className="font-mono tnum text-lg font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 py-3 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          <section>
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Needs action
            </h2>
            <AttentionList items={needsAttention} dense />
          </section>

          <section>
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Active jobs
            </h2>
            <ActiveJobsTable jobs={activeJobs} dense />
          </section>

          <section>
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Top-ranked applicants
            </h2>
            <TopApplicants list={topApplicants} dense />
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-md border border-line p-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Funnel</h2>
            <FunnelChart data={funnel} />
          </div>
          <div className="rounded-md border border-line p-3">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Applicants / week
            </h2>
            <Sparkline values={TREND} />
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ══════════════════ C · funnel-first ══════════════════ */

function DashC({ needsAttention, funnel, stats, topApplicants }: Data) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <p className="text-sm font-medium text-brand-600">Northwind Labs</p>
      <h1 className="font-display tracking-tight mt-1 text-display-2 font-semibold text-ink">
        Four people are waiting on you.
      </h1>

      <div className="mt-8 rounded-v bg-paper p-8 shadow-xl">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-3">
          Hiring funnel · all open roles
        </h2>
        <div className="mt-5">
          <FunnelChart data={funnel} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} size="lg" />
        ))}
      </div>

      <h2 className="font-display tracking-tight mt-12 text-2xl font-semibold text-ink">Needs your attention</h2>
      <div className="mt-4">
        <AttentionList items={needsAttention} />
      </div>

      <div className="mt-10 rounded-v bg-paper p-8 shadow-lg">
        <SectionHeading
          title="Top-ranked applicants"
          action={{ label: 'Open triage', to: '/recruiter/jobs/j1/applicants' }}
        />
        <TopApplicants list={topApplicants} />
      </div>
    </div>
  )
}
