import * as React from 'react'
import { Link } from 'react-router'
import { Search, MapPin, Users2, BadgeCheck, Building2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { companies, jobs, type Company } from '@/data/mock'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/overlay'
import { CompanyMark } from '@/features/jobs/JobCard'
import { EmptyState, PageHeader } from '@/components/common'
import { Reveal, Stagger, StaggerItem, ScrambleText } from '@/components/motion'

/** P4 — Companies directory. */

function useCompanySearch() {
  const [query, setQuery] = React.useState('')
  const [industry, setIndustry] = React.useState<string | null>(null)
  const [verifiedOnly, setVerifiedOnly] = React.useState(false)

  const industries = React.useMemo(
    () => [...new Set(companies.map((c) => c.industry))],
    [],
  )

  const results = companies.filter((c) => {
    if (verifiedOnly && !c.verified) return false
    if (industry && c.industry !== industry) return false
    if (query) {
      const hay = `${c.name} ${c.industry} ${c.location}`.toLowerCase()
      if (!hay.includes(query.toLowerCase())) return false
    }
    return true
  })

  return { query, setQuery, industry, setIndustry, verifiedOnly, setVerifiedOnly, industries, results }
}

type Search = ReturnType<typeof useCompanySearch>

export function Component() {
  const variant = useVariant()
  const s = useCompanySearch()
  const Views = { a: CompaniesA, b: CompaniesB, c: CompaniesC }
  const View = Views[variant] ?? CompaniesA
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 transition-colors duration-500" aria-hidden />
      <div className="pt-2 pb-20">
        <View s={s} />
      </div>
    </>
  )
}
Component.displayName = 'CompaniesPage'

/* ══════════════════ shared ══════════════════ */

const openRoles = (id: string) => jobs.filter((j) => j.companyId === id).length

function VerifiedBadge({ verified }: { verified: boolean }) {
  if (!verified) {
    return (
      <Tooltip content="This employer has not completed domain and registration verification yet.">
        <span className="inline-flex cursor-help items-center gap-1 text-xs text-ink-3">
          <Building2 className="size-3.5" aria-hidden />
          Unverified
        </span>
      </Tooltip>
    )
  }
  return (
    <Tooltip content="A platform admin checked this company's domain and registration document before it could post jobs.">
      <span className="inline-flex cursor-help items-center gap-1 text-xs font-medium text-brand-600">
        <BadgeCheck className="size-3.5" aria-hidden />
        Verified
      </span>
    </Tooltip>
  )
}

function Filters({ s }: { s: Search }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => s.setIndustry(null)}
        aria-pressed={s.industry === null}
        className={cn(
          'rounded-full border px-3.5 py-2 text-sm font-medium transition-v',
          s.industry === null
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-line bg-paper text-ink-2 hover:border-brand-300',
        )}
      >
        All industries
      </button>
      {s.industries.map((ind) => (
        <button
          key={ind}
          type="button"
          onClick={() => s.setIndustry(ind)}
          aria-pressed={s.industry === ind}
          className={cn(
            'rounded-full border px-3.5 py-2 text-sm font-medium transition-v',
            s.industry === ind
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-line bg-paper text-ink-2 hover:border-brand-300',
          )}
        >
          {ind}
        </button>
      ))}
      <label className="ml-1 flex cursor-pointer items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          checked={s.verifiedOnly}
          onChange={(e) => s.setVerifiedOnly(e.target.checked)}
          className="size-4 accent-[var(--color-brand-600)]"
        />
        Verified only
      </label>
    </div>
  )
}

function SearchField({ s }: { s: Search }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-ink-3" aria-hidden />
      <Input
        value={s.query}
        onChange={(e) => s.setQuery(e.target.value)}
        placeholder="Search companies by name, industry or city…"
        aria-label="Search companies"
        className="h-12 pl-10 text-base"
      />
    </div>
  )
}

function Empty({ s }: { s: Search }) {
  return (
    <EmptyState
      icon={Building2}
      title="No companies match that"
      description="Try a different industry, or clear the verified-only filter."
      action={{
        label: 'Clear filters',
        onClick: () => {
          s.setQuery('')
          s.setIndustry(null)
          s.setVerifiedOnly(false)
        },
      }}
    />
  )
}

/* ══════════════════ A · bento card grid ══════════════════ */

function CompaniesA({ s }: { s: Search }) {
  return (
    // full-bleed ground matching the sticky header; the container stays centred
    // The shared Component() wrapper adds pt-2 pb-20 for every direction; the
    // ground bleeds back over it so no canvas strip shows above the footer.
    <div className="header-tint -mt-2 -mb-20 min-h-full pt-2 pb-20">
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <PageHeader
        icon={Building2}
        tone="teal"
        title="Companies hiring on Kairo"
        description={`${companies.length} employers · ${jobs.length} open roles`}
      />

      <div className="mt-6 max-w-xl">
        <SearchField s={s} />
      </div>
      <div className="mt-4">
        <Filters s={s} />
      </div>

      <p className="mt-6 text-sm text-ink-2" role="status">
        <span className="font-mono tnum font-semibold text-ink">{s.results.length}</span> companies
      </p>

      {s.results.length === 0 ? (
        <Empty s={s} />
      ) : (
        <Stagger className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" whenVisible={false}>
          {s.results.map((c) => (
            <StaggerItem key={c.id}>
              <CompanyCardA company={c} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
    </div>
  )
}

function CompanyCardA({ company }: { company: Company }) {
  const roles = openRoles(company.id)
  const sample = jobs.filter((j) => j.companyId === company.id).slice(0, 3)

  return (
    <article className="group relative h-full rounded-v border-[length:var(--v-card-border)] border-line bg-paper p-v-card shadow-v-card hover-lift">
      <div className="flex items-start gap-3">
        <CompanyMark company={company} size={44} />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-ink">
            <Link to={`/companies/${company.slug}`} className="after:absolute after:inset-0">
              {company.name}
            </Link>
          </h2>
          <p className="truncate text-sm text-ink-3">{company.industry}</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-2">{company.about}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden />
          {company.location}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users2 className="size-3.5" aria-hidden />
          {company.size}
        </span>
        <VerifiedBadge verified={company.verified} />
      </div>

      {/* sample roles reveal on hover — the reason to click */}
      <div className="mt-3 border-t border-line pt-3">
        <p className="text-sm font-medium text-brand-600">
          {roles} open {roles === 1 ? 'role' : 'roles'}
        </p>
        <ul className="mt-1 space-y-0.5 text-xs text-ink-3">
          {sample.map((j) => (
            <li key={j.id} className="truncate">
              {j.title}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

/* ══════════════════ B · sortable table ══════════════════ */

function CompaniesB({ s }: { s: Search }) {
  const [sort, setSort] = React.useState<'name' | 'roles' | 'size'>('roles')

  const rows = [...s.results].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'size') return a.size.localeCompare(b.size)
    return openRoles(b.id) - openRoles(a.id)
  })

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <h1 className="text-base font-semibold text-ink">Companies</h1>
          <ScrambleText
            as="p"
            className="font-mono text-xs text-ink-3"
            duration={480}
            text={`${s.results.length} employers / ${jobs.length} open roles`}
          />
        </div>
        <div className="min-w-64 flex-1 sm:max-w-sm">
          <SearchField s={s} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-3">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-8 rounded-v-control border border-line bg-paper px-2 text-sm text-ink outline-none focus:border-brand-500"
          >
            <option value="roles">Open roles</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
        </label>
      </div>

      <div className="py-2">
        <Filters s={s} />
      </div>

      {rows.length === 0 ? (
        <Empty s={s} />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-3">
              <th scope="col" className="py-1.5 font-medium">Company</th>
              <th scope="col" className="py-1.5 font-medium">Industry</th>
              <th scope="col" className="hidden py-1.5 font-medium md:table-cell">Location</th>
              <th scope="col" className="hidden py-1.5 font-medium md:table-cell">Size</th>
              <th scope="col" className="py-1.5 font-medium">Status</th>
              <th scope="col" className="py-1.5 text-right font-medium">Open roles</th>
            </tr>
          </thead>
          <Stagger as="tbody" className="divide-y divide-line" whenVisible={false}>
            {rows.map((c) => (
              <StaggerItem as="tr" key={c.id} className="hover:bg-hover">
                <td className="py-1.5">
                  <Link
                    to={`/companies/${c.slug}`}
                    className="inline-flex items-center gap-2 font-medium text-ink hover:text-brand-700"
                  >
                    <CompanyMark company={c} size={22} />
                    {c.name}
                  </Link>
                </td>
                <td className="py-1.5 text-ink-2">{c.industry}</td>
                <td className="hidden py-1.5 text-ink-3 md:table-cell">{c.location}</td>
                <td className="hidden py-1.5 font-mono text-xs text-ink-3 md:table-cell">{c.size}</td>
                <td className="py-1.5">
                  <VerifiedBadge verified={c.verified} />
                </td>
                <td className="py-1.5 text-right font-mono tnum font-medium text-ink">
                  {openRoles(c.id)}
                </td>
              </StaggerItem>
            ))}
          </Stagger>
        </table>
      )}
    </div>
  )
}

/* ══════════════════ C · large cover cards ══════════════════ */

function CompaniesC({ s }: { s: Search }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
          Places worth working
        </h1>
        <p className="mt-4 text-lg text-ink-2">
          {companies.length} employers, each verified before they can post a single role.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-xl">
        <SearchField s={s} />
      </div>
      <div className="mt-5 flex justify-center">
        <Filters s={s} />
      </div>

      {s.results.length === 0 ? (
        <Empty s={s} />
      ) : (
        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2">
          {s.results.map((c) => (
            <StaggerItem key={c.id}>
              <CompanyCardC company={c} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}

function CompanyCardC({ company }: { company: Company }) {
  const roles = openRoles(company.id)
  return (
    <article className="group relative h-full overflow-hidden rounded-v bg-paper shadow-v-card hover-lift">
      <div
        className="h-24"
        style={{
          background: `linear-gradient(135deg, oklch(0.93 0.06 ${company.logoHue}), oklch(0.98 0.02 ${company.logoHue}))`,
        }}
        aria-hidden
      />
      <div className="-mt-8 px-7 pb-7">
        <div className="inline-block rounded-v bg-paper p-1.5 shadow-md">
          <CompanyMark company={company} size={52} />
        </div>

        <h2 className="font-display tracking-tight mt-4 text-2xl font-semibold text-ink">
          <Link to={`/companies/${company.slug}`} className="after:absolute after:inset-0">
            {company.name}
          </Link>
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-3">
          <span>{company.industry}</span>
          <span>·</span>
          <span>{company.location}</span>
          <VerifiedBadge verified={company.verified} />
        </div>

        <p className="mt-4 leading-relaxed text-ink-2">{company.about}</p>

        <div className="mt-6 flex items-center justify-between">
          <Badge tone="brand" size="lg">
            {roles} open {roles === 1 ? 'role' : 'roles'}
          </Badge>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            View company
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  )
}
