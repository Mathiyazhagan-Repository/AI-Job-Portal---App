import * as React from 'react'
import { Link } from 'react-router'
import { ArrowRight, SearchX, Inbox, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TONE_CLASS, type Tone } from './StatCard'

export { VariantSwitcher } from './VariantSwitcher'
export { CommandPalette } from './CommandPalette'
export { HistogramRangeSlider } from './HistogramRangeSlider'
export { DataTable } from './DataTable'
export type { Column, DataTableProps } from './DataTable'
export { EmptyState } from './EmptyState'
export { StatCard, MiniStat, TONE_CLASS } from './StatCard'
export type { Tone, StatCardProps } from './StatCard'
export { AreaChart, BarChart, HBarChart, DonutChart, RadialGauge, StackedBar, TONE_HEX } from './charts'
export { SeriesChart, ChartTypePicker, CHART_TYPES } from './SeriesChart'
export type { ChartType } from './SeriesChart'
export type { Series } from './charts'
export { NotificationBell } from './NotificationBell'

/* ══════════════════ Page header ══════════════════ */

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  icon: Icon,
  tone = 'indigo',
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  eyebrow?: string
  /** Draws a gradient tile and a matching wash behind the header. */
  icon?: React.ElementType
  tone?: Tone
  className?: string
}) {
  const t = TONE_CLASS[tone]
  const wash = TONE_WASH[tone]

  return (
    <header
      className={cn(
        'relative overflow-hidden rounded-v border border-line bg-paper p-5 shadow-v-card',
        className,
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: wash }}
        aria-hidden
      />
      <span className={cn('absolute inset-x-0 top-0 h-1', t.rail)} aria-hidden />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          {Icon && (
            <span
              className={cn(
                'grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                t.tile,
              )}
              aria-hidden
            >
              <Icon className="size-5.5" />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className={cn('mb-0.5 text-xs font-semibold uppercase tracking-wider', t.text)}>
                {eyebrow}
              </p>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
            {description && <p className="mt-1 max-w-2xl text-sm text-ink-2">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}

/** Soft radial wash behind a page header, one per hue. */
export const TONE_WASH: Record<Tone, string> = {
  indigo:  'radial-gradient(55% 130% at 0% 0%, rgba(99,102,241,0.12), transparent 62%)',
  violet:  'radial-gradient(55% 130% at 0% 0%, rgba(139,92,246,0.12), transparent 62%)',
  emerald: 'radial-gradient(55% 130% at 0% 0%, rgba(16,185,129,0.12), transparent 62%)',
  teal:    'radial-gradient(55% 130% at 0% 0%, rgba(20,184,166,0.12), transparent 62%)',
  sky:     'radial-gradient(55% 130% at 0% 0%, rgba(14,165,233,0.12), transparent 62%)',
  amber:   'radial-gradient(55% 130% at 0% 0%, rgba(245,158,11,0.14), transparent 62%)',
  rose:    'radial-gradient(55% 130% at 0% 0%, rgba(244,63,94,0.12), transparent 62%)',
  fuchsia: 'radial-gradient(55% 130% at 0% 0%, rgba(217,70,239,0.12), transparent 62%)',
}

/* ══════════════════ Bento grid ══════════════════ */

export function BentoGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('grid grid-cols-1 md:grid-cols-6 gap-v', className)} {...props} />
}

/* ══════════════════ Stat tile ══════════════════ */

export function StatTile({
  label,
  value,
  delta,
  hint,
  size = 'md',
  className,
}: {
  label: string
  value: string | number
  delta?: number
  hint?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const Icon = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  // Direction of "good" varies by metric, so we render neutral-positive:
  // up is brand-coloured, down is muted. Never red/green — that implies
  // a judgement the data doesn't support.
  return (
    <div
      className={cn(
        'bg-paper rounded-v shadow-v-card border-[length:var(--v-card-border)] border-line p-v-card',
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</p>
      <p
        className={cn(
          'font-mono tnum font-bold text-ink mt-1.5 leading-none',
          size === 'sm' && 'text-xl',
          size === 'md' && 'text-3xl',
          size === 'lg' && 'text-5xl',
        )}
      >
        {value}
      </p>
      {(delta != null || hint) && (
        <p className="flex items-center gap-1 text-xs text-ink-3 mt-2">
          {delta != null && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                delta > 0 ? 'text-brand-600' : 'text-ink-3',
              )}
            >
              <Icon className="size-3" aria-hidden />
              {delta > 0 ? '+' : ''}
              {delta}
            </span>
          )}
          {hint}
        </p>
      )}
    </div>
  )
}

/* ══════════════════ Empty state ══════════════════ */

export function FilteredEmptyState({
  activeFilters,
  onClearFilter,
  onClearAll,
}: {
  activeFilters: { key: string; label: string }[]
  onClearFilter: (key: string) => void
  onClearAll: () => void
}) {
  const suggestions = activeFilters.slice(0, 2)
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-warning-bg text-warning mb-4">
        <SearchX className="size-7" aria-hidden />
      </span>
      <h3 className="font-semibold text-ink">No jobs match all your filters</h3>
      {suggestions.length > 0 ? (
        <>
          <p className="text-sm text-ink-2 mt-1.5 max-w-sm">
            Loosening {suggestions.length === 1 ? 'this filter' : 'one of these'} would widen your
            results the most:
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {suggestions.map((f) => (
              <Button key={f.key} size="sm" variant="secondary" onClick={() => onClearFilter(f.key)}>
                Remove “{f.label}”
              </Button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-ink-2 mt-1.5">Try a broader search term.</p>
      )}
      <Button size="sm" variant="ghost" className="mt-3" onClick={onClearAll}>
        Clear all filters
      </Button>
    </div>
  )
}

/* ══════════════════ Section heading ══════════════════ */

export function SectionHeading({
  title,
  action,
  icon: Icon,
  tone = 'indigo',
  className,
}: {
  title: string
  action?: { label: string; to: string }
  icon?: React.ElementType
  tone?: Tone
  className?: string
}) {
  const t = TONE_CLASS[tone]
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-3', className)}>
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-3">
        {Icon && (
          <span className={cn('grid size-6 place-items-center rounded-md', t.bg, t.text)} aria-hidden>
            <Icon className="size-3.5" />
          </span>
        )}
        {title}
      </h2>
      {action && (
        <Link
          to={action.to}
          className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
        >
          {action.label}
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  )
}

/* ══════════════════ Keyboard hint ══════════════════ */

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-subtle',
        'px-1 font-mono text-[10px] font-medium text-ink-3',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

/* ══════════════════ Simple SVG charts (no chart library) ══════════════════ */

const FUNNEL_TONES: Tone[] = ['indigo', 'sky', 'teal', 'emerald', 'violet', 'fuchsia', 'amber']

export function FunnelChart({
  data,
  className,
}: {
  data: { stage: string; count: number }[]
  className?: string
}) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className={cn('space-y-1.5', className)}>
      {data.map((d, i) => {
        const pct = (d.count / max) * 100
        const prevCount = i > 0 ? data[i - 1].count : 0
        const drop = i > 0 ? (prevCount === 0 ? 0 : Math.round((1 - d.count / prevCount) * 100)) : null
        const tone = FUNNEL_TONES[i % FUNNEL_TONES.length]
        // a bar under ~14% is too narrow to hold its own number legibly,
        // so the count moves outside it rather than being clipped
        const inside = pct >= 14
        return (
          <div key={d.stage} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 truncate text-ink-2">{d.stage}</span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-v-control bg-subtle">
              <div
                className={cn(
                  'flex h-full items-center justify-end rounded-v-control pr-2 transition-[width] duration-700 ease-[var(--ease-out-soft)]',
                  TONE_CLASS[tone].fill,
                )}
                style={{ width: `${Math.max(pct, 2)}%` }}
              >
                {inside && (
                  <span className="font-mono tnum text-xs font-semibold text-white">{d.count}</span>
                )}
              </div>
              {!inside && (
                <span
                  className={cn(
                    'absolute inset-y-0 flex items-center pl-2 font-mono tnum text-xs font-semibold',
                    TONE_CLASS[tone].text,
                  )}
                  style={{ left: `${Math.max(pct, 2)}%` }}
                >
                  {d.count}
                </span>
              )}
            </div>
            <span className="w-12 shrink-0 text-right font-mono tnum text-xs text-ink-3">
              {drop != null ? `−${drop}%` : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function Sparkline({
  values,
  className,
  stroke = 'var(--color-brand-600)',
}: {
  values: number[]
  className?: string
  stroke?: string
}) {
  const w = 100
  const h = 28
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('w-full h-7', className)} preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
