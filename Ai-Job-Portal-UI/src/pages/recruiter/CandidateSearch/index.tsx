import * as React from 'react'
import { Link } from 'react-router'
import { Search, Lock, Unlock, MapPin, Briefcase, GraduationCap, Filter, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { applicants, facets, type Applicant } from '@/data/mock'
import { billing } from '@/data/console'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, Checkbox } from '@/components/ui/controls'
import { Sheet, SheetContent, SheetTrigger, Tooltip } from '@/components/ui/overlay'
import { PageHeader, EmptyState, DataTable, type Column } from '@/components/common'
import { Stagger, StaggerItem } from '@/components/motion'
import { ScoreBadge, ScoreRing, AIProvenanceChip } from '@/components/brand'

/**
 * R10 — Candidate database search (PRD Part 22 / 44).
 *
 * The rule this screen exists to make visible: a recruiter sees
 * *capability* before they see *identity*. PII stays locked until an
 * entitled unlock is spent, and the lock is a designed state — not a
 * blurred afterthought.
 */

interface Result extends Applicant {
  unlocked: boolean
}

function maskName(name: string) {
  return name
    .split(' ')
    .map((p) => p[0] + '·'.repeat(Math.max(2, p.length - 1)))
    .join(' ')
}

function useCandidateSearch() {
  const [query, setQuery] = React.useState('')
  const [skills, setSkills] = React.useState<string[]>([])
  const [minExp, setMinExp] = React.useState(0)
  const [unlocked, setUnlocked] = React.useState<string[]>(['a1'])
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const unlockMeter = billing.usage.find((u) => u.label === 'Candidate unlocks')!
  const used = unlockMeter.used + (unlocked.length - 1)
  const limit = unlockMeter.limit ?? 50

  const results: Result[] = React.useMemo(
    () =>
      applicants
        .filter((a) => {
          if (a.totalExperience < minExp) return false
          if (skills.length && !skills.some((s) => a.matchedSkills.some((m) => m.name === s)))
            return false
          if (query) {
            const hay = `${a.headline} ${a.matchedSkills.map((s) => s.name).join(' ')} ${a.education}`
            if (!hay.toLowerCase().includes(query.toLowerCase())) return false
          }
          return true
        })
        .map((a) => ({ ...a, unlocked: unlocked.includes(a.id) })),
    [query, skills, minExp, unlocked],
  )

  const unlock = (id: string) => {
    if (used >= limit) return
    setUnlocked((u) => (u.includes(id) ? u : [...u, id]))
  }
  const toggleSkill = (s: string) =>
    setSkills((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]))

  return {
    query, setQuery, skills, toggleSkill, minExp, setMinExp,
    results, unlock, used, limit, activeId, setActiveId,
    clear: () => { setQuery(''); setSkills([]); setMinExp(0) },
  }
}

type S = ReturnType<typeof useCandidateSearch>

export function Component() {
  const variant = useVariant()
  const s = useCandidateSearch()
  const Views = { a: SearchA, b: SearchB, c: SearchC }
  const View = Views[variant] ?? SearchA
  return <View s={s} />
}
Component.displayName = 'CandidateSearchPage'

/* ══════════════════ shared ══════════════════ */

function UnlockMeter({ s, compact }: { s: S; compact?: boolean }) {
  const pct = (s.used / s.limit) * 100
  const full = s.used >= s.limit
  return (
    <div
      className={cn(
        'rounded-v border bg-paper',
        full ? 'border-warning/30' : 'border-line',
        compact ? 'px-3 py-2' : 'p-v-card shadow-v-card',
      )}
    >
      <p className={cn('font-medium', compact ? 'text-xs text-ink-3' : 'text-xs uppercase tracking-wide text-ink-3')}>
        Profile unlocks
      </p>
      <p className={cn('font-mono tnum font-bold text-ink', compact ? 'text-base' : 'mt-1 text-2xl')}>
        {s.used}
        <span className="text-sm font-normal text-ink-3"> / {s.limit}</span>
      </p>
      {!compact && (
        <>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle">
            <div
              className={cn('h-full rounded-full', full ? 'bg-warning' : 'bg-brand-600')}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-3">
            {full ? 'Limit reached this month — upgrade to unlock more.' : `${s.limit - s.used} left this month on Growth.`}
          </p>
          <Button variant="secondary" size="sm" className="mt-3 w-full" asChild>
            <Link to="/recruiter/billing">Manage plan</Link>
          </Button>
        </>
      )}
    </div>
  )
}

function Filters({ s }: { s: S }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">Skills</h3>
        <div className="flex flex-wrap gap-1.5">
          {facets.topSkills.map((sk) => {
            const on = s.skills.includes(sk)
            return (
              <button
                key={sk}
                type="button"
                onClick={() => s.toggleSkill(sk)}
                aria-pressed={on}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-v',
                  on
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-line bg-paper text-ink-2 hover:border-brand-300',
                )}
              >
                {sk}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">Minimum experience</h3>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={10}
            value={s.minExp}
            onChange={(e) => s.setMinExp(Number(e.target.value))}
            className="h-1.5 flex-1 accent-[var(--color-brand-600)]"
            aria-label="Minimum years of experience"
          />
          <span className="w-14 shrink-0 text-right font-mono tnum text-sm font-medium text-ink">
            {s.minExp}+ yrs
          </span>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">Other filters</h3>
        <ul className="space-y-1.5">
          {['Available immediately', 'Open to relocation', 'Has certifications', 'Assessment completed'].map((l) => (
            <li key={l}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-2">
                <Checkbox /> {l}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <Button variant="ghost" size="sm" className="w-full" onClick={s.clear}>
        Reset filters
      </Button>
    </div>
  )
}

/** The locked state, designed. Capability visible, identity not. */
function ResultCard({ r, s, large }: { r: Result; s: S; large?: boolean }) {
  return (
    <article
      className={cn(
        'h-full rounded-v border-[length:var(--v-card-border)] border-line bg-paper shadow-v-card hover-lift',
        large ? 'p-6' : 'p-v-card',
      )}
    >
      <div className="flex items-start gap-3">
        {r.unlocked ? (
          <Avatar name={r.name} id={r.id} size={large ? 'lg' : 'md'} />
        ) : (
          <span
            className={cn(
              'grid shrink-0 place-items-center rounded-full bg-subtle text-ink-3',
              large ? 'size-12' : 'size-9',
            )}
            aria-hidden
          >
            <Lock className={large ? 'size-5' : 'size-4'} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h3 className={cn('font-semibold', r.unlocked ? 'text-ink' : 'text-ink-3', large && 'text-lg')}>
            {r.unlocked ? r.name : maskName(r.name)}
          </h3>
          <p className="truncate text-sm text-ink-2">{r.headline}</p>
        </div>

        <ScoreRing score={r.score} meetsHardRequirements={r.meetsHardRequirements} size={large ? 'md' : 'sm'} />
      </div>

      {/* capability is always visible — that is what search is for */}
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-ink-2">
          <Briefcase className="size-3.5 shrink-0 text-ink-3" aria-hidden />
          {r.totalExperience} years experience
        </div>
        <div className="flex items-center gap-2 text-ink-2">
          <GraduationCap className="size-3.5 shrink-0 text-ink-3" aria-hidden />
          {r.unlocked ? r.education : r.education.replace(/,.*/, ', institution hidden')}
        </div>
        <div className="flex items-center gap-2 text-ink-2">
          <MapPin className="size-3.5 shrink-0 text-ink-3" aria-hidden />
          {r.locationNarrative.split('—')[0].trim()}
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {r.matchedSkills.slice(0, 5).map((sk) => (
          <Badge key={sk.name} tone="brand" size="sm">
            {sk.name}
          </Badge>
        ))}
      </div>

      <div className="mt-4 border-t border-line pt-3">
        {r.unlocked ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link to={`/recruiter/candidates/${r.id}`}>View full profile</Link>
            </Button>
            <Button size="sm" variant="secondary">
              Message
            </Button>
          </div>
        ) : (
          <div>
            <Button size="sm" onClick={() => s.unlock(r.id)} disabled={s.used >= s.limit}>
              <Unlock className="size-4" />
              Unlock contact details
            </Button>
            <p className="mt-1.5 text-[11px] leading-snug text-ink-3">
              Spends 1 of your {s.limit} monthly unlocks. The candidate is told their profile was
              viewed.
            </p>
          </div>
        )}
      </div>
    </article>
  )
}

function PrivacyNote() {
  return (
    <div className="flex items-start gap-2 rounded-v border border-line bg-canvas p-3">
      <Info className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
      <p className="text-xs leading-relaxed text-ink-2">
        You are searching a structured skills database, not a resume dump. Names and contact details
        stay hidden until you spend an unlock, candidates are notified when their profile is viewed,
        and anyone set to “Hidden” never appears here at all.
      </p>
    </div>
  )
}

/* ══════════════════ A · facets + cards ══════════════════ */

function SearchA({ s }: { s: S }) {
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={Search}
        tone="sky"
        title="Search candidates"
        description="Find people by what they can do — identity stays private until you unlock it."
        actions={<AIProvenanceChip what="ranks these results against your open roles" />}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <UnlockMeter s={s} />
          <div className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
            <Filters s={s} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <Input
              value={s.query}
              onChange={(e) => s.setQuery(e.target.value)}
              placeholder="Skills, titles, education…"
              aria-label="Search candidates"
              className="h-11 pl-9"
            />
          </div>

          <div className="mt-3">
            <PrivacyNote />
          </div>

          <p className="mt-4 text-sm text-ink-2" role="status">
            <span className="font-mono tnum font-semibold text-ink">{s.results.length}</span>{' '}
            candidates
          </p>

          {s.results.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No candidates match"
              description="Loosen a skill filter or lower the experience minimum."
              action={{ label: 'Reset filters', onClick: s.clear }}
            />
          ) : (
            <Stagger className="mt-3 grid gap-4 sm:grid-cols-2" whenVisible={false}>
              {s.results.map((r) => (
                <StaggerItem key={r.id}>
                  <ResultCard r={r} s={s} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════ B · table ══════════════════ */

function SearchB({ s }: { s: S }) {
  const columns: Column<Result>[] = [
    {
      key: 'name', header: 'Candidate', primary: true,
      cell: (r) => (
        <span className="flex items-center gap-2">
          {!r.unlocked && <Lock className="size-3.5 shrink-0 text-ink-3" aria-hidden />}
          <span className={cn('font-medium', r.unlocked ? 'text-ink' : 'text-ink-3')}>
            {r.unlocked ? r.name : maskName(r.name)}
          </span>
        </span>
      ),
    },
    { key: 'headline', header: 'Current role', hideBelow: 'md', cell: (r) => <span className="text-ink-2">{r.headline}</span> },
    {
      key: 'exp', header: 'Exp', align: 'right', sortable: true, sortValue: (r) => r.totalExperience,
      cell: (r) => <span className="font-mono tnum text-xs">{r.totalExperience}y</span>,
    },
    {
      key: 'skills', header: 'Top skills', hideBelow: 'lg',
      cell: (r) => (
        <span className="text-xs text-ink-3">
          {r.matchedSkills.slice(0, 3).map((x) => x.name).join(' · ')}
        </span>
      ),
    },
    {
      key: 'score', header: 'Match', align: 'right', sortable: true, sortValue: (r) => r.score,
      cell: (r) => <ScoreBadge score={r.score} meetsHardRequirements={r.meetsHardRequirements} size="sm" />,
    },
    {
      key: 'action', header: '', align: 'right',
      cell: (r) =>
        r.unlocked ? (
          <Button size="xs" variant="secondary" asChild>
            <Link to={`/recruiter/candidates/${r.id}`}>Open</Link>
          </Button>
        ) : (
          <Button size="xs" onClick={() => s.unlock(r.id)} disabled={s.used >= s.limit}>
            <Unlock className="size-3.5" />
            Unlock
          </Button>
        ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Candidate search</h1>
          <p className="font-mono text-xs text-ink-3">
            {s.results.length} results · {s.used}/{s.limit} unlocks used
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UnlockMeter s={s} compact />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" size="sm">
                <Filter className="size-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto p-5">
              <h2 className="mb-4 font-semibold text-ink">Filters</h2>
              <Filters s={s} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <DataTable
        rows={s.results}
        columns={columns}
        rowKey={(r) => r.id}
        searchable={(r) => `${r.headline} ${r.matchedSkills.map((x) => x.name).join(' ')}`}
        searchPlaceholder="Search skills, titles, education…"
        empty={{ title: 'No candidates match', description: 'Loosen a filter.', action: { label: 'Reset', onClick: s.clear } }}
      />

      <div className="mt-4">
        <PrivacyNote />
      </div>
    </div>
  )
}

/* ══════════════════ C · search-first ══════════════════ */

function SearchC({ s }: { s: S }) {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
          Who are you looking for?
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          Search by capability. Names stay private until you choose to unlock one.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input
            value={s.query}
            onChange={(e) => s.setQuery(e.target.value)}
            placeholder="React, TypeScript, 5 years, Bengaluru…"
            aria-label="Search candidates"
            className="h-14 pl-12 text-lg"
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {facets.topSkills.slice(0, 6).map((sk) => (
            <button
              key={sk}
              type="button"
              onClick={() => s.toggleSkill(sk)}
              aria-pressed={s.skills.includes(sk)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-v',
                s.skills.includes(sk)
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-line bg-paper text-ink-2 hover:border-brand-300',
              )}
            >
              {sk}
            </button>
          ))}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" size="sm">
                <Filter className="size-4" />
                More filters
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto p-6">
              <h2 className="mb-5 text-lg font-semibold text-ink">Refine</h2>
              <Filters s={s} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <UnlockMeter s={s} />
      </div>

      {s.results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nobody matches that yet"
          description="Try fewer skills, or a lower experience minimum."
          action={{ label: 'Reset', onClick: s.clear }}
        />
      ) : (
        <Stagger className="mt-10 grid gap-6 sm:grid-cols-2">
          {s.results.map((r) => (
            <StaggerItem key={r.id}>
              <ResultCard r={r} s={s} large />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <div className="mx-auto mt-10 max-w-2xl">
        <PrivacyNote />
      </div>
    </div>
  )
}
