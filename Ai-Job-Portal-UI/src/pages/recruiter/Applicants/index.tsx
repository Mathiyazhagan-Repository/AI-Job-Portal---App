import * as React from 'react'
import { Link, useParams } from 'react-router'
import {
  ChevronLeft, ChevronRight, SlidersHorizontal, ShieldAlert, Mail,
  Check, X, Users, Share2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant, useKeyboardShortcut, useAnnounce } from '@/hooks'
import { applicants as allApplicants, jobById, type Applicant } from '@/data/mock'
import { STAGES, type Stage } from '@/lib/pipeline'
import { bandFor, SCORE_BANDS } from '@/lib/scoring'
import { MatchPrism, ScoreBadge, ScreeningCard, StagePill, ScoreRing } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/controls'
import { Sheet, SheetContent, SheetTrigger, Tooltip } from '@/components/ui/overlay'
import { EmptyState, Kbd, PageHeader } from '@/components/common'
import { Stagger, StaggerItem, ScrambleText } from '@/components/motion'
import { supabase } from '@/lib/supabase'

/**
 * ⭐ R8 — THE most important screen in the product (DESIGN.md §13.2).
 *
 * Non-negotiable across all three directions:
 *  · candidates failing a HARD requirement are GROUPED SEPARATELY, never
 *    silently buried (PRD Part 16.2)
 *  · the same explanation is available for #1 and #200 (PRD Part 19)
 *  · rejection requires a reason
 *  · stage changes announce via aria-live (PRD Part 39–40)
 */

function useApplicantTriage(jobId: string) {
  const [list, setList] = React.useState<Applicant[]>(() =>
    [...allApplicants].sort((a, b) => b.score - a.score),
  )
  const [cursor, setCursor] = React.useState(0)
  const announce = useAnnounce()

  const qualified = list.filter((a) => a.meetsHardRequirements)
  const blocked = list.filter((a) => !a.meetsHardRequirements)
  const ordered = [...qualified, ...blocked]
  const selected = ordered[cursor]

  const move = React.useCallback(
    (delta: number) => setCursor((c) => Math.max(0, Math.min(ordered.length - 1, c + delta))),
    [ordered.length],
  )

  const setStage = React.useCallback(
    (id: string, stage: Stage) => {
      setList((l) => l.map((a) => (a.id === id ? { ...a, stage } : a)))
      const who = list.find((a) => a.id === id)?.name ?? 'Candidate'
      announce(`${who} moved to ${STAGES[stage].label}`)
    },
    [announce, list],
  )

  return { list, ordered, qualified, blocked, cursor, setCursor, selected, move, setStage, job: jobById(jobId) }
}

type Triage = ReturnType<typeof useApplicantTriage>

export function Component() {
  const variant = useVariant()
  const { jobId = 'j1' } = useParams()
  const t = useApplicantTriage(jobId)

  useKeyboardShortcut({
    j: () => t.move(1),
    k: () => t.move(-1),
    arrowdown: () => t.move(1),
    arrowup: () => t.move(-1),
    s: () => t.selected && t.setStage(t.selected.id, 'shortlisted'),
    r: () => t.selected && t.setStage(t.selected.id, 'rejected'),
  })

  const Views = { a: TriageA, b: TriageB, c: TriageC }
  const View = Views[variant] ?? TriageA
  return (
    <>
      <PersistentApplications jobId={jobId} />
      <View t={t} />
    </>
  )
}
Component.displayName = 'ApplicantsPage'

function PersistentApplications({ jobId }: { jobId: string }) {
  const [applications, setApplications] = React.useState<Array<{
    id: string
    candidate_name: string
    candidate_email: string
    resume_name: string
    resume_storage_path: string | null
    applied_at: string
  }>>([])

  React.useEffect(() => {
    let active = true
    void supabase
      .from('applications')
      .select('id, candidate_name, candidate_email, resume_name, resume_storage_path, applied_at')
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false })
      .then(({ data }) => {
        if (active) setApplications(data ?? [])
      })
    return () => { active = false }
  }, [jobId])

  if (!applications.length) return null

  return (
    <section className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6" aria-label="Database applications">
      <div className="rounded-v border border-brand-200 bg-brand-50 p-4">
        <h2 className="text-sm font-semibold text-brand-900">Applications received</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {applications.map((application) => (
            <div key={application.id} className="rounded-v-control border border-brand-200 bg-paper p-3">
              <p className="font-medium text-ink">{application.candidate_name}</p>
              <p className="text-xs text-ink-3">{application.candidate_email}</p>
              <ResumeLink path={application.resume_storage_path} name={application.resume_name} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ResumeLink({ path, name }: { path: string | null; name: string }) {
  const [url, setUrl] = React.useState<string>()

  const openResume = async () => {
    if (!path) return
    const { data } = await supabase.storage.from('resumes').createSignedUrl(path, 600)
    if (data?.signedUrl) setUrl(data.signedUrl)
  }

  return path ? (
    url ? (
      <a href={url} target="_blank" rel="noreferrer" className="mt-2 block text-xs font-medium text-brand-700 hover:underline">
        Open resume: {name}
      </a>
    ) : (
      <button type="button" onClick={openResume} className="mt-2 text-xs font-medium text-brand-700 hover:underline">
        View attached resume: {name}
      </button>
    )
  ) : (
    <p className="mt-2 text-xs text-brand-700">Resume attached: {name}</p>
  )
}

/* ══════════════════ Shared bits ══════════════════ */

function TriageHeader({ t, dense }: { t: Triage; dense?: boolean }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', dense ? 'py-2' : 'py-4')}>
      <div className="min-w-0">
        <Link
          to="/recruiter/jobs"
          className="inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink"
        >
          <ChevronLeft className="size-3.5" />
          All jobs
        </Link>
        <h1 className={cn('truncate font-semibold tracking-tight text-ink', dense ? 'text-base' : 'text-xl')}>
          {t.job?.title}
        </h1>
        {!dense && (
          <p className="text-sm text-ink-2">
            {t.qualified.length} qualified · {t.blocked.length} below minimum requirements
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="sm">
              <SlidersHorizontal className="size-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent className="p-5">
            <h2 className="mb-4 font-semibold text-ink">Filter applicants</h2>
            <p className="text-sm text-ink-2">
              Stage, score band, skills, experience, assessment status.
            </p>
          </SheetContent>
        </Sheet>
        <Button variant="secondary" size="sm">
          <Share2 className="size-4" />
          Share job
        </Button>
      </div>
    </div>
  )
}

/** The row used by A's list and B's table — differs only in density. */
function ApplicantRow({
  a,
  active,
  dense,
  onSelect,
  expanded,
}: {
  a: Applicant
  active: boolean
  dense?: boolean
  onSelect: () => void
  expanded?: boolean
}) {
  const band = bandFor(a.score, a.meetsHardRequirements)

  return (
    <div
      className={cn(
        'border-b border-line transition-colors',
        active ? 'bg-brand-50' : 'hover:bg-hover',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
        className={cn('flex w-full items-center gap-3 text-left', dense ? 'px-3 py-1.5' : 'p-3')}
      >
        {dense ? (
          <span
            className="w-1 self-stretch rounded-full"
            style={{ backgroundColor: SCORE_BANDS[band].hex }}
            aria-hidden
          />
        ) : (
          <Avatar name={a.name} id={a.id} size="md" />
        )}

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className={cn('truncate font-medium text-ink', dense && 'text-sm')}>{a.name}</span>
            {!a.meetsHardRequirements && (
              <Badge tone="warning" size="sm">
                below minimum
              </Badge>
            )}
          </span>
          <span className={cn('block truncate text-ink-3', dense ? 'text-xs' : 'text-sm')}>
            {a.headline}
          </span>
        </span>

        <span className="hidden shrink-0 items-center gap-2 sm:flex">
          <StagePill stage={a.stage} size="sm" />
          {a.assessmentScore != null && (
            <Tooltip content="Assessment score">
              <span className="font-mono tnum text-xs text-ink-3">{a.assessmentScore}</span>
            </Tooltip>
          )}
        </span>

        <span className="shrink-0">
          {dense ? (
            <ScoreBadge score={a.score} meetsHardRequirements={a.meetsHardRequirements} size="sm" />
          ) : (
            <ScoreRing score={a.score} meetsHardRequirements={a.meetsHardRequirements} size="sm" />
          )}
        </span>
      </button>

      {/* B expands the breakdown IN PLACE — no navigation, no panel */}
      {expanded && (
        <div className="border-t border-line bg-canvas px-3 py-3">
          <MatchPrism
            score={a.score}
            breakdown={a.breakdown}
            matchedSkills={a.matchedSkills.map((s) => s.name)}
            missingSkills={a.missingSkills.map((s) => s.name)}
            meetsHardRequirements={a.meetsHardRequirements}
            layout="inline"
            defaultExpanded
          />
        </div>
      )}
    </div>
  )
}

function BlockedGroupHeader({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 border-y border-line bg-score-blocked-bg/50 px-3 py-2">
      <ShieldAlert className="size-4 shrink-0 text-score-blocked" aria-hidden />
      <p className="text-xs font-medium text-score-blocked">
        {count} candidate{count === 1 ? '' : 's'} below the minimum requirements — shown separately,
        never hidden
      </p>
    </div>
  )
}

function ShortcutLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
      <span className="flex items-center gap-1">
        <Kbd>J</Kbd>
        <Kbd>K</Kbd> move
      </span>
      <span className="flex items-center gap-1">
        <Kbd>S</Kbd> shortlist
      </span>
      <span className="flex items-center gap-1">
        <Kbd>R</Kbd> reject
      </span>
      <span className="flex items-center gap-1">
        <Kbd>E</Kbd> email
      </span>
      <span className="flex items-center gap-1">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd> palette
      </span>
    </div>
  )
}

/* ══════════════════ A · three-pane ══════════════════ */

function TriageA({ t }: { t: Triage }) {
  if (!t.ordered.length) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <EmptyState
          icon={Users}
          title="No applicants yet"
          description="Share this job to start receiving applications. Most roles see their first applicant within 12 hours."
          action={{ label: 'Copy job link' }}
          secondaryAction={{ label: 'Show QR code' }}
        />
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6">
      <TriageHeader t={t} />

      <div className="grid gap-4 pb-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_460px]">
        {/* ranked list */}
        <div className="min-w-0 overflow-hidden rounded-v border border-line bg-paper">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
              Ranked by match score
            </p>
            <ShortcutLegend />
          </div>

          <Stagger whenVisible={false}>
            {t.qualified.map((a) => (
              <StaggerItem key={a.id}>
                <ApplicantRow
                  a={a}
                  active={t.selected?.id === a.id}
                  onSelect={() => t.setCursor(t.ordered.indexOf(a))}
                />
              </StaggerItem>
            ))}
          </Stagger>

          {t.blocked.length > 0 && (
            <>
              <BlockedGroupHeader count={t.blocked.length} />
              {t.blocked.map((a) => (
                <ApplicantRow
                  key={a.id}
                  a={a}
                  active={t.selected?.id === a.id}
                  onSelect={() => t.setCursor(t.ordered.indexOf(a))}
                />
              ))}
            </>
          )}
        </div>

        {/* docked screening card */}
        <aside className="hidden lg:block">
          {t.selected && (
            <div className="sticky top-20 h-[calc(100dvh-6rem)] overflow-hidden rounded-v border border-line bg-paper">
              <ScreeningCard
                applicant={t.selected}
                variant="a"
                onShortlist={() => t.setStage(t.selected!.id, 'shortlisted')}
                onReject={() => t.setStage(t.selected!.id, 'rejected')}
                className="h-full"
              />
            </div>
          )}
        </aside>

        {/* mobile: full-screen sheet */}
        {t.selected && (
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button className="w-full">Open screening card for {t.selected.name}</Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[92dvh] p-0">
                <ScreeningCard applicant={t.selected} variant="a" className="h-full" />
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════ B · dense table, inline expansion ══════════════════ */

function TriageB({ t }: { t: Triage }) {
  return (
    <div className="px-3 sm:px-4">
      <TriageHeader t={t} dense />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-y border-line py-1.5">
        <ScrambleText
          as="p"
          className="font-mono text-xs text-ink-3"
          duration={480}
          text={`${t.qualified.length} qualified / ${t.blocked.length} blocked / ${t.ordered.length} total`}
        />
        <ShortcutLegend />
      </div>

      <div className="border-b border-line">
        <Stagger whenVisible={false}>
          {t.qualified.map((a) => (
            <StaggerItem key={a.id}>
              <ApplicantRow
                a={a}
                dense
                active={t.selected?.id === a.id}
                expanded={t.selected?.id === a.id}
                onSelect={() => t.setCursor(t.ordered.indexOf(a))}
              />
            </StaggerItem>
          ))}
        </Stagger>

        {t.blocked.length > 0 && (
          <>
            <BlockedGroupHeader count={t.blocked.length} />
            {t.blocked.map((a) => (
              <ApplicantRow
                key={a.id}
                a={a}
                dense
                active={t.selected?.id === a.id}
                expanded={t.selected?.id === a.id}
                onSelect={() => t.setCursor(t.ordered.indexOf(a))}
              />
            ))}
          </>
        )}
      </div>

      {/* sticky action bar — the selected candidate is always actionable */}
      {t.selected && (
        <div className="sticky bottom-0 mt-2 flex items-center gap-2 border-t border-line bg-paper/95 py-2 backdrop-blur">
          <span className="min-w-0 flex-1 truncate text-sm">
            <span className="font-medium text-ink">{t.selected.name}</span>
            <span className="text-ink-3"> · {t.selected.headline}</span>
          </span>
          <Button size="xs" onClick={() => t.setStage(t.selected!.id, 'shortlisted')}>
            <Check className="size-3.5" />
            Shortlist <Kbd className="border-white/30 bg-white/20 text-white">S</Kbd>
          </Button>
          <Button size="xs" variant="secondary" onClick={() => t.setStage(t.selected!.id, 'rejected')}>
            <X className="size-3.5" />
            Reject <Kbd>R</Kbd>
          </Button>
          <Button size="xs" variant="ghost">
            <Mail className="size-3.5" />
            <Kbd>E</Kbd>
          </Button>
        </div>
      )}
    </div>
  )
}

/* ══════════════════ C · one candidate at a time ══════════════════ */

function TriageC({ t }: { t: Triage }) {
  const a = t.selected
  if (!a) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <TriageHeader t={t} />

      {/* position indicator */}
      <div className="mb-4 flex items-center gap-3">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => t.move(-1)}
          disabled={t.cursor === 0}
          aria-label="Previous candidate"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="flex-1">
          <div className="flex h-1.5 gap-0.5">
            {t.ordered.map((x, i) => (
              <span
                key={x.id}
                className={cn(
                  'flex-1 rounded-full transition-colors',
                  i === t.cursor ? 'bg-brand-600' : i < t.cursor ? 'bg-brand-200' : 'bg-line',
                )}
              />
            ))}
          </div>
          <p className="mt-1.5 text-center text-xs text-ink-3">
            Candidate {t.cursor + 1} of {t.ordered.length}
            {!a.meetsHardRequirements && ' · below minimum requirements'}
          </p>
        </div>

        <Button
          variant="secondary"
          size="icon"
          onClick={() => t.move(1)}
          disabled={t.cursor === t.ordered.length - 1}
          aria-label="Next candidate"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {!a.meetsHardRequirements && (
        <div className="mb-4 flex items-start gap-2 rounded-v bg-score-blocked-bg p-4">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-score-blocked" aria-hidden />
          <p className="text-sm text-score-blocked">
            This candidate does not meet a hard requirement for the role. They are still shown, with
            the same full explanation — the AI never removes anyone from your view.
          </p>
        </div>
      )}

      <div key={a.id} className="animate-rise overflow-hidden rounded-v bg-paper shadow-lg">
        <ScreeningCard
          applicant={a}
          variant="c"
          onShortlist={() => {
            t.setStage(a.id, 'shortlisted')
            t.move(1)
          }}
          onReject={() => {
            t.setStage(a.id, 'rejected')
            t.move(1)
          }}
        />
      </div>

      <p className="mt-4 text-center text-xs text-ink-3">
        Use <Kbd>J</Kbd> <Kbd>K</Kbd> or the arrows to move · <Kbd>S</Kbd> shortlist ·{' '}
        <Kbd>R</Kbd> reject
      </p>
    </div>
  )
}
