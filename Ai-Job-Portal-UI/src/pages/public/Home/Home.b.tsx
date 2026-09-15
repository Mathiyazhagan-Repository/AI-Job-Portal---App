import { Link } from 'react-router'
import { ArrowRight, Check, Keyboard, Table2, Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JobCard } from '@/features/jobs/JobCard'
import { Kbd } from '@/components/common'
import { MatchPrism } from '@/components/brand'
import { DEMO_BREAKDOWN, CompanyStrip, HeroSearch, featuredJobs, AUDIENCE } from './parts'
import { jobs } from '@/data/mock'
import {
  Reveal, Stagger, StaggerItem, ScrambleText, TypeLine, Caret,
} from '@/components/motion'

/**
 * DIRECTION B · Command Console
 * Product-first SaaS page: split hero with a real UI crop, logo wall,
 * alternating feature rows built from actual product screens. No
 * illustration, no kinetic type, no gradient. Static, dense, factual —
 * for a buyer who wants to see the thing, not be sold to.
 */
export default function HomeB() {
  return (
    <>
      {/* ── Split hero ───────────────────────────────────── */}
      <section className="border-b border-line bg-paper">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-start">
          <div className="lg:pt-6">
            <ScrambleText
              as="p"
              text="Recruitment platform · ATS + job board + explainable AI"
              className="font-mono text-xs font-medium uppercase tracking-widest text-brand-600"
              duration={700}
            />
            <Reveal delay={0.08}>
              <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight text-ink">
                A ranked shortlist you can defend in a meeting.
              </h1>
              <p className="mt-4 text-ink-2 leading-relaxed">
                Kairo scores every candidate against every job across six weighted components and
                shows all six. No black-box percentage, no silent auto-rejection.
              </p>
            </Reveal>

            <Stagger as="ul" className="mt-6 space-y-2">
              {AUDIENCE.recruiter.points.map((p, i) => (
                <StaggerItem as="li" key={i} className="flex gap-2 text-sm text-ink-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                  {p.text}
                </StaggerItem>
              ))}
            </Stagger>

            <div className="mt-7 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/recruiter/jobs/j1/applicants">
                  Open applicant triage
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/jobs">Browse the job board</Link>
              </Button>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-3">
              <Keyboard className="size-3.5" aria-hidden />
              Everything is reachable from <Kbd>⌘</Kbd>
              <Kbd>K</Kbd> — try it now
            </p>

            {/* Proof strip — balances the column height against the product
                crop and puts the numbers where a buyer looks for them. */}
            <Stagger className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-v border border-line bg-line">
              {[
                ['1.4 days', 'median time to first shortlist'],
                ['6 of 6', 'score components always visible'],
                ['0', 'candidates auto-rejected by AI'],
              ].map(([stat, label], i) => (
                <StaggerItem key={label} className="bg-paper px-3 py-3">
                  <dt className="font-mono tnum text-lg font-bold text-ink">{stat}</dt>
                  <dd className="mt-0.5 text-[11px] leading-snug text-ink-3">{label}</dd>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          {/* real product crop, not a mockup */}
          <div className="rounded-v border border-line bg-canvas p-3 shadow-v-card">
            <div className="mb-2 flex items-center gap-2 border-b border-line pb-2">
              <span className="flex gap-1">
                <i className="size-2 rounded-full bg-line-strong" />
                <i className="size-2 rounded-full bg-line-strong" />
                <i className="size-2 rounded-full bg-line-strong" />
              </span>
              <span className="font-mono text-[11px] text-ink-3">
                <TypeLine text="/recruiter/jobs/j1/applicants" delay={260} speed={22} />
                <Caret className="ml-0.5 h-[0.9em] w-[0.45em]" />
              </span>
            </div>
            <Stagger className="divide-y divide-line rounded-md border border-line bg-paper">
              {jobs.slice(0, 5).map((j) => (
                <StaggerItem key={j.id}>
                  <JobCard job={j} variant="b" />
                </StaggerItem>
              ))}
            </Stagger>
            <div className="mt-3 rounded-md border border-line bg-paper p-3">
              <MatchPrism
                score={87}
                breakdown={DEMO_BREAKDOWN}
                matchedSkills={['React', 'TypeScript', 'Node.js', 'AWS']}
                missingSkills={['GraphQL', 'Kubernetes']}
                layout="inline"
                defaultExpanded
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Logo wall ────────────────────────────────────── */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Hiring on Kairo
          </p>
          <CompanyStrip />
        </div>
      </section>

      {/* ── Feature rows ─────────────────────────────────── */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <FeatureRow
          icon={Gauge}
          eyebrow="Explainable matching"
          title="Six weighted components. All six visible."
          body="Skills 35%, experience 20%, location 15%, education 10%, title relevance 10%, preferences 10%. Every candidate card opens into the full table — the same detail for the #1 candidate and the #200."
          bullets={[
            'Hard requirements exclude rather than silently down-rank',
            'Matched and missing skills listed explicitly, not as a percentage',
            'Protected attributes never reach the scoring model',
          ]}
          to="/recruiter/jobs/j1/applicants"
          linkLabel="See a live screening card"
        >
          <MatchPrism
            score={87}
            breakdown={DEMO_BREAKDOWN}
            matchedSkills={['React', 'TypeScript', 'Node.js', 'AWS']}
            missingSkills={['GraphQL', 'Kubernetes']}
            defaultExpanded
          />
        </FeatureRow>

        <FeatureRow
          reverse
          icon={Keyboard}
          eyebrow="Throughput"
          title="Triage 200 applicants without touching the mouse."
          body="J and K move. S shortlists. R rejects with a required reason. E opens email. The screening card is docked, so nothing navigates and nothing reloads."
          bullets={[
            'Rejection always requires a reason — it becomes the audit entry',
            'Bulk stage moves with an aria-live confirmation',
            'Every drag action has a keyboard equivalent',
          ]}
          to="/recruiter/jobs/j1/applicants"
          linkLabel="Open the triage screen"
        >
          <div className="space-y-2">
            {[
              ['J / K', 'Move between candidates'],
              ['S', 'Shortlist'],
              ['R', 'Reject — reason required'],
              ['E', 'Email candidate'],
              ['⌘ K', 'Command palette'],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center gap-3 text-sm">
                <Kbd className="w-14 justify-center">{key}</Kbd>
                <span className="text-ink-2">{label}</span>
              </div>
            ))}
          </div>
        </FeatureRow>

        <FeatureRow
          icon={Table2}
          eyebrow="Full ATS"
          title="Nine stages, with a timestamped history behind every move."
          body="Applied → Screening → Shortlisted → Assessment → Interview → Technical → HR → Offer → Hired, plus Rejected and Withdrawn. Who moved whom, when, and why."
          bullets={[
            'Structured interview feedback required before advancing a stage',
            'Stage history is append-only and admin-queryable',
            'Candidates see their own status, never a black hole',
          ]}
          to="/candidate/applications"
          linkLabel="See the candidate-side tracker"
        >
          <div className="space-y-2">
            {featuredJobs.slice(0, 4).map((j) => (
              <JobCard key={j.id} job={j} variant="b" />
            ))}
          </div>
        </FeatureRow>
      </section>

      {/* ── Compact pricing strip ────────────────────────── */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6">
          <div>
            <h2 className="text-xl font-semibold text-ink">Free while you evaluate</h2>
            <p className="mt-1 text-sm text-ink-2">
              Job-post credits on the free tier. Candidate database and team seats on Growth.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" asChild>
              <Link to="/pricing">Compare plans</Link>
            </Button>
            <Button asChild>
              <Link to="/recruiter/jobs/new">Post a job</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

function FeatureRow({
  icon: Icon,
  eyebrow,
  title,
  body,
  bullets,
  children,
  reverse,
  to,
  linkLabel,
}: {
  icon: React.ElementType
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  children: React.ReactNode
  reverse?: boolean
  to: string
  linkLabel: string
}) {
  return (
    <Reveal whenVisible className="grid gap-10 border-b border-line py-14 lg:grid-cols-2 lg:items-center">
      <div className={reverse ? 'lg:order-2' : undefined}>
        <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-widest text-brand-600">
          <Icon className="size-3.5" aria-hidden />
          {eyebrow}
        </p>
        <h2 className="mt-2.5 text-2xl font-semibold tracking-tight text-ink">{title}</h2>
        <p className="mt-3 text-ink-2 leading-relaxed">{body}</p>
        <ul className="mt-4 space-y-1.5">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2 text-sm text-ink-2">
              <Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
              {b}
            </li>
          ))}
        </ul>
        <Link
          to={to}
          className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {linkLabel}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className={reverse ? 'lg:order-1' : undefined}>{children}</div>
    </Reveal>
  )
}
