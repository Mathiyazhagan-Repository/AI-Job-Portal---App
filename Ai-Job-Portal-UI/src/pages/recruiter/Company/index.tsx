import * as React from 'react'
import { Link } from 'react-router'
import {
  Building2, BadgeCheck, Upload, Eye, Pencil, Check, ArrowRight, ArrowLeft,
  Globe, MapPin, Users2, ShieldAlert, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { companies, jobs } from '@/data/mock'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea, Field, Label } from '@/components/ui/input'
import { Progress } from '@/components/ui/controls'
import { Tooltip } from '@/components/ui/overlay'
import { PageHeader } from '@/components/common'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { CompanyMark } from '@/features/jobs/JobCard'
import { useAuth } from '@/store/auth'

/**
 * R2 / R3 — Company setup wizard and company profile.
 *
 * One file, two routes: setup is the same form with a step rail and a
 * live preview of the public page. The preview is the motivation to
 * finish, so it is present in every direction.
 */

const company = companies[0]

const SETUP_STEPS = [
  { id: 'basics', label: 'Company basics', hint: 'Name, industry, size' },
  { id: 'brand', label: 'Branding', hint: 'Logo, colour, about' },
  { id: 'places', label: 'Locations & culture', hint: 'Where and how you work' },
  { id: 'verify', label: 'Verification', hint: 'Unlocks job posting' },
] as const

const CULTURE_FIELDS = [
  { key: 'work', label: 'How you work', placeholder: 'Small teams with end-to-end ownership…' },
  { key: 'process', label: 'Your hiring process', placeholder: 'Intro call, paid take-home, team round…' },
  { key: 'hours', label: 'Working hours', placeholder: 'Core hours 11:00–17:00 IST…' },
]

function useCompany(mode: 'setup' | 'profile') {
  const [step, setStep] = React.useState(0)
  const [form, setForm] = React.useState(() =>
    mode === 'setup'
      ? {
          name: '',
          industry: '',
          size: '',
          website: '',
          about: '',
          location: '',
          hue: 220,
          work: '',
          process: '',
          hours: '',
        }
      : {
          name: company.name,
          industry: company.industry,
          size: company.size,
          website: `${company.slug}.example`,
          about: company.about,
          location: company.location,
          hue: company.logoHue,
          work: 'Small teams with end-to-end ownership. Written proposals before big changes.',
          process: 'Intro call, a paid take-home you keep, a systems conversation, then a team round.',
          hours: 'Core hours 11:00–17:00 IST. No meetings on Wednesdays.',
        },
  )
  const [previewAsVisitor, setPreviewAsVisitor] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const { token, user } = useAuth()
  
  React.useEffect(() => {
    let active = true

    void (async () => {
      if (!token) return

      try {
        const res = await fetch('http://localhost:8000/api/recruiter/company', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch company')
        const savedCompany = await res.json()
        
        if (!savedCompany || !savedCompany.name) {
          const draft = localStorage.getItem('kairo.company.draft')
          if (draft && active) setForm((current) => ({ ...current, ...JSON.parse(draft) }))
          return
        }

        if (!active) return

        setForm((current) => ({
          ...current,
          name: savedCompany.name,
          industry: savedCompany.industry,
          size: savedCompany.size ?? '',
          website: savedCompany.website ?? '',
          about: savedCompany.about ?? '',
          location: savedCompany.location ?? '',
          hue: savedCompany.hue || 220,
          work: savedCompany.work ?? '',
          process: savedCompany.process ?? '',
          hours: savedCompany.hours ?? '',
        }))
      } catch (error) {
        console.error('Failed to load recruiter company:', error)
      }
    })()

    return () => {
      active = false
    }
  }, [token])

  const saveCompany = async () => {
    setSaveError(null)
    try {
      if (!token) throw new Error('Please sign in before setting up a company.')
      
      if (!form.name.trim() || !form.industry.trim()) {
        throw new Error('Company name and industry are required.')
      }
      if (mode === 'setup' && step >= 2 && !form.location.trim()) {
        throw new Error('Location is required before continuing.')
      }

      const res = await fetch('http://localhost:8000/api/recruiter/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          industry: form.industry,
          size: form.size,
          location: form.location,
          about: form.about,
          website: form.website
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Unable to save company details.')
      }

      localStorage.removeItem('kairo.company.draft')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save company details.'
      setSaveError(message)
      throw error
    }
  }

  const filled = [form.name, form.industry, form.about, form.location, form.work].filter(
    (x) => String(x).trim().length > 3,
  ).length
  const pct = Math.round((filled / 5) * 100)

  return { mode, step, setStep, form, set, saveCompany, saveError, previewAsVisitor, setPreviewAsVisitor, pct }
}

type C = ReturnType<typeof useCompany>

export function ProfileComponent() {
  const variant = useVariant()
  const c = useCompany('profile')
  const Views = { a: ProfileA, b: ProfileB, c: ProfileC }
  const View = Views[variant] ?? ProfileA
  return <View c={c} />
}

export function SetupComponent() {
  const variant = useVariant()
  const c = useCompany('setup')
  const Views = { a: SetupA, b: SetupB, c: SetupC }
  const View = Views[variant] ?? SetupA
  return <View c={c} />
}

/* ══════════════════ shared form sections ══════════════════ */

function BasicsForm({ c, large }: { c: C; large?: boolean }) {
  return (
    <div className={cn('grid gap-4', large ? 'sm:grid-cols-2' : 'sm:grid-cols-2')}>
      <Field label="Company name" htmlFor="co-name" required>
        <Input placeholder="e.g. Tata Consultancy Services" value={c.form.name} onChange={(e) => c.set('name', e.target.value)} className={large ? 'h-12 text-lg' : undefined} />
      </Field>
      <Field label="Industry" htmlFor="co-ind" required>
        <Input placeholder="e.g. Software and IT services" value={c.form.industry} onChange={(e) => c.set('industry', e.target.value)} className={large ? 'h-12 text-lg' : undefined} />
      </Field>
      <Field label="Company size" htmlFor="co-size">
        <Input placeholder="e.g. 500-1,000 employees" value={c.form.size} onChange={(e) => c.set('size', e.target.value)} className={large ? 'h-12 text-lg' : undefined} />
      </Field>
      <Field label="Website" htmlFor="co-web" hint="Used for domain verification">
        <Input placeholder="e.g. https://www.example.com" value={c.form.website} onChange={(e) => c.set('website', e.target.value)} className={large ? 'h-12 text-lg' : undefined} />
      </Field>
    </div>
  )
}

function BrandForm({ c }: { c: C }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Logo</Label>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <CompanyMark company={{ name: c.form.name, logoHue: Number(c.form.hue) }} size={64} />
          <div>
            <Button variant="secondary" size="sm">
              <Upload className="size-4" />
              Upload a logo
            </Button>
            <p className="mt-1 text-xs text-ink-3">PNG, JPG or WEBP · up to 2 MB</p>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="co-hue">Brand colour</Label>
        <div className="mt-2 flex items-center gap-3">
          <input
            id="co-hue"
            type="range"
            min={0}
            max={360}
            value={c.form.hue}
            onChange={(e) => c.set('hue', Number(e.target.value))}
            className="h-1.5 flex-1 accent-[var(--color-brand-600)]"
          />
          <span
            className="size-8 shrink-0 rounded-v-control border border-line"
            style={{ background: `oklch(0.7 0.14 ${c.form.hue})` }}
            aria-hidden
          />
        </div>
        <p className="mt-1 text-xs text-ink-3">Tints your public page header and job cards.</p>
      </div>

      <Field label="About the company" htmlFor="co-about" hint="Two or three sentences. Candidates read this first.">
        <Textarea
          rows={4}
          placeholder="e.g. We build tools that help growing teams work smarter."
          value={c.form.about}
          onChange={(e) => c.set('about', e.target.value)}
        />
      </Field>
    </div>
  )
}

function PlacesForm({ c }: { c: C }) {
  return (
    <div className="space-y-4">
      <Field label="Primary location" htmlFor="co-loc" required>
        <Input placeholder="e.g. Bengaluru, Karnataka" value={c.form.location} onChange={(e) => c.set('location', e.target.value)} />
      </Field>
      {CULTURE_FIELDS.map((f) => (
        <Field key={f.key} label={f.label} htmlFor={`co-${f.key}`}>
          <Textarea
            rows={3}
            value={String(c.form[f.key as keyof typeof c.form])}
            onChange={(e) => c.set(f.key, e.target.value)}
            placeholder={f.placeholder}
          />
        </Field>
      ))}
    </div>
  )
}

function VerifyForm({ status = 'pending' }: { status?: 'unverified' | 'pending' | 'verified' }) {
  return (
    <div className="space-y-4">
      <div
        className={cn(
          'flex items-start gap-3 rounded-v p-4',
          status === 'verified' && 'bg-score-elite-bg',
          status === 'pending' && 'bg-warning-bg',
          status === 'unverified' && 'bg-subtle',
        )}
      >
        {status === 'verified' ? (
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-score-elite" aria-hidden />
        ) : (
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        )}
        <div>
          <p
            className={cn(
              'font-semibold',
              status === 'verified' ? 'text-score-elite' : 'text-warning',
            )}
          >
            {status === 'verified'
              ? 'Verified employer'
              : status === 'pending'
                ? 'Verification in review'
                : 'Not verified yet'}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">
            {status === 'verified'
              ? 'An admin checked your domain and registration document. Your jobs publish without further review.'
              : status === 'pending'
                ? 'An admin is reviewing your documents. Until it clears, your jobs go through the moderation queue before going live.'
                : 'Upload a registration document to unlock job posting. This is what stops fake companies collecting resumes.'}
          </p>
        </div>
      </div>

      <div className="rounded-v border border-dashed border-line p-5 text-center">
        <FileText className="mx-auto size-6 text-ink-3" aria-hidden />
        <p className="mt-2 font-medium text-ink">Registration or incorporation document</p>
        <p className="mt-1 text-xs text-ink-3">PDF · up to 5 MB · seen only by platform admins</p>
        <Button variant="secondary" size="sm" className="mt-3">
          <Upload className="size-4" />
          Upload document
        </Button>
      </div>

      <ul className="space-y-1.5 text-sm">
        {[
          ['Email domain matches website', true],
          ['Registration document uploaded', true],
          ['Admin review', false],
        ].map(([l, done]) => (
          <li key={String(l)} className="flex items-center gap-2">
            <span
              className={cn(
                'grid size-4 shrink-0 place-items-center rounded-full',
                done ? 'bg-score-elite text-white' : 'bg-subtle text-ink-3',
              )}
            >
              {done ? <Check className="size-2.5 stroke-[3]" aria-hidden /> : '·'}
            </span>
            <span className={done ? 'text-ink-2' : 'text-ink-3'}>{String(l)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ══════════════════ live public preview ══════════════════ */

function PublicPreview({ c, large }: { c: C; large?: boolean }) {
  const openJobs = jobs.filter((j) => j.companyId === company.id).slice(0, 3)
  return (
    <div className="overflow-hidden rounded-v border border-line bg-paper shadow-v-card">
      <div className="flex items-center gap-2 border-b border-line bg-subtle px-3 py-1.5">
        <span className="flex gap-1">
          <i className="size-2 rounded-full bg-line-strong" />
          <i className="size-2 rounded-full bg-line-strong" />
          <i className="size-2 rounded-full bg-line-strong" />
        </span>
        <span className="truncate font-mono text-[10px] text-ink-3">
          kairo.example/companies/{company.slug}
        </span>
        <Badge tone="brand" size="sm" className="ml-auto">
          live preview
        </Badge>
      </div>

      <div
        className="h-16"
        style={{
          background: `linear-gradient(135deg, oklch(0.93 0.06 ${c.form.hue}), oklch(0.98 0.02 ${c.form.hue}))`,
        }}
        aria-hidden
      />
      <div className={cn('-mt-6', large ? 'p-6' : 'p-4')}>
        <div className="inline-block rounded-v bg-paper p-1.5 shadow-md">
          <CompanyMark company={{ name: c.form.name, logoHue: Number(c.form.hue) }} size={large ? 48 : 40} />
        </div>
        <h3 className={cn('mt-3 font-semibold text-ink', large ? 'text-2xl' : 'text-lg')}>
          {c.form.name || 'Your company'}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1">
            <Building2 className="size-3" aria-hidden />
            {c.form.industry}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" aria-hidden />
            {c.form.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users2 className="size-3" aria-hidden />
            {c.form.size}
          </span>
        </div>
        <p className={cn('mt-3 leading-relaxed text-ink-2', large ? 'text-sm' : 'text-xs')}>
          {c.form.about || 'Your description appears here.'}
        </p>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">
          {openJobs.length} open roles
        </p>
        <ul className="mt-1.5 space-y-1">
          {openJobs.map((j) => (
            <li key={j.id} className="truncate text-xs text-ink-2">
              {j.title} · {j.location}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function CompletionMeter({ c }: { c: C }) {
  return (
    <div className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Page completeness</p>
      <p className="mt-1 font-mono tnum text-2xl font-bold text-ink">{c.pct}%</p>
      <Progress value={c.pct} className="mt-2" />
      <p className="mt-2 text-xs text-ink-3">
        {c.pct === 100
          ? 'Complete — candidates see the full picture.'
          : 'Companies with a complete page get 2× more applications per role.'}
      </p>
    </div>
  )
}

/* ══════════════════ R3 · profile — A ══════════════════ */

function ProfileA({ c }: { c: C }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={Building2}
        tone="teal"
        title="Company profile"
        description="This is your public page — the first thing a candidate reads about you."
        actions={
          <Button
            variant={c.previewAsVisitor ? 'primary' : 'secondary'}
            onClick={() => c.setPreviewAsVisitor(!c.previewAsVisitor)}
          >
            <Eye className="size-4" />
            {c.previewAsVisitor ? 'Back to editing' : 'Preview as visitor'}
          </Button>
        }
      />

      {c.previewAsVisitor ? (
        <Reveal whenVisible={false} className="mx-auto mt-6 max-w-2xl">
          <PublicPreview c={c} large />
        </Reveal>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <Stagger className="min-w-0 space-y-4" whenVisible={false}>
            {[
              { title: 'Basics', body: <BasicsForm c={c} /> },
              { title: 'Branding', body: <BrandForm c={c} /> },
              { title: 'Locations & culture', body: <PlacesForm c={c} /> },
              { title: 'Verification', body: <VerifyForm status="verified" /> },
            ].map((s) => (
              <StaggerItem key={s.title}>
                <section className="rounded-v border-[length:var(--v-card-border)] border-line bg-paper p-v-card shadow-v-card">
                  <h2 className="mb-4 font-semibold text-ink">{s.title}</h2>
                  {s.body}
                </section>
              </StaggerItem>
            ))}
          </Stagger>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <CompletionMeter c={c} />
            <PublicPreview c={c} />
          </aside>
        </div>
      )}
    </div>
  )
}

function ProfileB({ c }: { c: C }) {
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Company profile</h1>
          <p className="font-mono text-xs text-ink-3">{c.pct}% complete · verified</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={c.previewAsVisitor ? 'primary' : 'secondary'}
            onClick={() => c.setPreviewAsVisitor(!c.previewAsVisitor)}
          >
            <Eye className="size-4" />
            Preview
          </Button>
          <Button size="sm">Save</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <BasicsForm c={c} />
          <BrandForm c={c} />
          <PlacesForm c={c} />
          <VerifyForm status="verified" />
        </div>
        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <CompletionMeter c={c} />
          <PublicPreview c={c} />
        </aside>
      </div>
    </div>
  )
}

function ProfileC({ c }: { c: C }) {
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-10 sm:px-6">
      <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
        Your company page
      </h1>
      <p className="mt-3 text-lg text-ink-2">Edit on the right — the page updates as you type.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,440px)_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PublicPreview c={c} large />
          <div className="mt-4">
            <CompletionMeter c={c} />
          </div>
        </aside>

        <Stagger className="min-w-0 space-y-6">
          {[
            { title: 'Basics', body: <BasicsForm c={c} large /> },
            { title: 'Branding', body: <BrandForm c={c} /> },
            { title: 'Locations & culture', body: <PlacesForm c={c} /> },
            { title: 'Verification', body: <VerifyForm status="verified" /> },
          ].map((s) => (
            <StaggerItem key={s.title}>
              <section className="rounded-v bg-paper p-8 shadow-lg">
                <h2 className="font-display tracking-tight mb-6 text-2xl font-semibold text-ink">
                  {s.title}
                </h2>
                {s.body}
              </section>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  )
}

/* ══════════════════ R2 · setup wizard ══════════════════ */

function stepBody(c: C) {
  switch (SETUP_STEPS[c.step].id) {
    case 'basics': return <BasicsForm c={c} />
    case 'brand': return <BrandForm c={c} />
    case 'places': return <PlacesForm c={c} />
    default: return <VerifyForm status="pending" />
  }
}

function SetupNav({ c, large }: { c: C; large?: boolean }) {
  const last = c.step === SETUP_STEPS.length - 1

  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
      {c.saveError && (
        <p className="basis-full rounded-v-control border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {c.saveError}
        </p>
      )}
      <Button variant="ghost" onClick={() => c.setStep((s) => Math.max(0, s - 1))} disabled={c.step === 0}>
        <ArrowLeft className="size-4" />
        Back
      </Button>
      {last ? (
        <Button
          size={large ? 'lg' : 'md'}
          onClick={async () => {
            try {
              await c.saveCompany()
              window.location.assign('/recruiter/jobs/new')
            } catch (error) {
              console.error('Failed to save recruiter company:', error)
              if (error instanceof Error && error.message.toLowerCase().includes('sign in before')) {
                localStorage.setItem('kairo.company.draft', JSON.stringify(c.form))
                window.location.assign('/login')
              }
            }
          }}
        >
          Create your first job
          <ArrowRight className="size-4" />
        </Button>
      ) : (
        <Button size={large ? 'lg' : 'md'} onClick={() => c.setStep((s) => s + 1)}>
          Continue
          <ArrowRight className="size-4" />
        </Button>
      )}
    </div>
  )
}

function SetupA({ c }: { c: C }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Set up your company</h1>
      <p className="mt-1 text-sm text-ink-2">
        Four steps. Your public page builds itself as you go.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[200px_1fr_320px]">
        <ol className="space-y-1">
          {SETUP_STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => i <= c.step && c.setStep(i)}
                disabled={i > c.step}
                aria-current={i === c.step ? 'step' : undefined}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-v-control px-3 py-2 text-left transition-v',
                  i === c.step && 'bg-brand-50',
                  i > c.step && 'opacity-50',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
                    i <= c.step ? 'bg-brand-600 text-white' : 'bg-subtle text-ink-3',
                  )}
                >
                  {i < c.step ? <Check className="size-3 stroke-[3]" aria-hidden /> : i + 1}
                </span>
                <span>
                  <span className={cn('block text-sm font-medium', i === c.step ? 'text-brand-700' : 'text-ink')}>
                    {s.label}
                  </span>
                  <span className="block text-xs text-ink-3">{s.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="min-w-0">
          <Reveal key={c.step} whenVisible={false}>
            <h2 className="mb-5 text-xl font-semibold text-ink">{SETUP_STEPS[c.step].label}</h2>
            {stepBody(c)}
          </Reveal>
          <SetupNav c={c} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
            Your public page
          </p>
          <PublicPreview c={c} />
          <div className="mt-4">
            <CompletionMeter c={c} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function SetupB({ c }: { c: C }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Company setup</h1>
          <p className="font-mono text-xs text-ink-3">all four sections on one page · {c.pct}% complete</p>
        </div>
        <Button size="sm" asChild>
          <Link to="/recruiter/jobs/new">Finish and post a job</Link>
        </Button>
      </div>

      {/* everything at once — no wizard for a console user */}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-5">
          {SETUP_STEPS.map((s, i) => (
            <section key={s.id}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
                {i + 1}. {s.label}
              </h2>
              {s.id === 'basics' && <BasicsForm c={c} />}
              {s.id === 'brand' && <BrandForm c={c} />}
              {s.id === 'places' && <PlacesForm c={c} />}
              {s.id === 'verify' && <VerifyForm status="pending" />}
            </section>
          ))}
        </div>
        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <CompletionMeter c={c} />
          <PublicPreview c={c} />
        </aside>
      </div>
    </div>
  )
}

function SetupC({ c }: { c: C }) {
  const pct = ((c.step + 1) / SETUP_STEPS.length) * 100
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Progress value={pct} />
        <p className="mt-2 text-center font-mono text-xs text-ink-3">
          {c.step + 1} of {SETUP_STEPS.length}
        </p>
      </div>

      <Reveal key={c.step} whenVisible={false} className="mt-10">
        <h1 className="font-display tracking-tight text-center text-display-2 font-semibold text-ink">
          {SETUP_STEPS[c.step].label}
        </h1>
        <p className="mt-3 text-center text-lg text-ink-2">{SETUP_STEPS[c.step].hint}</p>
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 rounded-v bg-paper p-8 shadow-lg">
          <Reveal key={`f${c.step}`} whenVisible={false}>{stepBody(c)}</Reveal>
          <SetupNav c={c} large />
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PublicPreview c={c} large />
        </aside>
      </div>
    </div>
  )
}

/** R3 — the routed entry point for the company profile. */
export const Component = ProfileComponent
