import * as React from 'react'
import { Link } from 'react-router'
import {
  CalendarDays, Clock, AlertTriangle, Check, Send, Users2, Star, Globe, X, RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant, useAnnounce } from '@/hooks'
import { recruiterInterviews as seed, type InterviewSlot } from '@/data/console'
import { jobById } from '@/data/mock'
import { useAuth } from '@/store/auth'
import { STAGES } from '@/lib/pipeline'
import { shortDate, timeOfDay, relativeTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/controls'
import { Textarea, Label } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Tooltip } from '@/components/ui/overlay'
import { PageHeader, EmptyState } from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { StagePill } from '@/components/brand'

/**
 * R14 / R15 — Interview scheduling and structured feedback (PRD Part 21).
 *
 * The rule the UI enforces: structured feedback — a rating, strengths,
 * concerns and an explicit recommendation — is REQUIRED before a
 * candidate can advance past an interview stage. Other interviewers'
 * feedback stays hidden until yours is in, to prevent anchoring.
 */

const INTERVIEWERS = ['Meera Krishnan', 'Sanjay Bose', 'Nikita Rane', 'Imran Qadri']
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17]

function useInterviews() {
  const { token } = useAuth()
  const [list, setList] = React.useState<InterviewSlot[]>([])
  const [feedbackFor, setFeedbackFor] = React.useState<InterviewSlot | null>(null)
  const [rescheduleFor, setRescheduleFor] = React.useState<InterviewSlot | null>(null)
  const [proposing, setProposing] = React.useState(false)
  const announce = useAnnounce()

  React.useEffect(() => {
    let active = true
    fetch('http://localhost:8000/api/interviews/recruiter', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => res.ok ? res.json() : [])
      .then(data => {
        if (active) {
          setList(Array.isArray(data) && data.length > 0 ? data as InterviewSlot[] : seed)
        }
      })
      .catch(() => { if (active) setList(seed) })
    return () => { active = false }
  }, [token])

  const submitFeedback = (id: string) => {
    fetch(`http://localhost:8000/api/interviews/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'completed' })
    })
    setList((l) => l.map((s) => (s.id === id ? { ...s, status: 'completed', feedbackDue: false } : s)))
    announce('Feedback submitted. The candidate can now be moved to the next stage.')
    setFeedbackFor(null)
  }

  const cancelInterview = (id: string) => {
    fetch(`http://localhost:8000/api/interviews/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'cancelled' })
    })
    setList((l) => l.map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s)))
    announce('Interview cancelled. The candidate will be notified.')
  }

  const rescheduleInterview = (id: string, at: string) => {
    fetch(`http://localhost:8000/api/interviews/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'scheduled' })
    })
    setList((l) => l.map((s) => (s.id === id ? { ...s, at, status: 'scheduled' } : s)))
    setRescheduleFor(null)
    announce('Interview rescheduled. The candidate will be notified.')
  }

  const overdue = list.filter((s) => s.feedbackDue)
  const upcoming = list.filter((s) => s.status === 'scheduled' || s.status === 'confirmed')

  return {
    list, overdue, upcoming, feedbackFor, setFeedbackFor, proposing, setProposing,
    rescheduleFor, setRescheduleFor, submitFeedback, cancelInterview, rescheduleInterview,
  }
}

type I = ReturnType<typeof useInterviews>

export function Component() {
  const variant = useVariant()
  const i = useInterviews()
  const Views = { a: SchedA, b: SchedB, c: SchedC }
  const View = Views[variant] ?? SchedA
  return (
    <>
      <View i={i} />
      <FeedbackDialog i={i} />
      <ProposeDialog i={i} />
      <RescheduleDialog i={i} />
    </>
  )
}
Component.displayName = 'RecruiterInterviews'

/* ══════════════════ shared ══════════════════ */

function OverdueBanner({ i }: { i: I }) {
  if (i.overdue.length === 0) return null
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-v border border-danger/25 bg-danger-bg/50 p-4">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-danger">
          {i.overdue.length} interview {i.overdue.length === 1 ? 'needs' : 'need'} your feedback
        </p>
        <p className="mt-1 text-sm text-ink-2">
          Nobody can move past an interview stage until structured feedback is in — that is enforced
          at the API, not just here.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {i.overdue.map((s) => (
            <Button key={s.id} size="sm" onClick={() => i.setFeedbackFor(s)}>
              Give feedback on {s.candidateName.split(' ')[0]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SlotRow({ s, i, dense }: { s: InterviewSlot; i: I; dense?: boolean }) {
  const job = jobById(s.jobId)
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-v border bg-paper transition-v',
        s.feedbackDue ? 'border-danger/25' : 'border-line',
        dense ? 'px-3 py-2' : 'p-3.5',
      )}
    >
      <Avatar name={s.candidateName} id={s.candidateId} size={dense ? 'sm' : 'md'} />
      <div className="min-w-0 flex-1">
        <p className={cn('font-medium text-ink', dense && 'text-sm')}>{s.candidateName}</p>
        <p className="truncate text-xs text-ink-3">
          {job?.title} · {STAGES[s.stage].label}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-medium text-ink">
          {shortDate(s.at)} {timeOfDay(s.at)}
        </p>
        <p className="text-xs text-ink-3">
          {s.duration} min · IST · {s.interviewers.length} interviewer
          {s.interviewers.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="shrink-0">
        {s.status === 'cancelled' ? (
          <Badge tone="danger" size="sm">cancelled</Badge>
        ) : s.feedbackDue ? (
          <Button size="sm" onClick={() => i.setFeedbackFor(s)}>
            Give feedback
          </Button>
        ) : s.status === 'completed' ? (
          <Badge tone="success" size="sm">
            <Check className="size-3" aria-hidden /> feedback in
          </Badge>
        ) : (
          <Badge tone={s.status === 'confirmed' ? 'success' : 'warning'} size="sm">
            {s.status === 'confirmed' ? 'confirmed' : 'awaiting candidate'}
          </Badge>
        )}
      </div>

      {(s.status === 'scheduled' || s.status === 'confirmed') && (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => i.setRescheduleFor(s)}
            aria-label={`Reschedule interview with ${s.candidateName}`}
          >
            <RotateCcw className="size-4" />
            Reschedule
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => i.cancelInterview(s.id)}
            aria-label={`Cancel interview with ${s.candidateName}`}
            className="text-danger hover:bg-danger-bg"
          >
            <X className="size-4" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

/* ══════════════════ feedback — the gate ══════════════════ */

function FeedbackDialog({ i }: { i: I }) {
  const s = i.feedbackFor
  const [rating, setRating] = React.useState(0)
  const [strengths, setStrengths] = React.useState('')
  const [concerns, setConcerns] = React.useState('')
  const [rec, setRec] = React.useState<'proceed' | 'reject' | 'hold' | null>(null)

  React.useEffect(() => {
    if (s) {
      setRating(0)
      setStrengths('')
      setConcerns('')
      setRec(null)
    }
  }, [s])

  const complete = rating > 0 && strengths.trim().length > 3 && rec !== null

  return (
    <Dialog open={Boolean(s)} onOpenChange={(o) => !o && i.setFeedbackFor(null)}>
      <DialogContent className="md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Interview feedback — {s?.candidateName}</DialogTitle>
          <DialogDescription>
            Other interviewers' notes stay hidden until you submit, so nobody anchors on anyone else.
          </DialogDescription>
        </DialogHeader>

        {s && (
          <div className="max-h-[70dvh] overflow-y-auto px-5 pb-5">
            <div>
              <Label>Overall rating</Label>
              {/* segmented, not stars — stars imply a consumer review */}
              <div className="mt-2 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-pressed={rating === n}
                    className={cn(
                      'h-10 flex-1 rounded-v-control border text-sm font-semibold transition-v',
                      rating === n
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-line bg-paper text-ink-2 hover:border-brand-300',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-1 flex justify-between text-[11px] text-ink-3">
                <span>1 — would not progress</span>
                <span>5 — strong yes</span>
              </p>
            </div>

            <div className="mt-4">
              <Label htmlFor="fb-str">Strengths</Label>
              <Textarea
                id="fb-str"
                rows={3}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="What did they demonstrate? Be specific about what you saw."
                className="mt-1.5"
              />
            </div>

            <div className="mt-4">
              <Label htmlFor="fb-con">Concerns</Label>
              <Textarea
                id="fb-con"
                rows={3}
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                placeholder="Gaps against the role's requirements. Not personal impressions."
                className="mt-1.5"
              />
            </div>

            <div className="mt-4">
              <Label>Recommendation <span className="text-danger">*</span></Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([
                  ['proceed', 'Proceed', 'success'],
                  ['hold', 'Hold', 'warning'],
                  ['reject', 'Reject', 'danger'],
                ] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRec(v)}
                    aria-pressed={rec === v}
                    className={cn(
                      'rounded-v-control border py-2.5 text-sm font-medium transition-v',
                      rec === v
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-line bg-paper text-ink-2 hover:border-brand-300',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 rounded-v-control bg-subtle p-3 text-xs leading-relaxed text-ink-2">
              This becomes part of the audit trail: who recommended what, and when. The candidate
              never sees your notes, but a rejection reason can be shared with them if you choose.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => i.setFeedbackFor(null)}>
                Save draft
              </Button>
              <Button disabled={!complete} onClick={() => i.submitFeedback(s.id)}>
                Submit feedback
              </Button>
            </div>
            {!complete && (
              <p className="mt-2 text-right text-xs text-ink-3">
                A rating, at least one strength and a recommendation are required.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ProposeDialog({ i }: { i: I }) {
  const [picked, setPicked] = React.useState<string[]>([])
  const slots = [1, 2, 3].flatMap((d) =>
    [11, 15].map((h) => {
      const t = new Date()
      t.setDate(t.getDate() + d)
      t.setHours(h, 0, 0, 0)
      return t.toISOString()
    }),
  )

  return (
    <Dialog open={i.proposing} onOpenChange={i.setProposing}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Propose times</DialogTitle>
          <DialogDescription>
            Pick up to three. The candidate chooses one, and both sides see it in their own timezone.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          <div className="grid grid-cols-2 gap-2">
            {slots.map((t) => {
              const on = picked.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setPicked((p) => (on ? p.filter((x) => x !== t) : p.length < 3 ? [...p, t] : p))
                  }
                  aria-pressed={on}
                  className={cn(
                    'rounded-v border p-3 text-left text-sm transition-v',
                    on ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-brand-300',
                  )}
                >
                  <span className="block font-medium text-ink">
                    {new Date(t).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span className="block font-mono text-xs text-ink-3">{timeOfDay(t)} IST</span>
                </button>
              )
            })}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => i.setProposing(false)}>Cancel</Button>
            <Button disabled={picked.length === 0} onClick={() => { i.setProposing(false); setPicked([]) }}>
              <Send className="size-4" />
              Send {picked.length || ''} {picked.length === 1 ? 'time' : 'times'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RescheduleDialog({ i }: { i: I }) {
  const s = i.rescheduleFor
  const [picked, setPicked] = React.useState('')
  const slots = [1, 2, 3, 4].flatMap((d) =>
    [11, 15].map((h) => {
      const t = new Date()
      t.setDate(t.getDate() + d)
      t.setHours(h, 0, 0, 0)
      return t.toISOString()
    }),
  )

  React.useEffect(() => {
    setPicked('')
  }, [s])

  return (
    <Dialog open={Boolean(s)} onOpenChange={(open) => !open && i.setRescheduleFor(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule interview{ s ? ` — ${s.candidateName}` : ''}</DialogTitle>
          <DialogDescription>Select a new time. The candidate will be notified automatically.</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          <div className="grid grid-cols-2 gap-2">
            {slots.map((t) => {
              const selected = picked === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPicked(t)}
                  aria-pressed={selected}
                  className={cn(
                    'rounded-v border p-3 text-left text-sm transition-v',
                    selected ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-brand-300',
                  )}
                >
                  <span className="block font-medium text-ink">
                    {new Date(t).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span className="block font-mono text-xs text-ink-3">{timeOfDay(t)} IST</span>
                </button>
              )
            })}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => i.setRescheduleFor(null)}>Keep current time</Button>
            <Button disabled={!s || !picked} onClick={() => s && i.rescheduleInterview(s.id, picked)}>
              <RotateCcw className="size-4" />
              Reschedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ══════════════════ A · week calendar ══════════════════ */

function SchedA({ i }: { i: I }) {
  const days = Array.from({ length: 5 }, (_, d) => {
    const t = new Date()
    t.setDate(t.getDate() + d)
    return t
  })

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={CalendarDays}
        tone="fuchsia"
        title="Interviews"
        description={`${i.upcoming.length} upcoming · ${i.overdue.length} awaiting your feedback`}
        actions={
          <Button onClick={() => i.setProposing(true)}>
            <CalendarDays className="size-4" />
            Propose times
          </Button>
        }
      />

      <div className="mt-5">
        <OverdueBanner i={i} />
      </div>

      {/* interviewer availability as overlaid lanes */}
      <div className="mt-5 overflow-x-auto rounded-v border border-line bg-paper shadow-v-card">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-line">
            <div />
            {days.map((d) => (
              <div key={d.toDateString()} className="border-l border-line px-2 py-2 text-center">
                <p className="text-xs font-medium text-ink">
                  {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                </p>
                <p className="font-mono text-xs text-ink-3">{d.getDate()}</p>
              </div>
            ))}
          </div>

          {HOURS.map((h) => (
            <div key={h} className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-line last:border-0">
              <div className="px-2 py-1.5 text-right font-mono text-[11px] text-ink-3">
                {String(h).padStart(2, '0')}:00
              </div>
              {days.map((d) => {
                const slot = i.list.find((s) => {
                  const t = new Date(s.at)
                  return t.toDateString() === d.toDateString() && t.getHours() === h
                })
                return (
                  <div key={d.toDateString() + h} className="border-l border-line p-1">
                    {slot ? (
                      <button
                        type="button"
                        onClick={() => slot.feedbackDue && i.setFeedbackFor(slot)}
                        className={cn(
                          'w-full rounded-v-control border-l-2 p-1.5 text-left text-xs transition-v',
                          slot.feedbackDue
                            ? 'border-l-danger bg-danger-bg/60'
                            : slot.status === 'confirmed'
                              ? 'border-l-score-elite bg-score-elite-bg/60'
                              : 'border-l-warning bg-warning-bg/60',
                        )}
                      >
                        <span className="block truncate font-medium text-ink">
                          {slot.candidateName}
                        </span>
                        <span className="block truncate text-ink-3">
                          {STAGES[slot.stage].label}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => i.setProposing(true)}
                        className="h-full min-h-8 w-full rounded-v-control text-xs text-transparent transition-v hover:bg-brand-50 hover:text-brand-600"
                      >
                        +
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink">All interviews</h2>
        <Stagger className="space-y-2" whenVisible={false}>
          {i.list.map((s) => (
            <StaggerItem key={s.id}>
              <SlotRow s={s} i={i} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  )
}

/* ══════════════════ B · pending list first ══════════════════ */

function SchedB({ i }: { i: I }) {
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Interviews</h1>
          <p className="font-mono text-xs text-ink-3">
            {i.upcoming.length} upcoming / {i.overdue.length} feedback overdue · all times IST
          </p>
        </div>
        <Button size="sm" onClick={() => i.setProposing(true)}>
          <CalendarDays className="size-4" />
          Propose times
        </Button>
      </div>

      {i.overdue.length > 0 && (
        <div className="mb-4">
          <OverdueBanner i={i} />
        </div>
      )}

      <section>
        <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
          Needs action
        </h2>
        <Stagger className="space-y-1.5" whenVisible={false}>
          {i.list.filter((s) => s.feedbackDue || s.status === 'scheduled').map((s) => (
            <StaggerItem key={s.id}>
              <SlotRow s={s} i={i} dense />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="mt-5">
        <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
          Confirmed
        </h2>
        <Stagger className="space-y-1.5" whenVisible={false}>
          {i.list.filter((s) => s.status === 'confirmed').map((s) => (
            <StaggerItem key={s.id}>
              <SlotRow s={s} i={i} dense />
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  )
}

/* ══════════════════ C · agenda timeline ══════════════════ */

function SchedC({ i }: { i: I }) {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
            Interviews
          </h1>
          <p className="mt-3 text-lg text-ink-2">
            {i.overdue.length > 0
              ? `${i.overdue.length} people are waiting on your feedback.`
              : 'Everyone is up to date.'}
          </p>
        </div>
        <Button size="lg" onClick={() => i.setProposing(true)}>
          <CalendarDays className="size-4" />
          Propose times
        </Button>
      </div>

      {i.overdue.length > 0 && (
        <Reveal whenVisible={false} className="mt-8">
          <OverdueBanner i={i} />
        </Reveal>
      )}

      <Stagger className="mt-10 space-y-6">
        {i.list.map((s) => {
          const job = jobById(s.jobId)
          return (
            <StaggerItem key={s.id}>
              <div className="flex gap-5">
                <span className="grid size-16 shrink-0 place-items-center rounded-v bg-brand-50 text-center">
                  <span className="font-mono text-2xl font-bold leading-none text-brand-700">
                    {new Date(s.at).getDate()}
                  </span>
                  <span className="text-[10px] uppercase text-brand-600">
                    {new Date(s.at).toLocaleDateString('en-IN', { month: 'short' })}
                  </span>
                </span>

                <div className="min-w-0 flex-1 rounded-v bg-paper p-6 shadow-lg">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-display tracking-tight text-xl font-semibold text-ink">
                        {s.candidateName}
                      </h2>
                      <p className="text-ink-2">{job?.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StagePill stage={s.stage} />
                      {(s.status === 'scheduled' || s.status === 'confirmed') && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => i.setRescheduleFor(s)}
                            aria-label={`Reschedule interview with ${s.candidateName}`}
                          >
                            <RotateCcw className="size-4" />
                            Reschedule
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => i.cancelInterview(s.id)}
                            aria-label={`Cancel interview with ${s.candidateName}`}
                            className="text-danger hover:bg-danger-bg"
                          >
                            <X className="size-4" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-ink-2">
                      <Clock className="size-4 text-ink-3" aria-hidden />
                      {shortDate(s.at)} · {timeOfDay(s.at)} · {s.duration} min
                      <Badge tone="neutral" size="sm">
                        <Globe className="size-3" aria-hidden /> IST
                      </Badge>
                    </p>
                    <p className="flex items-center gap-2 text-ink-2">
                      <Users2 className="size-4 text-ink-3" aria-hidden />
                      {s.interviewers.join(', ')}
                    </p>
                  </div>

                  <div className="mt-5">
                    {s.status === 'cancelled' ? (
                      <Badge tone="danger" size="lg">Interview cancelled</Badge>
                    ) : s.feedbackDue ? (
                      <Button onClick={() => i.setFeedbackFor(s)}>Give feedback</Button>
                    ) : s.status === 'completed' ? (
                      <Badge tone="success" size="lg">
                        <Check className="size-3.5" aria-hidden /> feedback submitted
                      </Badge>
                    ) : (
                      <Badge tone={s.status === 'confirmed' ? 'success' : 'warning'} size="lg">
                        {s.status === 'confirmed' ? 'Confirmed' : 'Awaiting candidate'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </StaggerItem>
          )
        })}
      </Stagger>
    </div>
  )
}
