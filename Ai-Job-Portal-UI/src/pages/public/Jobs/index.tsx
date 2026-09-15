import { Link, useLocation } from 'react-router'
import { SlidersHorizontal, ArrowRight, MapPin, Briefcase, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { useJobSearch, type JobSearchState } from './useJobSearch'
import { FilterRail } from './FilterRail'
import { JobCard, CompanyMark } from '@/features/jobs/JobCard'
import { MatchPrism } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/overlay'
import { Input } from '@/components/ui/input'
import { FilteredEmptyState, Kbd } from '@/components/common'
import { Stagger, StaggerItem } from '@/components/motion'
import { Recommendations, RecommendationsTeaser } from '@/features/jobs/Recommendations'
import { useCompanies } from '@/store/companies'
import { salaryLPA, experienceRange, relativeTime, titleCase } from '@/lib/format'

export function Component() {
  const variant = useVariant()
  const state = useJobSearch()
  const Views = { a: JobsA, b: JobsB, c: JobsC }
  const View = Views[variant] ?? JobsA
  return <View state={state} />
}
Component.displayName = 'JobsPage'

/* ══════════════════ Shared bits ══════════════════ */

/** The candidate console mounts this page at /candidate/jobs. */
function useSignedIn() {
  return useLocation().pathname.startsWith('/candidate')
}

function ResultsHeader({ state }: { state: JobSearchState }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink-2" role="status">
        <span className="font-mono tnum font-semibold text-ink">{state.results.length}</span> jobs
        {state.activeChips.length > 0 && ' matching your filters'}
      </p>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-ink-3">Sort</span>
        <select
          value={state.filters.sort}
          onChange={(e) =>
            state.setFilters((f) => ({ ...f, sort: e.target.value as typeof f.sort }))
          }
          className="h-8 rounded-v-control border border-line bg-paper px-2 text-sm text-ink outline-none focus:border-brand-500"
        >
          <option value="relevance">Best match</option>
          <option value="date">Most recent</option>
          <option value="salary">Highest salary</option>
        </select>
      </label>
    </div>
  )
}

function SearchBar({ state }: { state: JobSearchState }) {
  return (
    <Input
      type="search"
      value={state.filters.query}
      onChange={(e) => state.setFilters((f) => ({ ...f, query: e.target.value }))}
      placeholder="Search job title, skill or company…"
      aria-label="Search jobs"
      className="h-11"
    />
  )
}

/* ══════════════════ A · Editorial ══════════════════ */

function JobsA({ state }: { state: JobSearchState }) {
  const signedIn = useSignedIn()

  return (
    <>
      <div className="header-tint pt-2 pb-20">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black">Find your next role</h1>
        <p className="mt-2 text-base font-medium text-slate-600">
          12,480 open roles across engineering, design, data and operations.
        </p>

        <div className="mt-8 lg:hidden">
          <SearchBar state={state} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* filter rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2">
              <FilterRail state={state} />
            </div>
          </aside>

          <main className="min-w-0 space-y-6">
            <div className="hidden lg:block">
              <SearchBar state={state} />
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="secondary" size="sm" className="rounded-xl bg-white shadow-sm border-violet-100 text-violet-700 font-medium hover:bg-violet-50">
                    <SlidersHorizontal className="size-4 mr-1.5" />
                    Filters
                    {state.activeChips.length > 0 && (
                      <Badge className="ml-1.5 bg-violet-100 text-violet-700 border-0" size="sm">
                        {state.activeChips.length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto p-5 rounded-t-[2rem] bg-gradient-to-b from-violet-50 to-white">
                  <h2 className="mb-4 font-bold text-violet-900">Filters</h2>
                  <FilterRail state={state} />
                </SheetContent>
              </Sheet>
            </div>

            {signedIn ? <Recommendations variant="a" className="pb-2" /> : <RecommendationsTeaser />}

            <ResultsHeader state={state} />

            {state.results.length === 0 ? (
              <FilteredEmptyState
                activeFilters={state.activeChips}
                onClearFilter={state.clearChip}
                onClearAll={state.clearAll}
              />
            ) : (
              <Stagger as="ul" className="space-y-4" whenVisible={false}>
                {state.results.map((job) => (
                  <StaggerItem as="li" key={job.id}>
                    <JobCard job={job} variant="a" onSave={() => state.toggleSave(job.id)} />
                  </StaggerItem>
                ))}
              </Stagger>
            )}

            {state.results.length > 0 && (
              <div className="pt-6 text-center">
                <Button size="lg" variant="secondary" className="rounded-xl border border-black/15 text-black font-bold hover:bg-black/5 transition-colors">Load more jobs</Button>
              </div>
            )}
          </main>
        </div>
        </div>
      </div>
    </>
  )
}

/* ══════════════════ B · Command Console ══════════════════ */

function JobsB({ state }: { state: JobSearchState }) {
  const job = state.selected
  const signedIn = useSignedIn()
  const { companyById } = useCompanies()

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
      {/* filters as a top bar, not a rail — buys vertical space for rows */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <h1 className="text-base font-semibold text-ink">Jobs</h1>
        <div className="min-w-64 flex-1">
          <SearchBar state={state} />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="sm">
              <SlidersHorizontal className="size-4" />
              Filters
              {state.activeChips.length > 0 && (
                <Badge tone="brand" size="sm">
                  {state.activeChips.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto p-5">
            <h2 className="mb-4 font-semibold text-ink">Filters</h2>
            <FilterRail state={state} />
          </SheetContent>
        </Sheet>
        <ResultsHeader state={state} />
      </div>

      {signedIn && <Recommendations variant="b" limit={5} className="mt-3" />}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_420px]">
        {/* dense table */}
        <div className="min-w-0">
          {state.results.length === 0 ? (
            <FilteredEmptyState
              activeFilters={state.activeChips}
              onClearFilter={state.clearChip}
              onClearAll={state.clearAll}
            />
          ) : (
            <Stagger className="divide-y divide-line border-b border-line" whenVisible={false}>
              {state.results.map((j) => (
                <StaggerItem key={j.id}>
                  <JobCard
                    job={j}
                    variant="b"
                    active={j.id === state.selectedId}
                    onSelect={() => state.setSelectedId(j.id)}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          )}
          <p className="flex items-center gap-2 py-3 text-xs text-ink-3">
            <Kbd>J</Kbd>
            <Kbd>K</Kbd> move · <Kbd>↵</Kbd> open · <Kbd>S</Kbd> save
          </p>
        </div>

        {/* docked preview — no navigation, no reload */}
        <aside className="hidden lg:block">
          {job && (
            <div className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-md border border-line bg-paper">
              <div className="border-b border-line p-4">
                <div className="flex items-start gap-3">
                  <CompanyMark company={companyById(job.companyId)} size={36} />
                  <div className="min-w-0">
                    <h2 className="font-semibold text-ink">{job.title}</h2>
                    <p className="text-sm text-ink-2">{companyById(job.companyId).name}</p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {[
                    ['Location', job.location],
                    ['Work mode', titleCase(job.workMode)],
                    ['Experience', experienceRange(job.experienceMin, job.experienceMax)],
                    ['Salary', salaryLPA(job.salaryMin, job.salaryMax, job.salaryVisible)],
                    ['Posted', relativeTime(job.postedAt)],
                    ['Applicants', String(job.applicants)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt className="text-ink-3">{k}</dt>
                      <dd className="truncate font-medium text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1" asChild>
                    <Link to={`/jobs/${job.id}`}>Apply</Link>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => state.toggleSave(job.id)}>
                    {job.saved ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </div>

              {job.matchScore != null && job.matchBreakdown && (
                <div className="border-b border-line p-4">
                  <MatchPrism
                    score={job.matchScore}
                    breakdown={job.matchBreakdown}
                    matchedSkills={job.requiredSkills.slice(0, 3)}
                    missingSkills={job.requiredSkills.slice(3)}
                    layout="inline"
                    defaultExpanded
                  />
                </div>
              )}

              <div className="p-4 text-sm leading-relaxed text-ink-2">
                <p>{job.description}</p>
                <h3 className="mt-4 mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
                  Responsibilities
                </h3>
                <ul className="list-disc space-y-1 pl-4">
                  {job.responsibilities.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

/* ══════════════════ C · Expressive ══════════════════ */

function JobsC({ state }: { state: JobSearchState }) {
  const job = state.selected
  const signedIn = useSignedIn()
  const { companyById } = useCompanies()

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
          {state.results.length} roles waiting
        </h1>
        <p className="mt-3 text-lg text-ink-2">Ranked by how well they fit you, not by who paid.</p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <SearchBar state={state} />
      </div>

      {/* filters reduced to chips + a sheet */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {state.activeChips.map((c) => (
          <button
            key={c.key}
            onClick={() => state.clearChip(c.key)}
            className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium capitalize text-brand-700"
          >
            {c.label} ✕
          </button>
        ))}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="sm">
              <SlidersHorizontal className="size-4" />
              Refine
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto p-6">
            <h2 className="mb-5 text-lg font-semibold text-ink">Refine results</h2>
            <FilterRail state={state} />
          </SheetContent>
        </Sheet>
      </div>

      {signedIn ? (
        <Recommendations variant="c" className="mx-auto mt-10 max-w-4xl" />
      ) : (
        <RecommendationsTeaser className="mx-auto mt-10 max-w-4xl" />
      )}

      {state.results.length === 0 ? (
        <FilteredEmptyState
          activeFilters={state.activeChips}
          onClearFilter={state.clearChip}
          onClearAll={state.clearAll}
        />
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          {/* scroll column */}
          <Stagger className="space-y-4 lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:pr-2" whenVisible={false}>
            {state.results.map((j) => (
              <StaggerItem key={j.id}>
                <button
                  type="button"
                  onClick={() => state.setSelectedId(j.id)}
                  className={cn(
                    'block w-full text-left transition-v',
                    j.id === state.selectedId && 'lg:scale-[1.01]',
                  )}
                >
                  <JobCard job={j} variant="c" showReason />
                </button>
              </StaggerItem>
            ))}
          </Stagger>

          {/* live detail pane */}
          {job && (
            <div className="hidden lg:block">
              <div className="sticky top-6 rounded-v bg-paper p-8 shadow-lg">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <CompanyMark company={companyById(job.companyId)} size={48} />
                      <div>
                        <p className="text-sm text-ink-2">{companyById(job.companyId).name}</p>
                        <p className="text-xs text-ink-3">{companyById(job.companyId).industry}</p>
                      </div>
                    </div>
                    <h2 className="mt-5 font-display tracking-tight text-3xl font-semibold leading-tight text-ink">
                      {job.title}
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-ink-2">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-4" aria-hidden />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="size-4" aria-hidden />
                        {experienceRange(job.experienceMin, job.experienceMax)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-4" aria-hidden />
                        {relativeTime(job.postedAt)}
                      </span>
                    </div>
                  </div>

                  {job.matchScore != null && job.matchBreakdown && (
                    <MatchPrism
                      score={job.matchScore}
                      breakdown={job.matchBreakdown}
                      matchedSkills={job.requiredSkills.slice(0, 3)}
                      missingSkills={job.requiredSkills.slice(3)}
                      layout="ring"
                      size="lg"
                    />
                  )}
                </div>

                <p className="mt-6 text-lg leading-relaxed text-ink-2">{job.description}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {job.requiredSkills.map((s) => (
                    <Badge key={s} tone="brand" size="lg">
                      {s}
                    </Badge>
                  ))}
                  {job.preferredSkills.map((s) => (
                    <Badge key={s} tone="outline" size="lg">
                      {s}
                    </Badge>
                  ))}
                </div>

                <div className="mt-8 flex gap-3">
                  <Button size="lg" className="flex-1" asChild>
                    <Link to={`/jobs/${job.id}`}>
                      Apply now
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="secondary" onClick={() => state.toggleSave(job.id)}>
                    {job.saved ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
