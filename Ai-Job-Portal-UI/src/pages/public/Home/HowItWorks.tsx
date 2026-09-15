import * as React from 'react'
import { Link } from 'react-router'
import { useReducedMotion } from 'motion/react'
import {
  CloudUploadIcon, SearchIcon, ListChecksIcon, CircleCheckIcon,
} from '@animateicons/react/lucide'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TONE_CLASS, type Tone } from '@/components/common'
import type { AnimatedIconHandle } from '@/components/common/NavIcon'
import { useInView } from '@/hooks'
import { SHELL } from './shell'

/**
 * "How it works" — three numbered steps joined by dashed connectors.
 *
 * The icons come from `@animateicons/react`. Unlike the sidebar, where a hover
 * is the natural trigger, these loop continuously while the section is on
 * screen — staggered, so they read left to right in the order of the steps.
 * Hovering a step replays its own icon immediately.
 *
 * Reduced motion is enforced here rather than trusted to the library: several
 * of its icons do not guard `startAnimation` themselves.
 */

/** One full pass, then a beat before it runs again. */
const CYCLE_MS = 3600

const STEPS: {
  n: string
  title: string
  body: string
  tone: Tone
  Icon: typeof CloudUploadIcon
  cta?: { label: string; to: string }
}[] = [
  {
    n: '1',
    title: 'Upload once',
    body: 'Your resume is parsed into a structured profile — skills, experience, education — in about four seconds. You see every field before it is saved.',
    tone: 'indigo',
    Icon: CloudUploadIcon,
    cta: { label: 'Upload a resume', to: '/candidate/resumes' },
  },
  {
    n: '2',
    title: 'Get ranked matches',
    body: 'Every open role is scored against your profile across six weighted components — and you see all six, not just the total.',
    tone: 'violet',
    Icon: SearchIcon,
  },
  {
    n: '3',
    title: 'Track every stage',
    body: 'Applied through hired, with a timestamped history of who moved you and why. Nothing happens to your application in silence.',
    tone: 'fuchsia',
    Icon: ListChecksIcon,
  },
]

export function HowItWorks() {
  const section = useInView<HTMLElement>({ threshold: 0.25 })
  const reduced = useReducedMotion() ?? false
  // Both marker rows render — one is hidden by CSS at each breakpoint — so
  // handles are keyed by row as well as index. Keying by index alone let the
  // second row to mount overwrite the first, which meant the loop could end up
  // driving the hidden row's icons while the visible ones sat still.
  const icons = React.useRef(new Map<string, AnimatedIconHandle>())

  // Loop continuously, staggered so they read left to right. Only while the
  // section is on screen — an interval firing against a component nobody is
  // looking at is wasted work on every frame it triggers.
  React.useEffect(() => {
    if (!section.inView || reduced) return

    const play = () => {
      for (const [key, h] of icons.current) {
        const i = Number(key.split(':')[1]) || 0
        window.setTimeout(() => h.startAnimation(), i * 320)
      }
    }

    play()
    const id = window.setInterval(play, CYCLE_MS)
    return () => clearInterval(id)
  }, [section.inView, reduced])

  return (
    <section ref={section.ref} className="border-y border-line band-sky">
      <div className={cn(SHELL, 'py-16')}>
        <p className="flex justify-center">
          <span className="inline-flex items-center rounded-full bg-tone-sky-vivid px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
            Our process
          </span>
        </p>
        <h2 className="mt-4 text-center font-display text-4xl font-semibold tracking-tight text-gradient-sky sm:text-5xl">
          How it works
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink-2">
          Three steps from a file on your desktop to an offer you can see coming.
        </p>

        {/* the marker row — circles and the dashes between them */}
        <div className="mt-12 hidden items-center gap-4 lg:flex">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <StepMarker
                step={s}
                index={i}
                reduced={reduced}
                registryKey={`wide:${i}`}
                icons={icons}
              />
              <Connector tone={s.tone} />
            </React.Fragment>
          ))}
          {/* the outcome the three steps lead to */}
          <span
            className="grid size-14 shrink-0 place-items-center rounded-full bg-tone-emerald-vivid text-white shadow-md"
            aria-hidden
          >
            <CircleCheckIcon size={26} />
          </span>
        </div>

        <ol className="mt-8 grid gap-8 lg:mt-6 lg:grid-cols-3 lg:gap-4">
          {STEPS.map((s, i) => (
            <li key={s.n} className="lg:pr-16">
              {/* below lg the marker sits with its own copy instead of in a row */}
              <div className="mb-4 flex items-center gap-3 lg:hidden">
                <StepMarker
                  step={s}
                  index={i}
                  reduced={reduced}
                  registryKey={`narrow:${i}`}
                  icons={icons}
                />
                <span className="font-mono text-sm text-ink-3">Step {s.n}</span>
              </div>

              <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">
                {s.title}
              </h3>
              <p className="mt-2 leading-relaxed text-ink-2">{s.body}</p>

              {s.cta && (
                <Button className="mt-4" asChild>
                  <Link to={s.cta.to}>
                    {s.cta.label}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function StepMarker({
  step,
  index,
  reduced,
  registryKey,
  icons,
}: {
  step: (typeof STEPS)[number]
  index: number
  reduced: boolean
  registryKey: string
  icons: React.RefObject<Map<string, AnimatedIconHandle>>
}) {
  const inner = React.useRef<AnimatedIconHandle>(null)
  const t = TONE_CLASS[step.tone]

  // hand the parent a handle that respects reduced motion, whatever the
  // underlying icon does
  React.useEffect(() => {
    const map = icons.current
    map.set(registryKey, {
      startAnimation: () => {
        if (!reduced) inner.current?.startAnimation()
      },
      stopAnimation: () => inner.current?.stopAnimation(),
    })
    return () => { map.delete(registryKey) }
  }, [icons, registryKey, reduced])

  return (
    <span
      className="group/step flex shrink-0 items-center gap-3"
      onMouseEnter={() => !reduced && inner.current?.startAnimation()}
    >
      <span
        className={cn(
          'grid size-14 place-items-center rounded-full border-2 bg-paper font-mono text-lg font-bold shadow-sm transition-v',
          t.text,
        )}
        style={{ borderColor: `var(--color-tone-${step.tone}-vivid)` }}
      >
        {step.n}
      </span>
      <span
        className={cn('grid size-11 place-items-center rounded-v-control', t.bg, t.text)}
        aria-hidden
      >
        <step.Icon ref={inner} size={22} />
      </span>
      <span className="sr-only">Step {index + 1}</span>
    </span>
  )
}

/** The dashed run between two markers. Decorative, so it is hidden from AT. */
function Connector({ tone }: { tone: Tone }) {
  return (
    <span className="relative h-6 min-w-0 flex-1" aria-hidden>
      <svg viewBox="0 0 200 24" preserveAspectRatio="none" className="size-full">
        <path
          d="M2 12 C 50 2, 100 22, 150 12 L 188 12"
          fill="none"
          stroke={`var(--color-tone-${tone}-vivid)`}
          strokeWidth="2"
          strokeDasharray="6 7"
          strokeLinecap="round"
          opacity="0.55"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="absolute right-0 top-1/2 -translate-y-1/2"
        style={{ color: `var(--color-tone-${tone}-vivid)` }}
      >
        <ArrowRight className="size-4" />
      </span>
    </span>
  )
}
