import * as React from 'react'
import { Link } from 'react-router'
import {
  Eye, EyeOff, Building2, Download, Trash2, ShieldCheck, Check, ArrowRight, ArrowLeft, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/controls'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/overlay'
import { PageHeader } from '@/components/common'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { AIProvenanceChip } from '@/components/brand'

/**
 * C16 — Privacy & consent (PRD Part 44).
 *
 * The PRD's data-protection commitments made tangible: visibility as
 * three *explained* choices, consent toggles in plain language, data
 * export, and account deletion. Nothing here is legalese.
 */

type Visibility = 'public' | 'company_search' | 'hidden'

const VISIBILITY: { id: Visibility; icon: React.ElementType; label: string; body: string; consequence: string }[] = [
  {
    id: 'public', icon: Eye, label: 'Public',
    body: 'Any verified employer can find your profile in candidate search, and your profile page is visible to signed-in recruiters.',
    consequence: 'Most recruiter interest — and least control over who sees you.',
  },
  {
    id: 'company_search', icon: Building2, label: 'Company search only',
    body: 'You appear in candidate searches run by verified companies with an active subscription, but your profile has no public page.',
    consequence: 'A middle setting. Recruiters find you, strangers cannot.',
  },
  {
    id: 'hidden', icon: EyeOff, label: 'Hidden',
    body: 'You appear to nobody in search. Recruiters only see you if you apply to their job yourself.',
    consequence: 'Full control — but you will only be considered for roles you actively apply to.',
  },
]

const CONSENTS = [
  {
    key: 'parsing',
    label: 'Read my resume into a structured profile',
    body: 'We extract skills, experience, education and certifications so you do not have to type them. You see every field before it is saved, and can edit any of it.',
    required: true,
  },
  {
    key: 'matching',
    label: 'Use my profile to score how well I match jobs',
    body: 'Your skills, experience, education, location and stated preferences are compared to each role. Turning this off means no match scores and no recommendations.',
    required: true,
  },
  {
    key: 'recommendations',
    label: 'Learn from what I click and dismiss',
    body: 'If you keep skipping a job title, we show fewer of them. Turning this off keeps recommendations purely rule-based.',
    required: false,
  },
  {
    key: 'research',
    label: 'Include my anonymised data in matching-quality research',
    body: 'Used to check the scoring model for bias across anonymised profile variants. Your name and contact details are never part of this.',
    required: false,
  },
]

const NEVER_COLLECTED = [
  'Age or date of birth', 'Gender', 'Marital status', 'Religion',
  'Disability status', 'Photograph', 'Caste or community',
]

function usePrivacy() {
  const [visibility, setVisibility] = React.useState<Visibility>('company_search')
  const [consents, setConsents] = React.useState<Record<string, boolean>>({
    parsing: true, matching: true, recommendations: true, research: false,
  })
  const [exporting, setExporting] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const toggle = (k: string) => setConsents((c) => ({ ...c, [k]: !c[k] }))
  return { visibility, setVisibility, consents, toggle, exporting, setExporting, deleting, setDeleting }
}

type P = ReturnType<typeof usePrivacy>

export function Component() {
  const variant = useVariant()
  const p = usePrivacy()
  const Views = { a: PrivacyA, b: PrivacyB, c: PrivacyC }
  const View = Views[variant] ?? PrivacyA
  return (
    <>
      <View p={p} />
      <ExportDialog p={p} />
      <DeleteDialog p={p} />
    </>
  )
}
Component.displayName = 'CandidatePrivacy'

/* ══════════════════ shared blocks ══════════════════ */

function VisibilityChoice({ p, large }: { p: P; large?: boolean }) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label="Profile visibility">
      {VISIBILITY.map((v) => {
        const on = p.visibility === v.id
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => p.setVisibility(v.id)}
            className={cn(
              'flex w-full gap-3 rounded-v border text-left transition-v',
              large ? 'p-5' : 'p-4',
              on
                ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/15'
                : 'border-line bg-paper hover:border-brand-300 hover:bg-hover',
            )}
          >
            <span
              className={cn(
                'grid shrink-0 place-items-center rounded-v-control',
                large ? 'size-11' : 'size-9',
                on ? 'bg-brand-600 text-white' : 'bg-subtle text-ink-3',
              )}
            >
              <v.icon className={large ? 'size-5' : 'size-4'} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className={cn('font-semibold text-ink', large && 'text-lg')}>{v.label}</span>
                {on && <Check className="size-4 text-brand-600" aria-hidden />}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-2">{v.body}</span>
              {/* the consequence, stated — not just the setting */}
              <span className="mt-1.5 block text-xs font-medium text-ink-3">{v.consequence}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ConsentList({ p, large }: { p: P; large?: boolean }) {
  return (
    <div className="space-y-2">
      {CONSENTS.map((c) => (
        <div
          key={c.key}
          className={cn(
            'flex items-start gap-3 rounded-v border border-line bg-paper',
            large ? 'p-5' : 'p-3.5',
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2">
              <span className={cn('font-medium text-ink', large && 'text-lg')}>{c.label}</span>
              {c.required && <Badge tone="neutral" size="sm">needed for matching</Badge>}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{c.body}</p>
          </div>
          <Switch
            checked={p.consents[c.key]}
            onCheckedChange={() => p.toggle(c.key)}
            aria-label={c.label}
          />
        </div>
      ))}
    </div>
  )
}

function NeverCollected({ large }: { large?: boolean }) {
  return (
    <div className="rounded-v border border-score-elite/25 bg-score-elite-bg/50 p-v-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={cn('flex items-center gap-2 font-semibold text-score-elite', large && 'text-lg')}>
          <ShieldCheck className="size-5" aria-hidden />
          Never collected, never scored
        </h3>
        <AIProvenanceChip
          what="scores your matches"
          cannot="Protected characteristics are not collected at all, so they cannot reach the model even by accident."
        />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">
        These are not optional settings — the fields do not exist in our database, so they cannot
        influence a match score, a ranking, or a recruiter's view of you.
      </p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {NEVER_COLLECTED.map((x) => (
          <li key={x}>
            <Badge tone="success" size="sm">{x}</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DataControls({ p, large }: { p: P; large?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className={cn('rounded-v border border-line bg-paper', large ? 'p-6' : 'p-4')}>
        <Download className="size-5 text-brand-600" aria-hidden />
        <h3 className="mt-2 font-semibold text-ink">Export everything</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">
          A JSON file with your profile, resumes, applications, messages and every stage change —
          the same data a recruiter or an admin can see.
        </p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => p.setExporting(true)}>
          Request my data
        </Button>
      </div>

      <div className={cn('rounded-v border border-danger/25 bg-danger-bg/40', large ? 'p-6' : 'p-4')}>
        <Trash2 className="size-5 text-danger" aria-hidden />
        <h3 className="mt-2 font-semibold text-danger">Delete everything</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">
          Soft-deleted at once, permanently purged after 30 days. Active applications are marked
          withdrawn and recruiters are told.
        </p>
        <Button variant="danger" size="sm" className="mt-3" onClick={() => p.setDeleting(true)}>
          Delete my account
        </Button>
      </div>
    </div>
  )
}

/* ══════════════════ A · explained cards ══════════════════ */

function PrivacyA({ p }: { p: P }) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={ShieldCheck}
        tone="emerald"
        title="Privacy"
        description="Who can see you, what the AI is allowed to do with your data, and how to take it all back."
      />

      <Stagger className="mt-6 space-y-8" whenVisible={false}>
        <StaggerItem>
          <section>
            <h2 className="font-semibold text-ink">Who can find your profile</h2>
            <p className="mt-1 text-sm text-ink-2">
              This is the single most consequential setting on the page.
            </p>
            <div className="mt-3">
              <VisibilityChoice p={p} />
            </div>
          </section>
        </StaggerItem>

        <StaggerItem>
          <section>
            <h2 className="font-semibold text-ink">What the AI may do</h2>
            <p className="mt-1 text-sm text-ink-2">
              Plain language, not a consent wall. You can change any of these at any time.
            </p>
            <div className="mt-3">
              <ConsentList p={p} />
            </div>
          </section>
        </StaggerItem>

        <StaggerItem>
          <NeverCollected />
        </StaggerItem>

        <StaggerItem>
          <section>
            <h2 className="font-semibold text-ink">Your data</h2>
            <div className="mt-3">
              <DataControls p={p} />
            </div>
          </section>
        </StaggerItem>
      </Stagger>
    </div>
  )
}

/* ══════════════════ B · compact list ══════════════════ */

function PrivacyB({ p }: { p: P }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="mb-4 border-b border-line pb-2">
        <h1 className="text-base font-semibold text-ink">Privacy</h1>
        <p className="font-mono text-xs text-ink-3">
          visibility · consent · export · deletion
        </p>
      </div>

      <div className="space-y-5">
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
            Profile visibility
          </h2>
          <div className="flex flex-wrap gap-2">
            {VISIBILITY.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => p.setVisibility(v.id)}
                aria-pressed={p.visibility === v.id}
                className={cn(
                  'inline-flex items-center gap-2 rounded-v-control border px-3 py-1.5 text-sm font-medium transition-v',
                  p.visibility === v.id
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-line bg-paper text-ink-2 hover:border-brand-300',
                )}
              >
                <v.icon className="size-4" aria-hidden />
                {v.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink-2">
            {VISIBILITY.find((v) => v.id === p.visibility)!.body}
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
            AI processing consent
          </h2>
          <div className="divide-y divide-line border-y border-line">
            {CONSENTS.map((c) => (
              <div key={c.key} className="flex items-start gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{c.label}</p>
                  <p className="text-xs text-ink-3">{c.body}</p>
                </div>
                <Switch
                  checked={p.consents[c.key]}
                  onCheckedChange={() => p.toggle(c.key)}
                  aria-label={c.label}
                />
              </div>
            ))}
          </div>
        </section>

        <NeverCollected />
        <DataControls p={p} />
      </div>
    </div>
  )
}

/* ══════════════════ C · guided privacy checkup ══════════════════ */

function PrivacyC({ p }: { p: P }) {
  const [step, setStep] = React.useState(0)

  const steps = [
    {
      title: 'Who should be able to find you?',
      body: 'This decides whether recruiters can discover you, or only see you when you apply.',
      content: <VisibilityChoice p={p} large />,
    },
    {
      title: 'What may the AI do with your data?',
      body: 'Every one of these is reversible, and none of them is hidden in a policy document.',
      content: <ConsentList p={p} large />,
    },
    {
      title: 'What we never touch',
      body: 'Some things are not settings, because we do not collect them at all.',
      content: <NeverCollected large />,
    },
    {
      title: 'Taking your data back',
      body: 'Export it, or delete it. Both are self-service and neither needs to go through support.',
      content: <DataControls p={p} large />,
    },
  ]

  const s = steps[step]

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600">
        Privacy checkup · {step + 1} of {steps.length}
      </p>

      <div className="mt-3 flex gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-v',
              i <= step ? 'bg-brand-600' : 'bg-line',
            )}
          />
        ))}
      </div>

      <Reveal key={step} whenVisible={false} className="mt-8">
        <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
          {s.title}
        </h1>
        <p className="mt-4 text-lg text-ink-2">{s.body}</p>
        <div className="mt-8">{s.content}</div>
      </Reveal>

      <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6">
        <Button variant="ghost" onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button size="lg" onClick={() => setStep((x) => x + 1)}>
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button size="lg" asChild>
            <Link to="/candidate">
              Done
              <Check className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

/* ══════════════════ dialogs ══════════════════ */

function ExportDialog({ p }: { p: P }) {
  return (
    <Dialog open={p.exporting} onOpenChange={p.setExporting}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export your data</DialogTitle>
          <DialogDescription>
            We will build a JSON file and email you a download link. It expires after 24 hours.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          <p className="mb-2 text-sm font-medium text-ink">What is included</p>
          <ul className="space-y-1 text-sm text-ink-2">
            {[
              'Profile, skills, experience, education',
              'Every resume and its parsed fields',
              'All applications and their full stage history',
              'Messages with recruiters',
              'Match scores and the breakdown behind each one',
              'Your account security log',
            ].map((x) => (
              <li key={x} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-score-elite" aria-hidden />
                {x}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => p.setExporting(false)}>
              Cancel
            </Button>
            <Button onClick={() => p.setExporting(false)}>
              <Download className="size-4" />
              Request export
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({ p }: { p: P }) {
  const [text, setText] = React.useState('')
  return (
    <Dialog open={p.deleting} onOpenChange={p.setDeleting}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            Type <strong className="font-semibold text-ink">DELETE</strong> to confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          <p className="mb-3 flex items-start gap-2 rounded-v-control bg-warning-bg p-3 text-sm text-warning">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Consider exporting your data first — once the 30-day purge runs, we cannot recover it.
          </p>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => p.setDeleting(false)}>
              Keep my account
            </Button>
            <Button variant="danger" disabled={text !== 'DELETE'}>
              Delete permanently
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
