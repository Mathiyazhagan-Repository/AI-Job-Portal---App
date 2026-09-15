import * as React from 'react'
import { Link } from 'react-router'
import { Clock, Flag, Check, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant, useAnnounce } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress, Checkbox } from '@/components/ui/controls'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/overlay'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { Kbd } from '@/components/common'

/**
 * C11 — Assessment taking screen (PRD Part 20).
 *
 * Rules the UI enforces regardless of direction:
 *  · distraction-free — the FocusLayout gives it no navigation
 *  · the countdown announces at 5 min and 1 min via aria-live
 *  · submitting names the unanswered questions rather than just warning
 *  · auto-submit at zero, and the candidate is told that up front
 *
 * All six PRD question types are supported.
 */

type QType = 'mcq' | 'multi' | 'boolean' | 'yesno' | 'short' | 'number'

interface Question {
  id: string
  type: QType
  prompt: string
  options?: string[]
  weight: number
}

const QUESTIONS: Question[] = [
  { id: 'q1', type: 'mcq', weight: 2, prompt: 'A React list re-renders every row when one row changes. Which is the most likely cause?', options: ['The key prop is set to the array index', 'A new object literal is passed as a prop on every render', 'The list is not virtualised', 'useMemo is missing on the parent'] },
  { id: 'q2', type: 'multi', weight: 3, prompt: 'Which of these will trigger a layout reflow? Select all that apply.', options: ['Reading offsetHeight', 'Changing transform', 'Changing width', 'Reading getBoundingClientRect()'] },
  { id: 'q3', type: 'boolean', weight: 1, prompt: 'In TypeScript, `unknown` can be assigned to any type without a narrowing check.' },
  { id: 'q4', type: 'yesno', weight: 1, prompt: 'Have you maintained a shared component library used by more than one product team?' },
  { id: 'q5', type: 'number', weight: 1, prompt: 'How many years have you worked with TypeScript in a production codebase?' },
  { id: 'q6', type: 'short', weight: 4, prompt: 'Describe a front-end performance problem you diagnosed. What was the root cause, and how did you confirm it?' },
]

const TOTAL_SECONDS = 45 * 60

function useAssessment() {
  const [answers, setAnswers] = React.useState<Record<string, unknown>>({})
  const [flagged, setFlagged] = React.useState<string[]>([])
  const [current, setCurrent] = React.useState(0)
  const [left, setLeft] = React.useState(TOTAL_SECONDS)
  const [confirming, setConfirming] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const announce = useAnnounce()
  const warned = React.useRef<Set<number>>(new Set())

  React.useEffect(() => {
    if (submitted) return
    const id = window.setInterval(() => {
      setLeft((s) => {
        const n = s - 1
        if (n === 300 && !warned.current.has(300)) {
          warned.current.add(300)
          announce('Five minutes remaining')
        }
        if (n === 60 && !warned.current.has(60)) {
          warned.current.add(60)
          announce('One minute remaining')
        }
        if (n <= 0) {
          setSubmitted(true)
          announce('Time is up. Your answers were submitted automatically.')
          return 0
        }
        return n
      })
    }, 1000)
    return () => clearInterval(id)
  }, [announce, submitted])

  const answered = QUESTIONS.filter((q) => {
    const a = answers[q.id]
    return Array.isArray(a) ? a.length > 0 : a !== undefined && a !== ''
  })
  const unanswered = QUESTIONS.filter((q) => !answered.includes(q))

  const setAnswer = (id: string, v: unknown) => setAnswers((a) => ({ ...a, [id]: v }))
  const toggleFlag = (id: string) =>
    setFlagged((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))

  return {
    answers, setAnswer, flagged, toggleFlag, current, setCurrent, left,
    answered, unanswered, confirming, setConfirming, submitted, setSubmitted,
  }
}

type Exam = ReturnType<typeof useAssessment>

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function Component() {
  const variant = useVariant()
  const exam = useAssessment()

  if (exam.submitted) return <Result exam={exam} />

  const Views = { a: ExamA, b: ExamB, c: ExamC }
  const View = Views[variant] ?? ExamA
  return (
    <>
      <View exam={exam} />
      <SubmitDialog exam={exam} />
    </>
  )
}
Component.displayName = 'AssessmentPage'

/* ══════════════════ shared ══════════════════ */

function Countdown({ left, compact }: { left: number; compact?: boolean }) {
  const danger = left <= 60
  const warn = left <= 300 && !danger
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-v-control px-3 font-mono tnum font-semibold transition-v',
        compact ? 'h-8 text-sm' : 'h-10 text-base',
        danger && 'bg-danger-bg text-danger',
        warn && 'bg-warning-bg text-warning',
        !danger && !warn && 'bg-subtle text-ink-2',
      )}
      role="timer"
      aria-label={`${Math.floor(left / 60)} minutes ${left % 60} seconds remaining`}
    >
      <Clock className={cn('size-4', danger && 'animate-pulse')} aria-hidden />
      {mmss(left)}
    </div>
  )
}

function QuestionBody({
  q,
  exam,
  large,
}: {
  q: Question
  exam: Exam
  large?: boolean
}) {
  const value = exam.answers[q.id]

  if (q.type === 'mcq' || q.type === 'boolean' || q.type === 'yesno') {
    const options =
      q.type === 'mcq' ? q.options! : q.type === 'boolean' ? ['True', 'False'] : ['Yes', 'No']
    return (
      <div className="space-y-2" role="radiogroup" aria-label={q.prompt}>
        {options.map((o, i) => {
          const on = value === o
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => exam.setAnswer(q.id, o)}
              className={cn(
                'flex w-full items-center gap-3 rounded-v border text-left transition-v',
                large ? 'p-5 text-lg' : 'p-3.5',
                on
                  ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/15'
                  : 'border-line bg-paper hover:border-brand-300 hover:bg-hover',
              )}
            >
              <span
                className={cn(
                  'grid shrink-0 place-items-center rounded-full border-2 font-mono text-xs font-semibold',
                  large ? 'size-8' : 'size-6',
                  on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line-strong text-ink-3',
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className={on ? 'font-medium text-ink' : 'text-ink-2'}>{o}</span>
            </button>
          )
        })}
        <p className="pt-1 text-xs text-ink-3">
          Press <Kbd>{options.map((_, i) => String.fromCharCode(65 + i)).join('')}</Kbd> to answer
        </p>
      </div>
    )
  }

  if (q.type === 'multi') {
    const arr = (value as string[]) ?? []
    return (
      <div className="space-y-2">
        {q.options!.map((o) => {
          const on = arr.includes(o)
          return (
            <label
              key={o}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-v border transition-v',
                large ? 'p-5 text-lg' : 'p-3.5',
                on ? 'border-brand-600 bg-brand-50' : 'border-line bg-paper hover:border-brand-300',
              )}
            >
              <Checkbox
                checked={on}
                onCheckedChange={() =>
                  exam.setAnswer(q.id, on ? arr.filter((x) => x !== o) : [...arr, o])
                }
              />
              <span className={on ? 'font-medium text-ink' : 'text-ink-2'}>{o}</span>
            </label>
          )
        })}
        <p className="pt-1 text-xs text-ink-3">Select all that apply.</p>
      </div>
    )
  }

  if (q.type === 'number') {
    return (
      <div className="max-w-32">
        <Label htmlFor={q.id}>Years</Label>
        <Input
          id={q.id}
          type="number"
          min={0}
          max={50}
          value={(value as string) ?? ''}
          onChange={(e) => exam.setAnswer(q.id, e.target.value)}
          className={cn('mt-1.5', large && 'h-14 text-lg')}
        />
      </div>
    )
  }

  const text = (value as string) ?? ''
  return (
    <div>
      <Textarea
        rows={large ? 8 : 6}
        value={text}
        onChange={(e) => exam.setAnswer(q.id, e.target.value)}
        placeholder="Write as much or as little as you need."
        aria-label={q.prompt}
        className={large ? 'text-lg' : undefined}
      />
      <p className="mt-1.5 text-xs text-ink-3">
        {text.trim().split(/\s+/).filter(Boolean).length} words · reviewed by a person, not
        auto-graded
      </p>
    </div>
  )
}

function QuestionCard({ q, index, exam, large }: { q: Question; index: number; exam: Exam; large?: boolean }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-ink-3">
            Question {index + 1} of {QUESTIONS.length} · {q.weight}{' '}
            {q.weight === 1 ? 'point' : 'points'}
          </p>
          <h2 className={cn('mt-1.5 font-semibold text-ink', large ? 'text-2xl leading-snug' : 'text-lg')}>
            {q.prompt}
          </h2>
        </div>
        <Button
          variant={exam.flagged.includes(q.id) ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => exam.toggleFlag(q.id)}
          aria-pressed={exam.flagged.includes(q.id)}
        >
          <Flag className="size-4" />
          {exam.flagged.includes(q.id) ? 'Flagged' : 'Flag'}
        </Button>
      </div>
      <QuestionBody q={q} exam={exam} large={large} />
    </div>
  )
}

function Palette({ exam, compact }: { exam: Exam; compact?: boolean }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Questions</p>
      <div className={cn('grid gap-1.5', compact ? 'grid-cols-8' : 'grid-cols-5')}>
        {QUESTIONS.map((q, i) => {
          const done = exam.answered.includes(q)
          const flag = exam.flagged.includes(q.id)
          const here = exam.current === i
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => exam.setCurrent(i)}
              aria-current={here ? 'true' : undefined}
              aria-label={`Question ${i + 1}${done ? ', answered' : ', not answered'}${flag ? ', flagged' : ''}`}
              className={cn(
                'relative grid aspect-square place-items-center rounded-v-control border font-mono text-sm font-semibold transition-v',
                here && 'ring-2 ring-brand-600/40',
                done
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-line bg-paper text-ink-3 hover:border-brand-300',
              )}
            >
              {i + 1}
              {flag && (
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-warning ring-2 ring-paper" />
              )}
            </button>
          )
        })}
      </div>
      <dl className="mt-3 space-y-1 text-xs text-ink-3">
        <div className="flex justify-between">
          <dt>Answered</dt>
          <dd className="font-mono tnum font-medium text-ink">
            {exam.answered.length}/{QUESTIONS.length}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Flagged</dt>
          <dd className="font-mono tnum font-medium text-ink">{exam.flagged.length}</dd>
        </div>
      </dl>
    </div>
  )
}

function Nav({ exam, large }: { exam: Exam; large?: boolean }) {
  const last = exam.current === QUESTIONS.length - 1
  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
      <Button
        variant="secondary"
        onClick={() => exam.setCurrent((c) => Math.max(0, c - 1))}
        disabled={exam.current === 0}
      >
        <ArrowLeft className="size-4" />
        Previous
      </Button>
      {last ? (
        <Button size={large ? 'lg' : 'md'} onClick={() => exam.setConfirming(true)}>
          Review and submit
        </Button>
      ) : (
        <Button
          size={large ? 'lg' : 'md'}
          onClick={() => exam.setCurrent((c) => Math.min(QUESTIONS.length - 1, c + 1))}
        >
          Next
          <ArrowRight className="size-4" />
        </Button>
      )}
    </div>
  )
}

function SubmitDialog({ exam }: { exam: Exam }) {
  return (
    <Dialog open={exam.confirming} onOpenChange={exam.setConfirming}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit your assessment?</DialogTitle>
          <DialogDescription>
            You have one attempt, so this cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          {exam.unanswered.length > 0 ? (
            <div className="rounded-v bg-warning-bg p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-warning">
                <AlertTriangle className="size-4" aria-hidden />
                {exam.unanswered.length} unanswered{' '}
                {exam.unanswered.length === 1 ? 'question' : 'questions'}
              </p>
              {/* name them — a bare warning is not actionable */}
              <ul className="mt-2 space-y-1">
                {exam.unanswered.map((q) => (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => {
                        exam.setCurrent(QUESTIONS.indexOf(q))
                        exam.setConfirming(false)
                      }}
                      className="text-left text-sm text-warning underline-offset-2 hover:underline"
                    >
                      Question {QUESTIONS.indexOf(q) + 1} — {q.prompt.slice(0, 60)}…
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-2 rounded-v bg-score-elite-bg p-3 text-sm text-score-elite">
              <Check className="size-4" aria-hidden />
              All {QUESTIONS.length} questions answered.
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => exam.setConfirming(false)}>
              Keep working
            </Button>
            <Button
              onClick={() => {
                exam.setConfirming(false)
                exam.setSubmitted(true)
              }}
            >
              Submit now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ══════════════════ Result ══════════════════ */

function Result({ exam }: { exam: Exam }) {
  const objective = QUESTIONS.filter((q) => q.type !== 'short')
  const scored = Math.round(
    (exam.answered.filter((q) => q.type !== 'short').length / objective.length) * 82,
  )
  const passed = scored >= 60

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-4 py-16 sm:px-6">
      <Reveal whenVisible={false}>
        <div className="rounded-v border border-line bg-paper p-8 text-center shadow-v-card">
          <span
            className={cn(
              'mx-auto grid size-14 place-items-center rounded-full',
              passed ? 'bg-score-elite-bg text-score-elite' : 'bg-warning-bg text-warning',
            )}
          >
            <Check className="size-7" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-ink">Assessment submitted</h1>
          <p className="mt-2 text-ink-2">
            Northwind Labs · Senior React Developer · submitted just now
          </p>

          <div className="mt-8 rounded-v bg-canvas p-6">
            <p className="font-mono tnum text-5xl font-bold text-ink">{scored}%</p>
            <p className="mt-1 text-sm text-ink-2">
              on the {objective.length} auto-graded questions
            </p>
            <Badge tone={passed ? 'success' : 'warning'} className="mt-3">
              {passed ? 'Above the 60% pass mark' : 'Below the 60% pass mark'}
            </Badge>
          </div>

          <div className="mt-6 space-y-2 text-left">
            {[
              ['Auto-graded', `${objective.length} questions · scored now`],
              ['Written answer', '1 question · reviewed by a person, not by AI'],
              ['Time used', mmss(TOTAL_SECONDS - exam.left)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-line pb-2 text-sm">
                <span className="text-ink-3">{k}</span>
                <span className="font-medium text-ink">{v}</span>
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm text-ink-2">
            The recruiter sees your full answer sheet. Your written answer is read by a person —
            it is never machine-graded.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link to="/candidate/applications">Back to my applications</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/candidate">Dashboard</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </div>
  )
}

/* ══════════════════ A · palette + question ══════════════════ */

function ExamA({ exam }: { exam: Exam }) {
  const q = QUESTIONS[exam.current]
  return (
    <div className="mx-auto min-h-dvh max-w-[1100px] px-4 py-16 sm:px-6">
      <header className="sticky top-0 z-10 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div>
          <h1 className="font-semibold text-ink">Front-end engineering assessment</h1>
          <p className="text-xs text-ink-3">
            Northwind Labs · one attempt · auto-submits at zero
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-3">
            <span className="font-mono tnum font-semibold text-ink">{exam.answered.length}</span>/
            {QUESTIONS.length} answered
          </span>
          <Countdown left={exam.left} />
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[180px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Palette exam={exam} />
        </aside>
        <main className="min-w-0">
          <Reveal key={q.id} whenVisible={false}>
            <QuestionCard q={q} index={exam.current} exam={exam} />
          </Reveal>
          <Nav exam={exam} />
        </main>
      </div>
    </div>
  )
}

/* ══════════════════ B · minimal, keyboard-first ══════════════════ */

function ExamB({ exam }: { exam: Exam }) {
  const q = QUESTIONS[exam.current]
  const pct = ((exam.current + 1) / QUESTIONS.length) * 100

  return (
    <div className="min-h-dvh">
      <div className="fixed inset-x-0 top-0 z-10">
        <Progress value={pct} className="h-1 rounded-none" />
        <div className="flex items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 py-2 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-ink">
              Front-end engineering assessment
            </h1>
            <p className="font-mono text-xs text-ink-3">
              q{exam.current + 1}/{QUESTIONS.length} · {exam.answered.length} answered ·{' '}
              {exam.flagged.length} flagged
            </p>
          </div>
          <Countdown left={exam.left} compact />
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-24 sm:px-6">
        <Reveal key={q.id} whenVisible={false}>
          <QuestionCard q={q} index={exam.current} exam={exam} />
        </Reveal>
        <Nav exam={exam} />

        <div className="mt-6 border-t border-line pt-4">
          <Palette exam={exam} compact />
        </div>
      </main>
    </div>
  )
}

/* ══════════════════ C · one question per screen ══════════════════ */

function ExamC({ exam }: { exam: Exam }) {
  const q = QUESTIONS[exam.current]
  const pct = ((exam.current + 1) / QUESTIONS.length) * 100

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="px-4 pt-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-center text-sm font-medium uppercase tracking-widest text-ink-3">
            Front-end engineering assessment
          </h1>
          <div className="flex items-center gap-4">
            <Progress value={pct} className="flex-1" />
            <Countdown left={exam.left} />
          </div>
        </div>
      </div>

      <main className="flex flex-1 items-center px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <Reveal key={q.id} whenVisible={false}>
            <QuestionCard q={q} index={exam.current} exam={exam} large />
          </Reveal>
          <Nav exam={exam} large />
        </div>
      </main>

      <div className="px-4 pb-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Palette exam={exam} compact />
        </div>
      </div>
    </div>
  )
}
