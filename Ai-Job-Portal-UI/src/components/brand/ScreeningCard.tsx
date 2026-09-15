import { Check, X, MapPin, Briefcase, GraduationCap, IndianRupee, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MatchPrism } from './MatchPrism'
import { SkillConstellation } from './SkillConstellation'
import { AIProvenanceChip } from './AIProvenanceChip'
import { Avatar } from '@/components/ui/controls'
import { Button } from '@/components/ui/button'
import { StagePill } from './StageRail'
import type { Applicant } from '@/data/mock'
import type { Variant } from '@/hooks'

/**
 * ⭐ DESIGN.md §16.2 — the Screening Card (PRD Part 19)
 *
 * Every explanatory element the PRD demands, in one panel:
 *   overall % · required skills matched/missing (explicit lists, not a
 *   percentage) · experience narrative · education · location · salary
 *   compatibility · title relevance · AI strengths · AI concerns.
 *
 * The same card renders for the #1 and the #200 candidate — PRD Part 19
 * requires the identical explanation at every rank.
 */
export function ScreeningCard({
  applicant,
  variant = 'a',
  onShortlist,
  onReject,
  className,
}: {
  applicant: Applicant
  variant?: Variant
  onShortlist?: () => void
  onReject?: () => void
  className?: string
}) {
  const facts = [
    {
      icon: Briefcase,
      label: 'Experience',
      value: applicant.experienceNarrative,
      ok: applicant.breakdown.find((b) => b.key === 'experience')!.score >= 70,
    },
    {
      icon: GraduationCap,
      label: 'Education',
      value: applicant.education,
      ok: applicant.breakdown.find((b) => b.key === 'education')!.score >= 70,
    },
    {
      icon: MapPin,
      label: 'Location',
      value: applicant.locationNarrative,
      ok: applicant.breakdown.find((b) => b.key === 'location')!.score >= 70,
    },
    {
      icon: IndianRupee,
      label: 'Salary',
      value: applicant.salaryNarrative,
      ok: applicant.salaryCompatible,
    },
    {
      icon: Target,
      label: 'Title relevance',
      value: applicant.titleNarrative,
      ok: applicant.breakdown.find((b) => b.key === 'title')!.score >= 70,
    },
  ]

  return (
    <div className={cn('flex flex-col min-h-0', className)}>
      {/* Header */}
      <div className="flex items-start gap-3 p-v-card border-b border-line shrink-0">
        <Avatar name={applicant.name} id={applicant.id} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-ink truncate">{applicant.name}</h3>
          <p className="text-sm text-ink-2 truncate">{applicant.headline}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <StagePill stage={applicant.stage} size="sm" />
            <span className="text-xs text-ink-3">Applied {applicant.appliedAgo}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-v-card space-y-5">
        {/* The score, with its reasoning attached */}
        <MatchPrism
          score={applicant.score}
          breakdown={applicant.breakdown}
          matchedSkills={applicant.matchedSkills.map((s) => s.name)}
          missingSkills={applicant.missingSkills.map((s) => s.name)}
          meetsHardRequirements={applicant.meetsHardRequirements}
          layout={variant === 'b' ? 'inline' : 'panel'}
          size={variant === 'c' ? 'lg' : 'md'}
          defaultExpanded
        />

        {/* Explicit fact list — narrative, not just numbers (PRD Part 19) */}
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2">
            Requirement checks
          </h4>
          <ul className="space-y-1.5">
            {facts.map((f) => (
              <li key={f.label} className="flex items-start gap-2 text-sm">
                <span
                  className={cn(
                    'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full',
                    f.ok ? 'bg-score-elite-bg text-score-elite' : 'bg-warning-bg text-warning',
                  )}
                >
                  {f.ok ? (
                    <Check className="size-2.5 stroke-[3]" aria-hidden />
                  ) : (
                    <X className="size-2.5 stroke-[3]" aria-hidden />
                  )}
                </span>
                <span className="text-ink-2">
                  <span className="text-ink-3">{f.label}: </span>
                  {f.value}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Skills overlap */}
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2">
            Skill overlap
          </h4>
          {variant === 'b' ? (
            <SkillConstellation
              variant="b"
              matched={applicant.matchedSkills}
              missing={applicant.missingSkills}
              bonus={applicant.bonusSkills}
            />
          ) : (
            <div className="flex justify-center pb-5">
              <SkillConstellation
                variant={variant}
                matched={applicant.matchedSkills}
                missing={applicant.missingSkills}
                bonus={applicant.bonusSkills}
                size={220}
              />
            </div>
          )}
        </section>

        {/* AI strengths & concerns — grounded only in structured profile data */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-3">
              AI summary
            </h4>
            <AIProvenanceChip what="wrote this summary from structured profile data only" />
          </div>

          <div className="rounded-v-control bg-score-elite-bg/60 p-3">
            <p className="text-xs font-semibold text-score-elite mb-1.5">Strengths</p>
            <ul className="space-y-1 text-sm text-ink-2">
              {applicant.strengths.map((s) => (
                <li key={s} className="flex gap-1.5">
                  <span aria-hidden className="text-score-elite">
                    ·
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-v-control bg-warning-bg/60 p-3">
            <p className="text-xs font-semibold text-warning mb-1.5">Potential concerns</p>
            <ul className="space-y-1 text-sm text-ink-2">
              {applicant.concerns.map((c) => (
                <li key={c} className="flex gap-1.5">
                  <span aria-hidden className="text-warning">
                    ·
                  </span>
                  {c}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-ink-3 mt-2 leading-snug">
              Concerns are drawn from missing skills and experience gaps only — never inferred
              personal characteristics.
            </p>
          </div>
        </section>
      </div>

      {/* Actions — the human decision */}
      <div className="shrink-0 border-t border-line p-3 flex items-center gap-2 bg-paper">
        <Button variant="primary" size="sm" className="flex-1" onClick={onShortlist}>
          Shortlist
          <kbd className="ml-1 rounded bg-white/20 px-1 font-mono text-[10px]">S</kbd>
        </Button>
        <Button variant="secondary" size="sm" className="flex-1" onClick={onReject}>
          Reject
          <kbd className="ml-1 rounded bg-subtle px-1 font-mono text-[10px]">R</kbd>
        </Button>
      </div>
    </div>
  )
}
