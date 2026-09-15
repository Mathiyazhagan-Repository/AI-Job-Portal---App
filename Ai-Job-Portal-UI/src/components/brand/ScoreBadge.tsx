import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { bandFor, SCORE_BANDS } from '@/lib/scoring'

/**
 * Score is NEVER communicated by colour alone (PRD Part 42).
 * Every badge carries colour + numeral + shape glyph, and an
 * aria-label with the written band name.
 */
const scoreBadge = cva(
  'inline-flex items-center gap-1 rounded-full font-mono tnum font-semibold ring-1 ring-inset whitespace-nowrap',
  {
    variants: {
      band: {
        elite: 'bg-score-elite-bg text-score-elite ring-score-elite/20',
        strong: 'bg-score-strong-bg text-score-strong ring-score-strong/20',
        fair: 'bg-score-fair-bg text-score-fair ring-score-fair/20',
        low: 'bg-score-low-bg text-score-low ring-score-low/20',
        blocked: 'bg-score-blocked-bg text-score-blocked ring-score-blocked/20 line-through',
      },
      size: {
        sm: 'h-5.5 px-1.5 text-[11px]',
        md: 'h-6.5 px-2 text-xs',
        lg: 'h-8 px-2.5 text-sm',
      },
    },
    defaultVariants: { band: 'low', size: 'md' },
  },
)

export interface ScoreBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>,
    Pick<VariantProps<typeof scoreBadge>, 'size'> {
  score: number
  meetsHardRequirements?: boolean
  showLabel?: boolean
}

export function ScoreBadge({
  score,
  meetsHardRequirements = true,
  size,
  showLabel,
  className,
  ...props
}: ScoreBadgeProps) {
  const band = bandFor(score, meetsHardRequirements)
  const meta = SCORE_BANDS[band]

  return (
    <span
      className={cn(scoreBadge({ band, size }), className)}
      aria-label={`${score} percent — ${meta.label}`}
      {...props}
    >
      <span aria-hidden className="opacity-70">
        {meta.glyph}
      </span>
      {score}%
      {showLabel && <span className="font-sans font-medium ml-0.5">{meta.label}</span>}
    </span>
  )
}
