import * as React from 'react'
import { Link } from 'react-router'
import {
  CircleHelp, Search, SearchX, UserRound, Briefcase, ShieldCheck, Sparkles,
  Layers, Gauge, Link2, ArrowUpRight, ScrollText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/controls'
import { Reveal, Stagger, StaggerItem, ScrambleText } from '@/components/motion'
import {
  PageHeader, SectionHeading, StatCard, MiniStat, HBarChart, EmptyState,
  TONE_CLASS, type Tone,
} from '@/components/common'

/**
 * P9 — FAQ.
 *
 * Questions grouped Candidates / Recruiters / AI & Privacy, searchable
 * across all three. Every answer holds the same line the product does:
 * AI ranks and explains, a human decides.
 */

export interface Faq {
  /** Doubles as the deep-link anchor: /faq#c-match-score */
  id: string
  q: string
  a: string
}

export interface FaqCategory {
  id: string
  label: string
  tone: Tone
  icon: React.ElementType
  blurb: string
  items: Faq[]
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'candidates',
    label: 'Candidates',
    tone: 'indigo',
    icon: UserRound,
    blurb: 'Scores, applications, and what an employer can actually see.',
    items: [
      {
        id: 'c-match-score',
        q: 'What does my match score actually mean?',
        a: 'Every job you see carries a 0–100 match score built from six weighted components: skills overlap (35%), experience relevance (20%), location and work-mode fit (15%), education fit (10%), salary alignment (10%) and profile completeness (10%). Open the score anywhere it appears and you get the whole breakdown — which of your skills matched, which ones the role asked for that you do not list yet, and how many points each component contributed. None of that sits behind a paid plan.',
      },
      {
        id: 'c-auto-reject',
        q: 'Can a low score get my application auto-rejected?',
        a: 'No. Kairo ranks and explains; it never decides. A score orders a recruiter’s queue, it does not remove you from it — every applicant on a job stays visible to the hiring team at every stage. Only a person can move you forward or reject you, and when they do, the action is stamped with their name in your application timeline.',
      },
      {
        id: 'c-resume-parse',
        q: 'The resume parser got my job title wrong. Can I fix it?',
        a: 'Yes, and please do. After an upload every extracted field — names, titles, dates, skills, education — is shown beside the source text it came from, and anything the parser was unsure about is flagged for your review before the profile is saved. Your correction is permanent: re-uploading a resume will not silently overwrite a field you fixed by hand.',
      },
      {
        id: 'c-who-sees',
        q: 'Who can see my profile before I apply?',
        a: 'By default a recruiter searching the candidate database sees an anonymised card: skills, years of experience, city and match signals — no name, no contact details, no current employer. Your identity is revealed only when a recruiter requests an unlock and you approve it, and you can see who asked and for which role. Applying to a job is itself consent to be identified — for that job and that employer only.',
      },
      {
        id: 'c-stages',
        q: 'What happens after I hit apply?',
        a: 'Your application enters a nine-stage pipeline: Applied, Screening, Shortlisted, Assessment, Interview, Offer and Hired, with Rejected and Withdrawn as the two terminal outcomes. You see the same stage the recruiter sees, timestamped, in your application timeline — no black box between “submitted” and “we will be in touch”.',
      },
      {
        id: 'c-improve',
        q: 'How do I raise my match scores?',
        a: 'The breakdown tells you which component cost you the points, so start with the heaviest one: skills, at 35%. Adding a real skill the role explicitly asks for moves the number more than anything else you can do. After that, completeness (10%) is the cheapest win — a notice period, an expected range and a location preference remove guesswork for the recruiter. We show you the projected change before you commit to an edit.',
      },
    ],
  },
  {
    id: 'recruiters',
    label: 'Recruiters',
    tone: 'fuchsia',
    icon: Briefcase,
    blurb: 'Ranking, pipeline, unlocks, and what your team stays accountable for.',
    items: [
      {
        id: 'r-screening',
        q: 'Does the AI screen candidates out for me?',
        a: 'It ranks; you decide. Kairo sorts your applicant queue by match score and writes a short, evidence-backed reason for each position, but every applicant stays in the list and one click away. There is no auto-reject switch and there will not be one. If someone is rejected, a person on your team did it, and their name sits next to that action in the audit log.',
      },
      {
        id: 'r-pipeline',
        q: 'Can we change the pipeline stages?',
        a: 'The nine stages are the spine — Applied, Screening, Shortlisted, Assessment, Interview, Offer, Hired, plus Rejected and Withdrawn. On Growth and above you can rename them and add sub-stages inside them to match how your team really works. The underlying stage a candidate occupies stays consistent underneath, so your reporting and the status the candidate sees never drift apart.',
      },
      {
        id: 'r-unlocks',
        q: 'What does unlocking a candidate profile do, and what does it cost?',
        a: 'An unlock spends one credit from your monthly allowance and sends the candidate a consent request naming your company and the role. Until they approve, you keep seeing the anonymised profile. Declined and expired requests are not charged. Every unlock is logged per recruiter, so your admin can always see who requested what, and when.',
      },
      {
        id: 'r-jd-generator',
        q: 'Is the AI-written job description safe to publish as-is?',
        a: 'Treat it as a first draft. The generator works from the title, skills and seniority you enter, and it flags phrasing that would needlessly narrow your pool — gendered wording, a degree requirement the role does not need, an unrealistic year count. Nothing goes live until you have read it and pressed publish, and the draft is marked AI-assisted in the job’s history so your team knows where the words came from.',
      },
      {
        id: 'r-score-decisions',
        q: 'Can we use the match score as a hiring decision on its own?',
        a: 'No, and the product is built to stop you. A score is triage against a job description you wrote; it knows nothing about your team, your budget, or what happened in the interview. Wherever a score appears next to a decision, Kairo shows the six components behind it — so you can disagree with the reasoning specifically, rather than trusting or distrusting a number in general.',
      },
      {
        id: 'r-verification',
        q: 'Why can my company not post a job yet?',
        a: 'Every employer clears verification before a first role goes live: an admin confirms that your posting domain matches the company and that the registration document is valid. It usually takes under a business day. In the meantime you can write drafts, invite your team, configure the pipeline and build assessments — only publishing is gated.',
      },
    ],
  },
  {
    id: 'ai-privacy',
    label: 'AI & Privacy',
    tone: 'emerald',
    icon: ShieldCheck,
    blurb: 'What the models do, what they are never given, and what leaves the system.',
    items: [
      {
        id: 'p-never-decides',
        q: 'What does “AI never decides” actually mean here?',
        a: 'It is a product rule, not a slogan. No model in Kairo can advance, reject, hire or hide a candidate. Models rank, extract, summarise and explain; every action that changes someone’s outcome sits behind a human click that gets attributed in the audit log. If we cannot explain an output in plain language on the screen where it appears, we do not ship it.',
      },
      {
        id: 'p-attributes',
        q: 'Do you use age, gender, religion or a photo in matching?',
        a: 'None of them are collected, stored or scored. There is no photo upload on a candidate profile, and no field for date of birth, gender, marital status, religion or caste. Because the data does not exist in the system, no model can weight it and no recruiter can filter on it — a stronger guarantee than promising not to look.',
      },
      {
        id: 'p-components',
        q: 'What exactly goes into the six-component score?',
        a: 'Skills overlap 35%, experience relevance 20%, location and work-mode fit 15%, education fit 10%, salary alignment 10%, profile completeness 10%. Every component is computed from fields you can see and edit on your own profile. The weights are published, identical for every candidate on a given role, and printed on the breakdown itself rather than in a policy page nobody opens.',
      },
      {
        id: 'p-proxies',
        q: 'How do you stop proxies for the attributes you do not collect?',
        a: 'Deleting a field is not enough on its own — a graduation year can stand in for age. So scoring leans on relative experience rather than absolute dates wherever it can, and the AI monitoring dashboard watches score distributions across roles to surface any component drifting in a way the job description does not justify. Findings go to a human reviewer, and the review itself is auditable.',
      },
      {
        id: 'p-deletion',
        q: 'What happens to my data if I delete my account?',
        a: 'Your profile, resumes, parsed fields, saved searches and alerts are deleted. Applications you already submitted leave a redacted record where the employer has a legal retention obligation for their hiring file — no contact details, no resume, just that an application existed and how it ended. You can export everything as a single archive before you delete anything.',
      },
      {
        id: 'p-training',
        q: 'Is my resume used to train your models?',
        a: 'Not by default, and never in a form that identifies you. Matching runs over your data to produce your results; it does not become training material unless you turn that on yourself in Privacy settings, where you can also withdraw it later. Recruiter notes, messages and interview feedback are never used for training at all.',
      },
    ],
  },
]

/** The published weights, heaviest first. */
const SCORE_COMPONENTS: { label: string; value: number; tone: Tone }[] = [
  { label: 'Skills overlap', value: 35, tone: 'indigo' },
  { label: 'Experience', value: 20, tone: 'violet' },
  { label: 'Location & mode', value: 15, tone: 'sky' },
  { label: 'Education', value: 10, tone: 'teal' },
  { label: 'Salary fit', value: 10, tone: 'amber' },
  { label: 'Completeness', value: 10, tone: 'fuchsia' },
]

const TOTAL = FAQ_CATEGORIES.reduce((n, c) => n + c.items.length, 0)

function useFaqSearch() {
  const [query, setQuery] = React.useState('')
  const q = query.trim().toLowerCase()

  const groups = React.useMemo(() => {
    if (!q) return FAQ_CATEGORIES
    return FAQ_CATEGORIES.map((c) => ({
      ...c,
      items: c.items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(q)),
    })).filter((c) => c.items.length > 0)
  }, [q])

  const count = groups.reduce((n, c) => n + c.items.length, 0)
  return { query, setQuery, groups, count, searching: q.length > 0 }
}

type FaqSearch = ReturnType<typeof useFaqSearch>

export function Component() {
  const variant = useVariant()
  const s = useFaqSearch()
  const Views = { a: FaqA, b: FaqB, c: FaqC }
  const View = Views[variant] ?? FaqA
  return <View s={s} />
}
Component.displayName = 'FaqPage'

/* ══════════════════ shared ══════════════════ */

function SearchField({ s, className }: { s: FaqSearch; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
      <Input
        type="search"
        value={s.query}
        onChange={(e) => s.setQuery(e.target.value)}
        placeholder="Search every question — scores, unlocks, deletion…"
        aria-label="Search questions"
        className="h-11 pl-9"
      />
    </div>
  )
}

function ResultCount({ s, className }: { s: FaqSearch; className?: string }) {
  return (
    <p className={cn('text-sm text-ink-2', className)} role="status">
      <span className="font-mono tnum font-semibold text-ink">{s.count}</span>
      {s.searching
        ? ` of ${TOTAL} questions match “${s.query.trim()}”`
        : ' questions, answered in full'}
    </p>
  )
}

function NoMatches({ s }: { s: FaqSearch }) {
  return (
    <EmptyState
      icon={SearchX}
      title="Nothing matches that yet"
      description="Try a plainer word — “score”, “unlock”, “reject”, “delete”. If the answer genuinely is not here, ask us and we will write it."
      action={{ label: 'Clear search', onClick: () => s.setQuery('') }}
    />
  )
}

/** The one line the whole page is really about. */
function HumanDecidesNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2.5 rounded-v border border-line bg-tone-emerald-bg p-3.5 text-sm leading-relaxed text-ink-2',
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 size-4.5 shrink-0 text-tone-emerald" aria-hidden />
      <span>
        <strong className="font-semibold text-ink">AI ranks and explains. A human decides.</strong>{' '}
        Nothing on Kairo advances, rejects or hires anyone automatically — and every score arrives
        with the six components that produced it.
      </span>
    </p>
  )
}

function AskUs({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-v border border-line bg-paper p-4 shadow-v-card',
        className,
      )}
    >
      <p className="text-sm text-ink-2">
        <span className="font-medium text-ink">Still stuck?</span> A person answers — usually within
        a business day.
      </p>
      <Button size="sm" variant="secondary" asChild>
        <Link to="/contact">
          Ask us directly
          <ArrowUpRight className="size-4" />
        </Link>
      </Button>
    </div>
  )
}

/* ══════════════════ A · search + coloured grouped accordion ══════════════════ */

function FaqA({ s }: { s: FaqSearch }) {
  const [open, setOpen] = React.useState<string[]>([])

  // A search is an intent to read: open everything it found.
  React.useEffect(() => {
    if (s.searching) setOpen(s.groups.flatMap((g) => g.items.map((i) => i.id)))
  }, [s.searching, s.groups])

  // Deep link — /faq#p-attributes opens and scrolls to that one answer.
  React.useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return
    setOpen((o) => (o.includes(id) ? o : [...o, id]))
    const raf = window.requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({ block: 'center' }),
    )
    return () => window.cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <PageHeader
        icon={CircleHelp}
        tone="indigo"
        eyebrow="Help centre"
        title="Questions, answered properly"
        description="Scoring, pipelines and privacy — explained in the detail we would give a colleague. No answer here is shorter than the truth."
        actions={
          <Button size="sm" variant="secondary" asChild>
            <Link to="/contact">Ask a new question</Link>
          </Button>
        }
      />

      <Stagger className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" whenVisible={false}>
        <StaggerItem>
          <StatCard
            tone="indigo"
            icon={Sparkles}
            label="Score components"
            value={6}
            caption="all six shown, on every plan"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            tone="amber"
            icon={Gauge}
            label="Skills weight"
            value="35%"
            progress={35}
            caption="the heaviest single component"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            tone="fuchsia"
            icon={Layers}
            label="Pipeline stages"
            value={9}
            caption="candidate and recruiter see the same one"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            tone="emerald"
            icon={ShieldCheck}
            label="Sensitive fields stored"
            value={0}
            badge={{ text: 'by design', direction: 'flat' }}
            caption="no age, gender, religion or photo"
          />
        </StaggerItem>
      </Stagger>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div>
          <SearchField s={s} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {FAQ_CATEGORIES.map((c) => {
              const t = TONE_CLASS[c.tone]
              return (
                <a
                  key={c.id}
                  href={`#cat-${c.id}`}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-v hover:opacity-80',
                    t.bg,
                    t.text,
                  )}
                >
                  <c.icon className="size-3.5" aria-hidden />
                  {c.label}
                  <span className="font-mono tnum opacity-70">{c.items.length}</span>
                </a>
              )
            })}
          </div>
          <ResultCount s={s} className="mt-3" />
        </div>
        <HumanDecidesNote />
      </div>

      {s.groups.length === 0 ? (
        <div className="mt-6 rounded-v border border-line bg-paper shadow-v-card">
          <NoMatches s={s} />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {s.groups.map((c) => {
            const t = TONE_CLASS[c.tone]
            return (
              <Reveal
                key={c.id}
                as="section"
                id={`cat-${c.id}`}
                className="relative scroll-mt-24 overflow-hidden rounded-v border border-line bg-paper shadow-v-card"
              >
                <span className={cn('absolute inset-x-0 top-0 h-1', t.rail)} aria-hidden />

                <div className="flex flex-wrap items-start gap-3.5 px-5 pb-4 pt-6">
                  <span
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                      t.tile,
                    )}
                    aria-hidden
                  >
                    <c.icon className="size-5.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className={cn('text-lg font-semibold', t.text)}>{c.label}</h2>
                    <p className="mt-0.5 text-sm text-ink-2">{c.blurb}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 font-mono tnum text-xs font-semibold',
                      t.bg,
                      t.text,
                    )}
                  >
                    {c.items.length}
                  </span>
                </div>

                <Accordion
                  type="multiple"
                  value={open}
                  onValueChange={setOpen}
                  className="border-t border-line px-5"
                >
                  {c.items.map((item, i) => (
                    <AccordionItem
                      key={item.id}
                      id={item.id}
                      value={item.id}
                      className={cn('scroll-mt-24', i === c.items.length - 1 && 'border-b-0')}
                    >
                      <AccordionTrigger>{item.q}</AccordionTrigger>
                      <AccordionContent>
                        <p className="leading-relaxed">{item.a}</p>
                        <a
                          href={`#${item.id}`}
                          className={cn(
                            'mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline',
                            t.text,
                          )}
                        >
                          <Link2 className="size-3.5" aria-hidden />
                          Link to this answer
                        </a>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Reveal>
            )
          })}
        </div>
      )}

      <Reveal className="mt-5 rounded-v border border-line bg-paper p-5 shadow-v-card">
        <SectionHeading icon={Sparkles} tone="indigo" title="How a match score is built" />
        <p className="mb-4 max-w-2xl text-sm text-ink-2">
          The published weights, identical for every candidate on a given role. They are printed on
          the breakdown itself, not buried in a policy page.
        </p>
        <HBarChart data={SCORE_COMPONENTS} suffix="%" labelWidth="w-32" />
      </Reveal>

      <AskUs className="mt-5" />
    </div>
  )
}

/* ══════════════════ B · two-pane, everything expanded ══════════════════ */

function FaqB({ s }: { s: FaqSearch }) {
  const [active, setActive] = React.useState<string | null>(null)
  const shown = s.groups.filter((c) => !active || c.id === active)

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
        <div>
          <ScrambleText
            as="p"
            text="candidates · recruiters · ai & privacy"
            className="font-mono text-xs uppercase tracking-widest text-brand-600"
          />
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">FAQ</h1>
        </div>
        <div className="min-w-64 flex-1 sm:max-w-sm">
          <SearchField s={s} />
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Question categories" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-pressed={active === null}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-v-control px-2.5 py-1.5 text-left text-sm transition-v',
                  active === null
                    ? 'bg-brand-50 font-medium text-brand-700'
                    : 'text-ink-2 hover:bg-hover',
                )}
              >
                Everything
                <span className="font-mono tnum text-xs text-ink-3">{s.count}</span>
              </button>
            </li>
            {s.groups.map((c) => {
              const t = TONE_CLASS[c.tone]
              const on = active === c.id
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActive(on ? null : c.id)}
                    aria-pressed={on}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-v-control px-2.5 py-1.5 text-left text-sm transition-v',
                      on ? cn(t.bg, t.text, 'font-medium') : 'text-ink-2 hover:bg-hover',
                    )}
                  >
                    <span className={cn('size-2 shrink-0 rounded-full', t.fill)} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{c.label}</span>
                    <span className="font-mono tnum text-xs opacity-70">{c.items.length}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 space-y-2">
            <MiniStat tone="indigo" icon={Sparkles} label="Score components" value={6} />
            <MiniStat tone="fuchsia" icon={Layers} label="Pipeline stages" value={9} />
            <MiniStat tone="emerald" icon={ShieldCheck} label="Sensitive fields" value={0} />
          </div>

          <ResultCount s={s} className="mt-4 text-xs" />
        </nav>

        <div className="min-w-0">
          <HumanDecidesNote className="mb-4" />

          {shown.length === 0 ? (
            <div className="rounded-v border border-line bg-paper">
              <NoMatches s={s} />
            </div>
          ) : (
            <div className="space-y-4">
              {shown.map((c) => {
                const t = TONE_CLASS[c.tone]
                return (
                  <section
                    key={c.id}
                    id={`cat-${c.id}`}
                    className="scroll-mt-24 rounded-v border border-line bg-paper p-4 shadow-v-card"
                  >
                    <div className="mb-3 flex items-center gap-2 border-b border-line pb-2">
                      <span
                        className={cn(
                          'grid size-6 shrink-0 place-items-center rounded-md',
                          t.bg,
                          t.text,
                        )}
                        aria-hidden
                      >
                        <c.icon className="size-3.5" />
                      </span>
                      <h2 className={cn('text-xs font-semibold uppercase tracking-wide', t.text)}>
                        {c.label}
                      </h2>
                      <span className="ml-auto font-mono tnum text-xs text-ink-3">
                        {c.items.length}
                      </span>
                    </div>

                    <dl className="divide-y divide-line">
                      {c.items.map((item) => (
                        <div
                          key={item.id}
                          id={item.id}
                          className="scroll-mt-24 py-2.5 first:pt-0 last:pb-0"
                        >
                          <dt className="flex items-start gap-2 text-sm font-semibold text-ink">
                            <span
                              className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', t.fill)}
                              aria-hidden
                            />
                            {item.q}
                          </dt>
                          <dd className="mt-1 pl-3.5 text-sm leading-relaxed text-ink-2">
                            {item.a}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )
              })}

              <section className="rounded-v border border-line bg-paper p-4 shadow-v-card">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">
                  Score weights
                </h2>
                <HBarChart data={SCORE_COMPONENTS} suffix="%" labelWidth="w-32" />
              </section>

              <AskUs />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════ C · long scroll with a sticky contents rail ══════════════════ */

function FaqC({ s }: { s: FaqSearch }) {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
          Everything you might reasonably ask
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          {TOTAL} questions about scoring, hiring pipelines and what we refuse to collect — answered
          at length, because short answers here are usually evasions.
        </p>
        <div className="mx-auto mt-8 max-w-xl">
          <SearchField s={s} />
        </div>
        <ResultCount s={s} className="mt-3" />
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[230px_1fr]">
        <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink-3">
            <ScrollText className="size-3.5" aria-hidden />
            Contents
          </p>
          <ul className="space-y-4">
            {s.groups.map((c) => {
              const t = TONE_CLASS[c.tone]
              return (
                <li key={c.id}>
                  <a
                    href={`#cat-${c.id}`}
                    className={cn('flex items-center gap-2 text-sm font-semibold', t.text)}
                  >
                    <span className={cn('size-2 rounded-full', t.fill)} aria-hidden />
                    {c.label}
                  </a>
                  <ul className="mt-1.5 space-y-1.5 border-l border-line pl-3">
                    {c.items.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="block text-xs leading-snug text-ink-3 transition-v hover:text-ink"
                        >
                          {item.q}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="min-w-0">
          {s.groups.length === 0 ? (
            <div className="rounded-v bg-paper shadow-lg">
              <NoMatches s={s} />
            </div>
          ) : (
            <div className="space-y-16">
              {s.groups.map((c) => {
                const t = TONE_CLASS[c.tone]
                return (
                  <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-24">
                    <Reveal className="flex items-center gap-3">
                      <span
                        className={cn(
                          'grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md',
                          t.tile,
                        )}
                        aria-hidden
                      >
                        <c.icon className="size-6" />
                      </span>
                      <div>
                        <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">
                          {c.label}
                        </h2>
                        <p className="text-sm text-ink-2">{c.blurb}</p>
                      </div>
                    </Reveal>

                    <div className="mt-8 space-y-10">
                      {c.items.map((item) => (
                        <Reveal key={item.id} as="article" id={item.id} className="scroll-mt-24">
                          <h3 className="font-display tracking-tight text-2xl font-semibold text-ink">
                            {item.q}
                          </h3>
                          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-2">
                            {item.a}
                          </p>
                          <a
                            href={`#${item.id}`}
                            className={cn(
                              'mt-3 inline-flex items-center gap-1 text-sm font-medium hover:underline',
                              t.text,
                            )}
                          >
                            <Link2 className="size-3.5" aria-hidden />
                            Link to this answer
                          </a>
                        </Reveal>
                      ))}
                    </div>
                  </section>
                )
              })}

              <Reveal className="rounded-v bg-paper p-8 shadow-lg">
                <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">
                  The six weights, in full
                </h2>
                <p className="mb-6 mt-2 max-w-xl text-ink-2">
                  Published, identical for every candidate on a role, and shown on the breakdown
                  itself.
                </p>
                <HBarChart data={SCORE_COMPONENTS} suffix="%" labelWidth="w-36" />
                <HumanDecidesNote className="mt-6" />
              </Reveal>

              <AskUs />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
