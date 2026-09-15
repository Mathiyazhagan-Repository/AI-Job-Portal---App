import * as React from 'react'
import { Link } from 'react-router'
import { Crown, ArrowRight, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SHELL } from './shell'
import { Button } from '@/components/ui/button'
import { CompanyMark } from '@/features/jobs/JobCard'
import { Marquee } from '@/components/common/Marquee'
import { companies } from '@/data/mock'
import { TONE_CLASS, type Tone } from '@/components/common'

/**
 * "Explore jobs from premium companies" — a continuously scrolling rail of
 * employer cards, plus the rating strip above it.
 *
 * This was a snap-scroll rail with prev/next arrows. It now auto-scrolls, and
 * the arrows went with it: a track that is always moving cannot also honour a
 * `scrollLeft` the user set, so keeping both would have meant the two fighting
 * each other every frame. `Marquee` pauses on hover and on focus, which covers
 * the reason the arrows were there — stopping to read one card.
 */

const CARD = 280

/** One hue per card, cycled — the rail reads as a spectrum rather than a row of white boxes. */
const CARD_TONES: Tone[] = ['indigo', 'fuchsia', 'sky', 'amber', 'violet', 'teal', 'rose']

export function PremiumCompanies() {
  return (
    <section className="border-y border-line band-emerald">
      <div className="py-16">
        {/* ── the rating line ── */}
        <div className={cn(SHELL, 'mb-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center')}>
          <span className="inline-flex items-center gap-1" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'size-4',
                  i < 4
                    ? 'fill-tone-amber-vivid text-tone-amber-vivid'
                    : 'fill-tone-amber-vivid/40 text-tone-amber-vivid/40',
                )}
              />
            ))}
          </span>
          <p className="text-sm text-ink-2">
            Job seekers have rated Kairo{' '}
            <span className="font-semibold text-ink">4.6 / 5.0</span> on ease of finding jobs,
            as of 1 Sep 2026
          </p>
        </div>

        <p className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tone-emerald-vivid px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
            <Crown className="size-3.5 fill-white" aria-hidden />
            Premium companies
          </span>
        </p>
        <h2 className="mt-4 text-center font-display text-4xl font-semibold tracking-tight text-gradient-emerald sm:text-5xl">
          Explore jobs from premium companies
        </h2>
        <p className="mt-3 text-center text-ink-2">
          Employers who publish a salary band and a named hiring team on every role.
        </p>

        {/* one full pass scaled to the list length, so more cards do not mean
            a faster rail */}
        <Marquee speed={companies.length * 7} className="mt-10" fadeFrom="from-[color-mix(in_oklab,var(--color-tone-emerald-vivid)_9%,#fff)]">
          {companies.map((c, i) => (
            <div key={c.id} style={{ width: CARD }} className="shrink-0">
              <CompanyCard company={c} tone={CARD_TONES[i % CARD_TONES.length]} />
            </div>
          ))}
        </Marquee>

        <div className={cn(SHELL, 'mt-8 flex justify-center')}>
          <Button variant="secondary" asChild>
            <Link to="/jobs">
              View all jobs
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function CompanyCard({
  company,
  tone,
}: {
  company: (typeof companies)[number]
  tone: Tone
}) {
  return (
    <Link
      to={`/companies/${company.slug}`}
      className="relative flex h-full flex-col overflow-hidden rounded-v border border-line bg-paper p-5 shadow-v-card transition-v hover-lift"
    >
      <span className={cn('absolute inset-x-0 top-0 h-1', TONE_CLASS[tone].rail)} aria-hidden />
      <div className="mt-1 flex items-start justify-between gap-3">
        <span className="flex h-9 items-center">
          <CompanyMark company={company} size={44} />
        </span>
        <Crown className="size-4 shrink-0 fill-tone-amber-vivid text-tone-amber-vivid" aria-label="Premium employer" />
      </div>

      <h3 className="mt-4 text-xl font-semibold leading-snug text-ink">{company.name}</h3>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {(company.benefits ?? []).map((b) => (
          <li
            key={b}
            className={cn('rounded-md px-2 py-1 text-xs', TONE_CLASS[tone].bg, TONE_CLASS[tone].text)}
            title={b}
          >
            {b}
          </li>
        ))}
      </ul>

      {/* pushed to the bottom so the pill lines up across cards of any height */}
      <p className="mt-auto pt-4">
        <span className="inline-block rounded-md bg-[var(--color-tone-emerald-bg)] px-2 py-1 text-xs font-medium text-tone-emerald">
          {company.openJobs} jobs active
        </span>
      </p>
    </Link>
  )
}
