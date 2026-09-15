/** ATS pipeline stages — PRD Part 10 / Part 24. */

export type Stage =
  | 'applied'
  | 'screening'
  | 'shortlisted'
  | 'assessment'
  | 'interview'
  | 'technical_interview'
  | 'hr_interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

export interface StageMeta {
  label: string
  short: string
  text: string
  bg: string
  hex: string
  terminal?: boolean
}

export const STAGES: Record<Stage, StageMeta> = {
  applied: { label: 'Applied', short: 'App', text: 'text-stage-applied', bg: 'bg-stage-applied-bg', hex: '#475569' },
  screening: { label: 'Screening', short: 'Scr', text: 'text-stage-screening', bg: 'bg-stage-screening-bg', hex: '#0e7490' },
  shortlisted: { label: 'Shortlisted', short: 'Sho', text: 'text-stage-shortlisted', bg: 'bg-stage-shortlisted-bg', hex: '#1d4ed8' },
  assessment: { label: 'Assessment', short: 'Ass', text: 'text-stage-assessment', bg: 'bg-stage-assessment-bg', hex: '#4338ca' },
  interview: { label: 'Interview', short: 'Int', text: 'text-stage-interview', bg: 'bg-stage-interview-bg', hex: '#6d28d9' },
  technical_interview: { label: 'Technical', short: 'Tec', text: 'text-stage-tech', bg: 'bg-stage-tech-bg', hex: '#7e22ce' },
  hr_interview: { label: 'HR round', short: 'HR', text: 'text-stage-hr', bg: 'bg-stage-hr-bg', hex: '#a21caf' },
  offer: { label: 'Offer', short: 'Off', text: 'text-stage-offer', bg: 'bg-stage-offer-bg', hex: '#b45309' },
  hired: { label: 'Hired', short: 'Hir', text: 'text-stage-hired', bg: 'bg-stage-hired-bg', hex: '#047857' },
  rejected: { label: 'Rejected', short: 'Rej', text: 'text-stage-rejected', bg: 'bg-stage-rejected-bg', hex: '#b91c1c', terminal: true },
  withdrawn: { label: 'Withdrawn', short: 'Wdn', text: 'text-stage-withdrawn', bg: 'bg-stage-withdrawn-bg', hex: '#64748b', terminal: true },
}

/** The 9 active stages in order — the StageRail renders exactly these. */
export const ACTIVE_STAGES: Stage[] = [
  'applied',
  'screening',
  'shortlisted',
  'assessment',
  'interview',
  'technical_interview',
  'hr_interview',
  'offer',
  'hired',
]

export function stageIndex(stage: Stage): number {
  return ACTIVE_STAGES.indexOf(stage)
}
