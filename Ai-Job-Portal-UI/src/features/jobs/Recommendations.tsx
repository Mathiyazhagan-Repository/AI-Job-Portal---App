import * as React from 'react'
import { Link } from 'react-router'
import { Sparkles, ArrowRight, Info, FileUp, MapPin, Wallet, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompanies } from '@/store/companies'
import { salaryLPA, relativeTime, titleCase } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AIProvenanceChip, ScoreBadge, MatchPrism } from '@/components/brand'
import { CompanyMark } from '@/features/jobs/JobCard'
import { TONE_CLASS, type Tone } from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { useRecommendations, type Recommendation } from './useRecommendations'

/**
 * "Recommended for you" — the candidate-facing surface for AI matching.
 *
 * It sits above search results rather than replacing them, because the
 * product rule is that the model ranks and explains but never filters: every
 * job is still reachable through the normal list, recommendations just say
 * which ones are worth reading first, and why.
 */

const REC_TONES: Tone[] = ['indigo', 'fuchsia', 'teal', 'amber']

function WhyThis({ rec }: { rec: Recommendation }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline"
      >
        <Info className="size-3.5" aria-hidden />
        {open ? 'Hide the reasoning' : 'Why this score?'}
      </button>
      {open && (
        <div className="mt-2 rounded-v-control bg-subtle p-3">
          <MatchPrism
            score={rec.score}
            breakdown={rec.breakdown}
            matchedSkills={rec.matchedSkills}
            missingSkills={rec.missingSkills}
            meetsHardRequirements={rec.meetsHardRequirements}
            layout="panel"
            size="sm"
            defaultExpanded
          />
        </div>
      )}
    </div>
  )
}

/* ══════════════════ A · editorial cards ══════════════════ */

function RecCardA({ rec, tone, companyById }: { rec: Recommendation; tone: Tone; companyById: (id: string) => any }) {
  const { job } = rec
  const company = companyById(job.companyId)
  const t = TONE_CLASS[tone]

  return (
    <article className="relative h-full overflow-hidden rounded-v border border-line bg-paper p-4 shadow-v-card hover-lift">
      <span className={cn('absolute inset-x-0 top-0 h-1', t.rail)} aria-hidden />

      <div className="mt-1 flex items-start gap-3">
        <CompanyMark company={company} size={40} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-ink">
            <Link to={`/jobs/${job.id}`} className="hover:text-brand-700">
              {job.title}
            </Link>
          </h3>
          <p className="truncate text-sm text-ink-2">{company?.name}</p>
        </div>
        <ScoreBadge
          score={rec.score}
          meetsHardRequirements={rec.meetsHardRequirements}
          size="sm"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden />
          {job.location} · {titleCase(job.workMode)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Wallet className="size-3.5" aria-hidden />
          {salaryLPA(job.salaryMin, job.salaryMax, job.salaryVisible)}
        </span>
      </div>

      {/* the reason is the point of the card — it is never just a number */}
      <p className={cn('mt-3 rounded-v-control p-2.5 text-xs leading-relaxed', t.bg)}>
        <span className={cn('font-semibold', t.text)}>Why you: </span>
        <span className="text-ink-2">{rec.reason}</span>
      </p>

      {rec.missingSkills.length > 0 && (
        <p className="mt-2 text-xs leading-relaxed text-ink-3">
          Not on your profile yet: {rec.missingSkills.slice(0, 3).join(', ')}
          {rec.missingSkills.length > 3 && ` +${rec.missingSkills.length - 3}`}
        </p>
      )}

      <WhyThis rec={rec} />

      <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
        <Button size="xs" asChild>
          <Link to={`/jobs/${job.id}`}>
            View role
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
        <span className="ml-auto self-center text-[11px] text-ink-3">
          posted {relativeTime(job.postedAt)}
        </span>
      </div>
    </article>
  )
}

/* ══════════════════ the section ══════════════════ */

export function Recommendations({
  variant = 'a',
  limit = 4,
  className,
}: {
  variant?: 'a' | 'b' | 'c'
  limit?: number
  className?: string
}) {
  const recs = useRecommendations(limit)
  const { companyById } = useCompanies()
  const [seed, setSeed] = React.useState(0)

  const pool = recs.qualified.length ? recs.qualified : recs.all
  // more results than fit means "show me others" pages through them; fewer
  // means there is nothing else to show, and padding the row by wrapping
  // around would just print the same job twice
  const canPage = pool.length > limit

  const shown = React.useMemo(() => {
    if (!canPage) return pool
    const start = (seed * limit) % pool.length
    const out = pool.slice(start, start + limit)
    return out.length < limit ? [...out, ...pool.slice(0, limit - out.length)] : out
  }, [pool, canPage, seed, limit])

  if (recs.isLoading) {
    return (
      <section className={cn('animate-pulse', className)} aria-label="Loading recommendations">
        <div className="h-8 w-64 rounded bg-line mb-4" />
        <div className="h-48 rounded-v bg-paper shadow-sm" />
      </section>
    )
  }

  if (recs.all.length === 0) return null

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
          <span
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--color-tone-fuchsia-bg)] text-tone-fuchsia"
            aria-hidden
          >
            <Sparkles className="size-4.5" />
          </span>
          Recommended for you
        </h2>
        <p className="mt-1 text-sm text-ink-2">
          Ranked against your profile — {recs.skillCount} skills,{' '}
          {recs.filledFrom ? (
            <>read from <span className="font-medium text-ink">{recs.filledFrom.label}</span></>
          ) : (
            'entered by you'
          )}
          .{' '}
          {recs.qualified.length > 0
            ? `${recs.qualified.length} open ${recs.qualified.length === 1 ? 'role meets' : 'roles meet'} every hard requirement on your profile.`
            : 'No open role meets every hard requirement yet, so these are the closest.'}{' '}
          Nothing is filtered out of search — this is only what to read first.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <AIProvenanceChip
          what="ranked these against your profile"
          cannot="It cannot apply for you, hide a job from you, or tell an employer you looked."
        />
        {canPage && (
          <Button size="sm" variant="secondary" onClick={() => setSeed((s) => s + 1)}>
            <RefreshCw className="size-3.5" />
            Show me others
          </Button>
        )}
      </div>
    </div>
  )

  /* ── B · dense rows, no cards ── */
  if (variant === 'b') {
    return (
      <section className={cn('border-b border-line pb-3', className)} aria-label="Recommended for you">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Sparkles className="size-4 text-brand-600" aria-hidden />
            Recommended for you
          </h2>
          {canPage && (
            <button
              type="button"
              onClick={() => setSeed((s) => s + 1)}
              className="font-mono text-xs text-ink-3 hover:text-ink"
            >
              next {limit} →
            </button>
          )}
        </div>
        <ul className="divide-y divide-line">
          {shown.map((rec) => (
            <li key={rec.job.id}>
              <Link
                to={`/jobs/${rec.job.id}`}
                className="flex items-center gap-3 py-1.5 text-sm transition-v hover:bg-hover"
              >
                <ScoreBadge
                  score={rec.score}
                  meetsHardRequirements={rec.meetsHardRequirements}
                  size="sm"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{rec.job.title}</span>
                <span className="hidden min-w-0 flex-1 truncate text-xs text-ink-3 md:block">
                  {rec.reason}
                </span>
                <span className="w-28 shrink-0 truncate text-right font-mono text-xs text-ink-3">
                  {companyById(rec.job.companyId)?.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  /* ── C · one hero recommendation, large type ── */
  if (variant === 'c') {
    const hero = shown[0]
    return (
      <Reveal className={cn('rounded-v bg-paper p-6 shadow-lg sm:p-8', className)}>
        <Badge tone="brand" size="sm">
          <Sparkles className="size-3" aria-hidden />
          Your strongest match today
        </Badge>
        <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          <Link to={`/jobs/${hero.job.id}`} className="hover:text-brand-700">
            {hero.job.title}
          </Link>
        </h2>
        <p className="mt-2 text-lg text-ink-2">
          {companyById(hero.job.companyId)?.name} · {hero.job.location}
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2">{hero.reason}</p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <MatchPrism
            score={hero.score}
            breakdown={hero.breakdown}
            matchedSkills={hero.matchedSkills}
            missingSkills={hero.missingSkills}
            meetsHardRequirements={hero.meetsHardRequirements}
            layout="ring"
            size="lg"
          />
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={`/jobs/${hero.job.id}`}>
                View this role
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            {canPage && (
              <Button variant="secondary" onClick={() => setSeed((s) => s + 1)}>
                Show me another
              </Button>
            )}
          </div>
        </div>

        <ul className="mt-8 grid gap-2 border-t border-line pt-5 sm:grid-cols-3">
          {shown.slice(1, 4).map((rec) => (
            <li key={rec.job.id}>
              <Link to={`/jobs/${rec.job.id}`} className="group block">
                <p className="font-medium text-ink group-hover:text-brand-700">{rec.job.title}</p>
                <p className="truncate text-sm text-ink-3">
                  {companyById(rec.job.companyId)?.name} · {rec.score}% match
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    )
  }

  /* ── A · editorial card row ── */
  return (
    <section className={className} aria-label="Recommended for you">
      {header}
      <Stagger
        className="mt-4 grid gap-4 sm:grid-cols-2"
        whenVisible={false}
      >
        {shown.map((rec, i) => (
          <StaggerItem key={rec.job.id}>
            <RecCardA rec={rec} tone={REC_TONES[i % REC_TONES.length]} companyById={companyById} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}

/**
 * Shown to a signed-out visitor in place of the real recommendations —
 * it says what they would get without inventing a score for a profile that
 * does not exist yet.
 */
export function RecommendationsTeaser({ className }: { className?: string }) {
  return (
    <section
      className={cn('relative overflow-hidden rounded-v border border-line p-5', className)}
      aria-label="Recommendations"
    >
      <span
        className="absolute inset-0 bg-gradient-to-br from-[var(--color-tone-fuchsia-bg)] via-[var(--color-tone-violet-bg)] to-[var(--color-tone-indigo-bg)]"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center gap-4">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-v-control bg-paper/85 text-tone-fuchsia"
          aria-hidden
        >
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-ink">Get roles ranked for you</h2>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-2">
            Upload a resume and we read it into a profile, then rank every open role against it —
            and show the six components behind each score. Nothing is hidden from you either way.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/register">
              <FileUp className="size-4" />
              Upload a resume
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
