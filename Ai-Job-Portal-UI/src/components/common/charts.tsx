import * as React from 'react'
import { cn } from '@/lib/utils'
import { useTempo } from '@/components/motion'
import type { Tone } from './StatCard'

/**
 * Hand-built SVG charts, ~250 lines total and no chart dependency.
 * Everything reads the categorical palette so a metric keeps its hue
 * across the card, the chart and the legend.
 */

export const TONE_HEX: Record<Tone, { vivid: string; solid: string }> = {
  indigo:  { vivid: '#6366f1', solid: '#4338ca' },
  violet:  { vivid: '#8b5cf6', solid: '#6d28d9' },
  emerald: { vivid: '#10b981', solid: '#047857' },
  teal:    { vivid: '#14b8a6', solid: '#0f766e' },
  sky:     { vivid: '#0ea5e9', solid: '#0369a1' },
  amber:   { vivid: '#f59e0b', solid: '#b45309' },
  rose:    { vivid: '#f43f5e', solid: '#be123c' },
  fuchsia: { vivid: '#d946ef', solid: '#a21caf' },
}

/* ══════════════════ Area chart — trends over time ══════════════════ */

export interface Series {
  label: string
  tone: Tone
  points: number[]
}

export function AreaChart({
  series,
  labels,
  height = 220,
  yTicks = 4,
  formatY = (n: number) => String(Math.round(n)),
  className,
}: {
  series: Series[]
  labels: string[]
  height?: number
  yTicks?: number
  formatY?: (n: number) => string
  className?: string
}) {
  const t = useTempo()
  const w = 600
  const padL = 38
  const padB = 22
  const padT = 8
  const innerW = w - padL - 8
  const innerH = height - padB - padT

  const max = Math.max(...series.flatMap((s) => s.points)) * 1.1 || 1
  const x = (i: number, n: number) => padL + (i / Math.max(1, n - 1)) * innerW
  const y = (v: number) => padT + innerH - (v / max) * innerH

  // useId() returns ':r3:' — colons are invalid inside an SVG url(#…)
  // reference, which silently drops the gradient and paints the area black.
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '')

  return (
    <div className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img"
        aria-label={`${series.map((s) => s.label).join(' and ')} over ${labels.join(', ')}`}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.label} id={`${id}-${s.label.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TONE_HEX[s.tone].vivid} stopOpacity="0.35" />
              <stop offset="100%" stopColor={TONE_HEX[s.tone].vivid} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>

        {/* horizontal guides */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const v = (max / yTicks) * i
          return (
            <g key={i}>
              <line x1={padL} x2={w - 8} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeWidth="1" />
              <text x={padL - 6} y={y(v) + 3} textAnchor="end" className="fill-[var(--color-ink-3)]" fontSize="9">
                {formatY(v)}
              </text>
            </g>
          )
        })}

        {series.map((s) => {
          const pts = s.points.map((v, i) => `${x(i, s.points.length)},${y(v)}`)
          const area = `M ${padL},${y(0)} L ${pts.join(' L ')} L ${x(s.points.length - 1, s.points.length)},${y(0)} Z`
          const line = `M ${pts.join(' L ')}`
          return (
            <g key={s.label}>
              <path d={area} fill={`url(#${id}-${s.label.replace(/[^a-zA-Z0-9]/g, '')})`} />
              <path
                d={line}
                fill="none"
                stroke={TONE_HEX[s.tone].vivid}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={
                  t.reduced
                    ? undefined
                    : {
                        strokeDasharray: 2000,
                        strokeDashoffset: 2000,
                        animationName: 'chart-draw',
                        animationDuration: `${(1.1 / (t.duration || 1)) * 0.6}s`,
                        animationTimingFunction: 'ease-out',
                        animationFillMode: 'forwards',
                      }
                }
              />
              {s.points.map((v, i) => (
                <circle
                  key={i}
                  cx={x(i, s.points.length)}
                  cy={y(v)}
                  r="3.5"
                  fill="var(--color-paper)"
                  stroke={TONE_HEX[s.tone].vivid}
                  strokeWidth="2"
                />
              ))}
            </g>
          )
        })}

        {labels.map((l, i) => (
          <text
            key={l}
            x={x(i, labels.length)}
            y={height - 6}
            textAnchor="middle"
            className="fill-[var(--color-ink-3)]"
            fontSize="9"
          >
            {l}
          </text>
        ))}
      </svg>

      <style>{`@keyframes chart-draw { to { stroke-dashoffset: 0 } }`}</style>

      <ul className="mt-2 flex flex-wrap gap-4">
        {series.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5 text-xs text-ink-2">
            <span className="size-2.5 rounded-full" style={{ background: TONE_HEX[s.tone].vivid }} />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ══════════════════ Vertical bars ══════════════════ */

export function BarChart({
  data,
  height = 180,
  formatValue = (n: number) => String(n),
  className,
}: {
  data: { label: string; value: number; tone: Tone }[]
  height?: number
  formatValue?: (n: number) => string
  className?: string
}) {
  const max = Math.max(...data.map((d) => d.value)) || 1
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-stretch gap-2" style={{ height }}>
        {data.map((d, i) => (
          <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="font-mono tnum text-xs font-semibold text-ink">
              {formatValue(d.value)}
            </span>
            <div
              className="w-full rounded-t-lg transition-[height] duration-700 ease-[var(--ease-out-soft)]"
              style={{
                height: `${(d.value / max) * 100}%`,
                background: `linear-gradient(180deg, ${TONE_HEX[d.tone].vivid}, ${TONE_HEX[d.tone].solid})`,
                animationDelay: `${i * 60}ms`,
              }}
              title={`${d.label}: ${formatValue(d.value)}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[10px] text-ink-3">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════ Horizontal bars — rankings ══════════════════ */

export function HBarChart({
  data,
  labelWidth = 'w-28',
  showValue = true,
  suffix = '',
  className,
}: {
  data: { label: string; value: number; tone: Tone; hint?: string }[]
  labelWidth?: string
  showValue?: boolean
  suffix?: string
  className?: string
}) {
  const max = Math.max(...data.map((d) => d.value)) || 1
  return (
    <ul className={cn('space-y-2.5', className)}>
      {data.map((d, i) => (
        <li key={d.label} className="flex items-center gap-3">
          <span className={cn('shrink-0 truncate text-sm text-ink-2', labelWidth)} title={d.label}>
            {d.label}
          </span>
          <div className="h-6 flex-1 overflow-hidden rounded-lg bg-subtle">
            <div
              className="flex h-full items-center justify-end rounded-lg pr-2 transition-[width] duration-700 ease-[var(--ease-out-soft)]"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: `linear-gradient(90deg, ${TONE_HEX[d.tone].vivid}, ${TONE_HEX[d.tone].solid})`,
                transitionDelay: `${i * 55}ms`,
              }}
            >
              {showValue && (d.value / max) > 0.18 && (
                <span className="font-mono tnum text-[11px] font-semibold text-white">
                  {d.value}
                  {suffix}
                </span>
              )}
            </div>
          </div>
          {d.hint && <span className="w-14 shrink-0 text-right text-xs text-ink-3">{d.hint}</span>}
        </li>
      ))}
    </ul>
  )
}

/* ══════════════════ Donut ══════════════════ */

export function DonutChart({
  data,
  size = 140,
  centerLabel,
  centerValue,
  className,
}: {
  data: { label: string; value: number; tone: Tone }[]
  size?: number
  centerLabel?: string
  centerValue?: string
  className?: string
}) {
  const total = data.reduce((n, d) => n + d.value, 0) || 1
  let offset = 0

  return (
    <div className={cn('flex flex-wrap items-center gap-5', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 42 42" className="-rotate-90" style={{ width: size, height: size }}
          role="img" aria-label={data.map((d) => `${d.label} ${d.value}`).join(', ')}>
          <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="var(--color-subtle)" strokeWidth="5" />
          {data.map((d) => {
            const pct = (d.value / total) * 100
            const el = (
              <circle
                key={d.label}
                cx="21" cy="21" r="15.9"
                fill="transparent"
                stroke={TONE_HEX[d.tone].vivid}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0, pct - 1)} ${100 - pct + 1}`}
                strokeDashoffset={-offset}
              />
            )
            offset += pct
            return el
          })}
        </svg>
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              {centerValue && (
                <p className="font-mono tnum text-xl font-bold leading-none text-ink">{centerValue}</p>
              )}
              {centerLabel && <p className="mt-0.5 text-[10px] text-ink-3">{centerLabel}</p>}
            </div>
          </div>
        )}
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: TONE_HEX[d.tone].vivid }} />
            <span className="min-w-0 flex-1 truncate text-ink-2">{d.label}</span>
            <span className="font-mono tnum font-semibold text-ink">{d.value}</span>
            <span className="w-9 text-right font-mono tnum text-xs text-ink-3">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ══════════════════ Radial gauge — a single 0–100 score ══════════════════ */

export function RadialGauge({
  value,
  tone = 'indigo',
  size = 120,
  label,
  sublabel,
  className,
}: {
  value: number
  tone?: Tone
  size?: number
  label?: string
  sublabel?: string
  className?: string
}) {
  const r = 15.9
  const circumference = 2 * Math.PI * r
  const dash = (value / 100) * circumference

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 42 42" className="-rotate-90" style={{ width: size, height: size }}
        role="img" aria-label={`${label ?? 'Score'}: ${value} out of 100`}>
        <circle cx="21" cy="21" r={r} fill="transparent" stroke="var(--color-subtle)" strokeWidth="4.5" />
        <circle
          cx="21" cy="21" r={r}
          fill="transparent"
          stroke={TONE_HEX[tone].vivid}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 900ms var(--ease-out-soft)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p
            className={cn('font-mono tnum font-bold leading-none', size < 80 ? 'text-sm' : 'text-2xl')}
            style={{ color: TONE_HEX[tone].solid }}
          >
            {label ?? value}
          </p>
          {sublabel && (
            <p className={cn('text-ink-3', size < 80 ? 'text-[8px]' : 'mt-0.5 text-[10px]')}>{sublabel}</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════ Stacked progress — one bar, many parts ══════════════════ */

export function StackedBar({
  data,
  height = 10,
  className,
}: {
  data: { label: string; value: number; tone: Tone }[]
  height?: number
  className?: string
}) {
  const total = data.reduce((n, d) => n + d.value, 0) || 1
  return (
    <div className={className}>
      <div className="flex overflow-hidden rounded-full bg-subtle" style={{ height }}>
        {data.map((d) => (
          <div
            key={d.label}
            className="transition-[width] duration-700 ease-[var(--ease-out-soft)]"
            style={{ width: `${(d.value / total) * 100}%`, background: TONE_HEX[d.tone].vivid }}
            title={`${d.label}: ${d.value}`}
          />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-1.5 text-xs text-ink-2">
            <span className="size-2 rounded-full" style={{ background: TONE_HEX[d.tone].vivid }} />
            {d.label}
            <span className="font-mono tnum font-semibold text-ink">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
