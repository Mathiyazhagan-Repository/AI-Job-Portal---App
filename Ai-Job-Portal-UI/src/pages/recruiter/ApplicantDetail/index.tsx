import * as React from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft, FileText, ClipboardCheck, CalendarDays, StickyNote, History,
  User, Check, X, Mail, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant, useAnnounce } from '@/hooks'
import { applicants, jobById } from '@/data/mock'
import { STAGES, ACTIVE_STAGES, type Stage } from '@/lib/pipeline'
import { shortDate, relativeTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/controls'
import { Textarea } from '@/components/ui/input'
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from '@/components/ui/controls'
import { PageHeader } from '@/components/common'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import {
  MatchPrism, SkillConstellation, StagePill, StageRail, AIProvenanceChip,
} from '@/components/brand'

/** R9 — Applicant detail. The full-page form of the screening card. */

const NOTES = [
  { by: 'Meera Krishnan', at: 2, body: 'Strong systems thinking on the component-library question. Would pair well with Sanjay.' },
  { by: 'Nikita Rane', at: 5, body: 'Screening call done. Notice period 30 days, flexible on start date.' },
]

const HISTORY: { stage: Stage; at: number; by: string; note?: string }[] = [
  { stage: 'applied', at: 12, by: 'Candidate' },
  { stage: 'screening', at: 10, by: 'System' },
  { stage: 'shortlisted', at: 7, by: 'Meera Krishnan', note: 'Strong React depth' },
  { stage: 'assessment', at: 5, by: 'Meera Krishnan' },
  { stage: 'interview', at: 1, by: 'Meera Krishnan', note: 'Technical round scheduled' },
]

function useApplicant(id: string) {
  const [a, setA] = React.useState(() => applicants.find((x) => x.id === id) ?? applicants[0])
  const [note, setNote] = React.useState('')
  const [notes, setNotes] = React.useState(NOTES)
  const announce = useAnnounce()

  const setStage = (stage: Stage) => {
    setA((x) => ({ ...x, stage }))
    announce(`${a.name} moved to ${STAGES[stage].label}`)
  }
  const addNote = () => {
    if (!note.trim()) return
    setNotes((l) => [{ by: 'Meera Krishnan', at: 0, body: note.trim() }, ...l])
    setNote('')
  }
  return { a, setStage, note, setNote, notes, addNote }
}

type D = ReturnType<typeof useApplicant>

export function Component() {
  const { id = 'a1' } = useParams()
  const variant = useVariant()
  const d = useApplicant(id)
  const Views = { a: DetailA, b: DetailB, c: DetailC }
  const View = Views[variant] ?? DetailA
  return <View d={d} />
}
Component.displayName = 'ApplicantDetailPage'

/* ══════════════════ shared blocks ══════════════════ */

function StageSelector({ d }: { d: D }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-ink-3">Stage</span>
      <select
        value={d.a.stage}
        onChange={(e) => d.setStage(e.target.value as Stage)}
        className="h-9 rounded-v-control border border-line bg-paper px-2 text-sm font-medium text-ink outline-none focus:border-brand-500"
      >
        {ACTIVE_STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGES[s].label}
          </option>
        ))}
        <option value="rejected">Rejected</option>
      </select>
    </label>
  )
}

function Header({ d, large }: { d: D; large?: boolean }) {
  const job = jobById(d.a.jobId)
  return (
    <div className="flex flex-wrap items-start gap-4">
      <Avatar name={d.a.name} id={d.a.id} size={large ? 'xl' : 'lg'} />
      <div className="min-w-0 flex-1">
        <h1 className={cn('font-semibold tracking-tight text-ink', large ? 'text-3xl' : 'text-2xl')}>
          {d.a.name}
        </h1>
        <p className="text-ink-2">{d.a.headline}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StagePill stage={d.a.stage} />
          <span className="text-sm text-ink-3">
            applied {d.a.appliedAgo} to {job?.title}
          </span>
        </div>
        <div className="mt-3">
          <StageRail stage={d.a.stage} />
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <StageSelector d={d} />
        <Button size="sm" variant="secondary">
          <Mail className="size-4" />
          Message
        </Button>
      </div>
    </div>
  )
}

function AiRail({ d }: { d: D }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-3">AI summary</h2>
        <AIProvenanceChip what="wrote this from structured profile data only" />
      </div>

      <div className="rounded-v-control bg-score-elite-bg/60 p-3">
        <p className="mb-1.5 text-xs font-semibold text-score-elite">Strengths</p>
        <ul className="space-y-1 text-sm text-ink-2">
          {d.a.strengths.map((s) => (
            <li key={s} className="flex gap-1.5">
              <span aria-hidden className="text-score-elite">·</span>
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-v-control bg-warning-bg/60 p-3">
        <p className="mb-1.5 text-xs font-semibold text-warning">Potential concerns</p>
        <ul className="space-y-1 text-sm text-ink-2">
          {d.a.concerns.map((c) => (
            <li key={c} className="flex gap-1.5">
              <span aria-hidden className="text-warning">·</span>
              {c}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] leading-snug text-ink-3">
          Drawn from missing skills and experience gaps only — never inferred personal
          characteristics.
        </p>
      </div>
    </div>
  )
}

function ProfileTab({ d }: { d: D }) {
  return (
    <div className="space-y-6">
      <MatchPrism
        score={d.a.score}
        breakdown={d.a.breakdown}
        matchedSkills={d.a.matchedSkills.map((s) => s.name)}
        missingSkills={d.a.missingSkills.map((s) => s.name)}
        meetsHardRequirements={d.a.meetsHardRequirements}
        defaultExpanded
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">Requirement checks</h2>
        <dl className="space-y-2 text-sm">
          {[
            ['Experience', d.a.experienceNarrative],
            ['Education', d.a.education],
            ['Location', d.a.locationNarrative],
            ['Salary', d.a.salaryNarrative],
            ['Title relevance', d.a.titleNarrative],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3 border-b border-line pb-2">
              <dt className="w-32 shrink-0 text-ink-3">{k}</dt>
              <dd className="text-ink-2">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">Skill overlap</h2>
        <div className="flex justify-center pb-6">
          <SkillConstellation
            matched={d.a.matchedSkills}
            missing={d.a.missingSkills}
            bonus={d.a.bonusSkills}
            size={240}
          />
        </div>
      </section>
    </div>
  )
}

function ResumeTab() {
  return (
    <div className="rounded-v border border-line bg-paper p-6">
      <div className="mx-auto max-w-md">
        <div className="aspect-[1/1.294] rounded-v border border-line p-6">
          <div className="space-y-1.5">
            <div className="h-3 w-2/5 rounded bg-ink/80" />
            <div className="h-2 w-1/3 rounded bg-line-strong" />
          </div>
          {[3, 4, 3, 2].map((n, bi) => (
            <div key={bi} className="mt-5 space-y-1.5">
              <div className="h-2 w-20 rounded bg-brand-200" />
              {Array.from({ length: n }).map((_, i) => (
                <div key={i} className="h-1.5 rounded bg-line" style={{ width: `${62 + ((i * 13) % 32)}%` }} />
              ))}
            </div>
          ))}
        </div>
        <p className="mt-3 text-center font-mono text-xs text-ink-3">
          resume-v2.pdf · attached to this application
        </p>
      </div>
    </div>
  )
}

function AnswersTab() {
  const qa = [
    ['How many years have you worked with React in production?', '6 years — since 2019, continuously.'],
    ['Are you able to work from Bengaluru two days a week?', 'Yes. I live in Indiranagar.'],
    ['What is your notice period?', '30 days, and my current team is flexible about the exact date.'],
  ]
  return (
    <div className="space-y-3">
      {qa.map(([q, a]) => (
        <div key={q} className="rounded-v border border-line bg-paper p-4">
          <p className="text-sm font-medium text-ink">{q}</p>
          <p className="mt-1.5 text-sm text-ink-2">{a}</p>
        </div>
      ))}
    </div>
  )
}

function AssessmentTab({ d }: { d: D }) {
  if (d.a.assessmentScore == null) {
    return (
      <div className="rounded-v border border-dashed border-line p-8 text-center">
        <ClipboardCheck className="mx-auto size-6 text-ink-3" aria-hidden />
        <p className="mt-3 font-medium text-ink">No assessment yet</p>
        <p className="mt-1 text-sm text-ink-2">Assign one to see auto-graded results here.</p>
        <Button size="sm" className="mt-4">Assign an assessment</Button>
      </div>
    )
  }
  return (
    <div className="rounded-v border border-line bg-paper p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-semibold text-ink">Front-end engineering</h2>
        <p className="font-mono tnum text-3xl font-bold text-ink">{d.a.assessmentScore}%</p>
      </div>
      <Badge tone={d.a.assessmentScore >= 60 ? 'success' : 'warning'} className="mt-2">
        {d.a.assessmentScore >= 60 ? 'Above the 60% pass mark' : 'Below the pass mark'}
      </Badge>
      <ul className="mt-4 space-y-1.5 text-sm">
        {[
          ['Auto-graded questions', '5 of 6'],
          ['Written answer', 'reviewed by a person, not machine-graded'],
          ['Time used', '31 of 45 minutes'],
        ].map(([k, v]) => (
          <li key={k} className="flex justify-between gap-3 border-b border-line pb-1.5">
            <span className="text-ink-3">{k}</span>
            <span className="font-medium text-ink">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NotesTab({ d }: { d: D }) {
  return (
    <div>
      <div className="rounded-v border border-line bg-paper p-4">
        <Textarea
          rows={3}
          value={d.note}
          onChange={(e) => d.setNote(e.target.value)}
          placeholder="Add a note. Everyone on the hiring team sees it, and it is timestamped."
          aria-label="Add a note"
        />
        <Button size="sm" className="mt-2" onClick={d.addNote} disabled={!d.note.trim()}>
          <Plus className="size-4" />
          Add note
        </Button>
      </div>

      <Stagger className="mt-4 space-y-2" whenVisible={false}>
        {d.notes.map((n, i) => (
          <StaggerItem key={i}>
            <div className="rounded-v border border-line bg-paper p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-ink">{n.by}</p>
                <p className="font-mono text-xs text-ink-3">
                  {relativeTime(new Date(Date.now() - n.at * 86400000).toISOString())}
                </p>
              </div>
              <p className="mt-1 text-sm text-ink-2">{n.body}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  )
}

function HistoryTab() {
  return (
    <ol className="space-y-4 border-l-2 border-line pl-5">
      {HISTORY.map((h, i) => (
        <li key={h.stage} className="relative">
          <span
            className={cn(
              'absolute -left-[23px] top-1 size-3 rounded-full ring-4 ring-canvas',
              i === HISTORY.length - 1 ? 'bg-brand-600' : 'bg-line-strong',
            )}
          />
          <p className="font-medium text-ink">{STAGES[h.stage].label}</p>
          <p className="font-mono text-xs text-ink-3">
            {shortDate(new Date(Date.now() - h.at * 86400000).toISOString())} · {h.by}
          </p>
          {h.note && <p className="mt-0.5 text-sm italic text-ink-2">“{h.note}”</p>}
        </li>
      ))}
    </ol>
  )
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User, render: (d: D) => <ProfileTab d={d} /> },
  { id: 'resume', label: 'Resume', icon: FileText, render: () => <ResumeTab /> },
  { id: 'answers', label: 'Screening answers', icon: ClipboardCheck, render: () => <AnswersTab /> },
  { id: 'assessment', label: 'Assessment', icon: ClipboardCheck, render: (d: D) => <AssessmentTab d={d} /> },
  { id: 'notes', label: 'Notes', icon: StickyNote, render: (d: D) => <NotesTab d={d} /> },
  { id: 'history', label: 'History', icon: History, render: () => <HistoryTab /> },
]

function Decision({ d }: { d: D }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => d.setStage('shortlisted')}>
        <Check className="size-4" />
        Shortlist
      </Button>
      <Button variant="secondary" onClick={() => d.setStage('rejected')}>
        <X className="size-4" />
        Reject
      </Button>
      <Button variant="ghost" asChild>
        <Link to="/recruiter/interviews">
          <CalendarDays className="size-4" />
          Schedule interview
        </Link>
      </Button>
    </div>
  )
}

function BackLink({ d }: { d: D }) {
  return (
    <Link
      to={`/recruiter/jobs/${d.a.jobId}/applicants`}
      className="inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Back to triage
    </Link>
  )
}

/* ══════════════════ A · tabs + AI rail ══════════════════ */

function DetailA({ d }: { d: D }) {
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-6 sm:px-6">
      <BackLink d={d} />
      <div className="mt-3">
        <Header d={d} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <Tabs defaultValue="profile" className="min-w-0">
          <TabsListUnderline>
            {TABS.map((t) => (
              <TabsTriggerUnderline key={t.id} value={t.id}>
                {t.label}
              </TabsTriggerUnderline>
            ))}
          </TabsListUnderline>
          {TABS.map((t) => (
            <TabsContent key={t.id} value={t.id} className="pt-6">
              <Reveal whenVisible={false}>{t.render(d)}</Reveal>
            </TabsContent>
          ))}
        </Tabs>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
            <AiRail d={d} />
            <div className="mt-4 border-t border-line pt-4">
              <Decision d={d} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ══════════════════ B · resume | screening side by side ══════════════════ */

function DetailB({ d }: { d: D }) {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div className="flex items-center gap-3">
          <BackLink d={d} />
          <span className="h-4 w-px bg-line" />
          <h1 className="text-base font-semibold text-ink">{d.a.name}</h1>
          <StagePill stage={d.a.stage} size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <StageSelector d={d} />
          <Decision d={d} />
        </div>
      </div>

      {/* evidence on the left, judgement on the right */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Resume</h2>
          <ResumeTab />
          <h2 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-ink-3">
            Screening answers
          </h2>
          <AnswersTab />
        </div>

        <div className="min-w-0 space-y-5">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Match breakdown
            </h2>
            <MatchPrism
              score={d.a.score}
              breakdown={d.a.breakdown}
              matchedSkills={d.a.matchedSkills.map((s) => s.name)}
              missingSkills={d.a.missingSkills.map((s) => s.name)}
              meetsHardRequirements={d.a.meetsHardRequirements}
              defaultExpanded
            />
          </div>
          <AiRail d={d} />
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Notes</h2>
            <NotesTab d={d} />
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">History</h2>
            <HistoryTab />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════ C · single-scroll dossier ══════════════════ */

function DetailC({ d }: { d: D }) {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <BackLink d={d} />

      <Reveal whenVisible={false} className="mt-6 rounded-v bg-paper p-8 shadow-xl">
        <Header d={d} large />
      </Reveal>

      <Reveal className="mt-6 rounded-v bg-paper p-8 shadow-lg">
        <h2 className="font-display tracking-tight mb-6 text-2xl font-semibold text-ink">
          Why this score
        </h2>
        <MatchPrism
          score={d.a.score}
          breakdown={d.a.breakdown}
          matchedSkills={d.a.matchedSkills.map((s) => s.name)}
          missingSkills={d.a.missingSkills.map((s) => s.name)}
          meetsHardRequirements={d.a.meetsHardRequirements}
          layout="ring"
          size="xl"
          defaultExpanded
        />
      </Reveal>

      <Reveal className="mt-6 rounded-v bg-paper p-8 shadow-lg">
        <h2 className="font-display tracking-tight mb-6 text-2xl font-semibold text-ink">
          What the AI noticed
        </h2>
        <AiRail d={d} />
      </Reveal>

      <Reveal className="mt-6 rounded-v bg-paper p-8 shadow-lg">
        <h2 className="font-display tracking-tight mb-6 text-2xl font-semibold text-ink">
          Their answers
        </h2>
        <AnswersTab />
      </Reveal>

      <Reveal className="mt-6 rounded-v bg-paper p-8 shadow-lg">
        <h2 className="font-display tracking-tight mb-6 text-2xl font-semibold text-ink">
          Assessment
        </h2>
        <AssessmentTab d={d} />
      </Reveal>

      <Reveal className="mt-6 rounded-v bg-paper p-8 shadow-lg">
        <h2 className="font-display tracking-tight mb-6 text-2xl font-semibold text-ink">
          Team notes
        </h2>
        <NotesTab d={d} />
      </Reveal>

      <Reveal className="mt-6 rounded-v bg-paper p-8 shadow-lg">
        <h2 className="font-display tracking-tight mb-6 text-2xl font-semibold text-ink">
          How they got here
        </h2>
        <HistoryTab />
      </Reveal>

      <div className="sticky bottom-6 mt-8 rounded-v bg-paper p-4 shadow-xl">
        <Decision d={d} />
      </div>
    </div>
  )
}
