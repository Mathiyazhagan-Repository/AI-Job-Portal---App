import * as React from 'react'
import { Link } from 'react-router'
import {
  Mail, Phone, MapPin, MessageSquare, Send, CircleCheckBig, Clock, Briefcase,
  Newspaper, Handshake, ShieldAlert, Building2, ArrowLeft, ArrowRight, Sparkles,
  AtSign, Timer, Headset, Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea, Field, Label } from '@/components/ui/input'
import { PageHeader, SectionHeading, MiniStat, TONE_CLASS, type Tone } from '@/components/common'
import { Reveal, Stagger, StaggerItem, ScrambleText } from '@/components/motion'

/**
 * P10 — Contact (PRD Part 47).
 *
 * The form validates in React state, not via native constraint bubbles:
 * every message is rendered under its own field, wired with aria-invalid
 * and aria-describedby, and held back until the field is blurred or a
 * submit has been attempted. A successful send REPLACES the form with a
 * panel that names the topic and its response time — never an alert().
 */

/* ══════════════════ model ══════════════════ */

interface Topic {
  value: string
  label: string
  /** Human phrasing, used verbatim in the success panel. */
  reply: string
  tone: Tone
  icon: React.ElementType
}

const TOPICS: Topic[] = [
  { value: 'sales', label: 'Sales', reply: 'within 1 business day', tone: 'indigo', icon: Briefcase },
  { value: 'support', label: 'Support', reply: 'within 4 working hours', tone: 'emerald', icon: Headset },
  { value: 'press', label: 'Press', reply: 'within 2 business days', tone: 'violet', icon: Newspaper },
  { value: 'partnerships', label: 'Partnerships', reply: 'within 3 business days', tone: 'amber', icon: Handshake },
  { value: 'problem', label: 'Report a problem', reply: 'within 4 working hours — sooner if it blocks a hire', tone: 'rose', icon: ShieldAlert },
]

const MIN_MESSAGE = 20

type FieldName = 'name' | 'email' | 'topic' | 'message'

const FIELD_ORDER: FieldName[] = ['name', 'email', 'topic', 'message']

interface Values {
  name: string
  email: string
  topic: string
  message: string
}

const EMPTY: Values = { name: '', email: '', topic: '', message: '' }

/**
 * Deliberately permissive on email: a shape check (`@` plus a dot in the
 * domain) rejects typos without rejecting real addresses. Anything
 * stricter than this belongs on the server, not in a form.
 */
function validate(v: Values): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {}

  if (!v.name.trim()) errors.name = 'Tell us who we are replying to.'

  const email = v.email.trim()
  if (!email) {
    errors.email = 'We need an address to reply to.'
  } else {
    const [local, ...rest] = email.split('@')
    const domain = rest.join('@')
    if (rest.length !== 1 || !local || !domain || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
      errors.email = 'That does not look like an email address — it needs an @ and a domain.'
    }
  }

  if (!v.topic) errors.topic = 'Pick the topic so this reaches the right team.'

  const message = v.message.trim()
  if (!message) {
    errors.message = 'Say a little about what you need.'
  } else if (message.length < MIN_MESSAGE) {
    errors.message = `A few more details, please — ${MIN_MESSAGE - message.length} more character${MIN_MESSAGE - message.length === 1 ? '' : 's'} to go.`
  }

  return errors
}

interface Sent {
  topic: Topic
  name: string
  email: string
}

function useContactForm() {
  const [values, setValues] = React.useState<Values>(EMPTY)
  const [touched, setTouched] = React.useState<Partial<Record<FieldName, boolean>>>({})
  const [attempted, setAttempted] = React.useState(false)
  const [sent, setSent] = React.useState<Sent | null>(null)

  const errors = validate(values)

  /** An error is only *shown* once the user has left the field, or tried to send. */
  const err = (f: FieldName) => (attempted || touched[f] ? errors[f] : undefined)

  const set = (f: FieldName, value: string) => setValues((p) => ({ ...p, [f]: value }))
  const blur = (f: FieldName) => setTouched((p) => ({ ...p, [f]: true }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    const firstBad = FIELD_ORDER.find((f) => errors[f])
    if (firstBad) {
      document.getElementById(`c-${firstBad}`)?.focus()
      return
    }
    const topic = TOPICS.find((t) => t.value === values.topic)
    if (!topic) return
    setSent({ topic, name: values.name.trim(), email: values.email.trim() })
  }

  const reset = () => {
    setValues(EMPTY)
    setTouched({})
    setAttempted(false)
    setSent(null)
  }

  return { values, errors, err, set, blur, submit, reset, sent, attempted }
}

type FormState = ReturnType<typeof useContactForm>

/* ══════════════════ entry ══════════════════ */

export function Component() {
  const variant = useVariant()
  const f = useContactForm()
  const Views = { a: ContactA, b: ContactB, c: ContactC }
  const View = Views[variant] ?? ContactA
  return <View f={f} />
}
Component.displayName = 'ContactPage'

/* ══════════════════ shared form ══════════════════ */

function TextField({
  f,
  name,
  label,
  placeholder,
  type = 'text',
  autoComplete,
  dense,
}: {
  f: FormState
  name: 'name' | 'email'
  label: string
  placeholder: string
  type?: string
  autoComplete?: string
  dense?: boolean
}) {
  return (
    <Field label={label} htmlFor={`c-${name}`} required error={f.err(name)}>
      <Input
        type={type}
        value={f.values[name]}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={dense ? 'h-8' : undefined}
        onChange={(e) => f.set(name, e.target.value)}
        onBlur={() => f.blur(name)}
      />
    </Field>
  )
}

function TopicField({ f, dense }: { f: FormState; dense?: boolean }) {
  return (
    <Field label="What is this about?" htmlFor="c-topic" required error={f.err('topic')}>
      <select
        value={f.values.topic}
        onChange={(e) => f.set('topic', e.target.value)}
        onBlur={() => f.blur('topic')}
        className={cn(
          'w-full rounded-v-control border border-line bg-paper px-3 text-sm text-ink',
          'transition-[border-color,box-shadow] duration-150 hover:border-line-strong',
          'focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10',
          'aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/10',
          dense ? 'h-8' : 'h-9.5',
        )}
      >
        <option value="">Choose a topic…</option>
        {TOPICS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

/**
 * Hand-wired rather than wrapped in <Field> because it carries a live
 * counter that must stay visible *alongside* an error, and Field shows
 * only one of hint/error at a time.
 */
function MessageField({ f, dense }: { f: FormState; dense?: boolean }) {
  const error = f.err('message')
  const len = f.values.message.trim().length
  const remaining = Math.max(0, MIN_MESSAGE - len)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor="c-message">
          Message
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        </Label>
        <span
          id="c-message-count"
          className={cn(
            'font-mono tnum text-xs',
            remaining > 0 ? 'text-tone-amber' : 'text-tone-emerald',
          )}
        >
          {len} / {MIN_MESSAGE} min
        </span>
      </div>
      <Textarea
        id="c-message"
        value={f.values.message}
        placeholder="What are you trying to do, and what have you tried so far?"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'c-message-error c-message-count' : 'c-message-count'}
        className={dense ? 'min-h-20' : 'min-h-32'}
        onChange={(e) => f.set('message', e.target.value)}
        onBlur={() => f.blur('message')}
      />
      {error ? (
        <p id="c-message-error" className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-ink-3">
          {remaining > 0
            ? `${remaining} more character${remaining === 1 ? '' : 's'} before this can be sent.`
            : 'Enough detail to route this properly — thank you.'}
        </p>
      )}
    </div>
  )
}

function SuccessPanel({
  sent,
  onReset,
  compact,
}: {
  sent: Sent
  onReset: () => void
  compact?: boolean
}) {
  const t = TONE_CLASS[sent.topic.tone]
  const Icon = sent.topic.icon

  return (
    <div
      role="status"
      className={cn(
        'relative overflow-hidden rounded-v border border-line bg-paper text-center shadow-v-card',
        compact ? 'p-6' : 'p-8',
      )}
    >
      <span className={cn('absolute inset-x-0 top-0 h-1', t.rail)} aria-hidden />

      <span
        className={cn(
          'mx-auto grid place-items-center rounded-2xl bg-gradient-to-br text-white shadow-sm',
          t.tile,
          compact ? 'size-11' : 'size-14',
        )}
        aria-hidden
      >
        <CircleCheckBig className={compact ? 'size-5.5' : 'size-7'} />
      </span>

      <h2 className={cn('mt-4 font-semibold text-ink', compact ? 'text-lg' : 'text-2xl')}>
        Message sent
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-2">
        Thanks, {sent.name}. This is now with the{' '}
        <span className={cn('font-semibold', t.text)}>{sent.topic.label}</span> team, and we have
        sent a copy to <span className="font-mono text-xs text-ink">{sent.email}</span>.
      </p>

      <span
        className={cn(
          'mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium',
          t.bg,
          t.text,
        )}
      >
        <Clock className="size-4" aria-hidden />
        Expect a reply {sent.topic.reply}
      </span>

      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-3">
        <Icon className="size-3.5" aria-hidden />
        Routed by topic — nothing about your message is scored or ranked.
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" onClick={onReset}>
          <ArrowLeft className="size-4" />
          Send another message
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/faq">
            Read the FAQ
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

/** The form body — fields plus submit. Shared by all three directions. */
function FormBody({ f, dense }: { f: FormState; dense?: boolean }) {
  const invalidCount = f.attempted ? Object.keys(f.errors).length : 0

  return (
    <form noValidate onSubmit={f.submit} className={cn('flex flex-col', dense ? 'gap-3' : 'gap-4')}>
      <div className={cn('grid gap-4 sm:grid-cols-2', dense && 'gap-3')}>
        <TextField f={f} name="name" label="Your name" placeholder="Priya Raman" autoComplete="name" dense={dense} />
        <TextField f={f} name="email" label="Work email" placeholder="priya@company.com" type="email" autoComplete="email" dense={dense} />
      </div>

      <TopicField f={f} dense={dense} />
      <MessageField f={f} dense={dense} />

      {invalidCount > 0 && (
        <p className="flex items-start gap-2 rounded-v bg-danger-bg p-2.5 text-xs text-danger" role="alert">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {invalidCount === 1
            ? 'One field still needs attention before this can be sent.'
            : `${invalidCount} fields still need attention before this can be sent.`}
        </p>
      )}

      <div className={cn('flex flex-wrap items-center gap-3', dense ? 'mt-0.5' : 'mt-1')}>
        <Button type="submit" size={dense ? 'sm' : 'md'}>
          <Send className="size-4" />
          Send message
        </Button>
        <p className="text-xs text-ink-3">
          We reply from a real inbox. No auto-responder, no sales sequence.
        </p>
      </div>
    </form>
  )
}

/** Form or success panel — the success state REPLACES the form. */
function FormPanel({ f, dense, compact }: { f: FormState; dense?: boolean; compact?: boolean }) {
  if (f.sent) return <SuccessPanel sent={f.sent} onReset={f.reset} compact={compact} />
  return <FormBody f={f} dense={dense} />
}

/* ══════════════════ contact methods (Direction A) ══════════════════ */

interface Method {
  tone: Tone
  icon: React.ElementType
  title: string
  blurb: string
  lines: { icon: React.ElementType; text: string }[]
  reply: string
}

const METHODS: Method[] = [
  {
    tone: 'indigo',
    icon: Briefcase,
    title: 'Sales',
    blurb: 'Pricing, pilots, and rolling Kairo out across a hiring team.',
    lines: [
      { icon: Mail, text: 'sales@kairo.jobs' },
      { icon: Phone, text: '+91 80 4718 2200' },
    ],
    reply: '1 business day',
  },
  {
    tone: 'emerald',
    icon: Headset,
    title: 'Support',
    blurb: 'Something is broken, or a candidate is stuck in your pipeline.',
    lines: [
      { icon: Mail, text: 'support@kairo.jobs' },
      { icon: Clock, text: 'Mon–Sat · 09:00–19:00 IST' },
    ],
    reply: '4 working hours',
  },
  {
    tone: 'violet',
    icon: Newspaper,
    title: 'Press',
    blurb: 'Interviews, hiring-market data, and how our match scores are explained.',
    lines: [
      { icon: Mail, text: 'press@kairo.jobs' },
      { icon: AtSign, text: '@kairojobs' },
    ],
    reply: '2 business days',
  },
  {
    tone: 'amber',
    icon: Building2,
    title: 'Office',
    blurb: 'Visits by appointment — we will leave a gate pass at reception.',
    lines: [
      { icon: MapPin, text: '4th floor, 100 Ft Road, Indiranagar, Bengaluru 560038' },
      { icon: Clock, text: 'Mon–Fri · 10:00–18:00 IST' },
    ],
    reply: 'same day',
  },
]

function MethodCard({ m }: { m: Method }) {
  const t = TONE_CLASS[m.tone]
  const Icon = m.icon

  return (
    <article
      className={cn(
        'relative h-full overflow-hidden rounded-v border border-line bg-paper p-4 shadow-v-card hover-lift',
      )}
    >
      <span className={cn('absolute inset-x-0 top-0 h-1', t.rail)} aria-hidden />

      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm',
            t.tile,
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">{m.title}</h3>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                t.bg,
                t.text,
              )}
            >
              <Timer className="size-3" aria-hidden />
              {m.reply}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">{m.blurb}</p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
        {m.lines.map((l) => {
          const LineIcon = l.icon
          return (
            <li key={l.text} className="flex items-start gap-2 text-sm text-ink-2">
              <LineIcon className={cn('mt-0.5 size-3.5 shrink-0', t.text)} aria-hidden />
              <span className="min-w-0 break-words">{l.text}</span>
            </li>
          )
        })}
      </ul>
    </article>
  )
}

const SERVICE_STATS: { tone: Tone; icon: React.ElementType; label: string; value: string }[] = [
  { tone: 'sky', icon: Timer, label: 'Median first reply', value: '3h 12m' },
  { tone: 'teal', icon: MessageSquare, label: 'Answered by a human', value: '100%' },
  { tone: 'fuchsia', icon: Globe, label: 'Languages supported', value: 'EN · HI · KN' },
  { tone: 'rose', icon: Clock, label: 'Support window', value: 'Mon–Sat' },
]

/* ══════════════════ A · split — form left, methods right ══════════════════ */

function ContactA({ f }: { f: FormState }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <PageHeader
        icon={MessageSquare}
        tone="fuchsia"
        eyebrow="We answer everything"
        title="Talk to the team behind Kairo"
        description="Pick a topic and we route it straight to the people who own it — sales, support, press or partnerships. Every reply is written by a person."
        actions={
          <Badge tone="success" size="lg">
            <CircleCheckBig className="size-3.5" aria-hidden />
            Replying today
          </Badge>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {/* form */}
        <Reveal className="rounded-v border-[length:var(--v-card-border)] border-line bg-paper p-v-card shadow-v-card">
          {!f.sent && (
            <div className="mb-5 flex items-start gap-3 border-b border-line pb-4">
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-lg',
                  TONE_CLASS.indigo.bg,
                  TONE_CLASS.indigo.text,
                )}
                aria-hidden
              >
                <Send className="size-4.5" />
              </span>
              <div>
                <h2 className="font-semibold text-ink">Send us a message</h2>
                <p className="mt-0.5 text-sm text-ink-2">
                  Four fields. We will tell you the response time as soon as you send it.
                </p>
              </div>
            </div>
          )}
          <FormPanel f={f} />
        </Reveal>

        {/* coloured contact methods */}
        <div>
          <SectionHeading title="Direct lines" icon={Sparkles} tone="violet" />
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" whenVisible={false}>
            {METHODS.map((m) => (
              <StaggerItem key={m.title}>
                <MethodCard m={m} />
              </StaggerItem>
            ))}
          </Stagger>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SERVICE_STATS.map((s) => (
              <MiniStat key={s.label} tone={s.tone} icon={s.icon} label={s.label} value={s.value} />
            ))}
          </div>
        </div>
      </div>

      {/* full-width closer so the page never trails off into white */}
      <Reveal
        className="relative mt-6 overflow-hidden rounded-v border border-line bg-paper p-v-card shadow-v-card"
        whenVisible={false}
      >
        <span className={cn('absolute inset-x-0 top-0 h-1', TONE_CLASS.teal.rail)} aria-hidden />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              tone: 'teal' as Tone,
              icon: Handshake,
              title: 'Partnerships',
              body: 'Job boards, assessment vendors, ATS integrations and campus programmes.',
            },
            {
              tone: 'rose' as Tone,
              icon: ShieldAlert,
              title: 'Report a problem',
              body: 'A wrong match, a suspicious employer, or anything that looks unfair. These jump the queue.',
            },
            {
              tone: 'sky' as Tone,
              icon: Globe,
              title: 'Prefer to self-serve?',
              body: 'The FAQ covers matching, privacy and what our AI can and cannot do.',
            },
          ].map((c) => {
            const t = TONE_CLASS[c.tone]
            const Icon = c.icon
            return (
              <div key={c.title} className="flex items-start gap-3">
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', t.bg, t.text)} aria-hidden>
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{c.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">{c.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Reveal>
    </div>
  )
}

/* ══════════════════ B · centred compact card ══════════════════ */

function ContactB({ f }: { f: FormState }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <div className="border-b border-line pb-3">
        <ScrambleText
          as="p"
          text="contact · routed by topic"
          className="font-mono text-xs uppercase tracking-widest text-brand-600"
        />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Contact</h1>
        <p className="mt-1 text-sm text-ink-2">
          One form, four fields. Response times are listed per topic below.
        </p>
      </div>

      <div className="mt-4 rounded-v border border-line bg-paper p-4 shadow-v-card">
        <FormPanel f={f} dense compact />
      </div>

      {!f.sent && (
        <div className="mt-4 rounded-v border border-line bg-paper p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
            Response times
          </h2>
          <ul className="divide-y divide-line text-sm">
            {TOPICS.map((t) => (
              <li key={t.value} className="flex items-center justify-between gap-3 py-1.5">
                <span className="inline-flex min-w-0 items-center gap-2 text-ink-2">
                  <span
                    className={cn('inline-block size-2 shrink-0 rounded-full', TONE_CLASS[t.tone].fill)}
                    aria-hidden
                  />
                  <span className="truncate">{t.label}</span>
                </span>
                <span className="shrink-0 font-mono tnum text-xs text-ink-3">{t.reply}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <Mail className="size-3.5" aria-hidden />
          support@kairo.jobs
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Phone className="size-3.5" aria-hidden />
          +91 80 4718 2200
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" aria-hidden />
          Indiranagar, Bengaluru
        </span>
      </div>
    </div>
  )
}

/* ══════════════════ C · full-bleed hero + floating card ══════════════════ */

const HERO_BG = [
  'radial-gradient(58% 52% at 12% 6%, color-mix(in oklab, var(--color-tone-violet-vivid) 28%, transparent), transparent 68%)',
  'radial-gradient(52% 48% at 88% 2%, color-mix(in oklab, var(--color-tone-sky-vivid) 26%, transparent), transparent 66%)',
  'radial-gradient(64% 58% at 62% 96%, color-mix(in oklab, var(--color-tone-fuchsia-vivid) 20%, transparent), transparent 70%)',
  'linear-gradient(180deg, var(--color-tone-indigo-bg), transparent 60%)',
].join(', ')

function ContactC({ f }: { f: FormState }) {
  return (
    <div className="relative overflow-hidden">
      <span className="pointer-events-none absolute inset-0" style={{ background: HERO_BG }} aria-hidden />

      <div className="relative mx-auto max-w-[1100px] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
              TONE_CLASS.violet.bg,
              TONE_CLASS.violet.text,
            )}
          >
            <Sparkles className="size-3.5" aria-hidden />
            Every message gets a human reply
          </span>

          <h1 className="font-display tracking-tight mt-5 text-display-2 font-semibold text-ink">
            Say hello to Kairo
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-2">
            Tell us what you are trying to do. We route it by topic, and we tell you exactly when to
            expect an answer — before you close the tab.
          </p>
        </div>

        <Reveal className="mx-auto mt-12 max-w-2xl rounded-v bg-paper p-8 shadow-2xl ring-1 ring-line">
          <FormPanel f={f} />
        </Reveal>

        <Stagger className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
          {[
            { tone: 'indigo' as Tone, icon: Mail, label: 'Email', value: 'hello@kairo.jobs' },
            { tone: 'emerald' as Tone, icon: Timer, label: 'Median first reply', value: '3h 12m' },
            { tone: 'amber' as Tone, icon: MapPin, label: 'Office', value: 'Bengaluru, IN' },
          ].map((c) => {
            const t = TONE_CLASS[c.tone]
            const Icon = c.icon
            return (
              <StaggerItem key={c.label}>
                <div className="flex h-full items-center gap-3 rounded-v bg-paper/80 p-4 shadow-v-card backdrop-blur">
                  <span
                    className={cn(
                      'grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                      t.tile,
                    )}
                    aria-hidden
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-ink-3">{c.label}</p>
                    <p className="truncate font-medium text-ink">{c.value}</p>
                  </div>
                </div>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
    </div>
  )
}
