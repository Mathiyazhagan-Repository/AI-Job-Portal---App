/**
 * The single source of truth for match-score presentation.
 * Weights mirror PRD Part 16.2 exactly.
 *
 * Score is NEVER communicated by colour alone (PRD Part 42) —
 * every band carries a colour, a label AND a shape glyph.
 */

export type ScoreBand = 'elite' | 'strong' | 'fair' | 'low' | 'blocked'

export interface BandMeta {
  label: string
  glyph: string
  text: string
  bg: string
  ring: string
  /** hex, for the SVG conic ring which cannot read Tailwind classes */
  hex: string
}

export const SCORE_BANDS: Record<ScoreBand, BandMeta> = {
  elite: {
    label: 'Excellent match',
    glyph: '●',
    text: 'text-score-elite',
    bg: 'bg-score-elite-bg',
    ring: 'ring-score-elite/20',
    hex: '#047857',
  },
  strong: {
    label: 'Strong match',
    glyph: '◆',
    text: 'text-score-strong',
    bg: 'bg-score-strong-bg',
    ring: 'ring-score-strong/20',
    hex: '#1d4ed8',
  },
  fair: {
    label: 'Partial match',
    glyph: '▲',
    text: 'text-score-fair',
    bg: 'bg-score-fair-bg',
    ring: 'ring-score-fair/20',
    hex: '#b45309',
  },
  low: {
    label: 'Low match',
    glyph: '○',
    text: 'text-score-low',
    bg: 'bg-score-low-bg',
    ring: 'ring-score-low/20',
    hex: '#475569',
  },
  blocked: {
    label: 'Does not meet minimum requirements',
    glyph: '✕',
    text: 'text-score-blocked',
    bg: 'bg-score-blocked-bg',
    ring: 'ring-score-blocked/20',
    hex: '#7e22ce',
  },
}

export function bandFor(score: number, meetsHardRequirements = true): ScoreBand {
  if (!meetsHardRequirements) return 'blocked'
  if (score >= 90) return 'elite'
  if (score >= 75) return 'strong'
  if (score >= 60) return 'fair'
  return 'low'
}

/** PRD Part 16.2 default weights. Passed into MatchPrism, never hardcoded there. */
export const MATCH_WEIGHTS = [
  { key: 'skills', label: 'Skills match', weight: 35 },
  { key: 'experience', label: 'Experience match', weight: 20 },
  { key: 'location', label: 'Location match', weight: 15 },
  { key: 'education', label: 'Education match', weight: 10 },
  { key: 'title', label: 'Job-title relevance', weight: 10 },
  { key: 'preferences', label: 'Preferences', weight: 10 },
] as const

export interface MatchBreakdownItem {
  key: string
  label: string
  weight: number
  score: number
}

/** Compose a full breakdown from per-component sub-scores. */
export function buildBreakdown(scores: Record<string, number>): MatchBreakdownItem[] {
  return MATCH_WEIGHTS.map((w) => ({
    key: w.key,
    label: w.label,
    weight: w.weight,
    score: scores[w.key] ?? 0,
  }))
}

export function weightedTotal(breakdown: MatchBreakdownItem[]): number {
  const total = breakdown.reduce((sum, b) => sum + (b.score * b.weight) / 100, 0)
  return Math.round(total)
}
