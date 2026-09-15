import * as React from 'react'
import {
  ChartLine, ChartArea, ChartSpline, ChartColumn, ChartColumnStacked,
  ChartBar, Donut, ChartPie, Radar as RadarIcon, ChartNoAxesColumn,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTempo } from '@/components/motion'
import { TONE_HEX, type Series } from './charts'

/**
 * One dataset, nine ways of looking at it.
 *
 * The same `series` + `labels` drive every type, so switching is purely a
 * change of representation — no re-fetch, no different numbers. That matters
 * for honesty as much as for code: a reader flipping from Columns to Pie has
 * to be looking at the same data, not a different slice of it.
 *
 * The three radial types (donut, pie, radar) cannot show a time axis, so they
 * aggregate: donut and pie plot each series' total over the whole period,
 * radar plots every period as its own spoke. Each one says so in its caption
 * rather than quietly changing what the numbers mean.
 */

export type ChartType =
  | 'line' | 'area' | 'smooth'
  | 'columns' | 'stacked' | 'bars'
  | 'donut' | 'pie' | 'radar'

export const CHART_TYPES: {
  id: ChartType
  label: string
  icon: React.ElementType
  /** Shown under the chart when the type changes what the data means. */
  note?: string
}[] = [
  { id: 'line', label: 'Line', icon: ChartLine },
  { id: 'area', label: 'Area', icon: ChartArea },
  { id: 'smooth', label: 'Smooth', icon: ChartSpline },
  { id: 'columns', label: 'Columns', icon: ChartColumn },
  { id: 'stacked', label: 'Stacked', icon: ChartColumnStacked, note: 'Series are summed on top of each other.' },
  { id: 'bars', label: 'Bars', icon: ChartBar },
  { id: 'donut', label: 'Donut', icon: Donut, note: 'Totals for the whole period — the time axis is not shown.' },
  { id: 'pie', label: 'Pie', icon: ChartPie, note: 'Totals for the whole period — the time axis is not shown.' },
  { id: 'radar', label: 'Radar', icon: RadarIcon, note: 'Each period is a spoke; the shape shows where a series peaks.' },
]

const clean = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '')

/* ══════════════════ the picker ══════════════════ */

export function ChartTypePicker({
  value,
  onChange,
  className,
}: {
  value: ChartType
  onChange: (t: ChartType) => void
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const root = React.useRef<HTMLDivElement>(null)

  // close on outside click and on Escape — a popover that traps you is worse
  // than no popover
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = CHART_TYPES.find((t) => t.id === value) ?? CHART_TYPES[0]

  return (
    <div ref={root} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Chart type: ${current.label}. Change it`}
        className={cn(
          'grid size-9 place-items-center rounded-v-control transition-v',
          open
            ? 'bg-tone-violet-vivid text-white shadow-md ring-2 ring-ink/10'
            : 'bg-[var(--color-tone-violet-bg)] text-tone-violet hover:brightness-95',
        )}
      >
        <ChartNoAxesColumn className="size-4.5" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Visualise as"
          className="absolute right-0 z-30 mt-2 w-[268px] rounded-v border border-line bg-paper p-3 shadow-lg"
        >
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            Visualise as
          </p>
          <div className="grid grid-cols-3 gap-2">
            {CHART_TYPES.map((t) => {
              const on = t.id === value
              return (
                <button
                  key={t.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={on}
                  onClick={() => {
                    onChange(t.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-v-control border px-2 py-3 text-xs font-medium transition-v',
                    on
                      ? 'border-transparent bg-tone-violet-vivid text-white shadow-sm'
                      : 'border-line bg-paper text-ink-2 hover:border-line-strong hover:bg-hover',
                  )}
                >
                  <t.icon className="size-4.5" aria-hidden />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════ shared geometry ══════════════════ */

const W = 600

function useAxis(series: Series[], height: number, stacked = false) {
  const padL = 38
  const padB = 22
  const padT = 8
  const innerW = W - padL - 8
  const innerH = height - padB - padT

  const peak = stacked
    ? Math.max(
        ...(series[0]?.points ?? [0]).map((_, i) =>
          series.reduce((sum, s) => sum + (s.points[i] ?? 0), 0),
        ),
      )
    : Math.max(...series.flatMap((s) => s.points))

  const max = (peak || 1) * 1.1
  return {
    padL, padB, padT, innerW, innerH, max,
    x: (i: number, n: number) => padL + (i / Math.max(1, n - 1)) * innerW,
    y: (v: number) => padT + innerH - (v / max) * innerH,
  }
}

function Guides({
  ax, yTicks, formatY, height,
}: {
  ax: ReturnType<typeof useAxis>
  yTicks: number
  formatY: (n: number) => string
  height: number
}) {
  return (
    <>
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const v = (ax.max / yTicks) * i
        return (
          <g key={i}>
            <line x1={ax.padL} x2={W - 8} y1={ax.y(v)} y2={ax.y(v)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={ax.padL - 6} y={ax.y(v) + 3} textAnchor="end" className="fill-[var(--color-ink-3)]" fontSize="9">
              {formatY(v)}
            </text>
          </g>
        )
      })}
      <line x1={ax.padL} x2={W - 8} y1={height - ax.padB} y2={height - ax.padB} stroke="var(--color-line-strong)" strokeWidth="1" />
    </>
  )
}

function XLabels({
  labels, ax, height, centred = false,
}: {
  labels: string[]
  ax: ReturnType<typeof useAxis>
  height: number
  /** Columns sit in slots, not on points — their labels centre differently. */
  centred?: boolean
}) {
  const slot = ax.innerW / Math.max(labels.length, 1)
  const at = (i: number) =>
    centred ? ax.padL + slot * i + slot / 2 : ax.x(i, labels.length)

  return (
    <>
      {labels.map((l, i) => (
        <text
          key={l + i}
          x={at(i)}
          y={height - 6}
          textAnchor="middle"
          className="fill-[var(--color-ink-3)]"
          fontSize="9"
        >
          {l}
        </text>
      ))}
    </>
  )
}

/** Catmull-Rom through the points, emitted as cubic beziers. */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

/* ══════════════════ the chart ══════════════════ */

export function SeriesChart({
  series,
  labels,
  type,
  height = 230,
  yTicks = 4,
  formatY = (n: number) => String(Math.round(n)),
  className,
}: {
  series: Series[]
  labels: string[]
  type: ChartType
  height?: number
  yTicks?: number
  formatY?: (n: number) => string
  className?: string
}) {
  const t = useTempo()
  const uid = clean(React.useId())
  const stacked = type === 'stacked'
  const ax = useAxis(series, height, stacked)

  const totals = series.map((s) => s.points.reduce((a, b) => a + b, 0))
  const grand = totals.reduce((a, b) => a + b, 0) || 1
  const note = CHART_TYPES.find((c) => c.id === type)?.note

  const label = `${series.map((s) => s.label).join(' and ')} across ${labels.join(', ')}`

  const draw = t.reduced
    ? undefined
    : {
        strokeDasharray: 2000,
        strokeDashoffset: 2000,
        animation: `chart-draw ${(1.1 / (t.duration || 1)) * 0.6}s ease-out forwards`,
      }

  /* ── cartesian: line / area / smooth ── */
  function renderCurve() {
    return series.map((s) => {
      const pts = s.points.map((v, i) => ({ x: ax.x(i, s.points.length), y: ax.y(v) }))
      const path = type === 'smooth' ? smoothPath(pts) : `M ${pts.map((p) => `${p.x},${p.y}`).join(' L ')}`
      const base = ax.y(0)
      const fill =
        type === 'line'
          ? null
          : `${path} L ${pts[pts.length - 1].x},${base} L ${pts[0].x},${base} Z`

      return (
        <g key={s.label}>
          {fill && <path d={fill} fill={`url(#${uid}-${clean(s.label)})`} />}
          <path
            d={path}
            fill="none"
            stroke={TONE_HEX[s.tone].vivid}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={draw}
          />
          {s.points.map((v, i) => (
            <circle
              key={i}
              cx={ax.x(i, s.points.length)}
              cy={ax.y(v)}
              r="3.5"
              fill="var(--color-paper)"
              stroke={TONE_HEX[s.tone].vivid}
              strokeWidth="2"
            />
          ))}
        </g>
      )
    })
  }

  /* ── grouped or stacked columns ── */
  function renderColumns() {
    const n = labels.length
    const slot = ax.innerW / Math.max(n, 1)
    const groupW = slot * 0.62
    const barW = stacked ? groupW : groupW / series.length

    return labels.map((_, i) => {
      const left = ax.padL + slot * i + (slot - groupW) / 2
      let stackTop = ax.y(0)

      return (
        <g key={i}>
          {series.map((s, si) => {
            const v = s.points[i] ?? 0
            const h = ((v / ax.max) * ax.innerH) || 0
            const x = stacked ? left : left + si * barW
            const y = stacked ? stackTop - h : ax.y(v)
            if (stacked) stackTop -= h
            return (
              <rect
                key={s.label}
                x={x}
                y={y}
                width={Math.max(barW - (stacked ? 0 : 2), 1)}
                height={Math.max(h, 0)}
                rx={stacked ? 0 : 3}
                fill={TONE_HEX[s.tone].vivid}
                style={
                  t.reduced
                    ? undefined
                    : {
                        transformOrigin: `center ${ax.y(0)}px`,
                        animationName: 'chart-grow',
                        animationDuration: `${0.5 / (t.duration || 1)}s`,
                        animationTimingFunction: 'var(--v-ease)',
                        animationFillMode: 'both',
                        animationDelay: `${i * 40}ms`,
                      }
                }
              >
                <title>{`${s.label} · ${labels[i]}: ${v}`}</title>
              </rect>
            )
          })}
        </g>
      )
    })
  }

  /* ── horizontal bars, grouped by period ── */
  function renderBars() {
    const n = labels.length
    const rowH = (height - 16) / Math.max(n, 1)
    const groupH = rowH * 0.62
    const barH = groupH / series.length
    const left = 46
    const usable = W - left - 40
    const max = Math.max(...series.flatMap((s) => s.points)) || 1

    return labels.map((l, i) => (
      <g key={l + i}>
        <text x={left - 6} y={8 + rowH * i + groupH / 2 + 3} textAnchor="end" className="fill-[var(--color-ink-3)]" fontSize="9">
          {l}
        </text>
        {series.map((s, si) => {
          const v = s.points[i] ?? 0
          const w = (v / max) * usable
          return (
            <g key={s.label}>
              <rect
                x={left}
                y={8 + rowH * i + si * barH}
                width={Math.max(w, 1)}
                height={Math.max(barH - 2, 1)}
                rx="2"
                fill={TONE_HEX[s.tone].vivid}
                style={
                  t.reduced
                    ? undefined
                    : {
                        transformOrigin: `${left}px center`,
                        animationName: 'chart-grow-x',
                        animationDuration: `${0.5 / (t.duration || 1)}s`,
                        animationTimingFunction: 'var(--v-ease)',
                        animationFillMode: 'both',
                        animationDelay: `${i * 40}ms`,
                      }
                }
              >
                <title>{`${s.label} · ${l}: ${v}`}</title>
              </rect>
              <text
                x={left + Math.max(w, 1) + 4}
                y={8 + rowH * i + si * barH + barH / 2 + 2}
                className="fill-[var(--color-ink-3)] font-mono"
                fontSize="8"
              >
                {v}
              </text>
            </g>
          )
        })}
      </g>
    ))
  }

  /* ── donut / pie ── */
  function renderRadial() {
    const r = Math.min(height, 260) / 2 - 14
    const cx = W / 2
    const cy = height / 2
    const inner = type === 'donut' ? r * 0.58 : 0
    let angle = -Math.PI / 2

    const arc = (frac: number) => {
      const a0 = angle
      const a1 = angle + frac * Math.PI * 2
      angle = a1
      const large = a1 - a0 > Math.PI ? 1 : 0
      const p = (rad: number, a: number) => `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`
      if (inner === 0) {
        return `M ${cx},${cy} L ${p(r, a0)} A ${r},${r} 0 ${large} 1 ${p(r, a1)} Z`
      }
      return `M ${p(r, a0)} A ${r},${r} 0 ${large} 1 ${p(r, a1)} L ${p(inner, a1)} A ${inner},${inner} 0 ${large} 0 ${p(inner, a0)} Z`
    }

    return (
      <>
        {series.map((s, i) => (
          <path key={s.label} d={arc(totals[i] / grand)} fill={TONE_HEX[s.tone].vivid} stroke="var(--color-paper)" strokeWidth="2">
            <title>{`${s.label}: ${totals[i]} (${Math.round((totals[i] / grand) * 100)}%)`}</title>
          </path>
        ))}
        {type === 'donut' && (
          <>
            <text x={cx} y={cy - 2} textAnchor="middle" className="fill-[var(--color-ink)] font-mono" fontSize="20" fontWeight="700">
              {grand}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" className="fill-[var(--color-ink-3)]" fontSize="9">
              total
            </text>
          </>
        )}
      </>
    )
  }

  /* ── radar ── */
  function renderRadar() {
    const r = Math.min(height, 260) / 2 - 22
    const cx = W / 2
    const cy = height / 2
    const n = labels.length
    const max = Math.max(...series.flatMap((s) => s.points)) || 1
    const at = (i: number, v: number) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2
      const rad = (v / max) * r
      return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`
    }

    return (
      <>
        {/* web */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon
            key={f}
            points={labels.map((_, i) => at(i, max * f)).join(' ')}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="1"
          />
        ))}
        {labels.map((l, i) => (
          <g key={l + i}>
            <line x1={cx} y1={cy} x2={at(i, max).split(',')[0]} y2={at(i, max).split(',')[1]} stroke="var(--color-line)" strokeWidth="1" />
            <text
              x={cx + (r + 12) * Math.cos(-Math.PI / 2 + (i / n) * Math.PI * 2)}
              y={cy + (r + 12) * Math.sin(-Math.PI / 2 + (i / n) * Math.PI * 2) + 3}
              textAnchor="middle"
              className="fill-[var(--color-ink-3)]"
              fontSize="9"
            >
              {l}
            </text>
          </g>
        ))}
        {series.map((s) => (
          <polygon
            key={s.label}
            points={s.points.map((v, i) => at(i, v)).join(' ')}
            fill={TONE_HEX[s.tone].vivid}
            fillOpacity="0.18"
            stroke={TONE_HEX[s.tone].vivid}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ))}
      </>
    )
  }

  const cartesian = type === 'line' || type === 'area' || type === 'smooth'
  const columnar = type === 'columns' || type === 'stacked'

  return (
    <div className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={label}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.label} id={`${uid}-${clean(s.label)}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TONE_HEX[s.tone].vivid} stopOpacity="0.35" />
              <stop offset="100%" stopColor={TONE_HEX[s.tone].vivid} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>

        {(cartesian || columnar) && (
          <>
            <Guides ax={ax} yTicks={yTicks} formatY={formatY} height={height} />
            <XLabels labels={labels} ax={ax} height={height} centred={columnar} />
          </>
        )}

        {cartesian && renderCurve()}
        {columnar && renderColumns()}
        {type === 'bars' && renderBars()}
        {(type === 'donut' || type === 'pie') && renderRadial()}
        {type === 'radar' && renderRadar()}
      </svg>

      <style>{`
        @keyframes chart-draw { to { stroke-dashoffset: 0 } }
        @keyframes chart-grow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        @keyframes chart-grow-x { from { transform: scaleX(0) } to { transform: scaleX(1) } }
      `}</style>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <ul className="flex flex-wrap gap-4">
          {series.map((s, i) => (
            <li key={s.label} className="flex items-center gap-1.5 text-xs text-ink-2">
              <span className="size-2.5 rounded-full" style={{ background: TONE_HEX[s.tone].vivid }} />
              {s.label}
              {(type === 'donut' || type === 'pie') && (
                <span className="font-mono tnum font-semibold text-ink">
                  {totals[i]} · {Math.round((totals[i] / grand) * 100)}%
                </span>
              )}
            </li>
          ))}
        </ul>
        {/* the radial types change what the numbers mean, so they say so */}
        {note && <p className="text-[11px] text-ink-3">{note}</p>}
      </div>
    </div>
  )
}
