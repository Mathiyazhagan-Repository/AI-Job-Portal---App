import * as React from 'react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/overlay'
import type { Variant } from '@/hooks'

/**
 * ⭐ DESIGN.md §7.2 — Skill Constellation
 *
 * Candidate ↔ job skills as concentric rings instead of a chip list:
 *   inner  · matched          (solid)
 *   middle · missing required (dashed outline)
 *   outer  · bonus skills     (ghost)
 *
 * Pure SVG, no dependency. Direction B degrades to two dense chip
 * rows — faster to scan when you're triaging 200 candidates.
 */

export interface SkillNode {
  name: string
  years?: number
  proficiency?: string
}

export interface SkillConstellationProps {
  matched: SkillNode[]
  missing: SkillNode[]
  bonus?: SkillNode[]
  variant?: Variant
  size?: number
  className?: string
}

function ring(count: number, radius: number, cx: number, cy: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2 + offset
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }
  })
}

export function SkillConstellation({
  matched,
  missing,
  bonus = [],
  variant = 'a',
  size = 260,
  className,
}: SkillConstellationProps) {
  /* ── B · dense chip rows ── */
  if (variant === 'b') {
    return (
      <div className={cn('space-y-2 text-sm', className)}>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-xs font-medium text-score-elite shrink-0">✓ Matched</span>
          {matched.map((s) => (
            <span key={s.name} className="text-ink-2">
              {s.name}
              {s.years ? <span className="text-ink-3 font-mono text-xs"> {s.years}y</span> : null}
            </span>
          ))}
        </div>
        {missing.length > 0 && (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xs font-medium text-danger shrink-0">✕ Missing</span>
            {missing.map((s) => (
              <span key={s.name} className="text-ink-2">
                {s.name}
              </span>
            ))}
          </div>
        )}
        {bonus.length > 0 && (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xs font-medium text-ink-3 shrink-0">+ Bonus</span>
            {bonus.map((s) => (
              <span key={s.name} className="text-ink-3">
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ── A / C · the constellation ── */
  const cx = size / 2
  const cy = size / 2
  const rMatched = size * 0.19
  const rMissing = size * 0.32
  const rBonus = size * 0.44

  const matchedPts = ring(matched.length, rMatched, cx, cy)
  const missingPts = ring(missing.length, rMissing, cx, cy, 0.4)
  const bonusPts = ring(bonus.length, rBonus, cx, cy, 0.8)

  const nodeR = variant === 'c' ? 7 : 6

  return (
    <div className={cn('relative select-none', className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={`Skill overlap: ${matched.length} matched, ${missing.length} missing required, ${bonus.length} bonus`}
      >
        {/* orbit guides */}
        {[rMatched, rMissing, rBonus].map((r, i) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="1"
            strokeDasharray={i === 1 ? '3 4' : undefined}
          />
        ))}

        {/* spokes from centre to matched */}
        {matchedPts.map((p, i) => (
          <line
            key={`spoke-${i}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="var(--color-score-elite)"
            strokeWidth="1"
            opacity="0.25"
          />
        ))}

        {/* centre — the job */}
        <circle cx={cx} cy={cy} r={size * 0.075} fill="var(--color-brand-600)" />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          className="fill-white font-mono font-bold"
          fontSize={size * 0.06}
        >
          {matched.length}/{matched.length + missing.length}
        </text>
      </svg>

      {/* HTML nodes on top — so they get tooltips and keyboard focus */}
      {[
        ...matched.map((s, i) => ({ s, p: matchedPts[i], kind: 'matched' as const })),
        ...missing.map((s, i) => ({ s, p: missingPts[i], kind: 'missing' as const })),
        ...bonus.map((s, i) => ({ s, p: bonusPts[i], kind: 'bonus' as const })),
      ].map(({ s, p, kind }) => (
        <Tooltip
          key={`${kind}-${s.name}`}
          content={
            <span>
              <strong>{s.name}</strong>
              {s.years ? ` · ${s.years} yrs` : ''}
              {s.proficiency ? ` · ${s.proficiency}` : ''}
              <span className="block text-white/70">
                {kind === 'matched'
                  ? 'Matched required skill'
                  : kind === 'missing'
                    ? 'Required — not found in profile'
                    : 'Bonus skill'}
              </span>
            </span>
          }
        >
          <button
            type="button"
            className={cn(
              'absolute grid place-items-center rounded-full transition-transform hover:scale-125 focus-visible:scale-125',
              kind === 'matched' && 'bg-score-elite',
              kind === 'missing' && 'bg-paper border-2 border-dashed border-danger',
              kind === 'bonus' && 'bg-line-strong',
            )}
            style={{
              width: nodeR * 2,
              height: nodeR * 2,
              left: p.x - nodeR,
              top: p.y - nodeR,
            }}
            aria-label={`${s.name} — ${kind}`}
          />
        </Tooltip>
      ))}

      {/* legend */}
      <div className="absolute inset-x-0 -bottom-1 flex justify-center gap-3 text-[11px] text-ink-3">
        <span className="inline-flex items-center gap-1">
          <i className="size-2 rounded-full bg-score-elite" /> matched
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="size-2 rounded-full border border-dashed border-danger" /> missing
        </span>
        {bonus.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <i className="size-2 rounded-full bg-line-strong" /> bonus
          </span>
        )}
      </div>
    </div>
  )
}
