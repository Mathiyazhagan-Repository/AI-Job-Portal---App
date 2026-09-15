import * as React from 'react'
import { Link, useNavigate } from 'react-router'
import { Check, ArrowRight, ArrowLeft, Sparkles, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant, useAnnounce } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Input, Field, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/controls'
import { ParseTheatre, useParseTheatre } from '@/components/brand/ParseTheatre'
import { JobCard } from '@/features/jobs/JobCard'
import { Reveal, Stagger, StaggerItem, WordReveal } from '@/components/motion'
import { jobs } from '@/data/mock'
import { supabase } from '@/lib/supabase'

/**
 * C2 — Onboarding wizard.
 *
 * Five steps: Basics → Resume (Parse Theatre) → Confirm → Preferences → Done.
 * "Skip for now" is always available — no step is a dead end — and the flow
 * ends by revealing the candidate's first three matches, so the work they
 * just did pays off immediately.
 */

const STEPS = [
  { id: 'basics', label: 'The basics', hint: 'Who you are' },
  { id: 'resume', label: 'Your resume', hint: 'We read it for you' },
  { id: 'confirm', label: 'Confirm', hint: 'Check what we read' },
  { id: 'preferences', label: 'What you want', hint: 'Role, place, pay' },
  { id: 'done', label: 'Done', hint: 'Your first matches' },
] as const

const WORK_MODES = ['Remote', 'Hybrid', 'On-site'] as const
const JOB_TYPES = ['Full time', 'Contract', 'Internship'] as const
const AVAILABILITY = ['Immediately', 'In 15 days', 'In 30 days', '60+ days'] as const

function useOnboarding() {
  const [step, setStep] = React.useState(0)
  const [basics, setBasics] = React.useState(() => {
    try {
      const raw = localStorage.getItem('kairo.signup.basics')
      if (!raw) return { name: '', email: '', location: '' }
      const saved = JSON.parse(raw) as { name?: string; email?: string; location?: string }
      return {
        name: saved.name ?? '',
        email: saved.email ?? '',
        location: saved.location ?? '',
      }
    } catch {
      return { name: '', email: '', location: '' }
    }
  })
  const [prefs, setPrefs] = React.useState({
    titles: 'Senior Frontend Engineer',
    salary: 28,
    modes: ['Remote', 'Hybrid'] as string[],
    types: ['Full time'] as string[],
    availability: 'In 30 days',
  })
  const theatre = useParseTheatre()
  const announce = useAnnounce()
  const navigate = useNavigate()

  const saveLookingFor = async () => {
    if (!basics.email) return

    const payload = {
      email: basics.email,
      candidate_name: basics.name || 'Candidate',
      roles: prefs.titles
        .split(',')
        .map((role) => role.trim())
        .filter(Boolean),
      minimum_salary_lakhs: Number(prefs.salary ?? 28),
      work_modes: prefs.modes,
      job_types: prefs.types,
      availability: prefs.availability,
    }

    const res = await fetch('http://localhost:8000/api/looking-for', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`Backend error ${res.status}: ${detail}`)
    }
  }


  const next = async () => {
    if (step === 0 && basics.email) {
      try {
        const location = basics.location?.trim() || null

        localStorage.setItem(
          'kairo.signup.basics',
          JSON.stringify({ name: basics.name, email: basics.email, location }),
        )

        const { data: existing, error: fetchError } = await supabase
          .from('Candidates')
          .select('id')
          .eq('email', basics.email)
          .maybeSingle()

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError
        }

        const updatePayload = {
          full_name: basics.name,
          email: basics.email,
          location,
          updated_at: new Date().toISOString(),
        }

        if (existing?.id) {
          const { error: updateError } = await supabase
            .from('Candidates')
            .update(updatePayload)
            .eq('id', existing.id)

          if (updateError) throw updateError
        } else {
          const { error: insertError } = await supabase.from('Candidates').insert([
            {
              ...updatePayload,
              password: 'temporary',
              role: 'candidate',
              created_at: new Date().toISOString(),
            },
          ])

          if (insertError) throw insertError
        }
      } catch (error) {
        console.error('Failed to save onboarding basics to Supabase:', error)
      }
    }

    if (step === 3) {
      try {
        await saveLookingFor()
      } catch (error) {
        console.error('Failed to save looking_for preferences:', error)
      }
    }

    setStep((s) => {
      const n = Math.min(STEPS.length - 1, s + 1)
      announce(`Step ${n + 1} of ${STEPS.length}: ${STEPS[n].label}`)
      return n
    })
  }
  const back = () => setStep((s) => Math.max(0, s - 1))

  const toggle = (key: 'modes' | 'types', v: string) =>
    setPrefs((p) => ({
      ...p,
      [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v],
    }))

  return { step, setStep, next, back, basics, setBasics, prefs, setPrefs, toggle, theatre, navigate }
}

type Flow = ReturnType<typeof useOnboarding>

export function Component() {
  const variant = useVariant()
  const flow = useOnboarding()
  const Views = { a: OnboardingA, b: OnboardingB, c: OnboardingC }
  const View = Views[variant] ?? OnboardingA
  return <View flow={flow} />
}
Component.displayName = 'OnboardingPage'

/* ══════════════════ step content — shared by all three ══════════════════ */

function StepBasics({ flow, large }: { flow: Flow; large?: boolean }) {
  return (
    <div className={cn('space-y-4', large && 'space-y-6')}>
      <Field label="Full name" htmlFor="ob-name" required>
        <Input
          value={flow.basics.name}
          readOnly
          aria-readonly="true"
          placeholder="Aarav Sharma"
          className={cn(
            large ? 'h-14 text-lg' : undefined,
            'cursor-not-allowed bg-subtle text-ink-2',
          )}
        />
      </Field>
      <Field label="Email" htmlFor="ob-email" required>
        <Input
          type="email"
          value={flow.basics.email}
          readOnly
          aria-readonly="true"
          placeholder="you@example.com"
          className={cn(
            large ? 'h-14 text-lg' : undefined,
            'cursor-not-allowed bg-subtle text-ink-2',
          )}
        />
      </Field>
      <Field
        label="Where are you based?"
        htmlFor="ob-loc"
        hint="Used for location matching. You can still see remote roles anywhere."
      >
        <Input
          value={flow.basics.location}
          onChange={(e) => flow.setBasics((b) => ({ ...b, location: e.target.value }))}
          placeholder="Bengaluru"
          className={large ? 'h-14 text-lg' : undefined}
        />
      </Field>
    </div>
  )
}

function StepPreferences({ flow, large }: { flow: Flow; large?: boolean }) {
  const matching = 1204 - (flow.prefs.salary - 28) * 22 - (3 - flow.prefs.modes.length) * 180

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
      <div className={cn('space-y-5', large && 'space-y-7')}>
        <Field label="Roles you want" htmlFor="ob-titles" hint="Comma separated">
          <Input
            value={flow.prefs.titles}
            onChange={(e) => flow.setPrefs((p) => ({ ...p, titles: e.target.value }))}
            className={large ? 'h-14 text-lg' : undefined}
          />
        </Field>

        <div>
          <Label>Minimum salary</Label>
          <div className="mt-2 flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={60}
              value={flow.prefs.salary}
              onChange={(e) => flow.setPrefs((p) => ({ ...p, salary: Number(e.target.value) }))}
              className="h-1.5 flex-1 accent-[var(--color-brand-600)]"
              aria-label="Minimum salary in lakhs per annum"
            />
            <span className="w-20 shrink-0 text-right font-mono tnum font-semibold text-ink">
              ₹{flow.prefs.salary}L
            </span>
          </div>
        </div>

        <ChipGroup
          label="Work mode"
          options={[...WORK_MODES]}
          selected={flow.prefs.modes}
          onToggle={(v) => flow.toggle('modes', v)}
          large={large}
        />
        <ChipGroup
          label="Job type"
          options={[...JOB_TYPES]}
          selected={flow.prefs.types}
          onToggle={(v) => flow.toggle('types', v)}
          large={large}
        />
        <ChipGroup
          label="When can you start?"
          options={[...AVAILABILITY]}
          selected={[flow.prefs.availability]}
          onToggle={(v) => flow.setPrefs((p) => ({ ...p, availability: v }))}
          large={large}
          single
        />
      </div>

      {/* live payoff — the number moves as they choose */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-v border border-line bg-brand-50 p-4 text-center">
          <p className="font-mono tnum text-3xl font-bold text-brand-700">
            {Math.max(12, matching).toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-sm text-brand-800">jobs match what you just described</p>
        </div>
      </aside>
    </div>
  )
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
  large,
  single,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
  large?: boolean
  single?: boolean
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o)
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              aria-pressed={on}
              className={cn(
                'rounded-full border font-medium transition-v',
                large ? 'px-5 py-2.5 text-base' : 'px-3.5 py-1.5 text-sm',
                on
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-line bg-paper text-ink-2 hover:border-brand-300 hover:text-brand-700',
              )}
            >
              {on && !single && <Check className="mr-1 inline size-3.5" aria-hidden />}
              {o}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function StepDone({ large }: { large?: boolean }) {
  const top = [...jobs].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)).slice(0, 3)
  const variant = useVariant()

  return (
    <div>
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-score-elite-bg text-score-elite">
          <PartyPopper className="size-7" aria-hidden />
        </span>
        <h2 className={cn('mt-4 font-semibold text-ink', large ? 'text-3xl' : 'text-2xl')}>
          Your profile is live
        </h2>
        <p className={cn('mx-auto mt-2 max-w-md text-ink-2', large && 'text-lg')}>
          Here are your three strongest matches right now — each one opens into the exact reasoning
          behind its score.
        </p>
      </div>

      <Stagger className="mt-8 space-y-3" whenVisible={false}>
        {top.map((j) => (
          <StaggerItem key={j.id}>
            <JobCard job={j} variant={variant} showReason />
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button size={large ? 'lg' : 'md'} asChild>
          <Link to="/candidate">
            Go to my dashboard
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button size={large ? 'lg' : 'md'} variant="secondary" asChild>
          <Link to="/candidate/jobs">Browse all matches</Link>
        </Button>
      </div>
    </div>
  )
}

function StepBody({ flow, large }: { flow: Flow; large?: boolean }) {
  const variant = useVariant()
  switch (STEPS[flow.step].id) {
    case 'basics':
      return <StepBasics flow={flow} large={large} />
    case 'resume':
      return (
        <ParseTheatre
          theatre={flow.theatre}
          variant={variant}
          onAccept={flow.next}
          onManual={flow.next}
        />
      )
    case 'confirm':
      return <StepConfirm flow={flow} large={large} />
    case 'preferences':
      return <StepPreferences flow={flow} large={large} />
    default:
      return <StepDone large={large} />
  }
}

function StepConfirm({ flow, large }: { flow: Flow; large?: boolean }) {
  const read = flow.theatre.fields.filter((f) => flow.theatre.landed.includes(f.key))
  return (
    <div className="space-y-4">
      <p className={cn('text-ink-2', large && 'text-lg')}>
        {read.length === 0
          ? 'Nothing was read from a resume yet — you can add these by hand, or go back and upload one.'
          : `We read ${read.length} fields. Edit anything that is wrong before it becomes your profile.`}
      </p>
      <div className="space-y-2">
        {flow.theatre.fields.map((f) => (
          <div
            key={f.key}
            className="flex flex-wrap items-center gap-3 rounded-v border border-line bg-paper p-3"
          >
            <span className="w-32 shrink-0 text-xs text-ink-3">{f.label}</span>
            <Input
              defaultValue={flow.theatre.landed.includes(f.key) ? f.value : ''}
              placeholder="Not read — add it yourself"
              className="min-w-40 flex-1"
              aria-label={f.label}
            />
            {flow.theatre.landed.includes(f.key) && (
              <Badge tone="success" size="sm">
                <Sparkles className="size-3" /> read
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StepNav({ flow, large }: { flow: Flow; large?: boolean }) {
  const last = flow.step === STEPS.length - 1
  if (last) return null
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
      <Button variant="ghost" onClick={flow.back} disabled={flow.step === 0}>
        <ArrowLeft className="size-4" />
        Back
      </Button>
      <div className="flex items-center gap-2">
        {/* never a dead end — DESIGN.md §12.1 C2 */}
        <Button variant="ghost" onClick={flow.next}>
          Skip for now
        </Button>
        <Button size={large ? 'lg' : 'md'} onClick={flow.next}>
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

/* ══════════════════ A · progress rail + panel ══════════════════ */

function OnboardingA({ flow }: { flow: Flow }) {
  return (
    <div className="mx-auto grid min-h-dvh max-w-[1100px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[240px_1fr]">
      <aside className="lg:pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Set-up</p>
        <ol className="mt-4 space-y-1">
          {STEPS.map((s, i) => {
            const done = i < flow.step
            const current = i === flow.step
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => i <= flow.step && flow.setStep(i)}
                  disabled={i > flow.step}
                  aria-current={current ? 'step' : undefined}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-v-control px-3 py-2 text-left transition-v',
                    current && 'bg-brand-50',
                    i > flow.step && 'opacity-50',
                    i <= flow.step && !current && 'hover:bg-hover',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
                      done && 'bg-brand-600 text-white',
                      current && 'bg-brand-600 text-white',
                      !done && !current && 'bg-subtle text-ink-3',
                    )}
                  >
                    {done ? <Check className="size-3 stroke-[3]" aria-hidden /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        'block text-sm font-medium',
                        current ? 'text-brand-700' : 'text-ink',
                      )}
                    >
                      {s.label}
                    </span>
                    <span className="block text-xs text-ink-3">{s.hint}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>

      <main className="min-w-0">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink">
          {STEPS[flow.step].label}
        </h1>
        <Reveal key={flow.step}>
          <StepBody flow={flow} />
        </Reveal>
        <StepNav flow={flow} />
      </main>
    </div>
  )
}

/* ══════════════════ B · compact centred card ══════════════════ */

function OnboardingB({ flow }: { flow: Flow }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-4 py-16 sm:px-6">
      <div className="rounded-v border border-line bg-paper p-6 shadow-v-card">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-ink">{STEPS[flow.step].label}</h1>
            <p className="font-mono text-xs text-ink-3">
              step {flow.step + 1} / {STEPS.length} · {STEPS[flow.step].hint}
            </p>
          </div>
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  'size-2 rounded-full transition-v',
                  i < flow.step && 'bg-brand-600',
                  i === flow.step && 'bg-brand-600 ring-2 ring-brand-600/25',
                  i > flow.step && 'bg-line',
                )}
              />
            ))}
          </div>
        </div>

        <Reveal key={flow.step}>
          <StepBody flow={flow} />
        </Reveal>
        <StepNav flow={flow} />
      </div>
    </div>
  )
}

/* ══════════════════ C · one screen per step ══════════════════ */

function OnboardingC({ flow }: { flow: Flow }) {
  const pct = ((flow.step + 1) / STEPS.length) * 100

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="px-4 pt-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Progress value={pct} />
          <p className="mt-2 text-center font-mono text-xs text-ink-3">
            {flow.step + 1} of {STEPS.length}
          </p>
        </div>
      </div>

      <main className="flex flex-1 items-center px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <Reveal key={flow.step} whenVisible={false}>
            <h1 className="font-display tracking-tight mb-8 text-display-2 font-semibold text-ink">
              <WordReveal text={STEPS[flow.step].label} />
            </h1>
            <StepBody flow={flow} large />
          </Reveal>
          <StepNav flow={flow} large />
        </div>
      </main>
    </div>
  )
}
