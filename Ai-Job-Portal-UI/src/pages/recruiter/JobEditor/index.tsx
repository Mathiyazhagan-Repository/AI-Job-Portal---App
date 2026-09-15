import * as React from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Sparkles, RefreshCw, Check, Pencil, AlertTriangle, Eye, ShieldCheck, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant, useAnnounce } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Field, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/controls'
import { AIProvenanceChip } from '@/components/brand'
import { Kbd } from '@/components/common'
import { useAuth } from '@/store/auth'

/**
 * R6 — the AI Job Description Generator (PRD Part 13.2).
 *
 * The rule the UI enforces, in all three directions:
 *   AI NEVER AUTO-PUBLISHES. Publish stays disabled until a human has
 *   reviewed every generated section. Each block carries an "AI draft"
 *   chip until accepted or edited.
 */

interface Section {
  key: string
  label: string
  content: string
  status: 'empty' | 'generating' | 'draft' | 'accepted' | 'edited'
}

const DRAFT: Record<string, string> = {
  summary:
    'We are looking for a Senior React Developer to own the front end of our data-exploration product — the surface where thousands of analysts spend their working day. You will set the architectural direction for our React application, partner closely with design, and mentor a small team of engineers.',
  responsibilities:
    '• Own the architecture of our React application and its design system\n• Partner with design to ship interfaces that hold up under real data volume\n• Mentor three mid-level engineers through code review and pairing\n• Define and defend front-end performance budgets',
  requirements:
    '• 4+ years building production React applications\n• Deep TypeScript — generics and discriminated unions, not just annotations\n• Experience with GraphQL clients and cache design\n• Track record of shipping and maintaining a component library',
  qualifications:
    "Bachelor's degree in Computer Science, or equivalent practical experience. We weigh shipped work more heavily than credentials.",
  benefits:
    '• Health cover for you and your dependants\n• Annual learning budget of ₹1,00,000\n• Hybrid working — two days in the Bengaluru office\n• ESOP with a four-year vest',
}

const SUGGESTED_QUESTIONS = [
  'Describe a React performance problem you diagnosed and fixed. What was the root cause?',
  'How do you decide what belongs in a shared component library versus a product feature?',
  'How many years have you worked with TypeScript in a production codebase?',
]

function useJobEditor() {
  const navigate = useNavigate()
  const [brief, setBrief] = React.useState({
    title: 'Senior React Developer',
    seniority: 'Senior',
    skills: 'React, TypeScript, Node.js, GraphQL',
    notes: 'Own the front end of our data-exploration product. Mentor 3 engineers.',
    applicationMethod: 'apply_now' as 'easy_apply' | 'apply_now',
  })

  const [sections, setSections] = React.useState<Section[]>([
    { key: 'summary', label: 'About the role', content: '', status: 'empty' },
    { key: 'responsibilities', label: 'Responsibilities', content: '', status: 'empty' },
    { key: 'requirements', label: 'Requirements', content: '', status: 'empty' },
    { key: 'qualifications', label: 'Qualifications', content: '', status: 'empty' },
    { key: 'benefits', label: 'Benefits', content: '', status: 'empty' },
  ])
  const [questions, setQuestions] = React.useState<string[]>([])
  const [generating, setGenerating] = React.useState(false)
  const [publishing, setPublishing] = React.useState(false)
  const [publishError, setPublishError] = React.useState<string | null>(null)
  const announce = useAnnounce()
  const { token } = useAuth()

  /** Streams section by section, the way the real endpoint will. */
  const generate = React.useCallback(async () => {
    setGenerating(true)
    setQuestions([])
    setSections((s) => s.map((x) => ({ ...x, content: '', status: 'empty' as const })))

    for (const key of Object.keys(DRAFT)) {
      setSections((s) => s.map((x) => (x.key === key ? { ...x, status: 'generating' } : x)))
      await new Promise((r) => setTimeout(r, 520))
      setSections((s) =>
        s.map((x) => (x.key === key ? { ...x, content: DRAFT[key], status: 'draft' } : x)),
      )
    }
    await new Promise((r) => setTimeout(r, 400))
    setQuestions(SUGGESTED_QUESTIONS)
    setGenerating(false)
    announce('Draft generated. Review each section before publishing.')
  }, [announce])

  const accept = (key: string) =>
    setSections((s) => s.map((x) => (x.key === key ? { ...x, status: 'accepted' } : x)))

  const edit = (key: string, content: string) =>
    setSections((s) => s.map((x) => (x.key === key ? { ...x, content, status: 'edited' } : x)))

  const regenerate = async (key: string) => {
    setSections((s) => s.map((x) => (x.key === key ? { ...x, status: 'generating' } : x)))
    await new Promise((r) => setTimeout(r, 700))
    setSections((s) =>
      s.map((x) => (x.key === key ? { ...x, content: DRAFT[key], status: 'draft' } : x)),
    )
  }

  const reviewed = sections.filter((s) => s.status === 'accepted' || s.status === 'edited').length
  const hasDraft = sections.some((s) => s.content)
  const allReviewed = hasDraft && reviewed === sections.length

  const publish = async () => {
    setPublishError(null)
    if (!allReviewed) {
      setPublishError('Review and accept every drafted section before publishing.')
      return
    }

    setPublishing(true)
    try {
      if (!token) throw new Error('Please sign in before publishing a job.')

      const section = (key: string) => sections.find((item) => item.key === key)?.content ?? ''
      const list = (value: string) => value.split('\n').map((item) => item.replace(/^\s*[•*-]\s*/, '').trim()).filter(Boolean)
      const skills = brief.skills.split(',').map((skill) => skill.trim()).filter(Boolean)

      const payload = {
        title: brief.title.trim(),
        location: '', // The backend uses company.location
        workMode: 'hybrid',
        jobType: 'full_time',
        experienceMin: 0,
        experienceMax: 0,
        salaryMin: 0,
        salaryMax: 0,
        salaryVisible: true,
        requiredSkills: skills,
        preferredSkills: [],
        department: brief.seniority.trim(),
        openings: 1,
        description: section('summary'),
        responsibilities: list(section('responsibilities')),
        qualifications: list(`${section('requirements')}\n${section('qualifications')}`),
        benefits: list(section('benefits')),
        status: 'published'
      }

      const res = await fetch('http://localhost:8000/api/recruiter/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        let errStr = 'Unable to publish the job.'
        try {
          const errData = await res.json()
          errStr = errData.detail || errStr
        } catch {}
        throw new Error(errStr)
      }

      announce('Job published successfully.')
      navigate('/recruiter/jobs')
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Unable to publish the job.')
    } finally {
      setPublishing(false)
    }
  }

  const checklist = [
    { label: 'Job title', done: brief.title.length > 3 },
    { label: 'Required skills', done: brief.skills.length > 3 },
    { label: 'Description drafted', done: hasDraft },
    { label: `All ${sections.length} sections reviewed by a human`, done: allReviewed },
    { label: 'Screening questions', done: questions.length > 0 },
    { label: 'Salary range', done: false },
  ]

  return {
    brief, setBrief, sections, questions, generating, generate, accept, edit, regenerate,
    reviewed, allReviewed, hasDraft, checklist, publish, publishing, publishError,
  }
}

type Editor = ReturnType<typeof useJobEditor>

export function Component() {
  const variant = useVariant()
  const e = useJobEditor()
  const Views = { a: EditorA, b: EditorB, c: EditorC }
  const View = Views[variant] ?? EditorA
  return <View e={e} />
}
Component.displayName = 'JobEditorPage'

/* ══════════════════ Shared bits ══════════════════ */

function BriefForm({ e, compact }: { e: Editor; compact?: boolean }) {
  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <Field label="Job title" htmlFor="title" required>
        <Input
          value={e.brief.title}
          onChange={(ev) => e.setBrief((b) => ({ ...b, title: ev.target.value }))}
        />
      </Field>
      <Field label="Seniority" htmlFor="seniority">
        <Input
          value={e.brief.seniority}
          onChange={(ev) => e.setBrief((b) => ({ ...b, seniority: ev.target.value }))}
        />
      </Field>
      <Field
        label="Must-have skills"
        htmlFor="skills"
        hint="Comma separated. These become hard requirements in matching."
        required
      >
        <Input
          value={e.brief.skills}
          onChange={(ev) => e.setBrief((b) => ({ ...b, skills: ev.target.value }))}
        />
      </Field>
      <Field
        label="Key responsibilities"
        htmlFor="notes"
        hint="Two or three bullets is enough — the draft expands from here."
      >
        <Textarea
          rows={compact ? 3 : 4}
          value={e.brief.notes}
          onChange={(ev) => e.setBrief((b) => ({ ...b, notes: ev.target.value }))}
        />
      </Field>

      <Field
        label="Application button"
        htmlFor="application-method"
        hint="Choose the single button candidates will see on this job."
      >
        <select
          id="application-method"
          value={e.brief.applicationMethod}
          onChange={(ev) =>
            e.setBrief((b) => ({
              ...b,
              applicationMethod: ev.target.value as 'easy_apply' | 'apply_now',
            }))
          }
          className="h-10 w-full rounded-v-control border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand-500"
        >
          <option value="apply_now">Apply now</option>
          <option value="easy_apply">Easy apply</option>
        </select>
      </Field>

      <Button className="w-full" onClick={e.generate} loading={e.generating}>
        {!e.generating && <Sparkles className="size-4" />}
        {e.generating ? 'Drafting…' : e.hasDraft ? 'Regenerate draft' : 'Generate draft'}
      </Button>

      <p className="flex items-start gap-2 rounded-v-control bg-accent-50 p-2.5 text-xs leading-relaxed text-accent-700">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        The draft is checked for discriminatory language before it reaches you. Nothing publishes
        until you review every section.
      </p>
    </div>
  )
}

function SectionBlock({
  s,
  e,
  dense,
}: {
  s: Section
  e: Editor
  dense?: boolean
}) {
  const [editing, setEditing] = React.useState(false)

  if (s.status === 'generating') {
    return (
      <div className={cn('rounded-v border border-line bg-paper', dense ? 'p-3' : 'p-4')}>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">{s.label}</h3>
          <Badge tone="accent" size="sm">
            <Sparkles className="size-3" /> drafting
          </Badge>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-[92%]" />
          <Skeleton className="h-3 w-[76%]" />
        </div>
      </div>
    )
  }

  if (s.status === 'empty') {
    return (
      <div
        className={cn(
          'rounded-v border border-dashed border-line bg-canvas text-center text-sm text-ink-3',
          dense ? 'p-4' : 'p-6',
        )}
      >
        {s.label} — not drafted yet
      </div>
    )
  }

  const reviewed = s.status === 'accepted' || s.status === 'edited'

  return (
    <div
      className={cn(
        'rounded-v border bg-paper transition-colors',
        reviewed ? 'border-score-elite/30' : 'border-accent-200',
        dense ? 'p-3' : 'p-4',
      )}
    >
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-ink">{s.label}</h3>
        {s.status === 'draft' && <AIProvenanceChip what="drafted this section" />}
        {s.status === 'accepted' && (
          <Badge tone="success" size="sm">
            <Check className="size-3" /> accepted
          </Badge>
        )}
        {s.status === 'edited' && (
          <Badge tone="success" size="sm">
            <Pencil className="size-3" /> edited by you
          </Badge>
        )}

        <span className="ml-auto flex gap-1">
          <Button size="xs" variant="ghost" onClick={() => setEditing((v) => !v)}>
            <Pencil className="size-3.5" />
            {editing ? 'Done' : 'Edit'}
          </Button>
          <Button size="xs" variant="ghost" onClick={() => e.regenerate(s.key)}>
            <RefreshCw className="size-3.5" />
            Regenerate
          </Button>
          {!reviewed && (
            <Button size="xs" onClick={() => e.accept(s.key)}>
              <Check className="size-3.5" />
              Accept
            </Button>
          )}
        </span>
      </div>

      {editing ? (
        <Textarea
          autoFocus
          rows={s.content.split('\n').length + 1}
          value={s.content}
          onChange={(ev) => e.edit(s.key, ev.target.value)}
        />
      ) : (
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{s.content}</p>
      )}
    </div>
  )
}

function PublishChecklist({ e }: { e: Editor }) {
  return (
    <div className="rounded-v border border-line bg-paper p-4">
      <h3 className="text-sm font-semibold text-ink">Publishing checklist</h3>
      <ul className="mt-3 space-y-2">
        {e.checklist.map((c) => (
          <li key={c.label} className="flex items-start gap-2 text-sm">
            <span
              className={cn(
                'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full',
                c.done ? 'bg-score-elite-bg text-score-elite' : 'bg-subtle text-ink-3',
              )}
            >
              {c.done ? <Check className="size-2.5 stroke-[3]" aria-hidden /> : '·'}
            </span>
            <span className={c.done ? 'text-ink-2' : 'text-ink-3'}>{c.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-2 border-t border-line pt-4">
        <Button className="w-full" disabled={!e.allReviewed || e.publishing} onClick={e.publish}>
          {e.publishing ? 'Publishing...' : 'Publish job'}
        </Button>
        <Button variant="secondary" className="w-full">
          <Eye className="size-4" />
          Preview as a candidate
        </Button>
      </div>

      {!e.allReviewed && (
        <p className="mt-3 flex items-start gap-2 rounded-v-control bg-warning-bg p-2.5 text-xs leading-relaxed text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Publishing is locked until a person has reviewed all {e.checklist.length - 2} drafted
          sections. AI never publishes on its own.
        </p>
      )}
      {e.publishError && (
        <p className="mt-3 rounded-v-control border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
          {e.publishError}
        </p>
      )}
    </div>
  )
}

function ScreeningQuestions({ questions }: { questions: string[] }) {
  if (!questions.length) return null
  return (
    <div className="rounded-v border border-line bg-paper p-4">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-ink">Suggested screening questions</h3>
        <AIProvenanceChip what="suggested these questions" />
      </div>
      <ul className="space-y-2">
        {questions.map((q, i) => (
          <li key={q} className="flex gap-2.5 rounded-v-control border border-line p-2.5">
            <span className="font-mono text-xs text-ink-3">{i + 1}</span>
            <p className="flex-1 text-sm text-ink-2">{q}</p>
            <Button size="xs" variant="ghost">
              <Check className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Breadcrumb() {
  return (
    <nav className="flex items-center gap-1 text-xs text-ink-3" aria-label="Breadcrumb">
      <Link to="/recruiter/jobs" className="hover:text-ink">
        Jobs
      </Link>
      <ChevronRight className="size-3" aria-hidden />
      <span className="text-ink">New job</span>
    </nav>
  )
}

/* ══════════════════ A · brief left, draft right ══════════════════ */

function EditorA({ e }: { e: Editor }) {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
      <Breadcrumb />
      <div className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Create a job</h1>
          <p className="mt-1 text-sm text-ink-2">
            Give the AI a short brief. It drafts; you decide what ships.
          </p>
        </div>
        <p className="text-sm text-ink-3">
          <span className="font-mono tnum font-semibold text-ink">{e.reviewed}</span> of{' '}
          {e.sections.length} sections reviewed
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr_300px]">
        <aside>
          <div className="sticky top-20 rounded-v border border-line bg-paper p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink">Your brief</h2>
            <BriefForm e={e} />
          </div>
        </aside>

        <div className="min-w-0 space-y-3">
          {e.sections.map((s) => (
            <SectionBlock key={s.key} s={s} e={e} />
          ))}
          <ScreeningQuestions questions={e.questions} />
        </div>

        <aside>
          <div className="sticky top-20">
            <PublishChecklist e={e} />
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ══════════════════ B · document editor + AI sidebar ══════════════════ */

function EditorB({ e }: { e: Editor }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
        <div className="flex items-baseline gap-3">
          <Breadcrumb />
          <h1 className="text-base font-semibold text-ink">Create a job</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-3">
            {e.reviewed}/{e.sections.length} reviewed
          </span>
          <Button size="xs" variant="secondary">
            <Eye className="size-3.5" />
            Preview
          </Button>
          <Button size="xs" disabled={!e.allReviewed || e.publishing} onClick={e.publish}>
            {e.publishing ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 py-4 lg:grid-cols-[1fr_320px]">
        {/* document column */}
        <div className="min-w-0">
          <input
            value={e.brief.title}
            onChange={(ev) => e.setBrief((b) => ({ ...b, title: ev.target.value }))}
            className="w-full border-none bg-transparent text-2xl font-semibold tracking-tight text-ink outline-none placeholder:text-ink-3"
            placeholder="Job title"
            aria-label="Job title"
          />
          <p className="mb-4 mt-1 font-mono text-xs text-ink-3">
            Northwind Labs · Bengaluru · Hybrid · Draft
          </p>

          <div className="space-y-2">
            {e.sections.map((s) => (
              <SectionBlock key={s.key} s={s} e={e} dense />
            ))}
          </div>

          <div className="mt-3">
            <ScreeningQuestions questions={e.questions} />
          </div>
        </div>

        {/* AI sidebar */}
        <aside className="space-y-3">
          <div className="sticky top-4 space-y-3">
            <div className="rounded-md border border-line bg-paper p-3">
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
                <Sparkles className="size-3.5 text-accent-600" aria-hidden />
                AI assistant
              </h2>
              <BriefForm e={e} compact />
            </div>
            <PublishChecklist e={e} />
            <p className="flex items-center gap-1.5 px-1 text-[11px] text-ink-3">
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd> generate · <Kbd>⌘</Kbd>
              <Kbd>P</Kbd> preview
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ══════════════════ C · conversational build ══════════════════ */

function EditorC({ e }: { e: Editor }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <Breadcrumb />
        <h1 className="font-display tracking-tight mt-3 text-display-2 font-semibold text-ink">
          Let's write this together.
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-lg text-ink-2">
          Tell me the essentials. I'll draft the rest — and you'll approve every word before it goes
          live.
        </p>
      </div>

      {/* the conversation */}
      <div className="mt-10 space-y-4">
        <div className="flex gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-100 text-accent-700">
            <Sparkles className="size-4.5" aria-hidden />
          </span>
          <div className="rounded-v rounded-tl-sm bg-paper p-5 shadow-lg">
            <p className="text-ink-2">
              What role are you hiring for, and what must the person already know?
            </p>
          </div>
        </div>

        <div className="ml-12 rounded-v bg-paper p-6 shadow-lg">
          <BriefForm e={e} />
        </div>

        {e.hasDraft && (
          <div className="flex gap-3 pt-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-100 text-accent-700">
              <Sparkles className="size-4.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="rounded-v rounded-tl-sm bg-paper p-5 shadow-lg">
                <p className="text-ink-2">
                  Here's a first draft. Read each section and accept or rewrite it — I can't publish
                  anything you haven't approved.
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {e.sections.map((s) => (
                  <SectionBlock key={s.key} s={s} e={e} />
                ))}
                <ScreeningQuestions questions={e.questions} />
              </div>
            </div>
          </div>
        )}
      </div>

      {e.hasDraft && (
        <div className="mt-8">
          <PublishChecklist e={e} />
        </div>
      )}
    </div>
  )
}
