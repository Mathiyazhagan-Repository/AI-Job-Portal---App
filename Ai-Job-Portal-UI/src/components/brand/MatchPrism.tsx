import * as React from 'react'
import { ChevronDown, Check, X, ShieldAlert, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { bandFor, SCORE_BANDS, type MatchBreakdownItem } from '@/lib/scoring'
import { useCountUp, useInView } from '@/hooks'
import { AIProvenanceChip } from './AIProvenanceChip'

/**
 * ⭐ THE HERO COMPONENT — DESIGN.md §7.1
 *
 * The product's whole thesis in one object: a score is never allowed to
 * render without its reasoning. PRD Parts 16.3 / 19 / 45 make this a
 * requirement, not a nicety — "Reasoning is never hidden behind a single
 * score", and the SAME explanation must be available for the lowest-ranked
 * candidate as for the highest.
 *
 * Three layouts, one implementation (DESIGN.md §6.5 — variants differ in
 * composition, never in logic):
 *   panel  → A · ring + expandable breakdown card
 *   inline → B · compact ring + dense row that expands in place
 *   ring   → C · oversized ring as the visual anchor
 */

export interface MatchPrismProps {
  score: number
  breakdown: MatchBreakdownItem[]
  matchedSkills?: string[]
  missingSkills?: string[]
  meetsHardRequirements?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  layout?: 'panel' | 'inline' | 'ring'
  defaultExpanded?: boolean
  /** Shown when the candidate profile is incomplete — PRD Part 16.6 cold start. */
  partial?: boolean
  className?: string
}

/* ════════════════════════════════════════════════════════════
   The ring — conic-gradient + an animated count-up.
   No canvas, no chart library, ~40 lines.
   ════════════════════════════════════════════════════════════ */

const RING_SIZES = {
  sm: { box: 44, stroke: 4, font: 'text-xs' },
  md: { box: 64, stroke: 5, font: 'text-sm' },
  lg: { box: 96, stroke: 7, font: 'text-xl' },
  xl: { box: 140, stroke: 9, font: 'text-4xl' },
}

export function ScoreRing({
  score,
  meetsHardRequirements = true,
  size = 'md',
  className,
}: {
  score: number
  meetsHardRequirements?: boolean
  size?: keyof typeof RING_SIZES
  className?: string
}) {
  const ring = useInView<HTMLDivElement>()
  const animated = useCountUp(score, 900, ring.inView)
  const band = bandFor(score, meetsHardRequirements)
  const meta = SCORE_BANDS[band]
  const { box, stroke, font } = RING_SIZES[size]

  const r = (box - stroke) / 2
  const circumference = 2 * Math.PI * r
  const dash = (animated / 100) * circumference

  return (
    <div
      ref={ring.ref}
      className={cn('relative shrink-0 grid place-items-center', className)}
      style={{ width: box, height: box }}
      role="img"
      aria-label={`Match score ${score} percent — ${meta.label}`}
    >
      <svg width={box} height={box} className="-rotate-90 overflow-visible">
        <circle
          cx={box / 2}
          cy={box / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-line"
        />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={r}
          fill="none"
          stroke={meta.hex}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 60ms linear' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span
          className={cn('font-mono tnum font-bold leading-none', font)}
          style={{ color: meta.hex }}
        >
          {meetsHardRequirements ? (
            animated
          ) : (
            <X className="size-[1em] stroke-[3]" aria-hidden />
          )}
          {meetsHardRequirements && <span className="text-[0.55em] align-top">%</span>}
        </span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   The breakdown — the reason this component exists.
   Weights come from props (PRD Part 16.2), never hardcoded here.
   ════════════════════════════════════════════════════════════ */

function BreakdownTable({
  breakdown,
  dense,
}: {
  breakdown: MatchBreakdownItem[]
  dense?: boolean
}) {
  const table = useInView<HTMLTableElement>()
  return (
    <table ref={table.ref} className="w-full text-sm">
      <caption className="sr-only">Match score breakdown by weighted component</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Component</th>
          <th scope="col">Weight</th>
          <th scope="col">Score</th>
        </tr>
      </thead>
      <tbody>
        {breakdown.map((item, i) => {
          const band = bandFor(item.score)
          return (
            <tr key={item.key} className="group">
              <th
                scope="row"
                className={cn(
                  'text-left font-normal text-ink-2 whitespace-nowrap',
                  dense ? 'py-1' : 'py-1.5',
                )}
              >
                {item.label}
              </th>
              <td className="w-12 text-right pr-3 font-mono tnum text-xs text-ink-3">
                {item.weight}%
              </td>
              <td className="w-full min-w-24">
                <div className="h-1.5 rounded-full bg-subtle overflow-hidden">
                  <div
                    className="h-full origin-left rounded-full"
                    style={{
                      width: `${item.score}%`,
                      backgroundColor: SCORE_BANDS[band].hex,
                      animationName: table.inView ? 'kairo-bar-grow' : 'none',
                      animationDuration: 'calc(620ms * var(--v-motion))',
                      animationTimingFunction: 'var(--v-ease)',
                      animationFillMode: 'both',
                      animationDelay: `calc(${i} * 55ms * var(--v-motion))`,
                    }}
                  />
                </div>
              </td>
              <td className="w-11 text-right pl-3 font-mono tnum text-xs font-semibold text-ink">
                {item.score}%
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function SkillLists({
  matched = [],
  missing = [],
}: {
  matched?: string[]
  missing?: string[]
}) {
  if (!matched.length && !missing.length) return null
  return (
    <div className="space-y-2 text-sm">
      {matched.length > 0 && (
        <div className="flex gap-2">
          <Check className="size-4 shrink-0 mt-0.5 text-score-elite" aria-hidden />
          <div>
            <span className="sr-only">Matched skills: </span>
            <span className="text-ink-2">{matched.join(' · ')}</span>
          </div>
        </div>
      )}
      {missing.length > 0 && (
        <div className="flex gap-2">
          <X className="size-4 shrink-0 mt-0.5 text-danger" aria-hidden />
          <div>
            <span className="sr-only">Missing required skills: </span>
            <span className="text-ink-2">{missing.join(' · ')}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function HardRequirementRow({ meets }: { meets: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm rounded-v-control px-2.5 py-1.5',
        meets ? 'bg-score-elite-bg text-score-elite' : 'bg-score-blocked-bg text-score-blocked',
      )}
    >
      {meets ? (
        <ShieldCheck className="size-4 shrink-0" aria-hidden />
      ) : (
        <ShieldAlert className="size-4 shrink-0" aria-hidden />
      )}
      <span className="font-medium">
        {meets ? 'Hard requirements: all met' : 'Does not meet minimum requirements'}
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MatchPrism
   ════════════════════════════════════════════════════════════ */

export function MatchPrism({
  score,
  breakdown,
  matchedSkills,
  missingSkills,
  meetsHardRequirements = true,
  size = 'md',
  layout = 'panel',
  defaultExpanded = false,
  partial,
  className,
}: MatchPrismProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded)
  const band = bandFor(score, meetsHardRequirements)
  const meta = SCORE_BANDS[band]
  const id = React.useId()

  /* ── C · ring only, oversized ── */
  if (layout === 'ring') {
    return (
      <div className={cn('flex flex-col items-center gap-3 text-center', className)}>
        <ScoreRing score={score} meetsHardRequirements={meetsHardRequirements} size={size} />
        <div>
          <p className="font-semibold text-ink" style={{ color: meta.hex }}>
            {meta.label}
          </p>
          {partial && (
            <p className="text-xs text-ink-3 mt-0.5">
              Partial match — complete your profile for better matches
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={id}
          className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
        >
          Why this score
          <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
        </button>
        {expanded && (
          <div id={id} className="w-full text-left space-y-3 animate-rise pt-1">
            <BreakdownTable breakdown={breakdown} />
            <SkillLists matched={matchedSkills} missing={missingSkills} />
            <HardRequirementRow meets={meetsHardRequirements} />
            <AIProvenanceChip what="ranked and explained this match" />
          </div>
        )}
      </div>
    )
  }

  /* ── B · inline, expands in place inside a dense table row ── */
  if (layout === 'inline') {
    return (
      <div className={cn('w-full', className)}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={id}
          className="group flex w-full items-center gap-2 text-left"
        >
          <ScoreRing score={score} meetsHardRequirements={meetsHardRequirements} size="sm" />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium truncate" style={{ color: meta.hex }}>
              {meta.label}
            </span>
            <span className="block text-xs text-ink-3">
              {breakdown[0]?.label} {breakdown[0]?.score}% · {breakdown[1]?.label}{' '}
              {breakdown[1]?.score}%
            </span>
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-ink-3 transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </button>
        {expanded && (
          <div
            id={id}
            className="mt-3 max-w-3xl space-y-3 border-t border-line pt-3 animate-scale-in"
          >
            {/* capped measure — a 1100px progress bar cannot be compared by eye */}
            <BreakdownTable breakdown={breakdown} dense />
            <SkillLists matched={matchedSkills} missing={missingSkills} />
            <HardRequirementRow meets={meetsHardRequirements} />
          </div>
        )}
      </div>
    )
  }

  /* ── A · panel (default) ── */
  return (
    <div
      className={cn(
        'rounded-v border-[length:var(--v-card-border)] border-line bg-paper overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center gap-4 p-v-card">
        <ScoreRing score={score} meetsHardRequirements={meetsHardRequirements} size={size} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold" style={{ color: meta.hex }}>
            <span aria-hidden className="mr-1 opacity-60">
              {meta.glyph}
            </span>
            {meta.label}
          </p>
          {partial ? (
            <p className="text-xs text-ink-3 mt-0.5 leading-snug">
              Partial match — complete your profile for better matches
            </p>
          ) : (
            <p className="text-xs text-ink-3 mt-0.5 leading-snug">
              Weighted across {breakdown.length} components
            </p>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={id}
            className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {expanded ? 'Hide' : 'Why this score'}
            <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {expanded && (
        <div
          id={id}
          className="border-t border-line bg-canvas/60 p-v-card space-y-3 animate-rise"
        >
          <BreakdownTable breakdown={breakdown} />
          <div className="border-t border-line pt-3">
            <SkillLists matched={matchedSkills} missing={missingSkills} />
          </div>
          <HardRequirementRow meets={meetsHardRequirements} />
        </div>
      )}
    </div>
  )
}
