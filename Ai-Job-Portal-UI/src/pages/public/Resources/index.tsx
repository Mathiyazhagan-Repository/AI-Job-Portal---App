import * as React from 'react'
import { Link } from 'react-router'
import {
  BookOpen, Clock, ArrowRight, Search, Bookmark, TrendingUp, FileText,
  Sparkles, Users2, ShieldCheck, Calculator,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PageHeader, SectionHeading, EmptyState, MiniStat, TONE_CLASS, type Tone,
} from '@/components/common'
import { Reveal, Stagger, StaggerItem, ScrambleText } from '@/components/motion'

/**
 * P7 — Career resources.
 *
 * Editorial content marketing, marked V1.1 in the PRD. Everything here is
 * written copy, not generated: the AI-provenance rule means we never dress
 * model output up as editorial advice.
 */

export interface Article {
  id: string
  title: string
  dek: string
  category: string
  tone: Tone
  icon: React.ElementType
  readMinutes: number
  published: string
  author: string
  featured?: boolean
}

const CATEGORIES: { id: string; label: string; tone: Tone; icon: React.ElementType }[] = [
  { id: 'resume', label: 'Resumes & ATS', tone: 'indigo', icon: FileText },
  { id: 'interview', label: 'Interviewing', tone: 'fuchsia', icon: Users2 },
  { id: 'salary', label: 'Salary & offers', tone: 'amber', icon: Calculator },
  { id: 'ai', label: 'AI & hiring', tone: 'violet', icon: Sparkles },
  { id: 'rights', label: 'Your rights', tone: 'emerald', icon: ShieldCheck },
]

export const ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'What an applicant tracking system actually reads',
    dek: 'Two-column layouts, tables and text baked into images are the three things that most often stop a parser cold. Here is what survives, and how to check your own file before you send it.',
    category: 'resume', tone: 'indigo', icon: FileText,
    readMinutes: 9, published: '24 Aug 2026', author: 'Kairo editorial', featured: true,
  },
  {
    id: 'a2',
    title: 'Writing bullets that carry a measurable outcome',
    dek: '“Responsible for the design system” tells a reader nothing. “Owned the design system used by four teams” tells them scope, ownership and scale in the same number of words.',
    category: 'resume', tone: 'indigo', icon: FileText,
    readMinutes: 6, published: '18 Aug 2026', author: 'Kairo editorial',
  },
  {
    id: 'a3',
    title: 'How to talk about a project you shipped two years ago',
    dek: 'Interviewers are not testing recall. They are testing whether you can explain a decision, its trade-off, and what you would do differently now.',
    category: 'interview', tone: 'fuchsia', icon: Users2,
    readMinutes: 7, published: '15 Aug 2026', author: 'Kairo editorial',
  },
  {
    id: 'a4',
    title: 'Questions worth asking at the end of an interview',
    dek: 'Ask about how success is measured in the first ninety days, and about the last thing the team shipped that did not work. Both answers are hard to fake.',
    category: 'interview', tone: 'fuchsia', icon: Users2,
    readMinutes: 5, published: '9 Aug 2026', author: 'Kairo editorial',
  },
  {
    id: 'a5',
    title: 'Reading a salary band, and what to do when there is not one',
    dek: 'A band that spans more than 60% of its own floor is usually a level range, not a pay range. Ask which level the role is scoped at before you negotiate.',
    category: 'salary', tone: 'amber', icon: Calculator,
    readMinutes: 8, published: '2 Aug 2026', author: 'Kairo editorial',
  },
  {
    id: 'a6',
    title: 'Comparing two offers when the numbers are close',
    dek: 'Notice period, on-call load, who your manager is and whether the team ships — these move your next two years more than a 6% difference in base.',
    category: 'salary', tone: 'amber', icon: Calculator,
    readMinutes: 10, published: '28 Jul 2026', author: 'Kairo editorial',
  },
  {
    id: 'a7',
    title: 'What a match score is, and what it is not',
    dek: 'Kairo scores six weighted components — skills carry 35%. The score ranks and explains. It never decides: a person reads every shortlist before anyone is moved forward or out.',
    category: 'ai', tone: 'violet', icon: Sparkles,
    readMinutes: 6, published: '21 Jul 2026', author: 'Kairo editorial',
  },
  {
    id: 'a8',
    title: 'Why we never collect your age, gender or photo',
    dek: 'They are not predictive of whether you can do the work, and they are the easiest way for a model to learn a bias. So they are not collected, and they never reach the scoring model.',
    category: 'ai', tone: 'violet', icon: Sparkles,
    readMinutes: 4, published: '14 Jul 2026', author: 'Kairo editorial',
  },
  {
    id: 'a9',
    title: 'Your data, and how to get it back or delete it',
    dek: 'Export everything as JSON, see every recruiter who unlocked your profile, and revoke that access. Deletion removes the profile and the parsed resume together.',
    category: 'rights', tone: 'emerald', icon: ShieldCheck,
    readMinutes: 5, published: '7 Jul 2026', author: 'Kairo editorial',
  },
  {
    id: 'a10',
    title: 'What to do if you think a screening decision was wrong',
    dek: 'Every rejection carries a reason and an appeal route. A person — never a model — reviews every appeal, and the outcome is written into the audit log.',
    category: 'rights', tone: 'emerald', icon: ShieldCheck,
    readMinutes: 6, published: '30 Jun 2026', author: 'Kairo editorial',
  },
]

function useResources() {
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState<string | null>(null)

  const results = ARTICLES.filter((a) => {
    if (category && a.category !== category) return false
    if (query) {
      const hay = `${a.title} ${a.dek} ${a.category}`.toLowerCase()
      if (!hay.includes(query.toLowerCase())) return false
    }
    return true
  })

  return { query, setQuery, category, setCategory, results }
}

type R = ReturnType<typeof useResources>

export function Component() {
  const variant = useVariant()
  const r = useResources()
  const Views = { a: ResourcesA, b: ResourcesB, c: ResourcesC }
  const View = Views[variant] ?? ResourcesA
  return <View r={r} />
}
Component.displayName = 'ResourcesPage'

/* ══════════════════ shared ══════════════════ */

const catOf = (id: string) => CATEGORIES.find((c) => c.id === id)!

function ReadMeta({ a, className }: { a: Article; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3', className)}>
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3.5" aria-hidden />
        {a.readMinutes} min read
      </span>
      <span>{a.published}</span>
      <span>· {a.author}</span>
    </div>
  )
}

function CategoryChips({ r }: { r: R }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => r.setCategory(null)}
        aria-pressed={r.category === null}
        className={cn(
          'rounded-full border px-3 py-1.5 text-xs font-medium transition-v',
          r.category === null
            ? 'border-transparent bg-ink text-paper'
            : 'border-line bg-paper text-ink-2 hover:border-line-strong',
        )}
      >
        Everything
      </button>
      {CATEGORIES.map((c) => {
        const on = r.category === c.id
        const t = TONE_CLASS[c.tone]
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => r.setCategory(on ? null : c.id)}
            aria-pressed={on}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-v',
              on
                ? cn('border-transparent text-white', t.fill)
                : cn('border-line', t.bg, t.text, 'hover:brightness-95'),
            )}
          >
            <c.icon className="size-3.5" aria-hidden />
            {c.label}
          </button>
        )
      })}
    </div>
  )
}

function SearchField({ r }: { r: R }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
      <Input
        value={r.query}
        onChange={(e) => r.setQuery(e.target.value)}
        placeholder="Search articles by title or topic…"
        aria-label="Search career resources"
        className="h-11 pl-9"
      />
    </div>
  )
}

function Empty({ r }: { r: R }) {
  return (
    <EmptyState
      icon={BookOpen}
      title="Nothing matches that yet"
      description="Try a different topic, or clear the filter to see everything we have written."
      action={{
        label: 'Clear filters',
        onClick: () => {
          r.setQuery('')
          r.setCategory(null)
        },
      }}
    />
  )
}

/* ══════════════════ A · featured + card grid ══════════════════ */

function FeaturedCard({ a }: { a: Article }) {
  const c = catOf(a.category)
  const t = TONE_CLASS[a.tone]
  return (
    <article className="relative overflow-hidden rounded-v border border-line shadow-v-card">
      <span
        className="absolute inset-0 bg-gradient-to-br from-[var(--color-tone-indigo-bg)] via-[var(--color-tone-violet-bg)] to-[var(--color-tone-sky-bg)]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-[var(--color-tone-violet-vivid)] opacity-15 blur-3xl"
        aria-hidden
      />
      <div className="relative p-6 sm:p-8">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-paper/85 px-2.5 py-1 text-xs font-medium ring-1',
            t.text,
            t.ring,
          )}
        >
          <c.icon className="size-3.5" aria-hidden />
          {c.label} · featured
        </span>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          <Link to="/resources" className="after:absolute after:inset-0">
            {a.title}
          </Link>
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-2">{a.dek}</p>
        <ReadMeta a={a} className="mt-4" />
      </div>
    </article>
  )
}

function ArticleCard({ a }: { a: Article }) {
  const c = catOf(a.category)
  const t = TONE_CLASS[a.tone]
  return (
    <article className="group relative h-full overflow-hidden rounded-v border border-line bg-paper p-v-card shadow-v-card hover-lift">
      <span className={cn('absolute inset-x-0 top-0 h-1', t.rail)} aria-hidden />
      <div className="mt-1 flex items-start gap-3">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-v-control', t.bg, t.text)} aria-hidden>
          <a.icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className={cn('text-[11px] font-semibold uppercase tracking-wide', t.text)}>
            {c.label}
          </span>
          <h3 className="mt-0.5 font-semibold leading-snug text-ink">
            <Link to="/resources" className="after:absolute after:inset-0">
              {a.title}
            </Link>
          </h3>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-2">{a.dek}</p>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <ReadMeta a={a} />
        <ArrowRight
          className={cn('size-4 shrink-0 transition-transform group-hover:translate-x-0.5', t.text)}
          aria-hidden
        />
      </div>
    </article>
  )
}

function ResourcesA({ r }: { r: R }) {
  const featured = ARTICLES.find((a) => a.featured)!
  const rest = r.results.filter((a) => !a.featured)
  const showFeatured = !r.query && !r.category

  const perCategory = CATEGORIES.map((c) => ({
    tone: c.tone,
    icon: c.icon,
    label: c.label,
    value: ARTICLES.filter((a) => a.category === c.id).length,
  }))

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <PageHeader
        icon={BookOpen}
        tone="violet"
        title="Career resources"
        description={`${ARTICLES.length} articles on resumes, interviewing, offers and how our AI is allowed to behave.`}
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {perCategory.map((m) => (
          <MiniStat key={m.label} {...m} />
        ))}
      </div>

      <div className="mt-6 max-w-xl">
        <SearchField r={r} />
      </div>
      <div className="mt-4">
        <CategoryChips r={r} />
      </div>

      {showFeatured && (
        <Reveal className="mt-6">
          <FeaturedCard a={featured} />
        </Reveal>
      )}

      <p className="mt-6 text-sm text-ink-2" role="status">
        <span className="font-mono tnum font-semibold text-ink">{r.results.length}</span> articles
      </p>

      {r.results.length === 0 ? (
        <Empty r={r} />
      ) : (
        <Stagger className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" whenVisible={false}>
          {(showFeatured ? rest : r.results).map((a) => (
            <StaggerItem key={a.id}>
              <ArticleCard a={a} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Reveal className="mt-10 rounded-v border border-line bg-paper p-5 shadow-v-card">
        <SectionHeading title="Everything here is written, not generated" icon={ShieldCheck} tone="emerald" />
        <p className="max-w-3xl text-sm leading-relaxed text-ink-2">
          Kairo uses a model to rank and explain matches. It does not write this advice. Nothing on
          this page is model output presented as editorial, and no article is personalised using your
          profile.
        </p>
      </Reveal>
    </div>
  )
}

/* ══════════════════ B · list with a category rail ══════════════════ */

function ResourcesB({ r }: { r: R }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Career resources</h1>
          <p className="font-mono text-xs text-ink-3">
            {r.results.length} shown / {ARTICLES.length} total
          </p>
        </div>
        <div className="w-full max-w-xs">
          <SearchField r={r} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[190px_1fr]">
        <nav aria-label="Categories">
          <ul className="sticky top-20 space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => r.setCategory(null)}
                aria-pressed={r.category === null}
                className={cn(
                  'flex w-full items-center justify-between rounded-v-control px-2 py-1.5 text-left text-sm transition-v',
                  r.category === null ? 'bg-subtle font-medium text-ink' : 'text-ink-2 hover:bg-hover',
                )}
              >
                Everything
                <span className="font-mono text-xs text-ink-3">{ARTICLES.length}</span>
              </button>
            </li>
            {CATEGORIES.map((c) => {
              const n = ARTICLES.filter((a) => a.category === c.id).length
              const on = r.category === c.id
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => r.setCategory(on ? null : c.id)}
                    aria-pressed={on}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-v-control px-2 py-1.5 text-left text-sm transition-v',
                      on ? 'bg-subtle font-medium text-ink' : 'text-ink-2 hover:bg-hover',
                    )}
                  >
                    <c.icon className={cn('size-4 shrink-0', TONE_CLASS[c.tone].text)} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{c.label}</span>
                    <span className="font-mono text-xs text-ink-3">{n}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {r.results.length === 0 ? (
          <Empty r={r} />
        ) : (
          <ul className="divide-y divide-line rounded-v border border-line bg-paper">
            {r.results.map((a) => {
              const c = catOf(a.category)
              return (
                <li key={a.id}>
                  <Link
                    to="/resources"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm transition-v hover:bg-hover"
                  >
                    <span
                      className={cn('size-1.5 shrink-0 rounded-full', TONE_CLASS[a.tone].fill)}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">{a.title}</span>
                    <span className="hidden w-32 shrink-0 truncate text-xs text-ink-3 sm:block">
                      {c.label}
                    </span>
                    <span className="w-20 shrink-0 text-right font-mono text-xs text-ink-3">
                      {a.readMinutes} min
                    </span>
                    <span className="hidden w-24 shrink-0 text-right font-mono text-xs text-ink-3 md:block">
                      {a.published}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ══════════════════ C · magazine ══════════════════ */

function ResourcesC({ r }: { r: R }) {
  const featured = ARTICLES.find((a) => a.featured)!

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-14 sm:px-6">
      <h1 className="font-display text-display-2 font-semibold tracking-tight text-ink">
        <ScrambleText text="Career resources" />
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">
        Written by people who have sat on both sides of the table. No generated advice, no
        personalisation from your profile.
      </p>

      <div className="mt-8 max-w-lg">
        <SearchField r={r} />
      </div>
      <div className="mt-4">
        <CategoryChips r={r} />
      </div>

      {!r.query && !r.category && (
        <Reveal className="mt-12">
          <Link to="/resources" className="group block">
            <Badge tone="brand" size="sm">
              <TrendingUp className="size-3" aria-hidden />
              Most read this month
            </Badge>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-ink transition-colors group-hover:text-brand-700 sm:text-5xl">
              {featured.title}
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-2">{featured.dek}</p>
            <ReadMeta a={featured} className="mt-5" />
          </Link>
        </Reveal>
      )}

      {r.results.length === 0 ? (
        <Empty r={r} />
      ) : (
        <Stagger className="mt-14 columns-1 gap-8 sm:columns-2">
          {r.results
            .filter((a) => !a.featured || r.query || r.category)
            .map((a) => (
              <StaggerItem key={a.id}>
                <article className="mb-8 break-inside-avoid">
                  <span className={cn('text-xs font-semibold uppercase tracking-wide', TONE_CLASS[a.tone].text)}>
                    {catOf(a.category).label}
                  </span>
                  <h3 className="mt-1.5 font-display text-2xl font-semibold leading-snug tracking-tight text-ink">
                    <Link to="/resources" className="hover:text-brand-700">
                      {a.title}
                    </Link>
                  </h3>
                  <p className="mt-2.5 leading-relaxed text-ink-2">{a.dek}</p>
                  <ReadMeta a={a} className="mt-3" />
                </article>
              </StaggerItem>
            ))}
        </Stagger>
      )}

      <div className="mt-16 flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/jobs">
            Browse jobs
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/faq">
            <Bookmark className="size-4" />
            Read the FAQ
          </Link>
        </Button>
      </div>
    </div>
  )
}
