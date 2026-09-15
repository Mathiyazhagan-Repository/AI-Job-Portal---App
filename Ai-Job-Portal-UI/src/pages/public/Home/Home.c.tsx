import { Link } from 'react-router'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KineticHeadline, MatchPrism, AIProvenanceChip } from '@/components/brand'
import { JobCard } from '@/features/jobs/JobCard'
import { PrismField } from '@/layouts/AuthLayout'
import { Reveal, Stagger, StaggerItem, Parallax, WordReveal } from '@/components/motion'
import { cn } from '@/lib/utils'
import { jobs } from '@/data/mock'
import {
  ROLE_WORDS, HeroSearch, LiveCount, DEMO_BREAKDOWN,
  CategoryTiles, StepList, AudiencePanel,
} from './parts'

/**
 * DIRECTION C · Expressive Canvas
 * Full-bleed editorial. display-1 type filling the viewport, scroll-driven
 * reveals, a marquee of live job cards, and an oversized match ring as the
 * centrepiece. Optimised for emotional pull and mobile.
 */
export default function HomeC() {
  return (
    <>
      {/* ── Full-bleed hero ──────────────────────────────── */}
      <section className="relative flex min-h-[92dvh] flex-col justify-center overflow-hidden px-4 py-20 sm:px-6">
        <Parallax strength={90} className="absolute inset-0">
          <PrismField />
        </Parallax>

        <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
          <KineticHeadline
            prefix="Find your next"
            words={ROLE_WORDS}
            suffix="role"
            className="text-display-1"
          />

          <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-ink-2 sm:text-2xl">
            <WordReveal text="AI ranks and explains every match." delay={0.35} />
            <br className="hidden sm:block" />
            <span className="font-medium text-ink">
              <WordReveal text="You make every decision." delay={0.75} />
            </span>
          </p>

          <Reveal whenVisible={false} delay={1.05} className="mx-auto mt-10 max-w-2xl">
            <HeroSearch size="lg" />
          </Reveal>

          <Reveal whenVisible={false} delay={1.25} className="mt-8 flex justify-center">
            <LiveCount />
          </Reveal>
        </div>

        <a
          href="#thesis"
          className="absolute inset-x-0 bottom-8 z-10 mx-auto flex w-fit flex-col items-center gap-1 text-xs font-medium text-ink-3 transition-colors hover:text-brand-600"
        >
          See how the scoring works
          <ArrowDown className="size-4 animate-bounce" aria-hidden />
        </a>
      </section>

      {/* ── Live job marquee ─────────────────────────────── */}
      <section className="overflow-hidden border-y border-line bg-paper py-8" aria-label="Recently posted jobs">
        <div className="mb-5 px-4 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-3">
            Posted in the last 48 hours
          </p>
        </div>
        <Marquee>
          {[...jobs, ...jobs].map((job, i) => (
            <div key={`${job.id}-${i}`} className="w-[320px] shrink-0">
              <JobCard job={job} variant="c" showMatch={false} />
            </div>
          ))}
        </Marquee>
      </section>

      {/* ── The thesis, oversized ────────────────────────── */}
      <Reveal as="section" id="thesis" className="mx-auto max-w-[1200px] px-4 py-28 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <AIProvenanceChip what="scored this match" />
            <h2 className="font-display tracking-tight mt-5 text-display-2 font-semibold text-ink">
              A number is not
              <br />
              an <span className="text-signal">explanation.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-2">
              Every other platform hands you a percentage and asks you to trust it. Kairo opens
              every score into the exact weighting behind it — skills, experience, location,
              education, title relevance, preferences.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink-2">
              The same breakdown appears for the top-ranked candidate and the last one. That is not
              a feature. It is the whole point.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link to="/register">
                Get matched
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <Parallax strength={30} className="rounded-v bg-paper p-8 shadow-xl">
            <MatchPrism
              score={87}
              breakdown={DEMO_BREAKDOWN}
              matchedSkills={['React', 'TypeScript', 'Node.js', 'AWS']}
              missingSkills={['GraphQL', 'Kubernetes']}
              meetsHardRequirements
              layout="ring"
              size="xl"
              defaultExpanded
            />
          </Parallax>
        </div>
      </Reveal>

      {/* ── Steps, oversized ─────────────────────────────── */}
      <Reveal as="section" className="border-y border-line bg-paper">
        <div className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6">
          <h2 className="font-display tracking-tight text-display-2 font-semibold text-ink">
            <WordReveal text="Three steps." />
          </h2>
          <div className="mt-12">
            <StepList variant="c" />
          </div>
        </div>
      </Reveal>

      {/* ── Audience split, full-bleed halves ────────────── */}
      <Reveal as="section" className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6">
        <Stagger className="grid gap-6 lg:grid-cols-2">
          <StaggerItem className="rounded-v bg-paper p-10 shadow-lg hover-lift">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-600">
              For candidates
            </p>
            <div className="mt-4">
              <AudiencePanel which="candidate" />
            </div>
          </StaggerItem>
          <StaggerItem className="rounded-v bg-paper p-10 shadow-lg hover-lift">
            <p className="font-mono text-xs uppercase tracking-widest text-accent-600">
              For recruiters
            </p>
            <div className="mt-4">
              <AudiencePanel which="recruiter" />
            </div>
          </StaggerItem>
        </Stagger>
      </Reveal>

      {/* ── Categories ───────────────────────────────────── */}
      <Reveal as="section" className="mx-auto max-w-[1200px] px-4 pb-24 sm:px-6">
        <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">Explore by field</h2>
        <div className="mt-6">
          <CategoryTiles />
        </div>
      </Reveal>

      {/* ── Closing ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-signal">
        <div className="relative mx-auto max-w-[1200px] px-4 py-28 text-center sm:px-6">
          <h2 className="font-display tracking-tight mx-auto max-w-3xl text-display-2 font-semibold leading-tight text-white">
            <WordReveal text="Stop applying into the dark." />
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/85">
            Upload a resume once. Get ranked matches with the reasoning attached. Track every
            stage from applied to hired.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Create your profile</Link>
            </Button>
            <Button
              size="lg"
              asChild
              className="bg-white/10 text-white ring-1 ring-inset ring-white/30 hover:bg-white/20"
            >
              <Link to="/recruiter/jobs/new">I'm hiring instead</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

/* ── helpers ─────────────────────────────────────────── */

function Marquee({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="group relative flex overflow-hidden"
      style={{
        maskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <div
        className="flex shrink-0 gap-4 px-2"
        style={{
          animation: 'kairo-marquee 46s linear infinite',
          animationPlayState: 'running',
        }}
      >
        {children}
      </div>
      <style>{`
        @keyframes kairo-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .group:hover > div { animation-play-state: paused }
        @media (prefers-reduced-motion: reduce) { .group > div { animation: none } }
      `}</style>
    </div>
  )
}
