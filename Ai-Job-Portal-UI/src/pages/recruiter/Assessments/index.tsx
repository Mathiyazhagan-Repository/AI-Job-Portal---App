import * as React from 'react'
import { Link } from 'react-router'
import {
  Plus, ClipboardCheck, Clock, Users2, AlertTriangle, Eye, GripVertical, Trash2, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { assessments, questionDifficulty, scoreDistribution, type AssessmentSummary } from '@/data/console'
import { jobById } from '@/data/mock'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea, Field, Label } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger, Tooltip } from '@/components/ui/overlay'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/controls'
import { PageHeader, EmptyState, DataTable, type Column } from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { AIProvenanceChip } from '@/components/brand'

/** R12 / R13 — Assessment builder and results (PRD Part 20). */

const QUESTION_TYPES = [
  { id: 'mcq', label: 'Multiple choice', auto: true },
  { id: 'multi', label: 'Multiple select', auto: true },
  { id: 'boolean', label: 'True / false', auto: true },
  { id: 'yesno', label: 'Yes / no', auto: true },
  { id: 'number', label: 'Numeric', auto: true },
  { id: 'short', label: 'Short written answer', auto: false },
]

interface Draft {
  id: string
  type: string
  prompt: string
  weight: number
}

const SEED_DRAFT: Draft[] = [
  { id: 'd1', type: 'mcq', prompt: 'A React list re-renders every row when one row changes. Most likely cause?', weight: 2 },
  { id: 'd2', type: 'multi', prompt: 'Which of these trigger a layout reflow?', weight: 3 },
  { id: 'd3', type: 'short', prompt: 'Describe a performance problem you diagnosed.', weight: 4 },
]

function useAssessments() {
  const [list] = React.useState<AssessmentSummary[]>(assessments)
  const [activeId, setActiveId] = React.useState(list[0].id)
  const [draft, setDraft] = React.useState<Draft[]>(SEED_DRAFT)
  const [selected, setSelected] = React.useState<string>('d1')
  const [settings, setSettings] = React.useState({ timeLimit: 45, passMark: 60, attempts: 1 })

  const active = list.find((a) => a.id === activeId)!
  const totalWeight = draft.reduce((n, q) => n + q.weight, 0)
  const autoGraded = draft.filter((q) => QUESTION_TYPES.find((t) => t.id === q.type)?.auto).length

  const setWeight = (id: string, w: number) =>
    setDraft((d) => d.map((q) => (q.id === id ? { ...q, weight: w } : q)))
  const setPrompt = (id: string, p: string) =>
    setDraft((d) => d.map((q) => (q.id === id ? { ...q, prompt: p } : q)))
  const remove = (id: string) => setDraft((d) => d.filter((q) => q.id !== id))
  const add = (type: string) =>
    setDraft((d) => [...d, { id: `d${Date.now()}`, type, prompt: '', weight: 1 }])

  return {
    list, active, activeId, setActiveId, draft, selected, setSelected,
    settings, setSettings, totalWeight, autoGraded, setWeight, setPrompt, remove, add,
  }
}

type A = ReturnType<typeof useAssessments>

export function Component() {
  const variant = useVariant()
  const a = useAssessments()
  const [tab, setTab] = React.useState<'list' | 'build' | 'results'>('list')

  const Views = { a: ViewA, b: ViewB, c: ViewC }
  const View = Views[variant] ?? ViewA
  return <View a={a} tab={tab} setTab={setTab} />
}
Component.displayName = 'RecruiterAssessments'

/* ══════════════════ shared ══════════════════ */

function AssessmentCard({ s, large }: { s: AssessmentSummary; large?: boolean }) {
  const job = s.jobId ? jobById(s.jobId) : null
  return (
    <article
      className={cn(
        'h-full rounded-v border-[length:var(--v-card-border)] border-line bg-paper shadow-v-card hover-lift',
        large ? 'p-6' : 'p-v-card',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={cn('font-semibold text-ink', large && 'text-lg')}>{s.title}</h3>
          <p className="truncate text-sm text-ink-3">{job ? job.title : 'Not linked to a job'}</p>
        </div>
        {s.awaitingReview > 0 && (
          <Badge tone="warning" size="sm">{s.awaitingReview} to review</Badge>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['Attempts', s.attempts],
          ['Avg score', `${s.avgScore}%`],
          ['Pass rate', `${s.passRate}%`],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-v-control bg-canvas p-2">
            <dt className="text-[11px] text-ink-3">{k}</dt>
            <dd className="font-mono tnum font-bold text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1">
          <ClipboardCheck className="size-3.5" aria-hidden />
          {s.questions} questions
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden />
          {s.timeLimit} min
        </span>
        <span>pass at {s.passMark}%</span>
      </div>
    </article>
  )
}

/** Which question is killing everyone — the point of the results screen. */
function DifficultyChart() {
  return (
    <div className="space-y-2">
      {questionDifficulty.map((q) => {
        const manual = q.correct === 0
        return (
          <div key={q.q} className="flex items-center gap-3 text-sm">
            <span className="w-40 shrink-0 truncate text-ink-2">{q.q}</span>
            <div className="h-5 flex-1 overflow-hidden rounded-v-control bg-subtle">
              {!manual && (
                <div
                  className={cn(
                    'h-full rounded-v-control transition-[width] duration-700',
                    q.correct < 50 ? 'bg-warning' : 'bg-score-elite',
                  )}
                  style={{ width: `${q.correct}%` }}
                />
              )}
            </div>
            <span className="w-16 shrink-0 text-right font-mono tnum text-xs text-ink">
              {manual ? 'manual' : `${q.correct}%`}
            </span>
          </div>
        )
      })}
      <p className="pt-2 text-xs text-ink-2">
        <AlertTriangle className="mr-1 inline size-3.5 text-warning" aria-hidden />
        Only 41% get <strong className="font-medium">Q2 · Layout reflow</strong> right. Either it is
        genuinely hard, or the wording is doing the work — worth a look.
      </p>
    </div>
  )
}

function ScoreHistogram() {
  const max = Math.max(...scoreDistribution)
  return (
    <div>
      <div className="flex h-24 items-end gap-1">
        {scoreDistribution.map((n, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn('w-full rounded-t-sm', i * 10 >= 60 ? 'bg-score-elite' : 'bg-line-strong')}
              style={{ height: `${(n / max) * 100}%` }}
              title={`${i * 10}–${i * 10 + 9}%: ${n} candidates`}
            />
            <span className="text-[9px] text-ink-3">{i * 10}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-3">
        Score distribution · green is above the 60% pass mark
      </p>
    </div>
  )
}

/* ══════════════════ the builder ══════════════════ */

function Builder({ a, large }: { a: A; large?: boolean }) {
  const q = a.draft.find((x) => x.id === a.selected) ?? a.draft[0]

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      {/* question list with a live weight meter */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Questions</h3>
          <span className="font-mono tnum text-xs text-ink-3">{a.totalWeight} pts</span>
        </div>

        <Stagger className="space-y-1.5" whenVisible={false}>
          {a.draft.map((x, i) => (
            <StaggerItem key={x.id}>
              <button
                type="button"
                onClick={() => a.setSelected(x.id)}
                aria-current={x.id === a.selected ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center gap-2 rounded-v border p-2.5 text-left transition-v',
                  x.id === a.selected
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-line bg-paper hover:border-line-strong',
                )}
              >
                <GripVertical className="size-4 shrink-0 cursor-grab text-ink-3" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {x.prompt || `Question ${i + 1}`}
                  </span>
                  <span className="block text-xs text-ink-3">
                    {QUESTION_TYPES.find((t) => t.id === x.type)?.label} · {x.weight} pts
                  </span>
                </span>
              </button>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-3">
          <Label htmlFor="add-q">Add a question</Label>
          <select
            id="add-q"
            value=""
            onChange={(e) => e.target.value && a.add(e.target.value)}
            className="mt-1.5 h-9 w-full rounded-v-control border border-line bg-paper px-2 text-sm text-ink outline-none focus:border-brand-500"
          >
            <option value="">Choose a type…</option>
            {QUESTION_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} {t.auto ? '(auto-graded)' : '(manual review)'}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 rounded-v border border-line bg-canvas p-3">
          <p className="text-xs font-semibold text-ink">Grading split</p>
          <p className="mt-1 text-xs text-ink-2">
            <strong className="font-medium">{a.autoGraded}</strong> auto-graded ·{' '}
            <strong className="font-medium">{a.draft.length - a.autoGraded}</strong> read by a person
          </p>
          <p className="mt-1.5 text-[11px] leading-snug text-ink-3">
            Written answers are never machine-graded. They go to your review queue.
          </p>
        </div>
      </div>

      {/* editor for the selected question */}
      {q && (
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-v border border-line bg-paper p-3">
            {[
              ['Time limit', 'timeLimit', 'min'],
              ['Pass mark', 'passMark', '%'],
              ['Max attempts', 'attempts', ''],
            ].map(([label, key, unit]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <span className="text-ink-3">{label}</span>
                <Input
                  type="number"
                  value={a.settings[key as keyof typeof a.settings]}
                  onChange={(e) =>
                    a.setSettings((s) => ({ ...s, [key]: Number(e.target.value) }))
                  }
                  className="h-8 w-20"
                  aria-label={String(label)}
                />
                {unit && <span className="text-xs text-ink-3">{unit}</span>}
              </label>
            ))}
          </div>

          <div className={cn('rounded-v border border-line bg-paper', large ? 'p-6' : 'p-4')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone="brand">{QUESTION_TYPES.find((t) => t.id === q.type)?.label}</Badge>
              <Button variant="ghost" size="sm" onClick={() => a.remove(q.id)}>
                <Trash2 className="size-4" />
                Remove
              </Button>
            </div>

            <Field label="Question" htmlFor="q-prompt" className="mt-4">
              <Textarea
                rows={3}
                value={q.prompt}
                onChange={(e) => a.setPrompt(q.id, e.target.value)}
                placeholder="Ask about something the candidate has actually done."
              />
            </Field>

            {(q.type === 'mcq' || q.type === 'multi') && (
              <div className="mt-4">
                <Label>Options</Label>
                <div className="mt-2 space-y-2">
                  {['Option A', 'Option B', 'Option C', 'Option D'].map((o, i) => (
                    <div key={o} className="flex items-center gap-2">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line font-mono text-xs text-ink-3">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <Input defaultValue={o} aria-label={o} />
                      <Tooltip content="Mark as a correct answer">
                        <Button variant="ghost" size="icon-sm" aria-label="Mark correct">
                          <Check className="size-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <Label htmlFor="q-weight">Weight</Label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="q-weight"
                  type="range"
                  min={1}
                  max={10}
                  value={q.weight}
                  onChange={(e) => a.setWeight(q.id, Number(e.target.value))}
                  className="h-1.5 flex-1 accent-[var(--color-brand-600)]"
                />
                <span className="w-16 text-right font-mono tnum text-sm font-medium text-ink">
                  {q.weight} pts
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <AIProvenanceChip
              what="can suggest questions from the job description"
              cannot="It never grades a written answer and never decides who passes."
            />
            <Button variant="secondary" size="sm" asChild>
              <Link to="/assessment/preview">
                <Eye className="size-4" />
                Preview as a candidate
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Results({ a }: { a: A }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Attempts', a.active.attempts],
          ['Average score', `${a.active.avgScore}%`],
          ['Pass rate', `${a.active.passRate}%`],
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{k}</p>
            <p className="mt-1 font-mono tnum text-3xl font-bold text-ink">{v}</p>
          </div>
        ))}
      </div>

      <section className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
        <h3 className="mb-4 font-semibold text-ink">Score distribution</h3>
        <ScoreHistogram />
      </section>

      <section className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
        <h3 className="mb-1 font-semibold text-ink">Per-question difficulty</h3>
        <p className="mb-4 text-sm text-ink-2">Share of candidates answering each one correctly.</p>
        <DifficultyChart />
      </section>

      {a.active.awaitingReview > 0 && (
        <section className="rounded-v border border-warning/30 bg-warning-bg/40 p-v-card">
          <h3 className="flex items-center gap-2 font-semibold text-warning">
            <AlertTriangle className="size-4" aria-hidden />
            {a.active.awaitingReview} written answers waiting for a person
          </h3>
          <p className="mt-1.5 text-sm text-ink-2">
            Written answers are never machine-graded. Until someone reads them, those candidates
            cannot move stage.
          </p>
          <Button size="sm" className="mt-3">
            Start reviewing
          </Button>
        </section>
      )}
    </div>
  )
}

/* ══════════════════ direction shells ══════════════════ */

type ViewProps = { a: A; tab: 'list' | 'build' | 'results'; setTab: (t: 'list' | 'build' | 'results') => void }

function ViewA({ a, tab, setTab }: ViewProps) {
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={ClipboardCheck}
        tone="amber"
        title="Assessments"
        description="Objective questions are graded automatically; written answers always go to a person."
        actions={
          <Button onClick={() => setTab('build')}>
            <Plus className="size-4" />
            New assessment
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
        <TabsList>
          <TabsTrigger value="list">All ({a.list.length})</TabsTrigger>
          <TabsTrigger value="build">Builder</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-5">
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" whenVisible={false}>
            {a.list.map((s) => (
              <StaggerItem key={s.id}>
                <button type="button" onClick={() => { a.setActiveId(s.id); setTab('results') }} className="block w-full text-left">
                  <AssessmentCard s={s} />
                </button>
              </StaggerItem>
            ))}
          </Stagger>
        </TabsContent>

        <TabsContent value="build" className="mt-5">
          <Builder a={a} />
        </TabsContent>

        <TabsContent value="results" className="mt-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {a.list.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => a.setActiveId(s.id)}
                aria-pressed={s.id === a.activeId}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-v',
                  s.id === a.activeId
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-line bg-paper text-ink-2 hover:border-brand-300',
                )}
              >
                {s.title}
              </button>
            ))}
          </div>
          <Results a={a} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ViewB({ a, tab, setTab }: ViewProps) {
  const columns: Column<AssessmentSummary>[] = [
    { key: 'title', header: 'Assessment', primary: true, sortable: true, sortValue: (s) => s.title, cell: (s) => <span className="font-medium text-ink">{s.title}</span> },
    { key: 'job', header: 'Job', hideBelow: 'md', cell: (s) => <span className="text-ink-2">{s.jobId ? jobById(s.jobId)?.title : '—'}</span> },
    { key: 'q', header: 'Qs', align: 'right', cell: (s) => <span className="font-mono tnum text-xs">{s.questions}</span> },
    { key: 'time', header: 'Limit', align: 'right', hideBelow: 'lg', cell: (s) => <span className="font-mono tnum text-xs">{s.timeLimit}m</span> },
    { key: 'att', header: 'Attempts', align: 'right', sortable: true, sortValue: (s) => s.attempts, cell: (s) => <span className="font-mono tnum text-xs">{s.attempts}</span> },
    { key: 'avg', header: 'Avg', align: 'right', sortable: true, sortValue: (s) => s.avgScore, cell: (s) => <span className="font-mono tnum text-xs">{s.avgScore}%</span> },
    { key: 'pass', header: 'Pass', align: 'right', sortable: true, sortValue: (s) => s.passRate, cell: (s) => <span className="font-mono tnum text-xs">{s.passRate}%</span> },
    {
      key: 'rev', header: 'To review', align: 'right',
      cell: (s) => s.awaitingReview > 0 ? <Badge tone="warning" size="sm">{s.awaitingReview}</Badge> : <span className="text-ink-3">—</span>,
    },
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Assessments</h1>
          <p className="font-mono text-xs text-ink-3">
            {a.list.length} templates · {a.list.reduce((n, s) => n + s.awaitingReview, 0)} answers to review
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="xs" variant={tab === 'list' ? 'primary' : 'secondary'} onClick={() => setTab('list')}>List</Button>
          <Button size="xs" variant={tab === 'build' ? 'primary' : 'secondary'} onClick={() => setTab('build')}>Builder</Button>
          <Button size="xs" variant={tab === 'results' ? 'primary' : 'secondary'} onClick={() => setTab('results')}>Results</Button>
        </div>
      </div>

      {tab === 'list' && (
        <DataTable
          rows={a.list}
          columns={columns}
          rowKey={(s) => s.id}
          activeKey={a.activeId}
          onRowClick={(s) => { a.setActiveId(s.id); setTab('results') }}
          searchable={(s) => s.title}
          searchPlaceholder="Search assessments…"
          empty={{ title: 'No assessments yet' }}
        />
      )}
      {tab === 'build' && <Builder a={a} />}
      {tab === 'results' && <Results a={a} />}
    </div>
  )
}

function ViewC({ a, tab, setTab }: ViewProps) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
            Assessments
          </h1>
          <p className="mt-3 text-lg text-ink-2">
            Machines grade the objective questions. People read the written ones.
          </p>
        </div>
        <Button size="lg" onClick={() => setTab('build')}>
          <Plus className="size-4" />
          New assessment
        </Button>
      </div>

      {tab === 'list' && (
        <Stagger className="mt-10 grid gap-6 sm:grid-cols-2">
          {a.list.map((s) => (
            <StaggerItem key={s.id}>
              <button type="button" onClick={() => { a.setActiveId(s.id); setTab('results') }} className="block w-full text-left">
                <AssessmentCard s={s} large />
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {tab === 'build' && (
        <Reveal className="mt-10 rounded-v bg-paper p-8 shadow-lg">
          <Builder a={a} large />
        </Reveal>
      )}

      {tab === 'results' && (
        <Reveal className="mt-10">
          <Results a={a} />
        </Reveal>
      )}

      {tab !== 'list' && (
        <Button variant="ghost" className="mt-6" onClick={() => setTab('list')}>
          Back to all assessments
        </Button>
      )}
    </div>
  )
}
