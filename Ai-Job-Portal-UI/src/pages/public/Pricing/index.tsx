import * as React from 'react'
import { Link } from 'react-router'
import { Check, X, Info, ArrowRight, Zap, TrendingUp, Building2, Search, Sparkles, GitBranch, Users2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider, Switch, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/controls'
import { Tooltip } from '@/components/ui/overlay'
import { Reveal, Stagger, StaggerItem, AnimatedNumber, ScrambleText } from '@/components/motion'
import { AIProvenanceChip } from '@/components/brand'
import { TONE_CLASS, type Tone } from '@/components/common'

/**
 * P8 — Pricing (PRD Part 47).
 *
 * Tiers are Free / Growth / Enterprise. Exact limits are a
 * [PLACEHOLDER] pending Product, and NO payment provider is assumed —
 * every CTA leads to the labelled billing stub, never a fake checkout.
 */

interface Plan {
  id: string
  name: string
  blurb: string
  monthly: number | null
  jobCredits: string
  unlocks: string
  seats: string
  featured?: boolean
  cta: string
  tone: Tone
  icon: React.ElementType
}

const PLANS: Plan[] = [
  {
    id: 'free', name: 'Free', blurb: 'Enough to run one real hire end to end.',
    monthly: 0, jobCredits: '2 live jobs', unlocks: 'No candidate database', seats: '1 seat',
    cta: 'Start free', tone: 'sky', icon: Zap,
  },
  {
    id: 'growth', name: 'Growth', blurb: 'For teams hiring continuously across several roles.',
    monthly: 12000, jobCredits: '15 live jobs', unlocks: '50 profile unlocks / month', seats: '5 seats',
    featured: true, cta: 'Start 14-day trial', tone: 'emerald', icon: TrendingUp,
  },
  {
    id: 'enterprise', name: 'Enterprise', blurb: 'Unlimited hiring with governance and support.',
    monthly: null, jobCredits: 'Unlimited jobs', unlocks: 'Unlimited unlocks', seats: 'Unlimited seats',
    cta: 'Talk to us', tone: 'violet', icon: Building2,
  },
]

const MATRIX: { group: string; tone: Tone; icon: React.ElementType; rows: { label: string; hint?: string; free: string | boolean; growth: string | boolean; ent: string | boolean }[] }[] = [
  {
    group: 'Posting & discovery',
    tone: 'sky',
    icon: Search,
    rows: [
      { label: 'Live job posts', free: '2', growth: '15', ent: 'Unlimited' },
      { label: 'AI job-description generator', free: true, growth: true, ent: true },
      { label: 'Branded company page', free: true, growth: true, ent: true },
      { label: 'Featured placement in search', free: false, growth: true, ent: true },
    ],
  },
  {
    group: 'Matching & screening',
    tone: 'violet',
    icon: Sparkles,
    rows: [
      { label: 'Explainable match scores', hint: 'The full six-component breakdown is on every plan. Explainability is not a paid feature.', free: true, growth: true, ent: true },
      { label: 'Ranked applicant triage', free: true, growth: true, ent: true },
      { label: 'Candidate database search', free: false, growth: '50 unlocks / mo', ent: 'Unlimited' },
      { label: 'AI candidate recommendations', free: false, growth: true, ent: true },
    ],
  },
  {
    group: 'Pipeline',
    tone: 'teal',
    icon: GitBranch,
    rows: [
      { label: 'Full ATS pipeline + stage history', free: true, growth: true, ent: true },
      { label: 'Assessments', free: '1 template', growth: 'Unlimited', ent: 'Unlimited + coding' },
      { label: 'Interview scheduling & feedback', free: true, growth: true, ent: true },
      { label: 'Configurable pipeline stages', free: false, growth: true, ent: true },
    ],
  },
  {
    group: 'Team & governance',
    tone: 'amber',
    icon: Users2,
    rows: [
      { label: 'Team seats', free: '1', growth: '5', ent: 'Unlimited' },
      { label: 'Role-based permissions', free: false, growth: true, ent: true },
      { label: 'Audit log access', free: false, growth: 'Company-scoped', ent: 'Full export' },
      { label: 'Priority support', free: false, growth: false, ent: true },
    ],
  },
]

const FAQS = [
  ['Is the match breakdown limited on the free plan?', 'No. Every plan shows the complete six-component score breakdown for every candidate, at every rank. Explainability is the product — it is not an upsell.'],
  ['What happens when a subscription lapses?', 'You drop to Free-tier limits at the end of the period. Nothing is deleted: existing applications, pipeline history and candidate data are all retained and become visible again the moment you upgrade.'],
  ['Do unused job credits roll over?', 'Credits reset each billing period. Upgrades take effect immediately; downgrades apply from the next cycle.'],
  ['Which payment methods do you accept?', 'The payment provider is still being selected, so billing is not live in this build. The billing screen is a clearly-labelled stub rather than a fake checkout.'],
]

const inr = (n: number) => '₹' + n.toLocaleString('en-IN')

function useBillingCycle() {
  const [annual, setAnnual] = React.useState(true)
  const price = (p: Plan) => (p.monthly === null ? null : annual ? Math.round(p.monthly * 0.8) : p.monthly)
  return { annual, setAnnual, price }
}

export function Component() {
  const variant = useVariant()
  const Views = { a: PricingA, b: PricingB, c: PricingC }
  const View = Views[variant] ?? PricingA
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 transition-colors duration-500" aria-hidden />
      <div className="pt-2 pb-20">
        <View />
      </div>
    </>
  )
}
Component.displayName = 'PricingPage'

/* ══════════════════ shared ══════════════════ */

function CycleToggle({ annual, setAnnual }: { annual: boolean; setAnnual: (v: boolean) => void }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className={cn('text-sm', !annual ? 'font-medium text-ink' : 'text-ink-3')}>Monthly</span>
      <Switch checked={annual} onCheckedChange={setAnnual} aria-label="Bill annually" />
      <span className={cn('text-sm', annual ? 'font-medium text-ink' : 'text-ink-3')}>
        Annual
        <Badge tone="success" size="sm" className="ml-1.5">
          save 20%
        </Badge>
      </span>
    </div>
  )
}

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="mx-auto size-4 text-score-elite" aria-label="Included" />
  if (v === false) return <X className="mx-auto size-4 text-tone-rose" aria-label="Not included" />
  return <span className="text-sm text-ink-2">{v}</span>
}

function ComparisonTable({ dense }: { dense?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-0 text-sm">
        <caption className="sr-only">Feature comparison across plans</caption>
        <thead>
          <tr>
            <th scope="col" className="w-[40%] py-3 text-left text-base font-semibold text-ink">Feature</th>
            {PLANS.map((p) => {
              const pt = TONE_CLASS[p.tone]
              return (
                <th
                  key={p.id}
                  scope="col"
                  className={cn(
                    'w-[20%] rounded-t-lg py-3 text-center font-semibold text-ink',
                    pt.bg,
                    p.featured && cn('ring-1 ring-inset', pt.ring),
                  )}
                >
                  <span className="inline-flex flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        'grid size-7 place-items-center rounded-lg bg-gradient-to-br text-white shadow-sm',
                        pt.tile,
                      )}
                      aria-hidden
                    >
                      <p.icon className="size-3.5" />
                    </span>
                    <span className="text-base">{p.name}</span>
                    {p.featured && (
                      <Badge tone="brand" size="sm" className="font-normal normal-case">
                        Recommended
                      </Badge>
                    )}
                  </span>
                </th>
              )
            })}
          </tr>
          <tr>
            <td colSpan={4} className="p-0">
              <div className="h-px bg-line" />
            </td>
          </tr>
        </thead>
        {MATRIX.map((g, gi) => {
          const t = TONE_CLASS[g.tone]
          return (
            <tbody key={g.group}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={1}
                  className={cn(
                    'rounded-l-md text-left',
                    t.bg,
                    dense ? 'py-2' : 'py-2.5',
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={cn(
                        'grid size-5 shrink-0 place-items-center rounded-md bg-gradient-to-br text-white',
                        t.tile,
                      )}
                      aria-hidden
                    >
                      <g.icon className="size-3" />
                    </span>
                    <span className={cn('text-sm font-semibold uppercase tracking-wide', t.text)}>
                      {g.group}
                    </span>
                  </span>
                </th>
                {PLANS.map((p) => (
                  <td key={p.id} className={cn('rounded-r-md', TONE_CLASS[p.tone].bg)} aria-hidden />
                ))}
              </tr>
              {g.rows.map((r, ri) => {
                const isLast = ri === g.rows.length - 1
                return (
                  <tr key={r.label} className="group/row">
                    <th
                      scope="row"
                      className={cn(
                        'text-left text-base font-medium text-ink-2 group-hover/row:bg-hover',
                        !isLast && 'border-b border-line',
                        dense ? 'py-1.5' : 'py-2.5',
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {r.label}
                        {r.hint && (
                          <Tooltip content={r.hint}>
                            <Info className="size-3.5 shrink-0 cursor-help text-ink-3" />
                          </Tooltip>
                        )}
                      </span>
                    </th>
                    {PLANS.map((p) => (
                      <td
                        key={p.id}
                        className={cn(
                          'text-center',
                          TONE_CLASS[p.tone].bg,
                          !isLast && 'border-b border-line',
                        )}
                      >
                        <Cell v={p.id === 'free' ? r.free : p.id === 'growth' ? r.growth : r.ent} />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          )
        })}
      </table>
      <p className="mt-4 flex items-center gap-4 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <Check className="size-3.5 text-score-elite" aria-hidden /> Included
        </span>
        <span className="inline-flex items-center gap-1.5">
          <X className="size-3.5 text-tone-rose" aria-hidden /> Not included
        </span>
      </p>
    </div>
  )
}

function PlaceholderNote() {
  return (
    <p className="mx-auto mt-8 flex max-w-xl items-start gap-2 rounded-v bg-warning-bg p-3 text-xs leading-relaxed text-warning">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        <strong className="font-semibold">Prices are placeholders.</strong> Packaging is still a
        Product decision (PRD Part 47), and no payment provider is integrated — every button below
        leads to the labelled billing stub, never a real checkout.
      </span>
    </p>
  )
}

function FaqBlock() {
  return (
    <Accordion type="single" collapsible className="rounded-v border border-line bg-paper px-5">
      {FAQS.map(([q, a], i) => (
        <AccordionItem key={q} value={`q${i}`} className={i === FAQS.length - 1 ? 'border-b-0' : ''}>
          <AccordionTrigger>{q}</AccordionTrigger>
          <AccordionContent>{a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

/* ══════════════════ A · three plan cards ══════════════════ */

function PricingA() {
  const { annual, setAnnual, price } = useBillingCycle()

  return (
    // The shared Component() wrapper adds pt-2 pb-20 for every direction; the
    // ground bleeds back over it so no canvas strip shows above the footer.
    <div className="header-tint -mt-2 -mb-20 min-h-full pt-2 pb-20">
    <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="font-display tracking-tight text-4xl font-extrabold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-sm">
          Pricing that scales with your hiring
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600 font-medium">
          Explainable matching is on every plan, including Free. You pay for volume and team size —
          never for the reasoning behind a score.
        </p>
        <div className="mt-7">
          <CycleToggle annual={annual} setAnnual={setAnnual} />
        </div>
      </div>

      <Stagger className="mt-10 grid gap-5 lg:grid-cols-3" whenVisible={false}>
        {PLANS.map((p) => {
          const amount = price(p)
          const t = TONE_CLASS[p.tone]
          return (
            <StaggerItem
              key={p.id}
              className={cn(
                'relative flex flex-col rounded-v bg-paper p-v-card hover-lift',
                'border-[length:var(--v-card-border)] shadow-v-card',
                p.featured ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-line',
              )}
            >
              <span
                className={cn('absolute inset-x-0 top-0 h-1.5 rounded-t-[var(--v-radius)]', t.rail)}
                aria-hidden
              />

              {p.featured && (
                <Badge tone="brand" className="absolute -top-2.5 left-6">
                  Most teams pick this
                </Badge>
              )}

              <span
                className={cn(
                  'grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                  t.tile,
                )}
                aria-hidden
              >
                <p.icon className="size-5.5" />
              </span>

              <h2 className="mt-4 text-lg font-semibold text-ink">{p.name}</h2>
              <p className="mt-1 min-h-10 text-sm text-ink-2">{p.blurb}</p>

              <p className="mt-5 font-mono tnum text-3xl font-bold text-ink">
                {amount === null ? (
                  'Custom'
                ) : amount === 0 ? (
                  'Free'
                ) : (
                  <>
                    ₹<AnimatedNumber value={amount} />
                    <span className="text-sm font-normal text-ink-3"> /mo</span>
                  </>
                )}
              </p>
              {amount != null && amount > 0 && (
                <p className="mt-1 text-xs text-ink-3">
                  billed {annual ? 'annually' : 'monthly'} · excl. GST
                </p>
              )}

              <ul className="mt-6 space-y-2.5 text-sm">
                {[p.jobCredits, p.unlocks, p.seats].map((f) => (
                  <li key={f} className="flex gap-2 text-ink-2">
                    <Check className={cn('mt-0.5 size-4 shrink-0', t.text)} aria-hidden />
                    {f}
                  </li>
                ))}
                <li className="flex gap-2 text-ink-2">
                  <Check className={cn('mt-0.5 size-4 shrink-0', t.text)} aria-hidden />
                  Full explainable match breakdown
                </li>
              </ul>

              <Button
                className="mt-auto w-full"
                variant={p.featured ? 'primary' : 'secondary'}
                asChild
              >
                <Link to="/recruiter/billing">{p.cta}</Link>
              </Button>
            </StaggerItem>
          )
        })}
      </Stagger>

      <PlaceholderNote />

      <Reveal whenVisible className="mt-16">
        <h2 className="text-xl font-semibold text-ink">Compare every feature</h2>
        <div className="mt-4 rounded-v border border-line bg-paper p-5">
          <ComparisonTable />
        </div>
      </Reveal>
    </div>
    </div>
  )
}

/* ══════════════════ B · comparison table first ══════════════════ */

function PricingB() {
  const { annual, setAnnual, price } = useBillingCycle()

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <ScrambleText
            as="p"
            text="plans · limits · what you actually get"
            className="font-mono text-xs uppercase tracking-widest text-brand-600"
          />
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Pricing</h1>
        </div>
        <CycleToggle annual={annual} setAnnual={setAnnual} />
      </div>

      {/* numbers first — this buyer wants the table, not the sell */}
      <div className="mt-6 rounded-v border border-line bg-paper p-4 shadow-v-card">
        <ComparisonTable dense />
      </div>

      <Stagger className="mt-4 grid gap-3 sm:grid-cols-3" whenVisible={false}>
        {PLANS.map((p) => {
          const amount = price(p)
          return (
            <StaggerItem
              key={p.id}
              className={cn(
                'flex items-center justify-between gap-3 rounded-v border bg-paper p-3 shadow-v-card',
                p.featured ? 'border-brand-500' : 'border-line',
              )}
            >
              <span>
                <span className="block text-sm font-semibold text-ink">{p.name}</span>
                <span className="block font-mono tnum text-lg font-bold text-ink">
                  {amount === null ? 'Custom' : amount === 0 ? 'Free' : inr(amount) + '/mo'}
                </span>
              </span>
              <Button size="xs" variant={p.featured ? 'primary' : 'secondary'} asChild>
                <Link to="/recruiter/billing">{p.cta}</Link>
              </Button>
            </StaggerItem>
          )
        })}
      </Stagger>

      <PlaceholderNote />

      <div className="mt-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">Questions</h2>
        <FaqBlock />
      </div>
    </div>
  )
}

/* ══════════════════ C · interactive plan builder ══════════════════ */

function PricingC() {
  const [jobs, setJobs] = React.useState(8)
  const [seats, setSeats] = React.useState(3)
  const [unlocks, setUnlocks] = React.useState(20)

  // Which tier actually covers what they described.
  const recommended =
    jobs > 15 || seats > 5 || unlocks > 50 ? PLANS[2] : jobs > 2 || seats > 1 || unlocks > 0 ? PLANS[1] : PLANS[0]

  const est =
    recommended.monthly === null ? null : Math.round(recommended.monthly * 0.8)

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
          What does your hiring actually look like?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-2">
          Move the sliders. We'll point you at the smallest plan that covers it — not the largest.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Reveal className="rounded-v bg-paper p-8 shadow-lg">
          <div className="space-y-8">
            {[
              { label: 'Live job posts at once', value: jobs, set: setJobs, min: 1, max: 30, suffix: 'jobs' },
              { label: 'People on your hiring team', value: seats, set: setSeats, min: 1, max: 20, suffix: 'seats' },
              { label: 'Candidate profiles unlocked monthly', value: unlocks, set: setUnlocks, min: 0, max: 120, suffix: 'unlocks' },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <label className="font-medium text-ink">{s.label}</label>
                  <span className="font-mono tnum text-lg font-bold text-brand-600">
                    {s.value}
                    {s.value === s.max ? '+' : ''}{' '}
                    <span className="text-sm font-normal text-ink-3">{s.suffix}</span>
                  </span>
                </div>
                <Slider
                  className="mt-4"
                  min={s.min}
                  max={s.max}
                  step={1}
                  value={[s.value]}
                  onValueChange={(v) => s.set(v[0])}
                  aria-label={s.label}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <AIProvenanceChip what="matched your inputs to a plan" cannot="It only compares your numbers to published limits — nothing about you is stored or scored here." />
          </div>
        </Reveal>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Reveal className="rounded-v bg-paper p-8 shadow-xl" key={recommended.id}>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-600">
              Smallest plan that fits
            </p>
            <h2 className="font-display tracking-tight mt-2 text-3xl font-semibold text-ink">
              {recommended.name}
            </h2>
            <p className="mt-2 text-ink-2">{recommended.blurb}</p>

            <p className="mt-6 font-mono tnum text-4xl font-bold text-ink">
              {est === null ? 'Custom' : est === 0 ? 'Free' : <>₹<AnimatedNumber value={est} /></>}
              {est != null && est > 0 && (
                <span className="text-base font-normal text-ink-3"> /mo</span>
              )}
            </p>
            {est != null && est > 0 && (
              <p className="mt-1 text-xs text-ink-3">billed annually · excl. GST</p>
            )}

            <ul className="mt-6 space-y-2 text-sm">
              {[recommended.jobCredits, recommended.unlocks, recommended.seats].map((f) => (
                <li key={f} className="flex gap-2 text-ink-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-score-elite" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>

            <Button size="lg" className="mt-8 w-full" asChild>
              <Link to="/recruiter/billing">
                {recommended.cta}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </div>

      <PlaceholderNote />

      <Reveal className="mt-16">
        <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">
          Everything, side by side
        </h2>
        <div className="mt-6 rounded-v bg-paper p-8 shadow-lg">
          <ComparisonTable />
        </div>
      </Reveal>

      <Reveal className="mt-16">
        <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">Questions</h2>
        <div className="mt-6">
          <FaqBlock />
        </div>
      </Reveal>
    </div>
  )
}
