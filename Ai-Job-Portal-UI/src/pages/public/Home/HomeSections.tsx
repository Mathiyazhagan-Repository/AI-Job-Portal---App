import * as React from 'react'
import { Link } from 'react-router'
import {
  Star, ArrowRight, Clock, Plus, Minus, MessageCircleQuestion,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SHELL } from './shell'
import { Button } from '@/components/ui/button'
import { FacePhoto, Photo } from '@/components/common/Photo'
import { TONE_CLASS, type Tone } from '@/components/common'
import { Marquee } from '@/components/common/Marquee'
import type { PhotoKey } from '@/lib/photos'
import { FAQ_CATEGORIES } from '@/pages/public/Faq'
import { ARTICLES } from '@/pages/public/Resources'


/* ══════════════════ testimonials ══════════════════ */

/** A hue per quote so the rail reads as a spectrum. */
const QUOTE_TONES: Tone[] = ['violet', 'sky', 'emerald', 'fuchsia', 'amber', 'teal']

const QUOTES: {
  photo: PhotoKey
  name: string
  meta: string
  quote: string
  stars: number
}[] = [
  {
    photo: 'faceB',
    name: 'Meera Krishnan',
    meta: 'Engineering Manager · Northwind Labs',
    stars: 5,
    quote:
      'I can show a hiring panel why someone ranked third instead of first. That conversation used to be a shrug and a gut feeling — now it is six numbers and the reasoning behind each one.',
  },
  {
    photo: 'faceA',
    name: 'Rahul Deshpande',
    meta: 'Senior Backend Engineer · Pune',
    stars: 5,
    quote:
      'First job board that told me why I was rejected. I fixed the two things it named, re-applied somewhere else, and had an interview the next week. No other site does this.',
  },
  {
    photo: 'faceC',
    name: 'Ananya Rao',
    meta: 'Talent Partner · Meridian Health',
    stars: 5,
    quote:
      'Time to shortlist went from two days to under one, and I never once had to defend a number I could not explain. That is the part my hiring managers actually noticed.',
  },
  {
    photo: 'heroMain',
    name: 'Priya Menon',
    meta: 'Frontend Engineer · Bengaluru',
    stars: 5,
    quote:
      'The ATS check caught that my two-column layout was hiding half my experience from the parser. I had been sending that file out for four months.',
  },
  {
    photo: 'featureB',
    name: 'Vikram Shetty',
    meta: 'Full-stack Engineer · Loop Health',
    stars: 4,
    quote:
      'Knowing the agenda before the interview is the part I did not expect to matter this much. I prepared for the right hour instead of guessing.',
  },
  {
    photo: 'heroAlt',
    name: 'Nikita Rane',
    meta: 'Talent Partner · Northwind Labs',
    stars: 5,
    quote:
      'Every rejection we send carries a reason now. Candidates reply to thank us, which has genuinely never happened to me before on any ATS.',
  },
]

export function Testimonials() {
  return (
    <section className="border-y border-line band-amber">
      <div className={cn(SHELL, 'py-16')}>
        {/* eyebrow with the flanking rules */}
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-tone-amber-vivid/50" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-tone-amber">
            Testimonials
          </p>
          <span className="h-px w-10 bg-tone-amber-vivid/50" aria-hidden />
        </div>

        <h2 className="mt-4 text-center font-display text-4xl font-semibold tracking-tight text-gradient-amber sm:text-5xl">
          What people say about the reasoning
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink-2">
          Real words from candidates and hiring teams who stopped guessing.
        </p>

        {/* one pass scaled to the card count so a longer list does not speed up */}
        <Marquee
          speed={QUOTES.length * 11}
          className="mt-10"
          fadeFrom="from-[color-mix(in_oklab,var(--color-tone-amber-vivid)_9%,#fff)]"
        >
          {QUOTES.map((q, i) => (
            <figure
              key={q.name}
              className="relative flex w-[360px] shrink-0 flex-col overflow-hidden rounded-v bg-paper p-6 shadow-v-card"
            >
              <span
                className={cn('absolute inset-x-0 top-0 h-1', TONE_CLASS[QUOTE_TONES[i % QUOTE_TONES.length]].rail)}
                aria-hidden
              />
              <span className="flex items-center gap-1" aria-label={`${q.stars} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'size-4',
                      i < q.stars
                        ? 'fill-tone-amber-vivid text-tone-amber-vivid'
                        : 'fill-line text-line',
                    )}
                    aria-hidden
                  />
                ))}
              </span>

              <blockquote className="mt-5 flex-1 font-display text-lg italic leading-relaxed text-ink-2">
                “{q.quote}”
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3">
                <FacePhoto src={q.photo} size={48} priority />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{q.name}</p>
                  <p className="truncate text-sm text-ink-3">{q.meta}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

/* ══════════════════ blog / resources ══════════════════ */

const ARTICLE_PHOTO: Record<string, PhotoKey> = {
  a1: 'catEng',
  a2: 'catDesign',
  a3: 'featureB',
  a4: 'catOps',
  a5: 'catData',
  a6: 'catProduct',
  a7: 'featureA',
  a8: 'catMkt',
  a9: 'featureC',
  a10: 'heroAlt',
}

export function BlogStrip() {
  const posts = React.useMemo(() => ARTICLES.slice(0, 3), [])

  return (
    <section className="border-y border-line band-teal">
      <div className={cn(SHELL, 'py-16')}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p>
            <span className="inline-flex items-center rounded-full bg-tone-violet-vivid px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
              From the blog
            </span>
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-gradient-indigo sm:text-4xl">
            Written by people who have sat on both sides
          </h2>
          <p className="mt-2 max-w-2xl text-ink-2">
            No generated advice, and nothing here is personalised from your profile.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <Link to="/resources">
            All articles
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <ul className="mt-8 grid gap-5 lg:grid-cols-3">
        {posts.map((a) => (
          <li key={a.id}>
            <Link
              to="/resources"
              className="group relative flex h-full flex-col overflow-hidden rounded-v border border-line bg-paper shadow-v-card transition-v hover-lift"
            >
              <span
                className={cn('absolute inset-x-0 top-0 z-10 h-1', TONE_CLASS[a.tone as Tone].rail)}
                aria-hidden
              />
              <Photo
                src={ARTICLE_PHOTO[a.id] ?? 'featureA'}
                width={640}
                height={360}
                rounded={false}
                className="aspect-[16/9] w-full"
                imgClassName="transition-transform duration-500 group-hover:scale-105"
              />
              <div className="flex flex-1 flex-col p-5">
                <span
                  className={cn(
                    'w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                    TONE_CLASS[a.tone as Tone].bg,
                    TONE_CLASS[a.tone as Tone].text,
                  )}
                >
                  {a.category}
                </span>
                <h3 className="mt-3 font-semibold leading-snug text-ink group-hover:text-brand-700">
                  {a.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-2">{a.dek}</p>
                <p className="mt-auto flex items-center gap-3 pt-4 text-xs text-ink-3">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden />
                    {a.readMinutes} min read
                  </span>
                  <span>{a.published}</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </section>
  )
}

/* ══════════════════ faq ══════════════════ */

/**
 * The three most-asked from each category. The long tail lives on /faq, so
 * this section's job is to answer the objections that stop someone signing up
 * — not to be a complete reference.
 */
const HOME_FAQS = FAQ_CATEGORIES.flatMap((c) =>
  c.items.slice(0, 3).map((f) => ({ ...f, tone: c.tone, category: c.id, categoryLabel: c.label })),
)

export function FaqStrip() {
  const [filter, setFilter] = React.useState<string>('all')
  const [open, setOpen] = React.useState<string | null>(HOME_FAQS[0]?.id ?? null)

  const shown = React.useMemo(
    () => (filter === 'all' ? HOME_FAQS : HOME_FAQS.filter((f) => f.category === filter)),
    [filter],
  )

  // an open answer in a filtered-out category would silently vanish, so the
  // first visible question takes over
  React.useEffect(() => {
    if (!shown.some((f) => f.id === open)) setOpen(shown[0]?.id ?? null)
  }, [shown, open])

  const total = FAQ_CATEGORIES.reduce((n, c) => n + c.items.length, 0)

  return (
    <section className="border-y border-line band-fuchsia">
      <div className={cn(SHELL, 'py-16')}>
        {/* ── centred header, matching the other sections ── */}
        <p className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tone-fuchsia-vivid px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
            <MessageCircleQuestion className="size-3.5" aria-hidden />
            Questions
          </span>
        </p>
        <h2 className="mt-4 text-center font-display text-4xl font-semibold tracking-tight text-gradient-amber sm:text-5xl">
          Answered properly
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink-2">
          Scoring, privacy and what an employer can actually see — explained in the detail we would
          give a colleague. No answer here is shorter than the truth.
        </p>

        {/* ── category filter ── */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
            All questions
          </FilterPill>
          {FAQ_CATEGORIES.map((c) => (
            <FilterPill
              key={c.id}
              tone={c.tone}
              active={filter === c.id}
              onClick={() => setFilter(c.id)}
            >
              <c.icon className="size-3.5" aria-hidden />
              {c.label}
            </FilterPill>
          ))}
        </div>

        {/* ── the questions, as cards rather than a bare list ── */}
        <ul className="mt-8 grid gap-3">
          {shown.map((f) => {
            const on = open === f.id
            const t = TONE_CLASS[f.tone]
            return (
              <li key={f.id}>
                <div
                  className={cn(
                    'relative overflow-hidden rounded-v border bg-paper transition-v',
                    on ? 'border-transparent shadow-md' : 'border-line shadow-v-card hover:shadow-md',
                  )}
                >
                  <span
                    className={cn(
                      'absolute inset-y-0 left-0 w-1 transition-v',
                      on ? t.rail : 'bg-transparent',
                    )}
                    aria-hidden
                  />
                  <h3>
                    <button
                      type="button"
                      aria-expanded={on}
                      aria-controls={`faq-${f.id}`}
                      onClick={() => setOpen(on ? null : f.id)}
                      className="flex w-full items-start gap-4 p-5 text-left"
                    >
                      <span
                        className={cn(
                          'mt-0.5 hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide sm:inline-block',
                          t.bg,
                          t.text,
                        )}
                      >
                        {f.categoryLabel}
                      </span>
                      <span className={cn('flex-1 font-medium', on ? t.text : 'text-ink')}>
                        {f.q}
                      </span>
                      <span
                        className={cn(
                          'grid size-7 shrink-0 place-items-center rounded-full transition-v',
                          on ? cn(t.fill, 'text-white') : cn(t.bg, t.text),
                        )}
                        aria-hidden
                      >
                        {on ? <Minus className="size-4" /> : <Plus className="size-4" />}
                      </span>
                    </button>
                  </h3>
                  {on && (
                    <div id={`faq-${f.id}`} className="px-5 pb-5 pl-5 sm:pl-[7.5rem]">
                      <p className="max-w-4xl text-sm leading-relaxed text-ink-2">{f.a}</p>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {/* ── the way out, for anything not covered ── */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-v border border-line bg-paper p-5 shadow-v-card">
          <div className="flex items-center gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-v-control bg-gradient-to-br from-tone-fuchsia-vivid to-tone-violet-vivid text-white shadow-sm"
              aria-hidden
            >
              <MessageCircleQuestion className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-ink">Still have a question?</p>
              <p className="text-sm text-ink-2">
                {total} answers in full, or write to a person who will reply.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <Link to="/faq">
                Read all {total}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link to="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function FilterPill({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean
  tone?: Tone
  onClick: () => void
  children: React.ReactNode
}) {
  const t = tone ? TONE_CLASS[tone] : null
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-v',
        active
          ? t
            ? cn(t.fill, 'text-white shadow-sm')
            : 'bg-ink text-paper shadow-sm'
          : cn('bg-paper text-ink-2 shadow-v-card hover:text-ink', t && `hover:${t.text}`),
      )}
    >
      {children}
    </button>
  )
}
