import * as React from 'react'
import { Sparkles, ShieldCheck, AlertTriangle, TrendingUp, Info, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { aiMonitoring, adminUsers } from '@/data/console'
import { adminKpis } from '@/data/mock'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/overlay'
import { PageHeader, Sparkline, StatTile } from '@/components/common'
import { Stagger, StaggerItem, Reveal, AnimatedNumber } from '@/components/motion'
import { AIProvenanceChip } from '@/components/brand'

/**
 * A14 — AI monitoring (PRD Part 28 / 45).
 *
 * The bias-parity panel is the reason this screen exists: PRD Part 45
 * requires score parity to be checked across anonymised profile variants
 * that differ only in non-job-relevant fields.
 */

const METRICS = [
  { key: 'parse', label: 'Resume parse success', unit: '%', target: 95, higherBetter: true, series: aiMonitoring.parseSeries },
  { key: 'jd', label: 'JD generation accepted', unit: '%', target: 60, higherBetter: true, series: aiMonitoring.jdAcceptSeries },
  { key: 'latency', label: 'AI p95 latency', unit: 's', target: 3, higherBetter: false, series: aiMonitoring.latencySeries },
]

function metricState(m: (typeof METRICS)[number]) {
  const value = m.series.at(-1)!
  const ok = m.higherBetter ? value >= m.target : value <= m.target
  const prev = m.series.at(-2)!
  return { value, ok, delta: +(value - prev).toFixed(1) }
}

export function Component() {
  const variant = useVariant()
  const Views = { a: MonA, b: MonB, c: MonC }
  const View = Views[variant] ?? MonA
  return <View />
}
Component.displayName = 'AdminAiMonitoring'

/* ══════════════════ shared blocks ══════════════════ */

function MetricCard({ m, large }: { m: (typeof METRICS)[number]; large?: boolean }) {
  const s = metricState(m)
  return (
    <div className={cn('rounded-v border border-line bg-paper shadow-v-card', large ? 'p-6' : 'p-v-card')}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{m.label}</p>
        <Badge tone={s.ok ? 'success' : 'warning'} size="sm">
          {s.ok ? 'within target' : 'below target'}
        </Badge>
      </div>
      <p className={cn('mt-1 font-mono tnum font-bold text-ink', large ? 'text-4xl' : 'text-3xl')}>
        <AnimatedNumber value={Math.round(s.value)} />
        {m.unit === '%' ? '%' : 's'}
      </p>
      <p className="mt-1 text-xs text-ink-3">
        target {m.higherBetter ? '≥' : '≤'} {m.target}
        {m.unit} · {s.delta > 0 ? '+' : ''}
        {s.delta} vs last period
      </p>
      <div className="mt-3">
        <Sparkline
          values={m.series}
          stroke={s.ok ? 'var(--color-score-elite)' : 'var(--color-warning)'}
        />
      </div>
    </div>
  )
}

/** PRD Part 45 — the panel that makes bias testing visible. */
function BiasPanel({ large }: { large?: boolean }) {
  const worst = Math.max(...aiMonitoring.biasParity.map((b) => b.delta))
  const allClear = aiMonitoring.biasParity.every((b) => b.delta < b.threshold)

  return (
    <section
      className={cn(
        'rounded-v border bg-paper shadow-v-card',
        allClear ? 'border-score-elite/25' : 'border-warning/30',
        large ? 'p-8' : 'p-v-card',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className={cn('flex items-center gap-2 font-semibold text-ink', large && 'text-2xl')}>
            <ShieldCheck className={cn('text-score-elite', large ? 'size-6' : 'size-5')} aria-hidden />
            Bias parity
          </h2>
          <p className="mt-1 text-sm text-ink-2">
            Score difference between anonymised profile variants that differ only in fields the
            model is not supposed to weigh.
          </p>
        </div>
        <AIProvenanceChip
          what="is sampled against these variants nightly"
          cannot="Protected characteristics are not collected, so these pairs test for proxy effects — not for direct use."
        />
      </div>

      <div className={cn('mt-5 space-y-3', large && 'mt-8 space-y-4')}>
        {aiMonitoring.biasParity.map((b) => {
          const breach = b.delta >= b.threshold
          const pct = (b.delta / (b.threshold * 1.5)) * 100
          return (
            <div key={b.pair}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-ink-2">{b.pair}</span>
                <span
                  className={cn(
                    'font-mono tnum font-semibold',
                    breach ? 'text-warning' : 'text-score-elite',
                  )}
                >
                  {b.delta.toFixed(1)} pts
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-subtle">
                <div
                  className={cn('h-full rounded-full', breach ? 'bg-warning' : 'bg-score-elite')}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <p className="mt-0.5 text-[11px] text-ink-3">
                flags at {b.threshold} pts
              </p>
            </div>
          )
        })}
      </div>

      <div
        className={cn(
          'mt-5 flex items-start gap-2 rounded-v-control p-3 text-sm',
          allClear ? 'bg-score-elite-bg text-score-elite' : 'bg-warning-bg text-warning',
        )}
      >
        {allClear ? (
          <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
        ) : (
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        )}
        <span className="text-ink-2">
          {allClear ? (
            <>
              All four pairs are within tolerance — the widest gap is{' '}
              <strong className="font-semibold">{worst.toFixed(1)} points</strong> on university
              tier, which is worth watching but below the flag threshold. Last sampled 6 hours ago.
            </>
          ) : (
            'At least one pair has breached tolerance. Learning-to-rank should stay disabled until this is investigated.'
          )}
        </span>
      </div>
    </section>
  )
}

function FailureTable({ dense }: { dense?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-3">
            <th scope="col" className="py-2 font-medium">Failure mode</th>
            <th scope="col" className="py-2 text-right font-medium">Count</th>
            <th scope="col" className="py-2 text-right font-medium">Share</th>
            <th scope="col" className="hidden py-2 font-medium md:table-cell">What happens instead</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {aiMonitoring.failures.map((f) => (
            <tr key={f.kind} className="hover:bg-hover">
              <td className={cn('font-medium text-ink', dense ? 'py-1.5' : 'py-2.5')}>{f.kind}</td>
              <td className="text-right font-mono tnum text-ink-2">{f.count}</td>
              <td className="text-right font-mono tnum text-ink-2">{f.share}%</td>
              <td className="hidden text-ink-2 md:table-cell">{f.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-2">
        <Info className="mt-0.5 size-3.5 shrink-0 text-ink-3" aria-hidden />
        Every AI failure degrades to a manual path rather than blocking the user — parse failure
        opens manual entry, JD timeout falls back to a blank form, and matching shows the last
        computed score rather than an error.
      </p>
    </div>
  )
}

function ParseFailureUsers() {
  const affected = adminUsers.filter((u) => u.parseFailed)
  if (affected.length === 0) return null
  return (
    <div className="rounded-v border border-warning/25 bg-warning-bg/40 p-v-card">
      <h3 className="flex items-center gap-2 font-semibold text-warning">
        <AlertTriangle className="size-4" aria-hidden />
        {affected.length} candidate{affected.length === 1 ? '' : 's'} hit a parse failure
      </h3>
      <p className="mt-1.5 text-sm text-ink-2">
        These people were shown the manual-entry path, but a low profile completeness suggests some
        gave up. Worth a support touch.
      </p>
      <ul className="mt-3 space-y-1.5">
        {affected.map((u) => (
          <li key={u.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-ink-2">{u.name}</span>
            <span className="shrink-0 font-mono tnum text-xs text-ink-3">
              {u.profilePct}% complete
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ══════════════════ A · tiles + charts ══════════════════ */

function MonA() {
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={Sparkles}
        tone="fuchsia"
        title="AI monitoring"
        description="Quality, failure modes and fairness of the models behind matching and generation."
        actions={<AIProvenanceChip what="reports its own quality metrics here" />}
      />

      <Stagger className="mt-6 grid gap-4 lg:grid-cols-3" whenVisible={false}>
        {METRICS.map((m) => (
          <StaggerItem key={m.key}>
            <MetricCard m={m} />
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {adminKpis.aiHealth.slice(2, 3).map((m) => (
          <StatTile
            key={m.label}
            label={m.label}
            value={`${m.value}${m.unit}`}
            hint={`target ${m.unit === 's' ? '≤' : '≥'} ${m.target}${m.unit}`}
          />
        ))}
        <StatTile label="AI calls today" value="92.1k" delta={11} hint="vs yesterday" />
        <StatTile label="Matching pairs recomputed" value="12,480" hint="nightly batch" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
          <h2 className="mb-1 font-semibold text-ink">Failure modes</h2>
          <p className="mb-4 text-sm text-ink-2">What breaks, and what the user sees when it does.</p>
          <FailureTable />
        </section>
        <ParseFailureUsers />
      </div>

      <div className="mt-6">
        <BiasPanel />
      </div>
    </div>
  )
}

/* ══════════════════ B · dense console ══════════════════ */

function MonB() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">AI monitoring</h1>
          <p className="font-mono text-xs text-ink-3">
            {METRICS.filter((m) => metricState(m).ok).length}/{METRICS.length} metrics within target
          </p>
        </div>
        <AIProvenanceChip what="reports its own quality metrics here" />
      </div>

      <div className="grid grid-cols-2 divide-x divide-line border-b border-line py-2 sm:grid-cols-4">
        {METRICS.map((m) => {
          const s = metricState(m)
          return (
            <div key={m.key} className="px-3 first:pl-0">
              <p className="text-[11px] uppercase tracking-wide text-ink-3">{m.label}</p>
              <p
                className={cn(
                  'font-mono tnum text-lg font-bold',
                  s.ok ? 'text-ink' : 'text-warning',
                )}
              >
                {s.value}
                {m.unit}
              </p>
              <Sparkline values={m.series} stroke={s.ok ? 'var(--color-score-elite)' : 'var(--color-warning)'} />
            </div>
          )
        })}
        <div className="px-3">
          <p className="text-[11px] uppercase tracking-wide text-ink-3">AI calls / day</p>
          <p className="font-mono tnum text-lg font-bold text-ink">92.1k</p>
        </div>
      </div>

      <section className="mt-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
          Failure modes
        </h2>
        <FailureTable dense />
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        <BiasPanel />
        <ParseFailureUsers />
      </div>
    </div>
  )
}

/* ══════════════════ C · narrative health report ══════════════════ */

function MonC() {
  const allOk = METRICS.every((m) => metricState(m).ok)
  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600">
        AI health · last 9 sampling windows
      </p>
      <h1 className="font-display tracking-tight mt-2 text-display-2 font-semibold text-ink">
        {allOk ? 'Everything is within target.' : 'One metric needs attention.'}
      </h1>

      <div className="mt-6">
        <AIProvenanceChip
          what="wrote the summary lines on this page"
          cannot="It describes the metrics shown here and nothing else."
        />
      </div>

      <Reveal className="mt-12">
        <p className="text-xl leading-relaxed text-ink-2">
          Resume parsing succeeds{' '}
          <strong className="font-semibold text-ink">
            {aiMonitoring.parseSeries.at(-1)}%
          </strong>{' '}
          of the time, up from 94.1% nine windows ago. The failures that remain are almost all
          two-column and image-heavy CVs.
        </p>
        <div className="mt-6">
          <MetricCard m={METRICS[0]} large />
        </div>
      </Reveal>

      <Reveal className="mt-14">
        <p className="text-xl leading-relaxed text-ink-2">
          Recruiters keep{' '}
          <strong className="font-semibold text-ink">{aiMonitoring.jdAcceptSeries.at(-1)}%</strong>{' '}
          of AI-drafted job descriptions with little or no editing — comfortably above the 60%
          target we set for the feature to be worth keeping.
        </p>
        <div className="mt-6">
          <MetricCard m={METRICS[1]} large />
        </div>
      </Reveal>

      <Reveal className="mt-14">
        <p className="text-xl leading-relaxed text-ink-2">
          When the AI does fail, nobody is blocked. Every failure mode has a manual path behind it.
        </p>
        <div className="mt-6 rounded-v bg-paper p-8 shadow-lg">
          <FailureTable />
        </div>
      </Reveal>

      <Reveal className="mt-14">
        <p className="text-xl leading-relaxed text-ink-2">
          And the part that matters most — scoring does not shift when the only thing that changes
          is something the model should not care about.
        </p>
        <div className="mt-6">
          <BiasPanel large />
        </div>
      </Reveal>

      <Reveal className="mt-8">
        <ParseFailureUsers />
      </Reveal>
    </div>
  )
}
