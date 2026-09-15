import * as React from 'react'
import { Link } from 'react-router'
import {
  MapPin, Briefcase, Clock, Bookmark, Users, IndianRupee, FileText,
  MousePointerClick, BadgeCheck, ChevronLeft, ChevronRight, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { salaryLPA, experienceRange, relativeTime, titleCase } from '@/lib/format'
import { type Job } from '@/data/mock'
import { ScoreRing, ScoreBadge, RecommendationReason } from '@/components/brand'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Variant } from '@/hooks'
import { useApplicationStore } from '@/store/applications'
import { useCompanies } from '@/store/companies'

/**
 * One JobCard, three directions (DESIGN.md §9.1 corollary):
 *   A · card    — comfortable, match ring on the right
 *   B · row     — dense table-like row, score as an inline badge
 *   C · feature — big card, oversized ring, reason line prominent
 *
 * Note it takes `variant` as a PROP rather than reading the hook —
 * so the variant gallery can render all three at once.
 */
export function JobCard({
  job,
  variant = 'a',
  showMatch = true,
  showReason = false,
  active,
  onSelect,
  onSave,
  className,
}: {
  job: Job
  variant?: Variant
  showMatch?: boolean
  showReason?: boolean
  active?: boolean
  onSelect?: () => void
  onSave?: () => void | Promise<void>
  className?: string
}) {
  const { companyById } = useCompanies()
  const company = companyById(job.companyId)
  const { easyApply, hasApplied } = useApplicationStore()
  const [applyFeedback, setApplyFeedback] = React.useState<string | null>(null)
    const [saveFeedback, setSaveFeedback] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const hasMatch = showMatch && job.matchScore != null
  const applied = hasApplied(job.id)

  const handleEasyApply = () => {
    const result = easyApply(job)
    setApplyFeedback(result.ok ? `Applied with ${result.resumeName}` : result.reason)
  }

  const meta = (
    <>
      <span className="inline-flex items-center gap-1">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        {job.location}
      </span>
      <span className="inline-flex items-center gap-1">
        <Briefcase className="size-3.5 shrink-0" aria-hidden />
        {experienceRange(job.experienceMin, job.experienceMax)}
      </span>
      <span className="font-mono tnum">{salaryLPA(job.salaryMin, job.salaryMax, job.salaryVisible)}</span>
    </>
  )

  /* ── B · dense row ───────────────────────────────────────── */
  if (variant === 'b') {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'group relative grid w-full grid-cols-[1fr_auto] items-center gap-3 pl-4 pr-3 text-left',
          'h-v-row border-b border-line transition-v',
          // a 2px rail marks the active row and previews on hover — the
          // console equivalent of elevation
          'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:transition-v',
          active
            ? 'bg-brand-50 before:bg-brand-600'
            : 'hover:bg-hover before:bg-transparent group-hover:before:bg-brand-300',
          className,
        )}
      >
        <span className="min-w-0 flex items-center gap-3">
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className="font-medium text-ink truncate">{job.title}</span>
              <span className="text-ink-3 text-xs truncate">{company.name}</span>
            </span>
            <span className="flex items-center gap-3 text-xs text-ink-3 truncate">{meta}</span>
          </span>
        </span>
        <span className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-xs text-ink-3 font-mono tnum w-14 text-right">
            {relativeTime(job.postedAt)}
          </span>
          {hasMatch && <ScoreBadge score={job.matchScore!} size="sm" />}
        </span>
      </button>
    )
  }

  /* ── C · expressive feature card ─────────────────────────── */
  if (variant === 'c') {
    return (
      <article
        className={cn(
          'group relative bg-paper rounded-v shadow-v-card overflow-hidden hover-lift',
          className,
        )}
      >
        <div
          className="h-1.5 w-full"
          style={{ background: `oklch(0.7 0.14 ${company.logoHue})` }}
          aria-hidden
        />
        <div className="p-v-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <CompanyMark company={company} size={44} />
              <div className="min-w-0">
                <p className="text-sm text-ink-2 truncate">{company.name}</p>
                <p className="text-xs text-ink-3">{job.location}</p>
              </div>
            </div>
            {hasMatch && (
              <ScoreRing score={job.matchScore!} size="md" />
            )}
          </div>

          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-ink leading-tight">
            <Link to={`/jobs/${job.id}`} className="after:absolute after:inset-0">
              {job.title}
            </Link>
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="brand">{titleCase(job.workMode)}</Badge>
            <Badge tone="neutral">{experienceRange(job.experienceMin, job.experienceMax)}</Badge>
            <Badge tone="neutral" className="font-mono tnum">
              {salaryLPA(job.salaryMin, job.salaryMax, job.salaryVisible)}
            </Badge>
          </div>

          {showReason && job.recommendationReason && (
            <RecommendationReason reason={job.recommendationReason} variant="c" className="mt-4" />
          )}

          <p className="mt-4 text-sm text-ink-3">
            {job.applicants} applicants · posted {relativeTime(job.postedAt)}
          </p>
          <Button
            size="sm"
            className="relative z-10 mt-4 w-full"
            variant={applied ? 'secondary' : 'primary'}
            onClick={handleEasyApply}
            disabled={applied}
          >
            <FileText className="size-4" />
            {applied ? 'Applied' : 'Easy Apply'}
          </Button>
          {applyFeedback && <p className="relative z-10 mt-2 text-xs text-tone-emerald">{applyFeedback}</p>}
        </div>
      </article>
    )
  }

  /* ── A · editorial card (default) ────────────────────────── */
  return (
    <article
      className={cn(
        'group relative rounded-[2rem] p-6',
        'transition-all duration-300 hover:-translate-y-1',
        active 
          ? 'bg-gradient-to-br from-violet-50 to-fuchsia-50 border-violet-300 ring-4 ring-violet-500/20 shadow-xl' 
          : 'bg-white/80 border border-violet-500/10 hover:bg-white hover:border-violet-200 shadow-lg shadow-violet-500/[0.04] backdrop-blur-md',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <CompanyMark company={company} size={44} />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-ink-3">
              {company.name}
            </p>
            <h3 className="mt-0.5 text-xl font-bold leading-tight text-ink">
              {onSelect ? (
                <button type="button" onClick={onSelect} className="text-left after:absolute after:inset-0">
                  {job.title}
                </button>
              ) : (
                <Link to={`/jobs/${job.id}`} className="after:absolute after:inset-0 hover:text-brand-700">
                  {job.title}
                </Link>
              )}
            </h3>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {hasMatch && <ScoreRing score={job.matchScore!} size="sm" />}
          {onSave && (
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true)
                try {
                  await onSave()
                  setSaveFeedback(job.saved ? 'Removed from saved jobs' : 'Job saved')
                } catch (error) {
                  setSaveFeedback(error instanceof Error ? error.message : 'Unable to save job')
                } finally {
                  setSaving(false)
                }
              }}
              aria-label={job.saved ? 'Remove from saved jobs' : 'Save this job'}
              aria-pressed={job.saved}
              className="relative z-10 rounded-v-control p-1.5 text-ink-3 hover:bg-hover hover:text-brand-600 transition-colors"
            >
              <Bookmark className={cn('size-4', job.saved && 'fill-brand-600 text-brand-600')} />
            </button>
          )}
          {saveFeedback && (
            <span role="status" className="whitespace-nowrap rounded-v-control bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-200">
              {saveFeedback}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 -mx-1 px-1 py-1 flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full">
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-50/80 px-2.5 py-1.5 ring-1 ring-blue-500/20 whitespace-nowrap shadow-sm">
          <MapPin className="size-4 text-blue-500" />
          <span className="text-xs font-bold text-blue-800">{job.location}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-purple-50/80 px-2.5 py-1.5 ring-1 ring-purple-500/20 whitespace-nowrap shadow-sm">
          <Briefcase className="size-4 text-purple-500" />
          <span className="text-xs font-bold text-purple-800">{experienceRange(job.experienceMin, job.experienceMax)}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-50/80 px-2.5 py-1.5 ring-1 ring-orange-500/20 whitespace-nowrap shadow-sm">
          <Users className="size-4 text-orange-500" />
          <span className="text-xs font-bold text-orange-800">{job.applicants} applicants</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-50/80 px-2.5 py-1.5 ring-1 ring-emerald-500/20 whitespace-nowrap shadow-sm">
          <Check className="size-4 text-emerald-500" />
          <span className="text-xs font-bold text-emerald-800">{job.openings} openings</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-pink-50/80 px-2.5 py-1.5 ring-1 ring-pink-500/20 whitespace-nowrap shadow-sm">
          <span className="text-xs font-bold text-pink-800">{titleCase(job.jobType)}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-cyan-50/80 px-2.5 py-1.5 ring-1 ring-cyan-500/20 whitespace-nowrap shadow-sm">
          <span className="text-xs font-bold text-cyan-800">{titleCase(job.workMode)}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-50/80 px-2.5 py-1.5 ring-1 ring-amber-500/20 whitespace-nowrap shadow-sm">
          <Clock className="size-4 text-amber-500" />
          <span className="text-xs font-bold text-amber-800">{relativeTime(job.postedAt)}</span>
        </div>
      </div>

      {(job.requiredSkills.length > 0 || job.preferredSkills.length > 0) && (
        <SkillRail skills={[...job.requiredSkills, ...job.preferredSkills]} />
      )}

      {showReason && job.recommendationReason && (
        <RecommendationReason reason={job.recommendationReason} className="mt-3" />
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex items-center gap-3 text-xs font-medium text-ink-3">
          {company.verified ? (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <BadgeCheck className="size-4" aria-hidden />
              Verified Company
            </span>
          ) : (
            <span className="text-ink-4">Active Employer</span>
          )}
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <Button
            size="sm"
            variant={applied ? 'secondary' : 'primary'}
            onClick={handleEasyApply}
            disabled={applied}
          >
            <FileText className="size-4" />
            {applied ? 'Applied' : 'Easy Apply'}
          </Button>
          <Button size="sm" variant="secondary" asChild>
            <Link to={`/jobs/${job.id}`}>View job</Link>
          </Button>
        </div>
      </div>
      {applyFeedback && <p className="relative z-10 mt-2 text-right text-xs text-tone-emerald">{applyFeedback}</p>}
    </article>
  )
}

/** A hairline separator between meta items — a `|` character doesn't
 * align consistently with icon+text baselines across fonts. */
function MetaDivider() {
  return <span className="h-3.5 w-px shrink-0 bg-line-strong" aria-hidden />
}

/** All of a job's skills, scrollable rather than truncated to "+N" —
 * nothing about the role is hidden, it just doesn't all fit at once. */
function SkillRail({ skills }: { skills: string[] }) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const scrollBy = (dx: number) => trackRef.current?.scrollBy({ left: dx, behavior: 'smooth' })

  return (
    <div className="mt-3 flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => scrollBy(-160)}
        aria-label="Scroll skills left"
        className="relative z-10 hidden shrink-0 rounded-full border border-line bg-paper p-1 text-ink-3 transition-colors hover:bg-hover hover:text-ink sm:grid sm:place-items-center"
      >
        <ChevronLeft className="size-4" />
      </button>
      <div
        ref={trackRef}
        className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {skills.map((s, i) => {
          const colors = [
            'bg-blue-50 text-blue-700 ring-blue-500/20',
            'bg-purple-50 text-purple-700 ring-purple-500/20',
            'bg-orange-50 text-orange-700 ring-orange-500/20',
            'bg-emerald-50 text-emerald-700 ring-emerald-500/20',
            'bg-pink-50 text-pink-700 ring-pink-500/20',
          ]
          const colorClass = colors[i % colors.length]
          return (
            <Badge key={s} className={cn("shrink-0 ring-1 border-0 shadow-sm rounded-lg px-2.5 py-1 text-xs font-bold", colorClass)}>
              {s}
            </Badge>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => scrollBy(160)}
        aria-label="Scroll skills right"
        className="relative z-10 hidden shrink-0 rounded-full border border-line bg-paper p-1 text-ink-3 transition-colors hover:bg-hover hover:text-ink sm:grid sm:place-items-center"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

/** Company mark — a coloured monogram or actual logo. */
export function CompanyMark({
  company,
  size = 40,
  className,
}: {
  company: { name: string; logoHue: number; logoUrl?: string }
  size?: number
  className?: string
}) {
  if (company.logoUrl) {
    return (
      <img
        src={company.logoUrl}
        alt={`${company.name} logo`}
        className={cn('shrink-0 object-contain', className)}
        style={{ height: size * 0.75, width: 'auto', maxWidth: size * 4 }}
        aria-hidden
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-v-control font-bold select-none', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: `oklch(0.95 0.03 ${company.logoHue})`,
        color: `oklch(0.45 0.14 ${company.logoHue})`,
      }}
    >
      {company.name[0]}
    </span>
  )
}
