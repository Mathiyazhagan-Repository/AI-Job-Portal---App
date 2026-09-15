import * as React from 'react'
import { useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import {
  FileSearch, MessageSquareText, Check, ArrowRight, Sparkles, AlertTriangle,
  Timer, Users2, ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SHELL } from './shell'
import { Button } from '@/components/ui/button'
import { RadialGauge, TONE_CLASS, type Tone } from '@/components/common'
import { atsReports } from '@/data/console'

/**
 * "What you get as a candidate" — a two-track feature explorer.
 *
 * Same shape as the pattern this was modelled on (a track switch, a list of
 * sub-features on the left, a live preview on the right) but built from our
 * own vocabulary and, more importantly, from features that actually exist in
 * this build: the right-hand panel for the ATS track reads the real
 * `atsReports` fixture the Resumes page uses, so the preview cannot drift away
 * from the product.
 */

type TrackId = 'ats' | 'interview'

interface Feature {
  id: string
  title: string
  blurb: string
}

const TRACKS: {
  id: TrackId
  tab: string
  title: string
  intro: string
  tone: Tone
  icon: React.ElementType
  to: string
  cta: string
  features: Feature[]
}[] = [
  {
    id: 'ats',
    tab: 'Resume ATS check',
    title: 'See your resume the way a parser does',
    intro:
      'Upload a file and get the score an applicant tracking system would give it — before you send it anywhere.',
    tone: 'indigo',
    icon: FileSearch,
    to: '/candidate/resumes',
    cta: 'Check a resume',
    features: [
      { id: 'parse', title: 'Machine-readable check', blurb: 'Find the text a parser cannot reach — tables, columns, words baked into images' },
      { id: 'keywords', title: 'Keyword coverage', blurb: 'Compare your file against a specific job and see exactly what is missing' },
      { id: 'verbs', title: 'Action verbs and outcomes', blurb: 'Spot bullets that describe duties instead of results' },
      { id: 'sections', title: 'Section headings', blurb: 'Confirm the five headings most parsers key off are all present' },
    ],
  },
  {
    id: 'interview',
    tab: 'Interview prep',
    title: 'Walk in knowing how the hour will run',
    intro:
      'Every scheduled interview arrives with its agenda, who you will meet, and what to do before the call.',
    tone: 'fuchsia',
    icon: MessageSquareText,
    to: '/candidate/interviews',
    cta: 'See your interviews',
    features: [
      { id: 'agenda', title: 'A minute-by-minute agenda', blurb: 'What each part of the conversation is for, and how long it runs' },
      { id: 'panel', title: 'Who you will meet', blurb: 'Names and roles ahead of time — including who would be your manager' },
      { id: 'prep', title: 'A prep checklist', blurb: 'The four things worth doing before the call, not twenty' },
      { id: 'after', title: 'Feedback either way', blurb: 'Structured feedback after every round, whichever way it goes' },
    ],
  },
]

export function PremiumFeatures() {
  const [track, setTrack] = React.useState<TrackId>('ats')
  const [feature, setFeature] = React.useState<Record<TrackId, string>>({
    ats: 'parse',
    interview: 'agenda',
  })
  // Once someone picks a feature themselves, the auto-advance stops for good.
  // Yanking the panel out from under a reader who just chose something is the
  // one thing an auto-rotating list must not do.
  const [taken, setTaken] = React.useState(false)
  const reduced = useReducedMotion() ?? false

  const t = TRACKS.find((x) => x.id === track)!
  const active = feature[track]

  React.useEffect(() => {
    if (taken || reduced) return
    const id = window.setInterval(() => {
      setFeature((s) => {
        const list = TRACKS.find((x) => x.id === track)!.features
        const i = list.findIndex((f) => f.id === s[track])
        return { ...s, [track]: list[(i + 1) % list.length].id }
      })
    }, 1500)
    return () => clearInterval(id)
  }, [track, taken, reduced])

  const pick = (id: string) => {
    setTaken(true)
    setFeature((s) => ({ ...s, [track]: id }))
  }

  return (
    <section className="border-y border-line band-indigo">
      <div className={cn(SHELL, 'py-16')}>
        <p className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tone-indigo-vivid px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
            <Sparkles className="size-3.5" aria-hidden />
            Built for the person applying
          </span>
        </p>
        <h2 className="mt-4 text-center font-display text-4xl font-semibold tracking-tight text-gradient-indigo sm:text-5xl">
          What you get as a candidate
        </h2>
        <p className="mt-3 text-center text-ink-2 lg:whitespace-nowrap">
          How a machine reads your resume, and what actually happens in the room.
        </p>

        {/* ── track switch ── */}
        <div
          role="tablist"
          aria-label="Candidate features"
          className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-1 rounded-full border border-line bg-paper p-1 shadow-v-card"
        >
          {TRACKS.map((x) => {
            const on = x.id === track
            return (
              <button
                key={x.id}
                role="tab"
                aria-selected={on}
                aria-controls={`panel-${x.id}`}
                id={`tab-${x.id}`}
                onClick={() => setTrack(x.id)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-v',
                  on
                    ? cn(TONE_CLASS[x.tone].fill, 'text-white shadow-sm')
                    : 'text-ink-2 hover:bg-hover hover:text-ink',
                )}
              >
                <x.icon className="size-4" aria-hidden />
                {x.tab}
              </button>
            )
          })}
        </div>

        <div
          id={`panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${t.id}`}
          className="mt-10 grid items-stretch gap-8 lg:grid-cols-12 lg:gap-12"
        >
          {/* ── the rail ── */}
          <div className="flex flex-col lg:col-span-5">
            <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">
              {t.title}
            </h3>
            <p className="mt-2 leading-relaxed text-ink-2">{t.intro}</p>

            <ul className="mt-6 mb-6 space-y-1">
              {t.features.map((f) => {
                const on = f.id === active
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => pick(f.id)}
                      className={cn(
                        'relative w-full overflow-hidden rounded-v px-4 py-3 text-left transition-v',
                        on ? TONE_CLASS[t.tone].bg : 'hover:bg-hover',
                      )}
                    >
                      <span
                        className={cn(
                          'block font-semibold',
                          on ? TONE_CLASS[t.tone].text : 'text-ink',
                        )}
                      >
                        {f.title}
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-ink-2">
                        {f.blurb}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <Button className="mt-auto self-start pt-0" asChild>
              <Link to={t.to}>
                {t.cta}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          {/* ── the preview ── */}
          <div className="flex flex-col lg:col-span-7 [&>*]:flex-1">
            {track === 'ats' ? <AtsPreview feature={active} /> : <InterviewPreview feature={active} />}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════ previews ══════════════════ */

function PanelShell({
  icon: Icon,
  tone,
  title,
  blurb,
  children,
}: {
  icon: React.ElementType
  tone: Tone
  title: string
  blurb: string
  children: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-v border border-line bg-paper shadow-v-card">
      <span className={cn('absolute inset-x-0 top-0 h-1.5', TONE_CLASS[tone].rail)} aria-hidden />
      <div className={cn('border-b border-line p-5 pt-6', TONE_CLASS[tone].bg)}>
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white shadow-sm',
              TONE_CLASS[tone].tile,
            )}
            aria-hidden
          >
            <Icon className="size-4.5" />
          </span>
          <h4 className={cn('font-semibold', TONE_CLASS[tone].text)}>{title}</h4>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{blurb}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

/** Reads the same fixture the Resumes page scores, so the two cannot diverge. */
function AtsPreview({ feature }: { feature: string }) {
  const report = atsReports.r1
  const issues = report.checks.filter((c) => c.severity !== 'pass')
  const missing = report.keywords.filter((k) => k.inJob && !k.inResume)
  const present = report.keywords.filter((k) => k.inJob && k.inResume)

  if (feature === 'keywords') {
    const keywordCheck = report.checks.find((c) => c.id === 'keywords')!
    return (
      <PanelShell
        icon={Sparkles}
        tone="indigo"
        title="Keyword coverage"
        blurb={`Measured against one job you pick — here, Senior React Developer. ${present.length} of ${present.length + missing.length} required terms appear in the file.`}
      >
        <div className="flex h-2 overflow-hidden rounded-full bg-subtle">
          <span className="bg-tone-emerald-vivid" style={{ width: `${(present.length / (present.length + missing.length)) * 100}%` }} />
          <span className="flex-1 bg-tone-rose-vivid" />
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-tone-rose">
              Missing — add these {missing.length}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {missing.map((k) => (
                <li key={k.term} className="rounded-full bg-[var(--color-tone-rose-bg)] px-2.5 py-1 text-xs font-medium text-tone-rose">
                  {k.term}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-tone-emerald">
              Already covered — {present.length}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {present.map((k) => (
                <li key={k.term} className="rounded-full bg-[var(--color-tone-emerald-bg)] px-2.5 py-1 text-xs font-medium text-tone-emerald">
                  {k.term} ×{k.count}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-6 border-t border-line pt-4">
          <div>
            <p className="font-mono tnum text-lg font-semibold text-ink">{keywordCheck.weight}%</p>
            <p className="text-xs text-ink-3">of your parser score</p>
          </div>
          <div>
            <p className="font-mono tnum text-lg font-semibold text-ink">
              {present.length + missing.length}
            </p>
            <p className="text-xs text-ink-3">target-job terms checked</p>
          </div>
        </div>
        <div className="mt-4 rounded-v-control border border-line bg-subtle/60 p-3.5">
          <p className="text-sm leading-relaxed text-ink-2">
            <span className="font-medium text-ink">The match is literal.</span> "Built dashboards"
            does not cover "GraphQL" — the exact word has to appear somewhere in the file for the
            parser to credit it.
          </p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-3">
          Only add a term if it is genuinely true of your experience. Keyword-stuffing is obvious
          to the person who reads the file after the filter.
        </p>
      </PanelShell>
    )
  }

  if (feature === 'verbs' || feature === 'sections') {
    const shown = issues.filter((c) =>
      feature === 'verbs' ? c.category === 'Content' : c.category !== 'Keywords',
    )
    const thisCheck = report.checks.find((c) => c.id === feature)!
    return (
      <PanelShell
        icon={AlertTriangle}
        tone="amber"
        title={feature === 'verbs' ? 'Action verbs and outcomes' : 'Section headings'}
        blurb="Every issue is ranked by how much it is costing the score, so you fix the expensive ones first."
      >
        <ul className="space-y-3">
          {(shown.length ? shown : issues).map((c) => (
            <li key={c.id} className="rounded-v-control border border-line p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink">{c.label}</p>
                <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] text-ink-2">
                  {c.category}
                </span>
                <span className="ml-auto font-mono tnum text-xs font-semibold text-tone-rose">
                  −{Math.round((100 - c.score) * (c.weight / 100))} pts
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{c.detail}</p>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center gap-6 border-t border-line pt-4">
          <div>
            <p className="font-mono tnum text-lg font-semibold text-ink">{thisCheck.weight}%</p>
            <p className="text-xs text-ink-3">of your parser score</p>
          </div>
          <div>
            <p className="font-mono tnum text-lg font-semibold text-ink">{thisCheck.score}/100</p>
            <p className="text-xs text-ink-3">this resume's score here</p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-3">
          {feature === 'verbs'
            ? '"Responsible for" describes the job, not what you did with it. "Owned", "cut", "shipped" and "grew" all pair naturally with a number — and a number is what gets credited.'
            : 'Parsers key off five plain headings — Summary, Experience, Education, Skills, Projects. A creative rename like "Where I\'ve Been" can quietly drop a whole section from the score.'}
        </p>
      </PanelShell>
    )
  }

  return (
    <PanelShell
      icon={FileSearch}
      tone="indigo"
      title="Machine-readable check"
      blurb="The first thing that happens to your file is a parser trying to read it. This is what it got."
    >
      <div className="flex flex-wrap items-center gap-6">
        <RadialGauge value={report.overall} tone="amber" size={128} label={`${report.overall}`} sublabel="of 100" />
        <dl className="grid flex-1 gap-3 sm:grid-cols-3">
          {[
            { k: 'Words read', v: String(report.wordCount) },
            { k: 'Pages', v: String(report.pages) },
            { k: 'Reading level', v: report.readingLevel.split('·')[0].trim() },
          ].map((x) => (
            <div key={x.k}>
              <dd className="font-mono tnum text-lg font-semibold text-ink">{x.v}</dd>
              <dt className="text-xs text-ink-3">{x.k}</dt>
            </div>
          ))}
        </dl>
      </div>
      <ul className="mt-5 space-y-2 border-t border-line pt-4">
        {report.checks.filter((c) => c.severity === 'pass').slice(0, 3).map((c) => (
          <li key={c.id} className="flex items-start gap-2.5 text-sm text-ink-2">
            <Check className="mt-0.5 size-4 shrink-0 text-tone-emerald" aria-hidden />
            <span>
              <span className="font-medium text-ink">{c.label}. </span>
              {c.detail}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs leading-relaxed text-ink-3">
        This check runs before anything else does — a parser that cannot read your file never
        gets to the experience inside it, no matter how strong that experience is.
      </p>
    </PanelShell>
  )
}

const AGENDA = [
  { min: 5, title: 'Intros', detail: 'Who is in the room and how the hour will run.', tone: 'sky' as Tone },
  { min: 25, title: 'Work you have shipped', detail: 'One project in depth — decisions and trade-offs.', tone: 'indigo' as Tone },
  { min: 20, title: 'Practical problem', detail: 'A real bug from their codebase. No whiteboard puzzles.', tone: 'violet' as Tone },
  { min: 10, title: 'Your questions', detail: 'Team, roadmap, how success is measured.', tone: 'emerald' as Tone },
]

const PREP = [
  'Re-read the job description — the hard requirements are what they will probe',
  'Pick one project you can talk about for 20 minutes without slides',
  'Test your camera and mic on the meeting link',
  'Write down two questions about the team',
]

const FEEDBACK_STEPS = [
  'Each interviewer submits their own written feedback — before seeing anyone else\'s',
  'A recommendation is required, not just a 1–5 rating, so a number is never the whole story',
  'Your stage moves within 2 business days either way — silence is never the answer',
]

function InterviewPreview({ feature }: { feature: string }) {
  if (feature === 'panel') {
    return (
      <PanelShell
        icon={Users2}
        tone="fuchsia"
        title="Who you will meet"
        blurb="Names and roles before the call, so you are not meeting three strangers cold."
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            { n: 'Meera Krishnan', r: 'Engineering Manager · your future manager', t: 'violet' as Tone },
            { n: 'Sanjay Bose', r: 'Staff Engineer · leads the technical part', t: 'teal' as Tone },
          ].map((p) => (
            <li key={p.n} className={cn('rounded-v border border-line p-3.5', TONE_CLASS[p.t].bg)}>
              <p className="font-semibold text-ink">{p.n}</p>
              <p className="mt-0.5 text-xs text-ink-2">{p.r}</p>
            </li>
          ))}
        </ul>
        <ul className="mt-3 grid gap-2 text-xs text-ink-3 sm:grid-cols-2">
          <li className="rounded-v-control border border-line p-2.5 leading-relaxed">
            <span className="font-semibold text-ink">With Meera —</span> team, expectations, what
            success looks like in the first 90 days
          </li>
          <li className="rounded-v-control border border-line p-2.5 leading-relaxed">
            <span className="font-semibold text-ink">With Sanjay —</span> a real bug from their
            codebase, no whiteboard puzzles
          </li>
        </ul>
        <div className="mt-4 flex items-start gap-3 rounded-v-control border border-line bg-subtle/60 p-3.5">
          <Timer className="mt-0.5 size-4 shrink-0 text-tone-fuchsia" aria-hidden />
          <p className="text-sm leading-relaxed text-ink-2">
            Both conversations run back-to-back in the same 60-minute block — see the full
            breakdown under "How the 60 minutes are spent".
          </p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-3">
          If a third person joins — often a peer engineer — their name and role appear here at
          least a day before the call. Nobody new shows up unannounced.
        </p>
      </PanelShell>
    )
  }

  if (feature === 'prep') {
    return (
      <PanelShell
        icon={ListChecks}
        tone="emerald"
        title="Before the call"
        blurb="Four things worth doing, not twenty. Everything here is specific to this role."
      >
        <ul className="grid gap-2">
          {PREP.map((p) => (
            <li key={p} className="flex items-start gap-2.5 rounded-v-control bg-[var(--color-tone-emerald-bg)] p-3">
              <Check className="mt-0.5 size-4 shrink-0 text-tone-emerald" aria-hidden />
              <span className="text-sm leading-relaxed text-ink-2">{p}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-ink-3">
          None of this is generic. Every item above is pulled from the job description and the
          panel you are about to meet, not a one-size-fits-all interview guide.
        </p>
      </PanelShell>
    )
  }

  if (feature === 'after') {
    return (
      <PanelShell
        icon={ListChecks}
        tone="emerald"
        title="Feedback either way"
        blurb="The interviewer submits structured feedback afterwards, and your stage moves either way."
      >
        <ul className="grid gap-2">
          {FEEDBACK_STEPS.map((p) => (
            <li key={p} className="flex items-start gap-2.5 rounded-v-control bg-[var(--color-tone-emerald-bg)] p-3">
              <Check className="mt-0.5 size-4 shrink-0 text-tone-emerald" aria-hidden />
              <span className="text-sm leading-relaxed text-ink-2">{p}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
            What "recommendation" means
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Strong yes', 'Yes', 'No', 'Strong no'].map((r) => (
              <span key={r} className="rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-ink-2">
                {r}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-3">
          A rejection without a reason is the thing this whole product exists to get rid of — a
          real reason lands in your Applications tracker, not just a status change.
        </p>
      </PanelShell>
    )
  }

  return (
    <PanelShell
      icon={Timer}
      tone="fuchsia"
      title="How the 60 minutes are spent"
      blurb="Published before the call, so you can prepare for the parts that actually carry weight."
    >
      <ol className="relative space-y-4 pl-6">
        <span className="absolute bottom-2 left-[7px] top-2 w-px bg-line" aria-hidden />
        {AGENDA.map((a) => (
          <li key={a.title} className="relative">
            <span
              className={cn('absolute -left-6 top-1 size-3.5 rounded-full ring-4 ring-paper', TONE_CLASS[a.tone].fill)}
              aria-hidden
            />
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-semibold text-ink">{a.title}</p>
              <span className={cn('rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold', TONE_CLASS[a.tone].bg, TONE_CLASS[a.tone].text)}>
                {a.min} min
              </span>
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-ink-2">{a.detail}</p>
          </li>
        ))}
      </ol>
    </PanelShell>
  )
}
