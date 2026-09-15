import * as React from 'react'
import { Link } from 'react-router'
import {
  CalendarDays, Clock, Video, MapPin, Check, RefreshCw, Users2, Globe,
  Timer, ListChecks, ClipboardCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { jobById, companyById } from '@/data/mock'
import { useAuth } from '@/store/auth'
import { STAGES, type Stage } from '@/lib/pipeline'
import { shortDate, timeOfDay, relativeTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/controls'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/overlay'
import {
  PageHeader, EmptyState, SectionHeading, StatCard, TONE_CLASS, type Tone,
} from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { StagePill } from '@/components/brand'
import { CompanyMark } from '@/features/jobs/JobCard'

/** C12 — Interviews (PRD Part 21). */

interface Slot {
  id: string
  jobId: string
  stage: Stage
  at: string
  duration: number
  interviewers: string[]
  mode: string
  status: 'scheduled' | 'confirmed' | 'completed'
}

export function useInterviewCount() {
  const { token } = useAuth()
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    let active = true
    fetch('http://localhost:8000/api/candidate/interviews', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => response.ok ? response.json() : [])
      .then((data: unknown) => {
        if (active) setCount(Array.isArray(data) ? data.length : 0)
      })
      .catch(() => { if (active) setCount(0) })
    return () => { active = false }
  }, [token])

  return count
}

const PAST: Slot[] = [
  { id: 'p1', jobId: 'j4', stage: 'interview', at: new Date(Date.now() - 9 * 86400000).toISOString(), duration: 30, interviewers: ['Anil Suresh'], mode: 'Phone', status: 'completed' },
]

/** Proposed alternatives when a candidate asks to move. */
const PROPOSED = [
  new Date(Date.now() + 3 * 86400000).toISOString(),
  new Date(Date.now() + 4 * 86400000).toISOString(),
  new Date(Date.now() + 5 * 86400000).toISOString(),
]

function useInterviews() {
  const { token } = useAuth()
  const [list, setList] = React.useState<Slot[]>([])
  const [activeId, setActiveId] = React.useState(list[0]?.id ?? '')
  const [rescheduling, setRescheduling] = React.useState<Slot | null>(null)

  React.useEffect(() => {
    let active = true
    fetch('http://localhost:8000/api/candidate/interviews', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => response.ok ? response.json() : [])
      .then((data: unknown) => {
        if (active) {
          const next = Array.isArray(data) ? data as Slot[] : []
          setList(next)
          setActiveId(next[0]?.id ?? '')
        }
      })
      .catch(() => { if (active) setList([]) })
    return () => { active = false }
  }, [token])

  const confirm = (id: string) => {
    fetch(`http://localhost:8000/api/interviews/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'confirmed' })
    })
    setList((l) => l.map((s) => (s.id === id ? { ...s, status: 'confirmed' } : s)))
  }

  const active = list.find((s) => s.id === activeId) ?? list[0]
  return { list, active, activeId, setActiveId, confirm, rescheduling, setRescheduling }
}

type I = ReturnType<typeof useInterviews>

export function Component() {
  const variant = useVariant()
  const i = useInterviews()
  const Views = { a: InterviewsA, b: InterviewsB, c: InterviewsC }
  const View = Views[variant] ?? InterviewsA
  return (
    <>
      <View i={i} />
      <RescheduleDialog i={i} />
    </>
  )
}
Component.displayName = 'CandidateInterviews'

/* ══════════════════ shared ══════════════════ */

/** The timezone is stated explicitly on both sides — DESIGN.md §12.1 C12. */
function TimeBlock({ slot, large }: { slot: Slot; large?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', large ? 'text-base' : 'text-sm')}>
      <Clock className="size-4 shrink-0 text-ink-3" aria-hidden />
      <span className="font-medium text-ink">
        {shortDate(slot.at)} · {timeOfDay(slot.at)}
      </span>
      <span className="text-ink-3">
        · {slot.duration} min
      </span>
      <Badge tone="neutral" size="sm" className="ml-1">
        <Globe className="size-3" aria-hidden />
        IST
      </Badge>
    </div>
  )
}

function DateChip({ at, large }: { at: string; large?: boolean }) {
  const d = new Date(at)
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-v bg-brand-50 text-center',
        large ? 'size-16' : 'size-12',
      )}
    >
      <span className={cn('font-mono font-bold leading-none text-brand-700', large ? 'text-2xl' : 'text-lg')}>
        {d.getDate()}
      </span>
      <span className="text-[10px] uppercase text-brand-600">
        {d.toLocaleDateString('en-IN', { month: 'short' })}
      </span>
    </span>
  )
}

function Detail({ slot, i, large }: { slot: Slot; i: I; large?: boolean }) {
  const job = jobById(slot.jobId)!
  const company = companyById(job.companyId)

  return (
    <div className={cn(large ? 'p-8' : 'p-5')}>
      <div className="flex flex-wrap items-start gap-4">
        <CompanyMark company={company} size={large ? 56 : 44} />
        <div className="min-w-0 flex-1">
          <h2 className={cn('font-semibold text-ink', large ? 'text-2xl' : 'text-lg')}>
            {job.title}
          </h2>
          <p className="text-ink-2">{company.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StagePill stage={slot.stage} />
            <Badge tone={slot.status === 'confirmed' ? 'success' : 'warning'} size="sm">
              {slot.status === 'confirmed' ? 'confirmed' : 'awaiting your confirmation'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <TimeBlock slot={slot} large={large} />

        <div className="flex items-center gap-2 text-sm">
          {slot.mode.includes('Meet') || slot.mode.includes('Video') ? (
            <Video className="size-4 shrink-0 text-ink-3" aria-hidden />
          ) : (
            <MapPin className="size-4 shrink-0 text-ink-3" aria-hidden />
          )}
          <span className="text-ink-2">{slot.mode}</span>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <Users2 className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
          <div className="flex flex-wrap items-center gap-2">
            {slot.interviewers.map((n) => (
              <span key={n} className="inline-flex items-center gap-1.5">
                <Avatar name={n} id={n} size="xs" />
                <span className="text-ink-2">{n}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-v-control bg-subtle p-3">
        <p className="text-xs font-semibold text-ink">What to expect</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">
          A conversation about work you have actually done — no whiteboard puzzles. The interviewer
          submits structured feedback afterwards, and you will see your stage move either way.
        </p>
      </div>

      {slot.status !== 'completed' && (
        <div className="mt-5 flex flex-wrap gap-2">
          {slot.status !== 'confirmed' && (
            <Button onClick={() => i.confirm(slot.id)}>
              <Check className="size-4" />
              Confirm this time
            </Button>
          )}
          <Button variant="secondary" onClick={() => i.setRescheduling(slot)}>
            <RefreshCw className="size-4" />
            Request another time
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/candidate/messages">Message the recruiter</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function RescheduleDialog({ i }: { i: I }) {
  const [picked, setPicked] = React.useState<string | null>(null)
  const slot = i.rescheduling

  return (
    <Dialog open={Boolean(slot)} onOpenChange={(o) => !o && i.setRescheduling(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request another time</DialogTitle>
          <DialogDescription>
            These are the slots the recruiter has offered. All times are IST.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 px-5 pb-5">
          {PROPOSED.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPicked(t)}
              className={cn(
                'flex w-full items-center gap-3 rounded-v border p-3 text-left transition-v',
                picked === t
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-line hover:border-brand-300 hover:bg-hover',
              )}
            >
              <DateChip at={t} />
              <span>
                <span className="block font-medium text-ink">
                  {new Date(t).toLocaleDateString('en-IN', { weekday: 'long' })}
                </span>
                <span className="block text-sm text-ink-2">{timeOfDay(t)} IST</span>
              </span>
              {picked === t && <Check className="ml-auto size-5 text-brand-600" aria-hidden />}
            </button>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => i.setRescheduling(null)}>
              Cancel
            </Button>
            <Button
              disabled={!picked}
              onClick={() => {
                i.setRescheduling(null)
                setPicked(null)
              }}
            >
              Request this time
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Empty() {
  return (
    <EmptyState
      icon={CalendarDays}
      title="No interviews scheduled"
      description="When a recruiter invites you, it appears here with the time in your own timezone and a one-click confirm."
      action={{ label: 'Track my applications', to: '/candidate/applications' }}
    />
  )
}

/* ══════════════════ A · split list / detail ══════════════════ */

/* Direction A answers the question people actually arrive with: what is
   coming, when, with whom, and what do I have to do before it. */

const ROLES: Record<string, string> = {
  'Meera Krishnan': 'Engineering Manager · your future manager',
  'Sanjay Bose': 'Staff Engineer · will lead the technical part',
  'Anil Suresh': 'Talent Partner · screening call',
}

/* Only the interview-shaped stages carry an agenda, so these are keyed by
   the stages that actually schedule a call rather than by every Stage. */
const INTERVIEW_STAGES = new Set<Stage>(['interview', 'technical_interview', 'hr_interview'])

const AGENDA: { minutes: number; title: string; detail: string; tone: Tone }[] = [
  { minutes: 5, title: 'Intros', detail: 'Who is in the room and how the hour will run.', tone: 'sky' },
  { minutes: 25, title: 'Work you have shipped', detail: 'One project in depth — decisions, trade-offs, what you would redo.', tone: 'indigo' },
  { minutes: 20, title: 'Practical problem', detail: 'A real bug from their codebase. No whiteboard puzzles.', tone: 'violet' },
  { minutes: 10, title: 'Your questions', detail: 'Team, roadmap, how success is measured in the first 90 days.', tone: 'emerald' },
]

const PREP = [
  'Re-read the job description — the hard requirements are what they will probe',
  'Pick one project you can talk about for 20 minutes without slides',
  'Test your camera and mic on the meeting link',
  'Write down two questions about the team',
]

const PAST_OUTCOME: Record<string, { verdict: string; tone: Tone; note: string }> = {
  p1: {
    verdict: 'Moved forward',
    tone: 'emerald',
    note: 'Strong on system design. The interviewer flagged that you should prepare more detail on testing strategy for the next round.',
  },
}

function daysUntil(at: string) {
  return Math.ceil((new Date(at).getTime() - Date.now()) / 86400000)
}

function CountdownBand({ slot }: { slot: Slot }) {
  const job = jobById(slot.jobId)!
  const company = companyById(job.companyId)
  const days = daysUntil(slot.at)
  const when = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`

  return (
    <div className="relative overflow-hidden rounded-v border border-line p-4 sm:p-5">
      <span
        className="absolute inset-0 bg-gradient-to-br from-[var(--color-tone-fuchsia-bg)] via-[var(--color-tone-violet-bg)] to-[var(--color-tone-sky-bg)]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -right-12 -top-20 size-56 rounded-full bg-[var(--color-tone-fuchsia-vivid)] opacity-15 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-v bg-paper/85 text-center shadow-v-card">
          <span className="font-mono text-2xl font-bold leading-none text-tone-fuchsia">
            {new Date(slot.at).getDate()}
          </span>
          <span className="text-[10px] uppercase text-tone-fuchsia">
            {new Date(slot.at).toLocaleDateString('en-IN', { month: 'short' })}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/80 px-2.5 py-1 text-xs font-medium text-tone-fuchsia ring-1 ring-[var(--color-tone-fuchsia)]/20">
            <Timer className="size-3.5" aria-hidden />
            {when} · {timeOfDay(slot.at)} IST
          </span>
          <p className="mt-1.5 truncate text-lg font-semibold text-ink">
            {STAGES[slot.stage].label} · {job.title}
          </p>
          <p className="truncate text-sm text-ink-2">
            {company.name} · {slot.mode} · {slot.duration} min
          </p>
        </div>
        <Button asChild>
          <a href="https://meet.google.com/" target="_blank" rel="noreferrer">
            <Video className="size-4" />
            Join
          </a>
        </Button>
      </div>
    </div>
  )
}

function DetailA({ slot, i }: { slot: Slot; i: I }) {
  const job = jobById(slot.jobId)!
  const company = companyById(job.companyId)
  const scheduled = INTERVIEW_STAGES.has(slot.stage)
  const agenda = scheduled ? AGENDA : []
  const prep = scheduled ? PREP : []
  const totalMin = agenda.reduce((n, a) => n + a.minutes, 0)

  return (
    <div className="grid gap-4">
      {/* who and when */}
      <div className="rounded-v border border-line bg-paper p-5 shadow-v-card">
        <div className="flex flex-wrap items-start gap-4">
          <CompanyMark company={company} size={48} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-ink">{job.title}</h2>
            <p className="text-ink-2">{company.name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StagePill stage={slot.stage} />
              <Badge tone={slot.status === 'confirmed' ? 'success' : 'warning'} size="sm">
                {slot.status === 'confirmed' ? 'confirmed' : 'awaiting your confirmation'}
              </Badge>
            </div>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { icon: CalendarDays, tone: 'fuchsia' as Tone, label: 'When', value: `${shortDate(slot.at)} · ${timeOfDay(slot.at)} IST` },
            { icon: Timer, tone: 'amber' as Tone, label: 'Length', value: `${slot.duration} minutes` },
            { icon: Video, tone: 'sky' as Tone, label: 'Where', value: slot.mode },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2.5">
              <span
                className={cn('grid size-9 shrink-0 place-items-center rounded-lg', TONE_CLASS[row.tone].bg, TONE_CLASS[row.tone].text)}
                aria-hidden
              >
                <row.icon className="size-4.5" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-ink-3">{row.label}</dt>
                <dd className="truncate text-sm font-medium text-ink">{row.value}</dd>
              </div>
            </div>
          ))}
        </dl>

        {slot.status !== 'completed' && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
            {slot.status !== 'confirmed' && (
              <Button onClick={() => i.confirm(slot.id)}>
                <Check className="size-4" />
                Confirm this time
              </Button>
            )}
            <Button variant="secondary" onClick={() => i.setRescheduling(slot)}>
              <RefreshCw className="size-4" />
              Request another time
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/candidate/messages">Message the recruiter</Link>
            </Button>
          </div>
        )}
      </div>

      {/* who you will meet */}
      <div className="rounded-v border border-line bg-paper p-5 shadow-v-card">
        <SectionHeading title="Who you will meet" icon={Users2} tone="violet" />
        <ul className="grid gap-2 sm:grid-cols-2">
          {slot.interviewers.map((n, idx) => {
            const tone: Tone = idx % 2 === 0 ? 'violet' : 'teal'
            return (
              <li
                key={n}
                className={cn('flex items-center gap-3 rounded-v border border-line p-3', TONE_CLASS[tone].bg)}
              >
                <Avatar name={n} id={n} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{n}</p>
                  <p className="truncate text-xs text-ink-2">{ROLES[n] ?? 'Interviewer'}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* how the time is spent */}
      {agenda.length > 0 && (
        <div className="rounded-v border border-line bg-paper p-5 shadow-v-card">
          <SectionHeading
            title={`How the ${totalMin} minutes are spent`}
            icon={ListChecks}
            tone="indigo"
          />
          <ol className="relative space-y-3 pl-6">
            <span className="absolute left-[7px] top-2 bottom-2 w-px bg-line" aria-hidden />
            {agenda.map((a) => (
              <li key={a.title} className="relative">
                <span
                  className={cn('absolute -left-6 top-1 size-3.5 rounded-full ring-4 ring-paper', TONE_CLASS[a.tone].fill)}
                  aria-hidden
                />
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="text-sm font-semibold text-ink">{a.title}</p>
                  <span
                    className={cn('rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold', TONE_CLASS[a.tone].bg, TONE_CLASS[a.tone].text)}
                  >
                    {a.minutes} min
                  </span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-2">{a.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* prep */}
      {prep.length > 0 && (
        <div className="rounded-v border border-line bg-paper p-5 shadow-v-card">
          <SectionHeading title="Before the call" icon={ClipboardCheck} tone="emerald" />
          <ul className="grid gap-2">
            {prep.map((p) => (
              <li key={p} className="flex items-start gap-2.5 rounded-v-control bg-[var(--color-tone-emerald-bg)] p-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-tone-emerald" aria-hidden />
                <span className="text-sm leading-relaxed text-ink-2">{p}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-v-control bg-subtle p-3 text-sm leading-relaxed text-ink-2">
            <span className="font-semibold text-ink">What to expect. </span>
            A conversation about work you have actually done. The interviewer submits structured
            feedback afterwards, and you will see your stage move either way.
          </p>
        </div>
      )}
    </div>
  )
}

function InterviewsA({ i }: { i: I }) {
  if (i.list.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Empty />
      </div>
    )
  }

  const upcoming = i.list.filter((s) => s.status !== 'completed')
  const unconfirmed = upcoming.filter((s) => s.status !== 'confirmed')
  const next = [...upcoming].sort((a, b) => +new Date(a.at) - +new Date(b.at))[0]

  const cards = [
    { tone: 'fuchsia' as Tone, icon: CalendarDays, label: 'Upcoming', value: upcoming.length,
      caption: next ? `next ${shortDate(next.at)}` : undefined },
    { tone: 'amber' as Tone, icon: Clock, label: 'Awaiting your confirmation', value: unconfirmed.length,
      caption: unconfirmed.length ? 'confirm so the slot is held' : 'all confirmed' },
    { tone: 'emerald' as Tone, icon: Check, label: 'Completed', value: PAST.length,
      caption: 'feedback shared with you' },
    { tone: 'indigo' as Tone, icon: Timer, label: 'Days to next', value: next ? Math.max(0, daysUntil(next.at)) : '—',
      caption: next ? timeOfDay(next.at) + ' IST' : undefined },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={CalendarDays}
        tone="fuchsia"
        title="Interviews"
        description={`${upcoming.length} upcoming · ${PAST.length} completed · all times shown in IST`}
      />

      {next && (
        <div className="mt-5">
          <CountdownBand slot={next} />
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[320px_1fr]">
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Upcoming</h2>
          <Stagger className="space-y-2" whenVisible={false}>
            {i.list.map((s, idx) => {
              const job = jobById(s.jobId)!
              const active = s.id === i.active?.id
              const tone: Tone = idx % 2 === 0 ? 'fuchsia' : 'violet'
              return (
                <StaggerItem key={s.id}>
                  <button
                    type="button"
                    onClick={() => i.setActiveId(s.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'relative flex w-full items-center gap-3 overflow-hidden rounded-v border p-3 text-left transition-v',
                      active
                        ? 'border-line-strong bg-paper shadow-v-card'
                        : 'border-line bg-paper hover:border-line-strong hover:bg-hover',
                    )}
                  >
                    <span className={cn('absolute inset-y-0 left-0 w-1', active ? TONE_CLASS[tone].rail : 'bg-transparent')} aria-hidden />
                    <span
                      className={cn('ml-1 grid size-12 shrink-0 place-items-center rounded-v text-center', TONE_CLASS[tone].bg)}
                      aria-hidden
                    >
                      <span className={cn('font-mono text-lg font-bold leading-none', TONE_CLASS[tone].text)}>
                        {new Date(s.at).getDate()}
                      </span>
                      <span className={cn('text-[10px] uppercase', TONE_CLASS[tone].text)}>
                        {new Date(s.at).toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{job.title}</span>
                      <span className="block truncate text-xs text-ink-3">
                        {timeOfDay(s.at)} IST · {STAGES[s.stage].label}
                      </span>
                    </span>
                    {s.status !== 'confirmed' && (
                      <span
                        className="size-2 shrink-0 rounded-full bg-warning"
                        aria-label="Needs confirmation"
                      />
                    )}
                  </button>
                </StaggerItem>
              )
            })}
          </Stagger>

          {PAST.length > 0 && (
            <div className="mt-5">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
                Already done
              </h2>
              <ul className="space-y-2">
                {PAST.map((s) => {
                  const out = PAST_OUTCOME[s.id]
                  return (
                    <li
                      key={s.id}
                      className="relative overflow-hidden rounded-v border border-line bg-paper p-3"
                    >
                      <span
                        className={cn('absolute inset-y-0 left-0 w-1', TONE_CLASS[out?.tone ?? 'teal'].rail)}
                        aria-hidden
                      />
                      <p className="ml-1 text-sm font-medium text-ink">{jobById(s.jobId)?.title}</p>
                      <p className="ml-1 text-xs text-ink-3">
                        {shortDate(s.at)} · {relativeTime(s.at)}
                      </p>
                      {out && (
                        <>
                          <span
                            className={cn(
                              'ml-1 mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold',
                              TONE_CLASS[out.tone].bg,
                              TONE_CLASS[out.tone].text,
                            )}
                          >
                            {out.verdict}
                          </span>
                          <p className="ml-1 mt-1.5 text-xs leading-relaxed text-ink-2">{out.note}</p>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        {i.active && (
          <Reveal key={i.active.id}>
            <DetailA slot={i.active} i={i} />
          </Reveal>
        )}
      </div>
    </div>
  )
}

/* ══════════════════ B · week grid ══════════════════ */

function InterviewsB({ i }: { i: I }) {
  const days = Array.from({ length: 7 }, (_, d) => {
    const date = new Date()
    date.setDate(date.getDate() + d)
    return date
  })

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Interviews</h1>
          <p className="font-mono text-xs text-ink-3">
            {i.list.filter((s) => s.status === 'confirmed').length} confirmed /{' '}
            {i.list.filter((s) => s.status !== 'confirmed').length} awaiting you · all times IST
          </p>
        </div>
      </div>

      {/* calendar-first */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-v border border-line bg-line">
        {days.map((d) => {
          const key = d.toDateString()
          const slots = i.list.filter((s) => new Date(s.at).toDateString() === key)
          const today = d.toDateString() === new Date().toDateString()
          return (
            <div key={key} className="min-h-40 bg-paper p-2">
              <p
                className={cn(
                  'mb-2 font-mono text-xs',
                  today ? 'font-bold text-brand-600' : 'text-ink-3',
                )}
              >
                {d.toLocaleDateString('en-IN', { weekday: 'short' })} {d.getDate()}
              </p>
              <div className="space-y-1">
                {slots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => i.setActiveId(s.id)}
                    className={cn(
                      'w-full rounded-v-control border-l-2 p-1.5 text-left text-xs transition-v',
                      s.id === i.active?.id ? 'bg-brand-50' : 'bg-subtle hover:bg-hover',
                      s.status === 'confirmed' ? 'border-l-score-elite' : 'border-l-warning',
                    )}
                  >
                    <span className="block font-mono font-semibold text-ink">{timeOfDay(s.at)}</span>
                    <span className="block truncate text-ink-2">{jobById(s.jobId)?.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {i.active && (
        <div className="mt-4 rounded-v border border-line bg-paper shadow-v-card">
          <Detail slot={i.active} i={i} />
        </div>
      )}
    </div>
  )
}

/* ══════════════════ C · agenda timeline ══════════════════ */

function InterviewsC({ i }: { i: I }) {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
        Coming up
      </h1>
      <p className="mt-3 text-lg text-ink-2">
        All times in your timezone — IST. Confirm, or ask for another slot.
      </p>

      {i.list.length === 0 ? (
        <Empty />
      ) : (
        <Stagger className="mt-12 space-y-8">
          {i.list.map((s) => (
            <StaggerItem key={s.id}>
              <div className="flex gap-6">
                <DateChip at={s.at} large />
                <div className="min-w-0 flex-1 rounded-v bg-paper shadow-lg">
                  <Detail slot={s} i={i} large />
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {PAST.length > 0 && (
        <Reveal className="mt-16">
          <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">Already done</h2>
          <div className="mt-5 space-y-3">
            {PAST.map((s) => (
              <div key={s.id} className="rounded-v bg-paper p-5 opacity-70 shadow-v-card">
                <p className="font-semibold text-ink">{jobById(s.jobId)?.title}</p>
                <p className="text-sm text-ink-2">
                  {shortDate(s.at)} · {STAGES[s.stage].label} · completed
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  )
}
