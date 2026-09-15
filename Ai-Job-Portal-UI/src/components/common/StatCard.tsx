import * as React from 'react'
import { Link } from 'react-router'
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from '@/components/motion'

/**
 * The colourful KPI card for Direction A.
 *
 * Each card owns ONE hue from the categorical palette and keeps it
 * everywhere that metric appears — the coloured rail, the icon tile,
 * the progress fill. Colour therefore still says *which metric*, which
 * is the same discipline as categorical chart colours.
 */

export type Tone =
  | 'indigo' | 'violet' | 'emerald' | 'teal' | 'sky' | 'amber' | 'rose' | 'fuchsia'

export const TONE_CLASS: Record<Tone, { rail: string; tile: string; text: string; bg: string; fill: string; ring: string }> = {
  indigo:  { rail: 'bg-tone-indigo-vivid',  tile: 'from-tone-indigo-vivid to-tone-indigo',   text: 'text-tone-indigo',  bg: 'bg-tone-indigo-bg',  fill: 'bg-tone-indigo-vivid',  ring: 'ring-tone-indigo/20' },
  violet:  { rail: 'bg-tone-violet-vivid',  tile: 'from-tone-violet-vivid to-tone-violet',   text: 'text-tone-violet',  bg: 'bg-tone-violet-bg',  fill: 'bg-tone-violet-vivid',  ring: 'ring-tone-violet/20' },
  emerald: { rail: 'bg-tone-emerald-vivid', tile: 'from-tone-emerald-vivid to-tone-emerald', text: 'text-tone-emerald', bg: 'bg-tone-emerald-bg', fill: 'bg-tone-emerald-vivid', ring: 'ring-tone-emerald/20' },
  teal:    { rail: 'bg-tone-teal-vivid',    tile: 'from-tone-teal-vivid to-tone-teal',       text: 'text-tone-teal',    bg: 'bg-tone-teal-bg',    fill: 'bg-tone-teal-vivid',    ring: 'ring-tone-teal/20' },
  sky:     { rail: 'bg-tone-sky-vivid',     tile: 'from-tone-sky-vivid to-tone-sky',         text: 'text-tone-sky',     bg: 'bg-tone-sky-bg',     fill: 'bg-tone-sky-vivid',     ring: 'ring-tone-sky/20' },
  amber:   { rail: 'bg-tone-amber-vivid',   tile: 'from-tone-amber-vivid to-tone-amber',     text: 'text-tone-amber',   bg: 'bg-tone-amber-bg',   fill: 'bg-tone-amber-vivid',   ring: 'ring-tone-amber/20' },
  rose:    { rail: 'bg-tone-rose-vivid',    tile: 'from-tone-rose-vivid to-tone-rose',       text: 'text-tone-rose',    bg: 'bg-tone-rose-bg',    fill: 'bg-tone-rose-vivid',    ring: 'ring-tone-rose/20' },
  fuchsia: { rail: 'bg-tone-fuchsia-vivid', tile: 'from-tone-fuchsia-vivid to-tone-fuchsia', text: 'text-tone-fuchsia', bg: 'bg-tone-fuchsia-bg', fill: 'bg-tone-fuchsia-vivid', ring: 'ring-tone-fuchsia/20' },
}

export interface StatCardProps {
  tone: Tone
  icon: React.ElementType
  label: string
  value: string | number
  /** Small pill top-right — a delta, or any short status. */
  badge?: { text: string; direction?: 'up' | 'down' | 'flat' }
  /** 0–100. Draws the thin progress rail under the number. */
  progress?: number
  caption?: string
  to?: string
  className?: string
}

export function StatCard({
  tone, icon: Icon, label, value, badge, progress, caption, to, className,
}: StatCardProps) {
  const t = TONE_CLASS[tone]
  const numeric = typeof value === 'number'

  const DeltaIcon =
    badge?.direction === 'up' ? TrendingUp
      : badge?.direction === 'down' ? TrendingDown
        : badge?.direction === 'flat' ? Minus
          : null

  const body = (
    <>
      {/* the coloured rail that names the metric */}
      <span className={cn('absolute inset-x-0 top-0 h-1', t.rail)} aria-hidden />

      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'grid size-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm',
            t.tile,
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </span>

        {badge && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              t.bg, t.text,
            )}
          >
            {DeltaIcon && <DeltaIcon className="size-3" aria-hidden />}
            {badge.text}
          </span>
        )}
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-3">{label}</p>
      <p className="mt-1 font-mono tnum text-3xl font-bold leading-none text-ink">
        {numeric ? <AnimatedNumber value={value as number} /> : value}
      </p>

      {progress != null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-subtle">
          <div
            className={cn('h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-soft)]', t.fill)}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {caption && (
        <p className="mt-2 flex items-center gap-1 text-xs text-ink-3">
          {caption}
          {to && <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />}
        </p>
      )}
    </>
  )

  // `block` matters: <a> is display:inline by default, so without it the
  // link variant never forms a box and its content spills out of the card.
  const shell = cn(
    'group relative block h-full overflow-hidden rounded-v border border-line bg-paper p-4 shadow-v-card',
    to && 'hover-lift cursor-pointer',
    className,
  )

  return to ? (
    <Link to={to} className={shell}>{body}</Link>
  ) : (
    <div className={shell}>{body}</div>
  )
}

/** A compact coloured tile for secondary metrics — same palette, less weight. */
export function MiniStat({
  tone, icon: Icon, label, value, className,
}: {
  tone: Tone
  icon: React.ElementType
  label: string
  value: string | number
  className?: string
}) {
  const t = TONE_CLASS[tone]
  return (
    <div className={cn('flex items-center gap-3 rounded-v border border-line bg-paper p-3', className)}>
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', t.bg, t.text)} aria-hidden>
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-ink-3">{label}</p>
        <p className="font-mono tnum text-lg font-bold leading-tight text-ink">{value}</p>
      </div>
    </div>
  )
}
