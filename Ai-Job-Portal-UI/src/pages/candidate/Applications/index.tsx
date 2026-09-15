import * as React from 'react'
import { Link } from 'react-router'
import {
  LayoutGrid, List as ListIcon, MessageSquareWarning, FileText,
  Send, Activity, CalendarCheck, MessageSquare, Clock3, XCircle, TrendingUp, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { jobById, companyById, type Application } from '@/data/mock'
import { useApplicationStore } from '@/store/applications'
import { ACTIVE_STAGES, STAGES, type Stage } from '@/lib/pipeline'
import { shortDate, relativeTime } from '@/lib/format'
import { StageRail, StagePill } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/controls'
import { CompanyMark } from '@/features/jobs/JobCard'
import {
  EmptyState, PageHeader, SectionHeading,
  StatCard, AreaChart, HBarChart, StackedBar, type Tone,
} from '@/components/common'

export function Component() {
  const variant = useVariant()
  const Views = { a: AppsA, b: AppsB, c: AppsC }
  const View = Views[variant] ?? AppsA
  return <View />
}
Component.displayName = 'ApplicationsPage'

/* ══════════════════ shared ══════════════════ */

function AppTimeline({ app }: { app: Application }) {
  return (
    <ol className="relative space-y-3 border-l border-line pl-4">
      {app.history.map((h, i) => {
        const last = i === app.history.length - 1
        return (
          <li key={`${h.stage}-${h.at}`} className="relative">
            <span
              className={cn(
                'absolute -left-[21px] top-1 size-2.5 rounded-full ring-4 ring-paper',
                last ? 'bg-brand-600' : 'bg-line-strong',
              )}
              aria-hidden
            />
            <p className="text-sm font-medium text-ink">{STAGES[h.stage].label}</p>
            <p className="text-xs text-ink-3">
              {shortDate(h.at)} · {h.by}
            </p>
            {h.note && <p className="mt-0.5 text-xs italic text-ink-2">“{h.note}”</p>}
          </li>
        )
      })}
    </ol>
  )
}

function RejectedNotice() {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-v-control bg-subtle p-3">
      <MessageSquareWarning className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
      <p className="text-xs leading-relaxed text-ink-2">
        You were not moved forward. If you believe the screening was wrong, you can{' '}
        <Link to="/candidate/settings" className="font-medium text-brand-600 hover:underline">
          appeal via support
        </Link>{' '}
        — a person reviews every appeal.
      </p>
    </div>
  )
}

/* ══════════════════ A · board ⇄ table toggle ══════════════════ */

/* ── Direction A colour summary ─────────────────────────────────────
   The list below answers "what happened"; this strip answers "how am I
   doing", which is the question people actually open this page with. */

const APP_TONES: Tone[] = ['indigo', 'sky', 'violet', 'fuchsia', 'amber', 'emerald', 'teal', 'rose']

const RESPONSE_TREND = [
  { label: 'Applications sent', tone: 'indigo' as Tone, points: [2, 3, 1, 4, 3, 5, 4, 6] },
  { label: 'Replies received', tone: 'emerald' as Tone, points: [0, 1, 1, 2, 1, 3, 2, 4] },
]
const RESPONSE_LABELS = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8']

function ApplicationsSummaryA() {
  const { applications } = useApplicationStore()
  const active = applications.filter((a) => !STAGES[a.stage].terminal)
  const interviewing = applications.filter((a) => a.stage === 'interview' || a.stage === 'offer')
  const rejected = applications.filter((a) => a.stage === 'rejected')
  const responded = applications.filter((a) => a.stage !== 'applied')
  const responseRate = Math.round((responded.length / Math.max(applications.length, 1)) * 100)

  // one bar per stage that actually has applications in it
  const stageMix = ACTIVE_STAGES.map((st, i) => ({
    label: STAGES[st].label,
    value: applications.filter((a) => a.stage === st).length,
    tone: APP_TONES[i % APP_TONES.length],
  })).filter((d) => d.value > 0)

  const waiting = applications
    .filter((a) => !STAGES[a.stage].terminal)
    .map((a, i) => ({
      label: jobById(a.jobId)!.title,
      value: Math.max(1, Math.round((Date.now() - +new Date(a.lastUpdate)) / 86400000)),
      tone: APP_TONES[i % APP_TONES.length],
      hint: STAGES[a.stage].label,
    }))
    .sort((x, y) => y.value - x.value)

  const cards = [
    { tone: 'indigo' as Tone, icon: Send, label: 'Applications sent', value: applications.length,
      badge: { text: '+4', direction: 'up' as const }, caption: 'last 30 days' },
    { tone: 'sky' as Tone, icon: Activity, label: 'Still active', value: active.length,
      caption: 'awaiting a decision' },
    { tone: 'fuchsia' as Tone, icon: CalendarCheck, label: 'At interview or offer', value: interviewing.length,
      caption: 'furthest you have got' },
    { tone: 'emerald' as Tone, icon: MessageSquare, label: 'Response rate', value: `${responseRate}%`,
      progress: responseRate, caption: `${responded.length} of ${applications.length} heard back` },
    { tone: 'amber' as Tone, icon: Clock3, label: 'Median reply time', value: '6d',
      badge: { text: '-2d', direction: 'down' as const }, caption: 'faster than last month' },
    { tone: 'rose' as Tone, icon: XCircle, label: 'Closed out', value: rejected.length,
      caption: 'every one has a reason' },
  ]

  return (
    <section className="mt-5" aria-label="Application summary">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="rounded-v border border-line bg-paper p-v-card shadow-v-card lg:col-span-7">
          <SectionHeading title="Sent vs. heard back · last 8 weeks" icon={TrendingUp} tone="indigo" />
          <AreaChart series={RESPONSE_TREND} labels={RESPONSE_LABELS} height={190} />
        </div>

        <div className="rounded-v border border-line bg-paper p-v-card shadow-v-card lg:col-span-5">
          <SectionHeading title="Where your applications sit" icon={Layers} tone="violet" />
          <StackedBar data={stageMix} height={12} />
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
              How long each one has been waiting
            </p>
            <HBarChart data={waiting} labelWidth="w-32" suffix="d" />
          </div>
          <p className="mt-3 rounded-v-control bg-[var(--color-tone-violet-bg)] px-3 py-2 text-xs leading-relaxed text-tone-violet">
            Stages only ever move forward when a person at the company acts. Nothing here is decided by
            a model.
          </p>
        </div>
      </div>
    </section>
  )
}


function AppsA() {
  const { applications } = useApplicationStore()
  const [view, setView] = React.useState<'board' | 'list'>('list')

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={FileText}
        tone="violet"
        title="Your applications"
        description={`${applications.length} applications · ${applications.filter((a) => !STAGES[a.stage].terminal).length} still active`}
        actions={
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList>
              <TabsTrigger value="list">
                <ListIcon className="size-4" /> List
              </TabsTrigger>
              <TabsTrigger value="board">
                <LayoutGrid className="size-4" /> Board
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <ApplicationsSummaryA />

      {view === 'list' ? (
        <ul className="mt-6 space-y-3">
          {applications.map((app) => {
            const job = jobById(app.jobId)!
            const company = companyById(job.companyId)
            return (
              <li
                key={app.id}
                className="rounded-v border border-line bg-paper p-v-card shadow-v-card"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <CompanyMark company={company} size={40} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-ink">{job.title}</h3>
                    <p className="text-sm text-ink-2">
                      {company.name} · {job.location}
                    </p>
                    <p className="mt-1 text-xs text-ink-3">
                      Applied {shortDate(app.appliedAt)} · updated {relativeTime(app.lastUpdate)}
                    </p>
                    <div className="mt-3">
                      <StageRail stage={app.stage} showLabel />
                    </div>
                    {app.stage === 'rejected' && <RejectedNotice />}
                  </div>
                  <div className="shrink-0 space-y-2 text-right">
                    <StagePill stage={app.stage} />
                    <Button size="sm" variant="secondary" className="w-full">
                      View detail
                    </Button>
                  </div>
                </div>

                <details className="mt-4 border-t border-line pt-3">
                  <summary className="cursor-pointer text-sm font-medium text-brand-600">
                    Stage history ({app.history.length} events)
                  </summary>
                  <div className="mt-3">
                    <AppTimeline app={app} />
                  </div>
                </details>
              </li>
            )
          })}
        </ul>
      ) : (
        <BoardView />
      )}
    </div>
  )
}

function BoardView() {
  const { applications } = useApplicationStore()
  return (
    <div className="mt-6 flex gap-3 overflow-x-auto pb-4">
      {ACTIVE_STAGES.map((stage) => {
        const inStage = applications.filter((a) => a.stage === stage)
        const meta = STAGES[stage]
        return (
          <div key={stage} className="w-64 shrink-0">
            <div className={cn('mb-2 flex items-center justify-between rounded-v-control px-2.5 py-1.5', meta.bg)}>
              <span className={cn('text-xs font-semibold', meta.text)}>{meta.label}</span>
              <span className={cn('font-mono tnum text-xs', meta.text)}>{inStage.length}</span>
            </div>
            <div className="space-y-2">
              {inStage.map((app) => {
                const job = jobById(app.jobId)!
                return (
                  <div key={app.id} className="rounded-v border border-line bg-paper p-3">
                    <p className="text-sm font-medium text-ink">{job.title}</p>
                    <p className="text-xs text-ink-3">{companyById(job.companyId).name}</p>
                    <p className="mt-2 text-[11px] text-ink-3">{relativeTime(app.lastUpdate)}</p>
                  </div>
                )
              })}
              {inStage.length === 0 && (
                <div className="rounded-v border border-dashed border-line py-6 text-center text-xs text-ink-3">
                  None
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════ B · dense table only ══════════════════ */

function AppsB() {
  const { applications } = useApplicationStore()
  const [openId, setOpenId] = React.useState<string | null>(null)

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <h1 className="text-base font-semibold text-ink">Applications</h1>
        <p className="font-mono text-xs text-ink-3">
          {applications.filter((a) => !STAGES[a.stage].terminal).length} active /{' '}
          {applications.length} total
        </p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-3">
            <th scope="col" className="py-2 font-medium">Role</th>
            <th scope="col" className="py-2 font-medium">Company</th>
            <th scope="col" className="hidden py-2 font-medium md:table-cell">Progress</th>
            <th scope="col" className="py-2 font-medium">Stage</th>
            <th scope="col" className="py-2 text-right font-medium">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {applications.map((app) => {
            const job = jobById(app.jobId)!
            const open = openId === app.id
            return (
              <React.Fragment key={app.id}>
                <tr
                  className={cn('cursor-pointer', open ? 'bg-brand-50' : 'hover:bg-hover')}
                  onClick={() => setOpenId(open ? null : app.id)}
                >
                  <td className="py-1.5 font-medium text-ink">{job.title}</td>
                  <td className="py-1.5 text-ink-2">{companyById(job.companyId).name}</td>
                  <td className="hidden py-1.5 md:table-cell">
                    <StageRail stage={app.stage} size="sm" />
                  </td>
                  <td className="py-1.5">
                    <StagePill stage={app.stage} size="sm" />
                  </td>
                  <td className="py-1.5 text-right font-mono text-xs text-ink-3">
                    {relativeTime(app.lastUpdate)}
                  </td>
                </tr>
                {open && (
                  <tr>
                    <td colSpan={5} className="bg-canvas px-3 py-3">
                      <AppTimeline app={app} />
                      {app.stage === 'rejected' && <RejectedNotice />}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ══════════════════ C · journey lanes ══════════════════ */

function AppsC() {
  const { applications } = useApplicationStore()
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">Where you stand</h1>
      <p className="mt-3 text-lg text-ink-2">
        Every application, and exactly how far it has travelled.
      </p>

      <div className="mt-10 space-y-6">
        {applications.map((app) => {
          const job = jobById(app.jobId)!
          const company = companyById(job.companyId)
          const idx = ACTIVE_STAGES.indexOf(app.stage)
          const pct = STAGES[app.stage].terminal ? 100 : ((idx + 1) / ACTIVE_STAGES.length) * 100
          const terminal = STAGES[app.stage].terminal

          return (
            <div key={app.id} className="rounded-v bg-paper p-6 shadow-lg sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <CompanyMark company={company} size={52} />
                  <div className="min-w-0">
                    <h2 className="font-display tracking-tight text-xl font-semibold text-ink">{job.title}</h2>
                    <p className="text-ink-2">{company.name}</p>
                  </div>
                </div>
                <StagePill stage={app.stage} />
              </div>

              {/* the journey track */}
              <div className="mt-8">
                <div className="relative h-2 rounded-full bg-subtle">
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000 ease-[var(--ease-out-soft)]',
                      terminal ? 'bg-line-strong' : 'bg-signal',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                  {!terminal && (
                    <span
                      className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-600 bg-white shadow-md"
                      style={{ left: `${pct}%` }}
                      aria-hidden
                    />
                  )}
                </div>
                <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wide text-ink-3">
                  {['Applied', 'Screen', 'Short', 'Assess', 'Interview', 'Tech', 'HR', 'Offer', 'Hired'].map(
                    (s, i) => (
                      <span key={s} className={cn(i <= idx && !terminal && 'font-semibold text-brand-600')}>
                        {s}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <details className="mt-6">
                <summary className="cursor-pointer text-sm font-medium text-brand-600">
                  See the full history
                </summary>
                <div className="mt-4">
                  <AppTimeline app={app} />
                </div>
              </details>

              {app.stage === 'rejected' && <RejectedNotice />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
