import * as React from 'react'
import { Link } from 'react-router'
import {
  Check, Pencil, Plus, X, GraduationCap, Briefcase, Award, FolderGit2,
  Languages, User, FileText, Sparkles, Target,
  Eye, Unlock, LayoutList, MapPin, Radio, Clock, ArrowRight,
  FileUp, Download, Loader2, Sparkle, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { MAX_RESUMES, useProfileStore, parseFor, type ProfileData } from '@/store/profile'
import { relativeTime } from '@/lib/format'
import { downloadProfilePdf } from '@/lib/profilePdf'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Field, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/controls'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { AIProvenanceChip, ScoreRing } from '@/components/brand'
import { Avatar } from '@/components/ui/controls'
import {
  SectionHeading, RadialGauge, StackedBar, TONE_CLASS, type Tone,
} from '@/components/common'

/**
 * C3 — Profile editor.
 *
 * The profile IS the matching input, so every section says what it
 * affects. Sections are inline-editable: click a card and it becomes a
 * form in place — no modal, no separate edit page.
 */

interface Section {
  id: string
  label: string
  icon: React.ElementType
  complete: boolean
  /** What this section changes in the match score. */
  affects: string
}

const SECTION_SPEC: Omit<Section, 'complete'>[] = [
  { id: 'personal', label: 'Personal details', icon: User, affects: 'Location match — 15% of your score' },
  { id: 'summary', label: 'Professional summary', icon: FileText, affects: 'Job-title relevance — 10%' },
  { id: 'skills', label: 'Skills', icon: Sparkles, affects: 'Skills match — 35%, the largest single component' },
  { id: 'experience', label: 'Work experience', icon: Briefcase, affects: 'Experience match — 20%' },
  { id: 'education', label: 'Education', icon: GraduationCap, affects: 'Education match — 10%' },
  { id: 'certifications', label: 'Certifications', icon: Award, affects: 'Can satisfy a hard requirement on some roles' },
  { id: 'projects', label: 'Projects', icon: FolderGit2, affects: 'Supports skills evidence' },
  { id: 'languages', label: 'Languages', icon: Languages, affects: 'Filtering only — never scored' },
]

const EXPERIENCE = [
  { company: 'Zenith Systems', title: 'Senior Frontend Engineer', from: 'Mar 2023', to: 'Present', current: true, detail: 'Own the design system and the analytics surface used by 12k weekly users. Cut first-contentful-paint by 44%.' },
  { company: 'Loop Health', title: 'Frontend Engineer', from: 'Jul 2021', to: 'Feb 2023', current: false, detail: 'Built the patient-intake flow in React and TypeScript. Introduced Testing Library across the front end.' },
]

const EDUCATION = [
  { institution: 'NIT Trichy', degree: 'B.Tech', field: 'Computer Science', from: '2017', to: '2021', grade: '8.6 CGPA' },
]

function useProfile() {
  const store = useProfileStore()
  const { data } = store
  const [editing, setEditing] = React.useState<string | null>(null)
  const [newSkill, setNewSkill] = React.useState('')
  const [saved, setSaved] = React.useState<string | null>(null)

  const flashSaved = () => {
    setSaved(new Date().toISOString())
    window.setTimeout(() => setSaved(null), 2200)
  }

  const addSkill = () => {
    const v = newSkill.trim()
    if (!v || data.skills.includes(v)) return
    store.set('skills', [...data.skills, v])
    setNewSkill('')
    flashSaved()
  }
  const removeSkill = (s: string) => {
    store.set('skills', data.skills.filter((x) => x !== s))
    flashSaved()
  }

  /** Which sections actually have content — derived, never hardcoded. */
  const isComplete = (id: string): boolean => {
    switch (id) {
      case 'personal': return Boolean(data.name && data.headline && data.location && data.email)
      case 'summary': return data.summary.trim().length > 0
      case 'skills': return data.skills.length > 0
      case 'experience': return data.experience.length > 0
      case 'education': return data.education.length > 0
      case 'certifications': return data.certifications.length > 0
      case 'projects': return false
      case 'languages': return data.languages.length > 0
      default: return false
    }
  }

  const sections: Section[] = SECTION_SPEC.map((s) => ({ ...s, complete: isComplete(s.id) }))

  // Completion moves as they work — the payoff is visible.
  const done = sections.filter((s) => s.complete).length
  const pct = Math.min(
    100,
    Math.round(((done + Math.min(data.skills.length, 8) / 8) / (sections.length + 1)) * 100) + 12,
  )

  return {
    ...store,
    data,
    sections,
    editing, setEditing,
    skills: data.skills,
    newSkill, setNewSkill, addSkill, removeSkill,
    saved, flashSaved, pct,
  }
}

type P = ReturnType<typeof useProfile>

export function Component() {
  const variant = useVariant()
  const p = useProfile()
  const Views = { a: ProfileA, b: ProfileB, c: ProfileC }
  const View = Views[variant] ?? ProfileA
  return <View p={p} />
}
Component.displayName = 'CandidateProfile'

/* ══════════════════ section bodies ══════════════════ */

/** A small "read from your resume" tag, shown on sections the parser filled. */
function SourceTag({ field, p }: { field: keyof ProfileData; p: P }) {
  if (p.source[field] !== 'resume') return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-tone-emerald-bg)] px-2 py-0.5 text-[11px] font-medium text-tone-emerald">
      <FileUp className="size-3" aria-hidden />
      from your resume
    </span>
  )
}

function SectionBody({ id, p }: { id: string; p: P }) {
  const editing = p.editing === id
  const d = p.data

  if (id === 'personal') {
    return editing ? (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" htmlFor="pf-name">
          <Input id="pf-name" value={d.name} onChange={(e) => p.set('name', e.target.value)} />
        </Field>
        <Field label="Headline" htmlFor="pf-head">
          <Input id="pf-head" value={d.headline} onChange={(e) => p.set('headline', e.target.value)} />
        </Field>
        <Field label="Location" htmlFor="pf-loc">
          <Input id="pf-loc" value={d.location} onChange={(e) => p.set('location', e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="pf-mail">
          <Input id="pf-mail" value={d.email} onChange={(e) => p.set('email', e.target.value)} />
        </Field>
        <Field label="Phone" htmlFor="pf-phone">
          <Input id="pf-phone" value={d.phone} onChange={(e) => p.set('phone', e.target.value)} />
        </Field>
      </div>
    ) : (
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {([['Name', d.name], ['Headline', d.headline], ['Location', d.location], ['Email', d.email], ['Phone', d.phone]] as const).map(([k, v]) => (
          <div key={k}>
            <dt className="text-ink-3">{k}</dt>
            <dd className="font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    )
  }

  if (id === 'summary') {
    return editing ? (
      <Textarea rows={4} value={d.summary} onChange={(e) => p.set('summary', e.target.value)} />
    ) : (
      <p className="text-sm leading-relaxed text-ink-2">{d.summary}</p>
    )
  }

  if (id === 'skills') {
    return (
      <div>
        <div className="flex flex-wrap gap-1.5">
          {p.skills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pl-2.5 pr-1.5 text-sm font-medium text-brand-700"
            >
              {s}
              <button
                type="button"
                onClick={() => p.removeSkill(s)}
                aria-label={`Remove ${s}`}
                className="rounded-full p-0.5 transition-v hover:bg-brand-100"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={p.newSkill}
            onChange={(e) => p.setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), p.addSkill())}
            placeholder="Add a skill and press Enter"
            aria-label="Add a skill"
            className="max-w-xs"
          />
          <Button variant="secondary" onClick={p.addSkill} disabled={!p.newSkill.trim()}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
        {p.skills.length < 8 && (
          <p className="mt-2 text-xs text-warning">
            {8 - p.skills.length} more {8 - p.skills.length === 1 ? 'skill' : 'skills'} would put you
            in 3× more recruiter searches.
          </p>
        )}
      </div>
    )
  }

  if (id === 'experience') {
    return (
      <ol className="space-y-4">
        {d.experience.map((e) => (
          <li key={e.id} className="border-l-2 border-line pl-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-medium text-ink">{e.title}</p>
              {e.current && <Badge tone="success" size="sm">current</Badge>}
            </div>
            <p className="text-sm text-ink-2">{e.company}</p>
            <p className="font-mono text-xs text-ink-3">
              {e.from} — {e.to}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{e.detail}</p>
          </li>
        ))}
      </ol>
    )
  }

  if (id === 'education') {
    return (
      <ol className="space-y-3">
        {d.education.map((e) => (
          <li key={e.id} className="border-l-2 border-line pl-4">
            <p className="font-medium text-ink">
              {e.degree} {e.field}
            </p>
            <p className="text-sm text-ink-2">{e.institution}</p>
            <p className="font-mono text-xs text-ink-3">
              {e.from} — {e.to} · {e.grade}
            </p>
          </li>
        ))}
      </ol>
    )
  }

  if (id === 'languages') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {d.languages.map((l) => (
          <Badge key={l} tone="neutral">{l}</Badge>
        ))}
      </div>
    )
  }

  if (id === 'certifications' && d.certifications.length > 0) {
    return (
      <ul className="space-y-1.5">
        {d.certifications.map((c) => (
          <li key={c} className="flex items-start gap-2 text-sm text-ink-2">
            <Award className="mt-0.5 size-4 shrink-0 text-tone-amber" aria-hidden />
            {c}
          </li>
        ))}
      </ul>
    )
  }

  // certifications / projects — genuinely empty
  return (
    <div className="rounded-v border border-dashed border-line bg-canvas p-5 text-center">
      <p className="text-sm text-ink-2">Nothing added yet.</p>
      <p className="mt-1 text-xs text-ink-3">
        {id === 'certifications'
          ? 'Some roles list a certification as a hard requirement — without it you are excluded from those rankings entirely.'
          : 'Projects give evidence for skills you have listed but never shipped at work.'}
      </p>
      <Button size="sm" variant="secondary" className="mt-3">
        <Plus className="size-4" />
        Add {id === 'certifications' ? 'a certification' : 'a project'}
      </Button>
    </div>
  )
}

/* ══════════════════ shared pieces ══════════════════ */

function SectionCard({ s, p, large }: { s: Section; p: P; large?: boolean }) {
  const editing = p.editing === s.id
  const Icon = s.icon

  return (
    <section
      id={s.id}
      className={cn(
        'scroll-mt-24 rounded-v border-[length:var(--v-card-border)] bg-paper p-v-card shadow-v-card transition-v',
        editing ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-line',
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={cn(
              'mt-0.5 grid size-8 shrink-0 place-items-center rounded-v-control',
              s.complete ? 'bg-brand-50 text-brand-600' : 'bg-subtle text-ink-3',
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className={cn('font-semibold text-ink', large ? 'text-xl' : 'text-base')}>
              {s.label}
            </h2>
            {/* every section says what it changes in the score */}
            <p className="mt-0.5 text-xs text-ink-3">{s.affects}</p>
          </div>
        </div>
        <Button
          variant={editing ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            if (editing) p.flashSaved()
            p.setEditing(editing ? null : s.id)
          }}
        >
          {editing ? <><Check className="size-4" />Done</> : <><Pencil className="size-4" />Edit</>}
        </Button>
      </div>
      <SectionBody id={s.id} p={p} />
    </section>
  )
}

function StrengthPanel({ p, large }: { p: P; large?: boolean }) {
  const done = p.sections.filter((s) => s.complete).length
  return (
    <div className="rounded-v border-[length:var(--v-card-border)] border-line bg-paper p-v-card shadow-v-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
            Profile strength
          </p>
          <p className={cn('mt-1 font-mono tnum font-bold text-ink', large ? 'text-4xl' : 'text-3xl')}>
            {p.pct}
            <span className="text-xl text-ink-3">%</span>
          </p>
        </div>
        <ScoreRing score={p.pct} size={large ? 'lg' : 'md'} />
      </div>

      <Progress value={p.pct} className="mt-4" />
      <p className="mt-2 text-xs text-ink-3">
        {done} of {p.sections.length} sections complete
      </p>

      <div className="mt-4 rounded-v-control bg-brand-50 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
          <Target className="size-3.5" aria-hidden />
          Highest-impact next step
        </p>
        <p className="mt-1.5 text-sm font-medium text-ink">
          {p.skills.length < 8 ? 'Add 2 more skills' : 'Add a certification'}
        </p>
        <p className="mt-0.5 text-xs text-ink-2">
          {p.skills.length < 8
            ? 'Skills are 35% of every match score — the largest single component.'
            : 'Certifications can satisfy hard requirements that currently exclude you.'}
        </p>
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <AIProvenanceChip
          what="uses this profile to score matches"
          cannot="Your age, gender, marital status, religion, disability and photo are never collected and never reach the scoring model."
        />
      </div>
    </div>
  )
}

function SavedPill({ p }: { p: P }) {
  if (!p.saved) return null
  return (
    <span
      role="status"
      className="inline-flex items-center gap-1 rounded-full bg-score-elite-bg px-2 py-0.5 text-xs font-medium text-score-elite"
    >
      <Check className="size-3" aria-hidden />
      Saved
    </span>
  )
}

/* ══════════════════ A · section nav + inline edit ══════════════════ */

/* Direction A gives every section its own hue, so the nav, the card and the
   strength breakdown all point at the same thing by colour rather than by
   position alone. */
/** Which profile field's provenance each section reflects. */
const SECTION_FIELD: Record<string, keyof ProfileData> = {
  personal: 'name',
  summary: 'summary',
  skills: 'skills',
  experience: 'experience',
  education: 'education',
  certifications: 'certifications',
  languages: 'languages',
}

const SECTION_TONE: Record<string, Tone> = {
  personal: 'indigo',
  summary: 'sky',
  skills: 'violet',
  experience: 'fuchsia',
  education: 'teal',
  certifications: 'amber',
  projects: 'rose',
  languages: 'emerald',
}

/** Weight each section carries in the match score — PRD Part 12. */
const SECTION_WEIGHT: Record<string, number> = {
  personal: 15, summary: 10, skills: 35, experience: 20,
  education: 10, certifications: 5, projects: 3, languages: 2,
}

/**
 * Offer to fill the profile from the newest parsed resume.
 *
 * This is the "after you sign in" path: the file is already uploaded, so
 * the only thing standing between it and a filled profile is consent. It
 * shows exactly which fields would change, and what each would become,
 * before anything is written — a parser overwriting a hand-edited headline
 * without warning is the failure mode this design exists to avoid.
 */
function ResumeFillBanner({ p }: { p: P }) {
  const [open, setOpen] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(false)
  const [justFilled, setJustFilled] = React.useState(false)

  // newest resume the parser actually read
  const latest = React.useMemo(
    () =>
      [...p.resumes]
        .filter((r) => r.status === 'parsed' && parseFor(r.id, p.resumes))
        .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))[0],
    [p.resumes],
  )

  const diff = React.useMemo(
    () => (latest ? p.previewResume(latest.id) : []),
    [latest, p],
  )

  if (!latest || dismissed) return null

  // already applied and nothing has drifted since — nothing to offer
  if (p.filledFrom?.resumeId === latest.id && diff.length === 0 && !justFilled) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-v border border-line bg-paper px-4 py-2.5 text-sm">
        <CheckCircle2 className="size-4 shrink-0 text-tone-emerald" aria-hidden />
        <span className="text-ink-2">
          Filled from <span className="font-medium text-ink">{p.filledFrom.label}</span>{' '}
          {relativeTime(p.filledFrom.at)}.
        </span>
        <Link
          to="/candidate/resumes"
          className="ml-auto text-xs font-medium text-brand-700 hover:underline"
        >
          Manage resumes
        </Link>
      </div>
    )
  }

  if (justFilled) {
    return (
      <div
        role="status"
        className="mt-4 flex flex-wrap items-center gap-2 rounded-v border border-line bg-[var(--color-tone-emerald-bg)] px-4 py-2.5 text-sm"
      >
        <CheckCircle2 className="size-4 shrink-0 text-tone-emerald" aria-hidden />
        <span className="font-medium text-tone-emerald">
          Profile filled from {latest.label}.
        </span>
        <span className="text-ink-2">Every field is still yours to edit.</span>
      </div>
    )
  }

  return (
    <div className="relative mt-4 overflow-hidden rounded-v border border-line bg-paper shadow-v-card">
      <span className="absolute inset-x-0 top-0 h-1 bg-tone-emerald" aria-hidden />
      <div className="flex flex-wrap items-start gap-3 p-4">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-v-control bg-[var(--color-tone-emerald-bg)] text-tone-emerald"
          aria-hidden
        >
          <FileUp className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">
            Fill this profile from your latest resume?
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-2">
            <span className="font-medium text-ink">{latest.label}</span> ·{' '}
            {latest.fileName} · uploaded {relativeTime(latest.uploadedAt)}. It would update{' '}
            <span className="font-medium text-ink">{diff.length}</span>{' '}
            {diff.length === 1 ? 'field' : 'fields'}.
          </p>

          {open && (
            <ul className="mt-3 grid gap-2">
              {diff.map((d) => (
                <li key={String(d.key)} className="rounded-v-control bg-subtle p-2.5">
                  <p className="text-xs font-semibold text-ink">{d.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-3 line-through">{d.before}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-tone-emerald">{d.after}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                p.fillFromResume(latest.id, latest.label)
                setJustFilled(true)
                window.setTimeout(() => setJustFilled(false), 4000)
              }}
            >
              <Sparkle className="size-4" />
              Fill {diff.length} {diff.length === 1 ? 'field' : 'fields'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}>
              {open ? 'Hide the changes' : 'Show me what changes'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Export the whole profile as a PDF the candidate can send anywhere. */
function DownloadPdfButton({ p }: { p: P }) {
  const [busy, setBusy] = React.useState(false)

  return (
    <Button
      variant="secondary"
      disabled={busy}
      onClick={async () => {
        // the PDF library is fetched on demand, so the busy state covers a
        // real network wait on the first click
        setBusy(true)
        try {
          await downloadProfilePdf(p.data, {
            filledFrom: p.filledFrom?.label ?? null,
            generatedAt: new Date(),
          })
        } finally {
          setBusy(false)
        }
      }}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      {busy ? 'Building PDF…' : 'Download PDF'}
    </Button>
  )
}

function ProfileHeroA({ p }: { p: P }) {
  const done = p.sections.filter((s) => s.complete).length

  const stats = [
    { tone: 'indigo' as Tone, icon: Eye, label: 'Profile views', value: 148, caption: 'last 30 days' },
    { tone: 'fuchsia' as Tone, icon: Unlock, label: 'Recruiter unlocks', value: 12, caption: 'you approved each one' },
    { tone: 'emerald' as Tone, icon: Target, label: 'Match-ready roles', value: 34, caption: 'meet every hard requirement' },
    { tone: 'amber' as Tone, icon: LayoutList, label: 'Sections complete', value: `${done}/${p.sections.length}`,
      progress: Math.round((done / p.sections.length) * 100), caption: 'two left to finish' },
  ]

  return (
    <>
      <div className="relative overflow-hidden rounded-v border border-line">
        <span
          className="absolute inset-0 bg-gradient-to-br from-[var(--color-tone-indigo-bg)] via-[var(--color-tone-violet-bg)] to-[var(--color-tone-teal-bg)]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-[var(--color-tone-violet-vivid)] opacity-15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center gap-5 p-5 sm:p-6">
          <span className="relative shrink-0">
            <Avatar name={p.data.name} id="cand-1" size="xl" />
            <span
              className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full bg-paper"
              aria-hidden
            >
              <span className="grid size-5 place-items-center rounded-full bg-tone-emerald text-white">
                <Check className="size-3" />
              </span>
            </span>
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {p.data.name}
              </h1>
              <SavedPill p={p} />
            </div>
            <p className="mt-0.5 text-sm text-ink-2 sm:text-base">{p.data.headline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/80 px-2.5 py-1 font-medium text-tone-indigo ring-1 ring-[var(--color-tone-indigo)]/20">
                <MapPin className="size-3.5" aria-hidden />
                {p.data.location}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/80 px-2.5 py-1 font-medium text-tone-emerald ring-1 ring-[var(--color-tone-emerald)]/20">
                <Radio className="size-3.5" aria-hidden />
                Open to offers
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/80 px-2.5 py-1 font-medium text-tone-sky ring-1 ring-[var(--color-tone-sky)]/20">
                <Clock className="size-3.5" aria-hidden />
                30-day notice
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" asChild>
              <Link to="/candidate/resumes">
                <FileText className="size-4" />
                Resumes ({p.resumes.length}/{MAX_RESUMES})
              </Link>
            </Button>
            <Button variant="secondary">
              <Eye className="size-4" />
              Preview as recruiter
            </Button>
            <DownloadPdfButton p={p} />
          </div>
        </div>

        {/* the strip that says how visible this profile actually is */}
        <div className="relative grid gap-px border-t border-line bg-line sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-paper/90 p-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn('grid size-9 shrink-0 place-items-center rounded-lg', TONE_CLASS[s.tone].bg, TONE_CLASS[s.tone].text)}
                  aria-hidden
                >
                  <s.icon className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono tnum text-xl font-semibold leading-none text-ink">
                    {s.value}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-3">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function SectionCardA({ s, p }: { s: Section; p: P }) {
  const editing = p.editing === s.id
  const Icon = s.icon
  const tone = SECTION_TONE[s.id] ?? 'indigo'
  const t = TONE_CLASS[tone]

  return (
    <section
      id={s.id}
      className={cn(
        'relative scroll-mt-24 overflow-hidden rounded-v border-[length:var(--v-card-border)] bg-paper p-v-card shadow-v-card transition-v',
        editing ? 'border-line-strong ring-4 ring-[var(--color-tone-indigo)]/10' : 'border-line',
      )}
    >
      <span className={cn('absolute inset-x-0 top-0 h-1', s.complete ? t.rail : 'bg-line')} aria-hidden />

      <div className="mb-3 mt-1 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={cn(
              'mt-0.5 grid size-9 shrink-0 place-items-center rounded-v-control',
              s.complete ? cn(t.bg, t.text) : 'bg-subtle text-ink-3',
            )}
          >
            <Icon className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-ink">{s.label}</h2>
              {SECTION_FIELD[s.id] && <SourceTag field={SECTION_FIELD[s.id]} p={p} />}
              {!s.complete && (
                <span className="rounded-full bg-[var(--color-tone-amber-bg)] px-2 py-0.5 text-[11px] font-semibold text-tone-amber">
                  not filled in
                </span>
              )}
            </div>
            {/* every section says what it changes in the score */}
            <p className="mt-0.5 text-xs text-ink-3">{s.affects}</p>
          </div>
        </div>
        <Button
          variant={editing ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            if (editing) p.flashSaved()
            p.setEditing(editing ? null : s.id)
          }}
        >
          {editing ? <><Check className="size-4" />Done</> : <><Pencil className="size-4" />Edit</>}
        </Button>
      </div>
      <SectionBody id={s.id} p={p} />
    </section>
  )
}

function StrengthPanelA({ p }: { p: P }) {
  const done = p.sections.filter((s) => s.complete).length
  const missing = p.sections.filter((s) => !s.complete)

  // what each *completed* section contributes, so the ring is not a mystery
  const mix = p.sections.filter((s) => s.complete).map((s) => ({
    label: s.label,
    value: SECTION_WEIGHT[s.id] ?? 1,
    tone: SECTION_TONE[s.id] ?? 'indigo',
  }))

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-v border-[length:var(--v-card-border)] border-line bg-paper p-v-card shadow-v-card">
        <span className="absolute inset-x-0 top-0 h-1 bg-tone-emerald" aria-hidden />
        <div className="mt-1 flex flex-col items-center text-center">
          <RadialGauge value={p.pct} tone={p.pct >= 80 ? 'emerald' : p.pct >= 60 ? 'amber' : 'rose'}
            size={128} label={`${p.pct}%`} sublabel="complete" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-3">
            Profile strength
          </p>
          <p className="mt-1 text-sm text-ink-2">
            {done} of {p.sections.length} sections done
          </p>
        </div>

        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
            What is carrying your score
          </p>
          <StackedBar data={mix} height={10} />
        </div>
      </div>

      {/* the next thing to do, in the colour of the section it belongs to */}
      <div className="rounded-v border-[length:var(--v-card-border)] border-line bg-paper p-v-card shadow-v-card">
        <SectionHeading title="Highest-impact next steps" icon={Target} tone="violet" />
        <ul className="grid gap-2">
          {(missing.length ? missing : p.sections.slice(0, 2)).map((s) => {
            const tone = SECTION_TONE[s.id] ?? 'indigo'
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={cn(
                    'group flex items-start gap-2.5 rounded-v-control p-2.5 transition-v hover:brightness-95',
                    TONE_CLASS[tone].bg,
                  )}
                >
                  <s.icon className={cn('mt-0.5 size-4 shrink-0', TONE_CLASS[tone].text)} aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">Add your {s.label.toLowerCase()}</span>
                    <span className="block text-xs leading-relaxed text-ink-2">{s.affects}</span>
                  </span>
                  <ArrowRight
                    className={cn('ml-auto mt-0.5 size-4 shrink-0 transition-transform group-hover:translate-x-0.5', TONE_CLASS[tone].text)}
                    aria-hidden
                  />
                </a>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-v border-[length:var(--v-card-border)] border-line bg-paper p-v-card shadow-v-card">
        <AIProvenanceChip
          what="uses this profile to score matches"
          cannot="Your age, gender, marital status, religion, disability and photo are never collected and never reach the scoring model."
        />
      </div>
    </div>
  )
}

function ProfileA({ p }: { p: P }) {
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-6 sm:px-6">
      <ProfileHeroA p={p} />
      <ResumeFillBanner p={p} />

      <div className="mt-5 grid gap-5 lg:grid-cols-[210px_1fr_300px]">
        <nav className="hidden lg:block" aria-label="Profile sections">
          <ul className="sticky top-24 space-y-1">
            {p.sections.map((s) => {
              const tone = SECTION_TONE[s.id] ?? 'indigo'
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex items-center gap-2.5 rounded-v-control px-2 py-1.5 text-sm text-ink-2 transition-v hover:bg-hover hover:text-ink"
                  >
                    <span
                      className={cn(
                        'grid size-7 shrink-0 place-items-center rounded-lg transition-v',
                        s.complete
                          ? cn(TONE_CLASS[tone].bg, TONE_CLASS[tone].text)
                          : 'bg-subtle text-ink-3',
                      )}
                      aria-hidden
                    >
                      <s.icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{s.label}</span>
                    {!s.complete && (
                      <span className="size-1.5 shrink-0 rounded-full bg-tone-amber" aria-label="incomplete" />
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <Stagger className="min-w-0 space-y-4" whenVisible={false}>
          {p.sections.map((s) => (
            <StaggerItem key={s.id}>
              <SectionCardA s={s} p={p} />
            </StaggerItem>
          ))}
        </Stagger>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <StrengthPanelA p={p} />
        </aside>
      </div>
    </div>
  )
}

/* ══════════════════ B · single long form ══════════════════ */

function ProfileB({ p }: { p: P }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6">
      <div className="sticky top-16 z-10 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div>
          <h1 className="text-base font-semibold text-ink">My profile</h1>
          <p className="font-mono text-xs text-ink-3">
            {p.sections.filter((s) => s.complete).length}/{p.sections.length} sections · {p.pct}% strength
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SavedPill p={p} />
          <Button size="sm">Save all</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        {/* everything expanded — no click needed to see a field */}
        <div className="min-w-0 space-y-3">
          {p.sections.map((s) => (
            <SectionCard key={s.id} s={{ ...s }} p={{ ...p, editing: s.id }} />
          ))}
        </div>
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <StrengthPanel p={p} />
        </aside>
      </div>
    </div>
  )
}

/* ══════════════════ C · live CV preview ══════════════════ */

function ProfileC({ p }: { p: P }) {
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
            Your profile
          </h1>
          <p className="mt-2 text-lg text-ink-2">Edit on the right; the CV updates as you type.</p>
        </div>
        <SavedPill p={p} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* the live rendered CV */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-v bg-paper p-8 shadow-xl">
            <p className="font-display tracking-tight text-2xl font-semibold text-ink">
              {p.data.name}
            </p>
            <p className="text-ink-2">{p.data.headline}</p>
            <p className="mt-0.5 font-mono text-xs text-ink-3">
              {p.data.location} · {p.data.email}
            </p>

            <div className="mt-6 border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Skills</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.skills.join(' · ')}</p>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                Experience
              </p>
              {EXPERIENCE.map((e) => (
                <div key={e.company} className="mt-2.5">
                  <p className="text-sm font-medium text-ink">
                    {e.title} · {e.company}
                  </p>
                  <p className="font-mono text-[11px] text-ink-3">
                    {e.from} — {e.to}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                Education
              </p>
              {EDUCATION.map((e) => (
                <p key={e.institution} className="mt-1.5 text-sm text-ink-2">
                  {e.degree} {e.field}, {e.institution} ({e.to})
                </p>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <StrengthPanel p={p} large />
          </div>
        </aside>

        <Stagger className="min-w-0 space-y-5">
          {p.sections.map((s) => (
            <StaggerItem key={s.id}>
              <SectionCard s={s} p={p} large />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  )
}
