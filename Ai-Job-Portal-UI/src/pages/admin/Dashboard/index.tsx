import { Link } from 'react-router'
import {
  Gavel, Building2, Flag, LifeBuoy, ArrowRight, Sparkles, ShieldCheck, Inbox,
  Activity, TrendingUp, Users2, Server, Database, Briefcase, FileText, Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { adminKpis } from '@/data/mock'
import { Button } from '@/components/ui/button'
import {
  StatTile, SectionHeading, Sparkline, Kbd,
  StatCard, MiniStat, AreaChart, BarChart, HBarChart, DonutChart, RadialGauge,
  TONE_CLASS, type Tone,
} from '@/components/common'
import { AIProvenanceChip } from '@/components/brand'

const QUEUE_ICONS = [Gavel, Building2, Flag, LifeBuoy]
const GROWTH = [120, 138, 129, 165, 180, 172, 210, 232, 244, 268, 291, 320]

/* ── Direction A colour data ───────────────────────────────────────── */

const QUEUE_TONES: Tone[] = ['amber', 'sky', 'rose', 'fuchsia']

const GROWTH_LABELS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12']

const GROWTH_SERIES = [
  { label: 'Applications (100s)', tone: 'indigo' as Tone, points: GROWTH },
  { label: 'Jobs published (10s)', tone: 'violet' as Tone, points: [61, 68, 66, 74, 80, 78, 88, 94, 97, 106, 112, 121] },
  { label: 'New signups (10s)', tone: 'emerald' as Tone, points: [44, 52, 49, 58, 64, 61, 70, 77, 81, 86, 93, 101] },
]

const AUDIENCE = [
  { label: 'Candidates', value: 78, tone: 'indigo' as Tone },
  { label: 'Recruiters', value: 17, tone: 'fuchsia' as Tone },
  { label: 'Company admins', value: 4, tone: 'amber' as Tone },
  { label: 'Platform staff', value: 1, tone: 'teal' as Tone },
]

const MODERATION = [
  { label: 'Approved', value: 612, tone: 'emerald' as Tone },
  { label: 'Edited', value: 148, tone: 'sky' as Tone },
  { label: 'Rejected', value: 74, tone: 'rose' as Tone },
  { label: 'Escalated', value: 21, tone: 'violet' as Tone },
]

const RELIABILITY = [
  { label: 'API', value: 99.98, tone: 'emerald' as Tone, hint: 'target 99.9' },
  { label: 'Search', value: 99.94, tone: 'teal' as Tone, hint: 'target 99.9' },
  { label: 'Matching', value: 99.71, tone: 'sky' as Tone, hint: 'target 99.5' },
  { label: 'Resume parser', value: 99.12, tone: 'amber' as Tone, hint: 'target 99.5' },
  { label: 'Notifications', value: 99.88, tone: 'violet' as Tone, hint: 'target 99.5' },
]

const KPI_CARDS = [
  { tone: 'indigo' as Tone, icon: Users2, label: 'Daily active users', value: '18.4k',
    badge: { text: '+6%', direction: 'up' as const }, caption: 'vs 7-day average', to: '/admin/users' },
  { tone: 'violet' as Tone, icon: Briefcase, label: 'Jobs published', value: '4,281',
    badge: { text: '+112', direction: 'up' as const }, caption: 'this month', to: '/admin/moderation' },
  { tone: 'sky' as Tone, icon: FileText, label: 'Applications', value: '146k',
    badge: { text: '+8%', direction: 'up' as const }, caption: 'all time' },
  { tone: 'teal' as Tone, icon: Building2, label: 'Companies', value: 892,
    badge: { text: '+14', direction: 'up' as const }, caption: '8 awaiting verification' },
  { tone: 'emerald' as Tone, icon: Trophy, label: 'Hires to date', value: '3,104',
    badge: { text: '+47', direction: 'up' as const }, caption: 'confirmed by employers' },
  { tone: 'fuchsia' as Tone, icon: Sparkles, label: 'AI calls / day', value: '92.1k',
    badge: { text: '+11%', direction: 'up' as const }, progress: 61, caption: '61% of daily budget',
    to: '/admin/ai-monitoring' },
]

const ACTIVITY_STRIP = [
  { tone: 'amber' as Tone, icon: Gavel, label: 'Queue backlog', value: 37 },
  { tone: 'rose' as Tone, icon: Flag, label: 'Open abuse reports', value: 4 },
  { tone: 'sky' as Tone, icon: Building2, label: 'Pending verifications', value: 8 },
  { tone: 'violet' as Tone, icon: LifeBuoy, label: 'Tickets breaching SLA', value: 2 },
  { tone: 'emerald' as Tone, icon: ShieldCheck, label: 'Audit events today', value: '1.2k' },
  { tone: 'indigo' as Tone, icon: Activity, label: 'AI p95 latency', value: '1.8s' },
]

export function Component() {
  const variant = useVariant()
  const Views = { a: AdminA, b: AdminB, c: AdminC }
  const View = Views[variant] ?? AdminA
  return <View />
}
Component.displayName = 'AdminDashboard'

/* ══════════════════ shared ══════════════════ */

const TONE = {
  brand: 'border-brand-200 bg-brand-50 text-brand-700',
  danger: 'border-danger/20 bg-danger-bg text-danger',
  warning: 'border-warning/20 bg-warning-bg text-warning',
}

function Queues({ dense }: { dense?: boolean }) {
  return (
    <ul className={cn('grid gap-2', !dense && 'sm:grid-cols-2')}>
      {adminKpis.queues.map((q, i) => {
        const Icon = QUEUE_ICONS[i]
        return (
          <li key={q.label}>
            <Link
              to="/admin/jobs"
              className={cn(
                'flex items-center gap-3 rounded-v-control border transition-transform hover:-translate-y-px',
                TONE[q.tone],
                dense ? 'px-2.5 py-1.5' : 'p-3',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{q.label}</span>
              <span
                className={cn(
                  'shrink-0 font-mono tnum font-bold',
                  q.count > 0 && 'animate-pulse-ring rounded-full px-1.5',
                )}
              >
                {q.count}
              </span>
              <ArrowRight className="size-4 shrink-0 opacity-50" aria-hidden />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function AiHealth({ dense }: { dense?: boolean }) {
  return (
    <ul className="space-y-3">
      {adminKpis.aiHealth.map((m) => {
        const good = m.unit === 's' ? m.value <= m.target : m.value >= m.target
        const pct = m.unit === '%' ? m.value : Math.min(100, (m.target / Math.max(m.value, 0.1)) * 100)
        return (
          <li key={m.label}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-ink-2">{m.label}</span>
              <span
                className={cn(
                  'font-mono tnum font-semibold',
                  good ? 'text-score-elite' : 'text-warning',
                )}
              >
                {m.value}
                {m.unit}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-subtle">
              <div
                className={cn('h-full rounded-full', good ? 'bg-score-elite' : 'bg-warning')}
                style={{ width: `${pct}%` }}
              />
            </div>
            {!dense && (
              <p className="mt-0.5 text-[11px] text-ink-3">
                target {m.unit === 's' ? '≤' : '≥'} {m.target}
                {m.unit}
              </p>
            )}
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

/* ══════════════════ A · KPI bento ══════════════════ */

function QueueCardA({
  item,
  icon: Icon,
  tone,
}: {
  item: (typeof adminKpis.queues)[number]
  icon: React.ElementType
  tone: Tone
}) {
  const t = TONE_CLASS[tone]
  return (
    <Link
      to="/admin/moderation"
      className="group relative block overflow-hidden rounded-v border border-line bg-paper p-3 transition-v hover-lift"
    >
      <span className={cn('absolute inset-x-0 top-0 h-1', t.rail)} aria-hidden />
      <div className="mt-1 flex items-center gap-3">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', t.bg, t.text)} aria-hidden>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono tnum text-2xl font-semibold leading-none text-ink">{item.count}</p>
          <p className="mt-1 truncate text-xs text-ink-2">{item.label}</p>
        </div>
        <ArrowRight
          className={cn('size-4 shrink-0 transition-transform group-hover:translate-x-0.5', t.text)}
          aria-hidden
        />
      </div>
    </Link>
  )
}

function AdminA() {
  const totalQueue = adminKpis.queues.reduce((n, q) => n + q.count, 0)

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* ── header band ── */}
      <header className="relative mb-5 overflow-hidden rounded-v border border-line p-5 sm:p-6">
        <span
          className="absolute inset-0 bg-gradient-to-br from-[var(--color-tone-violet-bg)] via-[var(--color-tone-sky-bg)] to-[var(--color-tone-emerald-bg)]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-[var(--color-tone-violet-vivid)] opacity-15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/80 px-2.5 py-1 text-xs font-medium text-tone-violet ring-1 ring-[var(--color-tone-violet)]/20">
              <ShieldCheck className="size-3.5" aria-hidden />
              {totalQueue} items waiting on a human decision
            </span>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
              Platform health
            </h1>
            <p className="mt-1 max-w-xl text-sm text-ink-2">
              Moderation, verification and AI quality across the whole platform. Every number here links
              to the queue that produced it.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link to="/admin/moderation">Open moderation</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/admin/ai-monitoring">AI monitoring</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── KPI row ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {KPI_CARDS.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* queues */}
        <Tile className="lg:col-span-7">
          <SectionHeading title="Queues waiting on you" icon={Inbox} tone="amber" />
          <div className="grid gap-2 sm:grid-cols-2">
            {adminKpis.queues.map((q, i) => (
              <QueueCardA
                key={q.label}
                item={q}
                icon={QUEUE_ICONS[i]}
                tone={QUEUE_TONES[i % QUEUE_TONES.length]}
              />
            ))}
          </div>
          <p className="mt-3 rounded-v-control bg-[var(--color-tone-amber-bg)] px-3 py-2 text-xs leading-relaxed text-tone-amber">
            Oldest unactioned item is 19 hours old — inside the 24-hour SLA, but two abuse reports are
            approaching it.
          </p>
        </Tile>

        {/* AI health */}
        <Tile className="lg:col-span-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <SectionHeading title="AI health" icon={Activity} tone="fuchsia" className="mb-0" />
            <AIProvenanceChip what="reports its own quality metrics here" />
          </div>
          <AiHealth />
          <Button variant="secondary" size="sm" className="mt-4 w-full" asChild>
            <Link to="/admin/ai-monitoring">Open AI monitoring</Link>
          </Button>
        </Tile>

        {/* growth */}
        <Tile className="lg:col-span-8">
          <SectionHeading
            title="Platform growth · last 12 weeks"
            icon={TrendingUp}
            tone="indigo"
            action={{ label: 'Reports', to: '/admin/reports' }}
          />
          <AreaChart series={GROWTH_SERIES} labels={GROWTH_LABELS} height={230} />
        </Tile>

        {/* traffic mix */}
        <Tile className="lg:col-span-4">
          <SectionHeading title="Who is on the platform" icon={Users2} tone="sky" />
          <div className="flex items-center justify-center py-2">
            <DonutChart data={AUDIENCE} size={124} centerLabel="daily active" centerValue="18.4k" />
          </div>
        </Tile>

        {/* moderation outcomes */}
        <Tile className="lg:col-span-4">
          <SectionHeading title="Moderation outcomes · 30 days" icon={Gavel} tone="teal" />
          <BarChart data={MODERATION} height={168} />
        </Tile>

        {/* infra */}
        <Tile className="lg:col-span-5">
          <SectionHeading title="Service reliability" icon={Server} tone="emerald" />
          <HBarChart data={RELIABILITY} labelWidth="w-28" suffix="%" />
          <p className="mt-3 text-xs leading-relaxed text-ink-3">
            Rolling 30-day availability. The resume parser is the only service below its 99.5% target.
          </p>
        </Tile>

        {/* uptime gauge */}
        <Tile className="lg:col-span-3">
          <SectionHeading title="Storage used" icon={Database} tone="rose" />
          <div className="flex flex-col items-center justify-center py-1">
            <RadialGauge value={64} tone="rose" size={132} label="64%" sublabel="1.9 TB of 3 TB" />
            <p className="mt-3 text-center text-xs leading-relaxed text-ink-2">
              Resume documents are 71% of it. Retention policy purges at 24 months.
            </p>
          </div>
        </Tile>

        {/* activity strip */}
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-3 xl:grid-cols-6">
          {ACTIVITY_STRIP.map((m) => (
            <MiniStat key={m.label} {...m} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════ B · ops console ══════════════════ */

function AdminB() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <h1 className="text-base font-semibold text-ink">Platform operations</h1>
        <p className="flex items-center gap-1 text-xs text-ink-3">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd> global search
        </p>
      </div>

      <div className="grid grid-cols-3 divide-x divide-line border-b border-line py-2 sm:grid-cols-6">
        {adminKpis.stats.map((s) => (
          <div key={s.label} className="px-3 first:pl-0">
            <p className="text-[11px] uppercase tracking-wide text-ink-3">{s.label}</p>
            <p className="font-mono tnum text-lg font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 py-3 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <section>
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Queues
            </h2>
            <Queues dense />
          </section>

          <section>
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Recent admin actions
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-3">
                  <th scope="col" className="py-1.5 font-medium">Actor</th>
                  <th scope="col" className="py-1.5 font-medium">Action</th>
                  <th scope="col" className="py-1.5 font-medium">Entity</th>
                  <th scope="col" className="py-1.5 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[
                  ['admin@kairo', 'job.approve', 'jobs/j4', '2m ago'],
                  ['admin@kairo', 'company.verify', 'companies/c2', '18m ago'],
                  ['support@kairo', 'ticket.resolve', 'tickets/t81', '41m ago'],
                  ['admin@kairo', 'user.suspend', 'users/u1204', '2h ago'],
                ].map((r) => (
                  <tr key={r[3]} className="hover:bg-hover">
                    <td className="py-1.5 font-mono text-xs text-ink-2">{r[0]}</td>
                    <td className="py-1.5 font-mono text-xs text-ink">{r[1]}</td>
                    <td className="py-1.5 font-mono text-xs text-ink-3">{r[2]}</td>
                    <td className="py-1.5 text-right text-xs text-ink-3">{r[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-md border border-line p-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
              AI health
            </h2>
            <AiHealth dense />
          </div>
          <div className="rounded-md border border-line p-3">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Applications / week
            </h2>
            <Sparkline values={GROWTH} />
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ══════════════════ C · ops board ══════════════════ */

function AdminC() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <p className="text-sm font-medium text-ink-2">Kairo · Operations</p>
      <h1 className="font-display tracking-tight mt-1 text-display-2 font-semibold text-ink">
        37 items need a human.
      </h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {adminKpis.queues.map((q, i) => {
          const Icon = QUEUE_ICONS[i]
          return (
            <Link
              key={q.label}
              to="/admin/jobs"
              className="group rounded-v bg-paper p-6 shadow-lg transition-transform hover:-translate-y-1"
            >
              <Icon className="size-6 text-brand-600" aria-hidden />
              <p className="mt-4 font-mono tnum text-5xl font-bold text-ink">{q.count}</p>
              <p className="mt-2 text-sm leading-snug text-ink-2">{q.label}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                Review
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          )
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminKpis.stats.map((s) => (
          <StatTile key={s.label} {...s} size="lg" />
        ))}
      </div>

      <div className="mt-10 rounded-v bg-paper p-8 shadow-lg">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">AI health</h2>
          <AIProvenanceChip what="reports its own quality metrics here" />
        </div>
        <AiHealth />
        <p className="mt-5 flex items-start gap-2 rounded-v-control bg-brand-50 p-3 text-sm text-brand-800">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
          All four indicators are within target. Bias-parity sampling last ran 6 hours ago with no
          flagged variance across anonymised profile variants.
        </p>
      </div>
    </div>
  )
}
