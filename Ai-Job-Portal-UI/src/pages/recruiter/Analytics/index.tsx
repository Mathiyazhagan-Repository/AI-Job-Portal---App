import * as React from 'react'
import { Link } from 'react-router'
import { Table2, BarChart3, TrendingUp, TrendingDown, Download, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { analytics } from '@/data/console'
import { jobById } from '@/data/mock'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/controls'
import { PageHeader, FunnelChart, Sparkline, StatTile } from '@/components/common'
import { Stagger, StaggerItem, Reveal, AnimatedNumber } from '@/components/motion'
import { AIProvenanceChip } from '@/components/brand'

/**
 * R18 — Recruiter analytics (PRD Part 46).
 *
 * Every chart has a "View as table" toggle — PRD Part 42 requires the
 * underlying numbers to be reachable without reading a picture.
 */

const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']

function useAnalytics() {
  const [range, setRange] = React.useState<'30' | '90' | '365'>('365')
  const [tableMode, setTableMode] = React.useState<Record<string, boolean>>({})
  const toggleTable = (k: string) => setTableMode((t) => ({ ...t, [k]: !t[k] }))
  return { range, setRange, tableMode, toggleTable }
}

type A = ReturnType<typeof useAnalytics>

export function Component() {
  const variant = useVariant()
  const a = useAnalytics()
  const Views = { a: AnalyticsA, b: AnalyticsB, c: AnalyticsC }
  const View = Views[variant] ?? AnalyticsA
  return <View a={a} />
}
Component.displayName = 'RecruiterAnalytics'

/* ══════════════════ chart shell with table fallback ══════════════════ */

function ChartCard({
  id,
  title,
  description,
  a,
  table,
  children,
  className,
}: {
  id: string
  title: string
  description?: string
  a: A
  table: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const showTable = a.tableMode[id]
  return (
    <section
      className={cn(
        'rounded-v border-[length:var(--v-card-border)] border-line bg-paper p-v-card shadow-v-card',
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => a.toggleTable(id)}
          aria-pressed={showTable}
        >
          {showTable ? <BarChart3 className="size-3.5" /> : <Table2 className="size-3.5" />}
          {showTable ? 'View as chart' : 'View as table'}
        </Button>
      </div>
      {showTable ? table : children}
    </section>
  )
}

function SimpleTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {head.map((h, i) => (
              <th
                key={h}
                scope="col"
                className={cn('py-1.5 text-xs font-medium text-ink-3', i > 0 && 'text-right')}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td
                  key={j}
                  className={cn('py-1.5', j === 0 ? 'text-ink-2' : 'text-right font-mono tnum text-ink')}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ══════════════════ individual charts ══════════════════ */

function TimeToHireChart() {
  const max = Math.max(...analytics.timeToHire)
  return (
    <div>
      <div className="flex h-32 items-end gap-1.5">
        {analytics.timeToHire.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-sm bg-brand-500 transition-[height] duration-700"
              style={{ height: `${(v / max) * 100}%` }}
              title={`${MONTHS[i]}: ${v} days`}
            />
            <span className="text-[9px] text-ink-3">{MONTHS[i]}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-2">
        <TrendingDown className="size-4 text-score-elite" aria-hidden />
        <span className="font-medium text-score-elite">11 days faster</span> than a year ago
      </p>
    </div>
  )
}

function SourceDonut() {
  const total = analytics.sourceOfHire.reduce((n, s) => n + s.count, 0)
  const colors = ['#2563eb', '#7c3aed', '#0891b2', '#f59e0b']
  let offset = 0

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 42 42" className="size-32 shrink-0 -rotate-90" role="img" aria-label="Source of hire breakdown">
        {analytics.sourceOfHire.map((s, i) => {
          const pct = (s.count / total) * 100
          const dash = `${pct} ${100 - pct}`
          const el = (
            <circle
              key={s.source}
              cx="21" cy="21" r="15.9"
              fill="transparent"
              stroke={colors[i]}
              strokeWidth="6"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          )
          offset += pct
          return el
        })}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {analytics.sourceOfHire.map((s, i) => (
          <li key={s.source} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: colors[i] }} />
            <span className="flex-1 truncate text-ink-2">{s.source}</span>
            <span className="font-mono tnum font-medium text-ink">{s.count}</span>
            <span className="w-10 text-right font-mono tnum text-xs text-ink-3">
              {Math.round((s.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RateGrid({ large }: { large?: boolean }) {
  return (
    <div className={cn('grid gap-3', large ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4')}>
      {analytics.rates.map((r) => {
        const up = r.value >= r.prev
        return (
          <div key={r.label} className="rounded-v border border-line bg-canvas p-3">
            <p className="text-xs text-ink-3">{r.label}</p>
            <p className={cn('mt-1 font-mono tnum font-bold text-ink', large ? 'text-3xl' : 'text-2xl')}>
              <AnimatedNumber value={r.value} suffix="%" />
            </p>
            <p
              className={cn(
                'mt-1 flex items-center gap-1 text-xs font-medium',
                up ? 'text-score-elite' : 'text-warning',
              )}
            >
              {up ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
              {up ? '+' : ''}
              {r.value - r.prev} pts vs last quarter
            </p>
          </div>
        )
      })}
    </div>
  )
}

function PerJobTable({ dense }: { dense?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-3">
            <th scope="col" className="py-2 font-medium">Job</th>
            <th scope="col" className="py-2 text-right font-medium">Applicants</th>
            <th scope="col" className="py-2 text-right font-medium">Shortlisted</th>
            <th scope="col" className="py-2 text-right font-medium">Interviewed</th>
            <th scope="col" className="py-2 text-right font-medium">Offers</th>
            <th scope="col" className="py-2 text-right font-medium">Hires</th>
            <th scope="col" className="py-2 text-right font-medium">Days</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {analytics.perJob.map((j) => (
            <tr key={j.jobId} className="hover:bg-hover">
              <td className={dense ? 'py-1.5' : 'py-2.5'}>
                <Link
                  to={`/recruiter/jobs/${j.jobId}/applicants`}
                  className="font-medium text-ink hover:text-brand-700"
                >
                  {jobById(j.jobId)?.title}
                </Link>
              </td>
              {[j.applicants, j.shortlisted, j.interviewed, j.offers, j.hires, j.days].map((v, i) => (
                <td key={i} className="text-right font-mono tnum text-ink-2">{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ══════════════════ shared header ══════════════════ */

function RangePicker({ a }: { a: A }) {
  return (
    <Tabs value={a.range} onValueChange={(v) => a.setRange(v as typeof a.range)}>
      <TabsList>
        <TabsTrigger value="30">30 days</TabsTrigger>
        <TabsTrigger value="90">90 days</TabsTrigger>
        <TabsTrigger value="365">12 months</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

/* ══════════════════ A · chart grid ══════════════════ */

function AnalyticsA({ a }: { a: A }) {
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={BarChart3}
        tone="fuchsia"
        title="Analytics"
        description="Where candidates drop out, how long hiring takes, and which roles are working."
        actions={
          <div className="flex items-center gap-2">
            <RangePicker a={a} />
            <Button variant="secondary" size="sm">
              <Download className="size-4" />
              Export
            </Button>
          </div>
        }
      />

      <Stagger className="mt-6 grid gap-4 lg:grid-cols-2" whenVisible={false}>
        <StaggerItem className="lg:col-span-2">
          <ChartCard
            id="funnel"
            title="Hiring funnel"
            description="Every open role combined, with drop-off at each stage."
            a={a}
            table={
              <SimpleTable
                head={['Stage', 'Candidates']}
                rows={analytics.funnel.map((f) => [f.stage, f.count])}
              />
            }
          >
            <FunnelChart data={analytics.funnel} />
          </ChartCard>
        </StaggerItem>

        <StaggerItem>
          <ChartCard
            id="tth"
            title="Time to hire"
            description="Median days from application to accepted offer."
            a={a}
            table={
              <SimpleTable
                head={['Month', 'Days']}
                rows={analytics.timeToHire.map((v, i) => [MONTHS[i], v])}
              />
            }
          >
            <TimeToHireChart />
          </ChartCard>
        </StaggerItem>

        <StaggerItem>
          <ChartCard
            id="source"
            title="Source of hire"
            description="Where the people you actually hired came from."
            a={a}
            table={
              <SimpleTable
                head={['Source', 'Hires']}
                rows={analytics.sourceOfHire.map((s) => [s.source, s.count])}
              />
            }
          >
            <SourceDonut />
          </ChartCard>
        </StaggerItem>

        <StaggerItem className="lg:col-span-2">
          <ChartCard
            id="rates"
            title="Conversion rates"
            description="How each stage transition is trending."
            a={a}
            table={
              <SimpleTable
                head={['Transition', 'Now', 'Previous']}
                rows={analytics.rates.map((r) => [r.label, `${r.value}%`, `${r.prev}%`])}
              />
            }
          >
            <RateGrid />
          </ChartCard>
        </StaggerItem>

        <StaggerItem className="lg:col-span-2">
          <ChartCard
            id="perjob"
            title="By job"
            description="Which roles convert, and which stall."
            a={a}
            table={<PerJobTable />}
          >
            <PerJobTable />
          </ChartCard>
        </StaggerItem>
      </Stagger>
    </div>
  )
}

/* ══════════════════ B · numbers first ══════════════════ */

function AnalyticsB({ a }: { a: A }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Analytics</h1>
          <p className="font-mono text-xs text-ink-3">northwind labs · last 12 months</p>
        </div>
        <div className="flex items-center gap-2">
          <RangePicker a={a} />
          <Button size="xs" variant="secondary">
            <Download className="size-3.5" />
            CSV
          </Button>
        </div>
      </div>

      {/* the table is the primary artefact here */}
      <section className="mt-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">By job</h2>
        <PerJobTable dense />
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
          Conversion rates
        </h2>
        <SimpleTable
          head={['Transition', 'Now', 'Previous', 'Change']}
          rows={analytics.rates.map((r) => [
            r.label,
            `${r.value}%`,
            `${r.prev}%`,
            `${r.value - r.prev > 0 ? '+' : ''}${r.value - r.prev}`,
          ])}
        />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-v border border-line p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Funnel</h2>
          <FunnelChart data={analytics.funnel} />
        </div>
        <div className="rounded-v border border-line p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
            Time to hire
          </h2>
          <Sparkline values={analytics.timeToHire} />
          <p className="mt-1 font-mono text-xs text-ink-3">15 days median · was 26</p>
        </div>
        <div className="rounded-v border border-line p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
            Source of hire
          </h2>
          <SimpleTable
            head={['Source', 'Hires']}
            rows={analytics.sourceOfHire.map((s) => [s.source, s.count])}
          />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════ C · narrative report ══════════════════ */

function AnalyticsC({ a }: { a: A }) {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600">
        Hiring report · last 12 months
      </p>
      <h1 className="font-display tracking-tight mt-2 text-display-2 font-semibold text-ink">
        You are hiring faster, and rejecting later.
      </h1>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <RangePicker a={a} />
        <AIProvenanceChip
          what="wrote the summary lines between these charts"
          cannot="It describes the numbers on this page and nothing else — it does not predict, recommend or judge anyone."
        />
      </div>

      <Reveal className="mt-12">
        <p className="text-xl leading-relaxed text-ink-2">
          Median time to hire fell from <strong className="font-semibold text-ink">26 days</strong> to{' '}
          <strong className="font-semibold text-ink">15</strong>. Most of that came out of the gap
          between applying and first shortlist.
        </p>
        <div className="mt-6 rounded-v bg-paper p-8 shadow-lg">
          <TimeToHireChart />
        </div>
      </Reveal>

      <Reveal className="mt-16">
        <p className="text-xl leading-relaxed text-ink-2">
          But the funnel narrows hardest at{' '}
          <strong className="font-semibold text-ink">shortlist → interview</strong>. Two thirds of
          shortlisted candidates never get a conversation.
        </p>
        <div className="mt-6 rounded-v bg-paper p-8 shadow-lg">
          <FunnelChart data={analytics.funnel} />
        </div>
      </Reveal>

      <Reveal className="mt-16">
        <p className="text-xl leading-relaxed text-ink-2">
          Offers are landing better than they used to —{' '}
          <strong className="font-semibold text-ink">71%</strong> accepted — though that is down
          three points on last quarter.
        </p>
        <div className="mt-6 rounded-v bg-paper p-8 shadow-lg">
          <RateGrid large />
        </div>
      </Reveal>

      <Reveal className="mt-16">
        <p className="text-xl leading-relaxed text-ink-2">
          Your own search is now the largest single source of hires, ahead of direct applications.
        </p>
        <div className="mt-6 rounded-v bg-paper p-8 shadow-lg">
          <SourceDonut />
        </div>
      </Reveal>

      <Reveal className="mt-16 rounded-v bg-paper p-8 shadow-lg">
        <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">
          Role by role
        </h2>
        <div className="mt-6">
          <PerJobTable />
        </div>
      </Reveal>
    </div>
  )
}
