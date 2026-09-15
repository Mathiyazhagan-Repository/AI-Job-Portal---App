import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { Link } from 'react-router'
import { useReducedMotion } from 'motion/react'
import {
  ArrowRight, Sparkles, Check, Quote, ShieldCheck, Eye, Clock3, Building2, Star, StarHalf, Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KineticHeadline, ScoreBadge } from '@/components/brand'
import { JobCard } from '@/features/jobs/JobCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/controls'
import { Photo, FacePhoto } from '@/components/common/Photo'
import { TONE_CLASS, type Tone } from '@/components/common'
import { Marquee } from '@/components/common/Marquee'
import { useCountUp, useInView } from '@/hooks'
import { cn } from '@/lib/utils'
import { SHELL } from './shell'
import { HowItWorks } from './HowItWorks'
import { companies, jobs, companyById } from '@/data/mock'
import type { PhotoKey } from '@/lib/photos'
import { PremiumFeatures } from './PremiumFeatures'
import { Testimonials, BlogStrip, FaqStrip } from './HomeSections'
import { PremiumCompanies } from './PremiumCompanies'
import {
  ROLE_WORDS, HeroSearch, LiveCount, MatchDemo, CompanyMarquee,
  AudiencePanel, StepList,
} from './parts'
import { Reveal, Stagger, StaggerItem, m } from '@/components/motion'

/**
 * DIRECTION A · Editorial Clarity
 *
 * The marketing face of the product. Rebuilt to carry photography and to stop
 * wasting horizontal space: the hero is asymmetric rather than a centred
 * column on white, sections run edge to edge at 1320px, and the vertical
 * rhythm is tighter (14–20 rather than 20–24) so more of the argument lands in
 * the first two screens.
 *
 * The console keeps the no-photography rule (DESIGN.md §5.3) — faces only ever
 * appear here, never beside a score.
 */


export default function HomeA() {
  return (
    <>
      <Hero />
      <TrustStrip />

      <PremiumCompanies />
      <PremiumFeatures />
      <DualAudience />
      <ScoreThesis />
      <HowItWorks />
      <Testimonials />
      <BlogStrip />
      <FaqStrip />

      <ClosingCta />
    </>
  )
}

/* ══════════════════ the score thesis ══════════════════ */

function ScoreThesis() {
  return (
      <div className="border-y border-line band-teal">
        <Reveal as="section" whenVisible className={cn(SHELL, 'py-14')}>
        <Stagger className="grid gap-4 lg:grid-cols-12">
          <StaggerItem className="relative overflow-hidden rounded-v border border-line bg-paper p-6 shadow-v-card lg:col-span-7 h-fit">
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-tone-indigo-vivid via-tone-violet-vivid to-tone-fuchsia-vivid" aria-hidden />
            <MatchDemo />
          </StaggerItem>
          <div className="flex flex-col gap-4 lg:col-span-5">
            <StaggerItem className="flex flex-1 flex-col">
              <ProofCard />
            </StaggerItem>
            <StaggerItem className="flex flex-1 flex-col">
              <HiringNowCard />
            </StaggerItem>
          </div>
        </Stagger>
        </Reveal>
      </div>
  )
}

/* ══════════════════ both sides ══════════════════ */

function DualAudience() {
  const [audience, setAudience] = useState<'candidate' | 'recruiter'>('candidate')

  // The right-hand job rail is a fixed-height auto-scroller, so its height
  // can't come from its own content (that content is the whole point of the
  // clip). It's measured off the left column instead — which does size
  // itself naturally — and re-fires on its own whenever that column's
  // height changes, including the audience switch above.
  const audienceLeftRef = useRef<HTMLDivElement>(null)
  const [audienceRailHeight, setAudienceRailHeight] = useState(560)
  useLayoutEffect(() => {
    const el = audienceLeftRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setAudienceRailHeight(entry.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
      <section className="border-y border-line band-violet">
        <div className={cn(SHELL, 'py-16')}>
          <Tabs value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
            {/* centred eyebrow / title / subtitle, matching Testimonials */}
            <p className="flex justify-center">
              <span className="inline-flex items-center rounded-full bg-tone-violet-vivid px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
                Both sides
              </span>
            </p>
            <h2 className="mt-4 text-center font-display text-4xl font-semibold tracking-tight text-gradient-indigo sm:text-5xl">
              Two sides, one honest system
            </h2>
            <p className="mt-3 text-center text-ink-2 lg:whitespace-nowrap">
              The same explainability that helps a recruiter defend a shortlist tells a candidate exactly where they stood.
            </p>

            <div className="mt-8 flex justify-center">
              <TabsList>
                <TabsTrigger value="candidate">I'm looking for work</TabsTrigger>
                <TabsTrigger value="recruiter">I'm hiring</TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-2">
              <div ref={audienceLeftRef} className="flex flex-col">
                <TabsContent value="candidate" className="m-0">
                  <AudiencePanel which="candidate" />
                </TabsContent>
                <TabsContent value="recruiter" className="m-0">
                  <AudiencePanel which="recruiter" />
                </TabsContent>

                {/* This column sets the height the job rail opposite is
                    clipped to (measured via ResizeObserver, above) — so the
                    photo filling any leftover space with flex-1 is what
                    keeps the two sides in sync rather than leaving a gap. */}
                <div className="relative mt-8 h-64 shrink-0 overflow-hidden rounded-v">
                  {/* The frame is ~2.5:1 but the source is 3:2, so a centre
                      crop sliced the tops of both heads off. Asking the CDN
                      for a crop at the frame's own ratio, weighted to faces,
                      keeps them whole. */}
                  <Photo
                    src={audience === 'candidate' ? 'featureB' : 'featureA'}
                    width={1100}
                    height={440}
                    crop="faces"
                    rounded={false}
                    className="size-full"
                  />
                  <span
                    className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent"
                    aria-hidden
                  />
                  <p className="absolute inset-x-0 bottom-0 p-4 text-sm font-medium leading-snug text-white">
                    {audience === 'candidate'
                      ? 'Every rejection carries a reason and an appeal route — reviewed by a person.'
                      : 'Every ranking decision is stamped with a name in the audit log.'}
                  </p>
                </div>
              </div>

              <Marquee
                direction="vertical"
                gap="gap-3"
                speed={jobs.length * 9}
                pauseOnHover={false}
                className="h-[420px] lg:h-[var(--audience-rail-h)]"
                style={{ '--audience-rail-h': `${audienceRailHeight}px` } as React.CSSProperties}
                fadeFrom="from-[color-mix(in_oklab,var(--color-tone-violet-vivid)_20%,#fff)]"
              >
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} variant="a" showMatch={audience === 'candidate'} />
                ))}
              </Marquee>
            </div>
          </Tabs>
        </div>
      </section>
  )
}

/** One hue per employer row in the hero card. */
const HERO_TONES: Tone[] = ['indigo', 'fuchsia', 'emerald', 'amber']

/* ══════════════════ hero media ══════════════════ */

/** Swap these two lines to change the clip. */
const heroVideo = '/videos/hero.mp4'
const heroPoster = '/videos/hero-poster.jpg'

/**
 * The hero clip. Autoplay only works muted, and without `playsInline` iOS
 * takes the video fullscreen instead of playing it in place.
 *
 * Reduced motion gets the poster frame rather than a silent loop — the rest of
 * the site holds still under that setting and `anim-check.mjs` asserts it, so
 * an autoplaying hero would be the one thing quietly ignoring it.
 */
function HeroMedia() {
  const reduced = useReducedMotion() ?? false

  if (reduced) {
    return (
      <img
        src={heroPoster}
        alt=""
        aria-hidden
        className="aspect-video w-full object-cover"
      />
    )
  }

  return (
    <video
      className="aspect-video w-full rounded-v object-cover shadow-lg"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={heroPoster}
      aria-hidden
    >
      <source src={heroVideo} type="video/mp4" />
    </video>
  )
}


/* ══════════════════ latest openings ══════════════════ */

/** Real fixtures, so the hero cannot advertise roles the jobs page lacks. */
const LATEST_OPENINGS = jobs.slice(0, 4).map((j) => {
  const c = companyById(j.companyId)
  return { id: j.id, role: j.title, company: c?.name ?? '', logoHue: c?.logoHue ?? 220, logoUrl: c?.logoUrl, openings: c?.openJobs ?? 1 }
})

/** How many rows are on screen, and how long each pair holds. */
const VISIBLE_OPENINGS = 1
const OPENINGS_ROTATE_MS = 1500

function LatestOpenings() {
  const total = LATEST_OPENINGS.reduce((n, o) => n + o.openings, 0)
  const reduced = useReducedMotion() ?? false
  const [start, setStart] = useState(0)

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(
      () => setStart((i) => (i + VISIBLE_OPENINGS) % LATEST_OPENINGS.length),
      OPENINGS_ROTATE_MS,
    )
    return () => clearInterval(id)
  }, [reduced])

  // wraps, so the window keeps two rows even at the end of the list
  const shown = Array.from(
    { length: Math.min(VISIBLE_OPENINGS, LATEST_OPENINGS.length) },
    (_, k) => LATEST_OPENINGS[(start + k) % LATEST_OPENINGS.length],
  )

  return (
    <div className="pt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Latest openings</h2>
        <span className="font-mono tnum text-[11px] text-ink-3">{total} live</span>
      </div>

      <ul className="space-y-2">
        {shown.map((o, i) => (
          <li key={o.id}>
            <Link
              to={`/jobs/${o.id}`}
              className="group flex items-center gap-3.5 rounded-v-control px-2 py-2 transition-v hover:bg-hover"
            >
              <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-paper ring-1 ring-line shadow-sm">
                {o.logoUrl ? (
                  <img src={o.logoUrl} alt="" aria-hidden className="size-11 object-contain" />
                ) : (
                  <span
                    className="text-2xl font-bold"
                    style={{ color: `oklch(0.45 0.15 ${o.logoHue})` }}
                    aria-hidden
                  >
                    {o.company.slice(0, 1)}
                  </span>
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-semibold leading-tight text-ink">
                  {o.role}
                </span>
                <span className="block truncate text-base leading-tight text-ink-3 mt-0.5">
                  {o.company}
                </span>
              </span>

              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 font-mono tnum text-[11px] font-semibold',
                  TONE_CLASS[OPENING_TONES[i % OPENING_TONES.length]].bg,
                  TONE_CLASS[OPENING_TONES[i % OPENING_TONES.length]].text,
                )}
              >
                {o.openings} open
              </span>

              <ArrowRight
                className="size-3.5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** One hue per row. */
const OPENING_TONES: Tone[] = ['indigo', 'fuchsia', 'emerald', 'amber']

/* ══════════════════ hero ══════════════════ */

function Hero() {
  const totalOpen = companies.reduce((n, c) => n + c.openJobs, 0)

  return (
    <section className="hero-mesh relative overflow-hidden border-b border-line">
      {/* items-start, not items-center: the photo column is shorter than the
          copy, and centring it left a visible step between the two tops */}
      <div className={cn(SHELL, 'relative grid items-start gap-8 pb-6 pt-6 lg:grid-cols-[1fr_1.12fr] lg:gap-10 lg:pb-8 lg:pt-8')}>
        {/* ── copy ── */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-white/50 px-3.5 py-1.5 text-sm font-bold shadow-sm backdrop-blur">
            <Sparkles className="size-4 text-tone-indigo-vivid" aria-hidden />
            <span className="bg-gradient-to-r from-tone-indigo-vivid via-tone-fuchsia-vivid to-tone-emerald-vivid bg-[length:200%_auto] bg-clip-text text-transparent animate-bg-pan">
              AI Job Portal
            </span>
          </div>

          <KineticHeadline
            prefix="Find your next"
            words={ROLE_WORDS}
            suffix="role"
            className="mt-5 text-left"
          />

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
            AI ranks and explains every match. You make every decision. No black-box
            percentages, no silent rejections.
          </p>

          <div className="mt-6 max-w-2xl [&_form]:shadow-xl [&_form]:ring-1 [&_form]:ring-white/60">
            <HeroSearch size="lg" />
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <LiveCount />
              <p className="text-xs text-ink-3">
                Popular:{' '}
                {['React', 'Python', 'Product Design', 'Data'].map((t, i) => (
                  <span key={t}>
                    {i > 0 && ' · '}
                    <Link to="/jobs" className="hover:text-brand-600">
                      {t}
                    </Link>
                  </span>
                ))}
              </p>
            </div>
          </div>

          <ul className="mt-6 flex flex-wrap gap-2">
            {([
              ['Every score opens into its reasoning', 'emerald'],
              ['No age, gender or photo is ever collected', 'sky'],
            ] as [string, Tone][]).map(([t, tone]) => (
              <li
                key={t}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
                  TONE_CLASS[tone].bg,
                  TONE_CLASS[tone].text,
                )}
              >
                <Check className="size-4 shrink-0" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* ── the visual column: heading, clip, then what is open ── */}
        <div className="rounded-v border border-line bg-paper/70 p-4 shadow-lg backdrop-blur">
          <p className="pb-3 text-center font-display text-2xl font-bold uppercase tracking-[0.14em] text-gradient-indigo">
            AI Job Portal
          </p>
          {/* a gradient rule rather than a flat border, to echo the heading */}
          <span
            className="block h-px bg-gradient-to-r from-transparent via-tone-indigo-vivid/45 to-transparent"
            aria-hidden
          />

          {/* the clip sits inside the card, so it gets its own rounding */}
          <div className="mt-4 overflow-hidden rounded-v-control">
            <HeroMedia />
          </div>

          <span className="mt-4 block h-px bg-line" aria-hidden />

          <LatestOpenings />
        </div>
      </div>
    </section>
  )
}

/* ══════════════════ trust ══════════════════ */

function TrustStrip() {
  return (
    <section className="bg-paper border-b border-line overflow-hidden">
      <div className={cn(SHELL, 'flex flex-col lg:flex-row items-center gap-12 py-10')}>
        <div className="flex shrink-0 flex-col gap-3 min-w-[280px]">
          <div className="flex text-amber-400">
            <Star className="size-5 fill-current" />
            <Star className="size-5 fill-current" />
            <Star className="size-5 fill-current" />
            <Star className="size-5 fill-current" />
            <StarHalf className="size-5 fill-current" />
          </div>
          <p className="text-[15px] font-medium text-ink-2 leading-relaxed">
            Job seekers have rated Kairo <span className="font-semibold text-brand-600">4.6</span> / 5.0<br/>
            on ease of finding jobs as of Sep 1, 2026
          </p>
        </div>
        <div className="min-w-0 flex-1 w-full">
          <CompanyMarquee />
        </div>
      </div>
    </section>
  )
}

/* ══════════════════ bento side cards ══════════════════ */

function ProofCard() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-v border border-line shadow-v-card">
      <Photo src="featureB" width={760} height={480} rounded={false} className="min-h-40 w-full flex-1" />
      <div className="bg-paper p-5">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--color-tone-emerald-bg)] text-tone-emerald" aria-hidden>
            <ShieldCheck className="size-4" />
          </span>
          <h3 className="font-semibold text-ink">Nothing decided in the dark</h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          Every rejection carries a reason and an appeal route, and a person — never a
          model — reviews every appeal.
        </p>
      </div>
    </div>
  )
}

function AnimatedStat({ stat, trigger }: { stat: { label: string; value: number; tone: Tone }; trigger: boolean }) {
  const animated = useCountUp(stat.value, 900, trigger)
  return (
    <div>
      <dd
        className="font-mono tnum text-2xl font-semibold leading-none"
        style={{ color: `var(--color-tone-${stat.tone})` }}
      >
        {animated.toLocaleString()}
      </dd>
      <dt className="mt-1.5 text-[11px] leading-tight text-ink-3">{stat.label}</dt>
    </div>
  )
}

function HiringNowCard() {
  const stats = [
    { label: 'Open roles', value: 12480, tone: 'indigo' as Tone },
    { label: 'Employers', value: 892, tone: 'teal' as Tone },
    { label: 'Hires made', value: 3104, tone: 'fuchsia' as Tone },
  ]
  const card = useInView<HTMLDivElement>()

  return (
    <div ref={card.ref} className="rounded-v border border-line bg-paper p-5 shadow-v-card">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-3">
        The board right now
      </h3>
      <dl className="mt-3 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <AnimatedStat key={s.label} stat={s} trigger={card.inView} />
        ))}
      </dl>
      <Link
        to="/jobs"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        Browse every role
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}

/* ══════════════════ categories ══════════════════ */

const CATEGORY_TILES: { name: string; count: number; photo: PhotoKey }[] = [
  { name: 'Engineering', count: 1284, photo: 'catEng' },
  { name: 'Design', count: 312, photo: 'catDesign' },
  { name: 'Data & Analytics', count: 486, photo: 'catData' },
  { name: 'Product', count: 268, photo: 'catProduct' },
  { name: 'Marketing', count: 401, photo: 'catMkt' },
  { name: 'Operations', count: 356, photo: 'catOps' },
]

function Categories() {
  return (
    <section className="border-y border-line band-fuchsia">
      <div className={cn(SHELL, 'py-16')}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              Browse by discipline
            </h2>
            <p className="mt-2 text-ink-2">Every role carries a published salary band.</p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            All categories
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_TILES.map((c) => (
            <li key={c.name}>
              <Link
                to="/jobs"
                className="group relative block overflow-hidden rounded-v shadow-v-card transition-v hover-lift"
              >
                <Photo
                  src={c.photo}
                  width={640}
                  height={420}
                  rounded={false}
                  className="aspect-[16/10] w-full"
                  imgClassName="transition-transform duration-500 group-hover:scale-105"
                />
                {/* the scrim is what keeps the label readable on any photo */}
                <span
                  className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent"
                  aria-hidden
                />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                  <span>
                    <span className="block text-lg font-semibold text-white">{c.name}</span>
                    <span className="block font-mono tnum text-xs text-white/70">
                      {c.count.toLocaleString('en-IN')} open roles
                    </span>
                  </span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15 text-white ring-1 ring-inset ring-white/30 backdrop-blur transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="size-4" aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ══════════════════ testimonials ══════════════════ */

const QUOTES: { photo: PhotoKey; name: string; role: string; quote: string; tone: Tone }[] = [
  {
    photo: 'faceB',
    name: 'Meera Krishnan',
    role: 'Engineering Manager, Northwind Labs',
    tone: 'violet',
    quote:
      'I can show a hiring panel why someone ranked third instead of first. That conversation used to be a shrug.',
  },
  {
    photo: 'faceA',
    name: 'Rahul Deshpande',
    role: 'Senior Backend Engineer',
    tone: 'sky',
    quote:
      'First job board that told me why I was rejected. I fixed the two things it named and got an interview the next week.',
  },
  {
    photo: 'faceC',
    name: 'Ananya Rao',
    role: 'Talent Partner, Meridian Health',
    tone: 'emerald',
    quote:
      'Time to shortlist went from two days to under one, and I never had to defend a number I could not explain.',
  },
]

/* ══════════════════ closing ══════════════════ */

function ClosingCta() {
  return (
    <section className={cn(SHELL, 'py-8')}>
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 shadow-2xl ring-1 ring-white/10">
        
        {/* Background ambient glowing orbs */}
        <div className="pointer-events-none absolute -left-1/4 -top-1/4 size-[120%] rounded-full bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/20 to-transparent blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-1/4 -right-1/4 size-[100%] rounded-full bg-gradient-to-tl from-emerald-500/20 via-transparent to-transparent blur-3xl" aria-hidden />

        <div className="relative grid items-stretch lg:grid-cols-[0.85fr_1.15fr]">
          {/* Visual Side (Left) */}
          <div className="relative hidden w-full lg:block">
            <Photo
              src="heroAlt"
              width={800}
              height={800}
              rounded={false}
              className="absolute inset-0 h-full w-full object-cover"
              imgClassName="object-[center_15%]"
            />
            {/* Gradient mask to blend the image into the dark background on the right */}
            <div className="absolute inset-0 bg-gradient-to-l from-gray-900 via-gray-900/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-50" />
            
            {/* Floating element 1 */}
            <div className="absolute bottom-10 left-10 animate-rise drop-shadow-2xl">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 pr-5 backdrop-blur-md">
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                  <Check className="size-4" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">Interview Confirmed</p>
                  <p className="text-[11px] text-white/70">Tomorrow at 10:00 AM</p>
                </div>
              </div>
            </div>

            {/* Floating element 2 */}
            <div className="absolute top-10 left-16 animate-rise drop-shadow-2xl" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/10 p-2.5 pr-4 backdrop-blur-md">
                <div className="flex size-7 items-center justify-center rounded-full bg-tone-violet-vivid/30 text-tone-violet ring-1 ring-tone-violet/50">
                  <Sparkles className="size-3.5" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">98% Match</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text Content (Right) */}
          <div className="flex flex-col justify-center px-8 py-8 sm:px-12 lg:px-12 lg:py-10">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white ring-1 ring-inset ring-white/20 backdrop-blur-md">
                <Sparkles className="size-3 text-fuchsia-400" aria-hidden />
                Free to start
              </span>
            </div>
            
            <h2 className="mt-4 font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
              Your next role is out there.<br />
              <span className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">Stop applying into the dark.</span>
            </h2>
            
            <p className="mt-3 max-w-lg text-sm text-white/70">
              Upload a resume, get ranked matches with the reasoning attached, and track every
              stage of your application pipeline.
            </p>
            
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button 
                size="md" 
                asChild
                className="h-10 rounded-full bg-white px-6 text-sm font-semibold text-gray-900 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
              >
                <Link to="/register">
                  Create your profile
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                size="md"
                variant="ghost"
                asChild
                className="h-10 rounded-full px-6 text-sm text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Link to="/recruiter/jobs/new">
                  <Building2 className="mr-2 size-4" />
                  I'm hiring instead
                </Link>
              </Button>
            </div>
            
            <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5 text-[13px] text-white/60">
              <div className="flex -space-x-2">
                <FacePhoto src="faceA" size={24} className="ring-2 ring-gray-900" />
                <FacePhoto src="faceB" size={24} className="ring-2 ring-gray-900" />
                <FacePhoto src="faceC" size={24} className="ring-2 ring-gray-900" />
              </div>
              <p>Joined by <span className="font-semibold text-white">10,000+</span> candidates this week</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
