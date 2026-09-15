import * as React from 'react'
import { Link } from 'react-router'
import { Bookmark, AlertTriangle, Clock, Send, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { type Job } from '@/data/mock'
import { useJobs } from '@/store/jobs'
import { useAuth } from '@/store/auth'
import { relativeTime, shortDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/controls'
import { JobCard } from '@/features/jobs/JobCard'
import { PageHeader, EmptyState, DataTable, type Column } from '@/components/common'
import { Stagger, StaggerItem } from '@/components/motion'
import { ScoreBadge } from '@/components/brand'

/** C7 — Saved jobs. */

type Urgency = 'open' | 'closing' | 'closed'

interface SavedJob extends Job {
  savedAt: string
  urgency: Urgency
  daysLeft: number
}

const URGENCY: Record<Urgency, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  open: { label: 'Open', tone: 'success' },
  closing: { label: 'Closing soon', tone: 'warning' },
  closed: { label: 'Closed since you saved it', tone: 'neutral' },
}

export function useSavedJobCount() {
  const { token } = useAuth()
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    let active = true
    fetch('http://localhost:8000/api/candidate/saved-jobs', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => response.ok ? response.json() : [])
      .then((data: unknown) => {
        if (active) setCount(Array.isArray(data) ? data.length : 0)
      })
      .catch(() => { if (active) setCount(0) })
    return () => { active = false }
  }, [token])

  return count
}

function useSaved() {
  const { jobs } = useJobs()
  const { token } = useAuth()
  const [ids, setIds] = React.useState<string[]>([])
  const [savedAtById, setSavedAtById] = React.useState<Record<string, string>>({})
  const [selected, setSelected] = React.useState<string[]>([])
  const [sort, setSort] = React.useState<'saved' | 'match' | 'deadline'>('saved')

  React.useEffect(() => {
    let active = true
    fetch('http://localhost:8000/api/candidate/saved-jobs', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => response.ok ? response.json() : [])
      .then((data: unknown) => {
        if (!active) return
        const rows = Array.isArray(data) ? data as { jobId?: string; savedAt?: string }[] : []
        setIds(rows.map((row) => row.jobId).filter((id): id is string => Boolean(id)))
        setSavedAtById(Object.fromEntries(rows.map((row) => [row.jobId, row.savedAt ?? ''])))
      })
      .catch(() => { if (active) setIds([]) })
    return () => { active = false }
  }, [token])

  const list: SavedJob[] = React.useMemo(() => {
    const out = jobs
      .filter((j) => ids.includes(j.id))
      .map((j, i) => {
        const daysLeft = Math.round(
          (new Date(j.deadline).getTime() - Date.now()) / 86400000,
        )
        // j5 is the deliberately-closed one, so the warning state is visible
        const urgency: Urgency = j.id === 'j5' ? 'closed' : daysLeft <= 10 ? 'closing' : 'open'
        return {
          ...j,
          saved: true,
          savedAt: savedAtById[j.id] || new Date(Date.now() - (i + 1) * 2.4 * 86400000).toISOString(),
          urgency,
          daysLeft,
        }
      })
    return [...out].sort((a, b) => {
      if (sort === 'match') return (b.matchScore ?? 0) - (a.matchScore ?? 0)
      if (sort === 'deadline') return a.daysLeft - b.daysLeft
      return +new Date(b.savedAt) - +new Date(a.savedAt)
    })
  }, [ids, savedAtById, jobs, sort])

  const remove = (id: string) => {
    setIds((l) => l.filter((x) => x !== id))
    setSelected((s) => s.filter((x) => x !== id))
  }
  const removeMany = () => {
    setIds((l) => l.filter((x) => !selected.includes(x)))
    setSelected([])
  }
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  return { list, selected, toggle, setSelected, remove, removeMany, sort, setSort }
}

type S = ReturnType<typeof useSaved>

export function Component() {
  const variant = useVariant()
  const s = useSaved()
  const Views = { a: SavedA, b: SavedB, c: SavedC }
  const View = Views[variant] ?? SavedA
  return <View s={s} />
}
Component.displayName = 'SavedJobsPage'

/* ══════════════════ shared ══════════════════ */

function ClosedBanner() {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-v-control bg-subtle p-2.5">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-ink-3" aria-hidden />
      <p className="text-xs leading-relaxed text-ink-2">
        This role closed after you saved it. Applications are no longer accepted — but similar roles
        at the same company may still be open.
      </p>
    </div>
  )
}

function BulkBar({ s }: { s: S }) {
  if (s.selected.length === 0) return null
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-v border border-brand-200 bg-brand-50 px-3 py-2">
      <span className="text-sm font-medium text-brand-800">{s.selected.length} selected</span>
      <Button size="xs">
        <Send className="size-3.5" />
        Apply to all
      </Button>
      <Button size="xs" variant="secondary" onClick={s.removeMany}>
        <Trash2 className="size-3.5" />
        Remove
      </Button>
      <button
        type="button"
        onClick={() => s.setSelected([])}
        className="ml-auto text-xs font-medium text-brand-700 hover:underline"
      >
        Clear
      </button>
    </div>
  )
}

function SortSelect({ s }: { s: S }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-ink-3">Sort</span>
      <select
        value={s.sort}
        onChange={(e) => s.setSort(e.target.value as typeof s.sort)}
        className="h-8 rounded-v-control border border-line bg-paper px-2 text-sm text-ink outline-none focus:border-brand-500"
      >
        <option value="saved">Recently saved</option>
        <option value="match">Best match</option>
        <option value="deadline">Closing soonest</option>
      </select>
    </label>
  )
}

function Empty() {
  return (
    <EmptyState
      icon={Bookmark}
      title="Nothing saved yet"
      description="Save a role from the job list and it waits here — we'll warn you if it closes before you apply."
      action={{ label: 'Browse jobs', to: '/candidate/jobs' }}
    />
  )
}

/* ══════════════════ A · card grid ══════════════════ */

function SavedA({ s }: { s: S }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={Bookmark}
        tone="teal"
        title="Saved jobs"
        description={`${s.list.length} saved · ${s.list.filter((j) => j.urgency === 'closing').length} closing within 10 days`}
        actions={<SortSelect s={s} />}
      />

      <div className="mt-5">
        <BulkBar s={s} />
        {s.list.length === 0 ? (
          <Empty />
        ) : (
          <Stagger className="grid gap-4 sm:grid-cols-2" whenVisible={false}>
            {s.list.map((j) => (
              <StaggerItem key={j.id}>
                <div className="relative h-full">
                  <label className="absolute left-3 top-3 z-10">
                    <Checkbox
                      checked={s.selected.includes(j.id)}
                      onCheckedChange={() => s.toggle(j.id)}
                      aria-label={`Select ${j.title}`}
                    />
                  </label>
                  <div className={cn('h-full pl-8', j.urgency === 'closed' && 'opacity-75')}>
                    <JobCard job={j} variant="a" onSave={() => s.remove(j.id)} />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone={URGENCY[j.urgency].tone} size="sm">
                        {URGENCY[j.urgency].label}
                      </Badge>
                      {j.urgency !== 'closed' && (
                        <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                          <Clock className="size-3.5" aria-hidden />
                          {j.daysLeft} days left
                        </span>
                      )}
                      <span className="text-xs text-ink-3">
                        · saved {relativeTime(j.savedAt)}
                      </span>
                    </div>
                    {j.urgency === 'closed' && <ClosedBanner />}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  )
}

/* ══════════════════ B · table ══════════════════ */

function SavedB({ s }: { s: S }) {
  const columns: Column<SavedJob>[] = [
    {
      key: 'title', header: 'Role', primary: true, sortable: true, sortValue: (j) => j.title,
      cell: (j) => (
        <Link to={`/jobs/${j.id}`} className="font-medium text-ink hover:text-brand-700">
          {j.title}
        </Link>
      ),
    },
    { key: 'loc', header: 'Location', hideBelow: 'md', cell: (j) => <span className="text-ink-2">{j.location}</span> },
    {
      key: 'status', header: 'Status',
      cell: (j) => <Badge tone={URGENCY[j.urgency].tone} size="sm">{URGENCY[j.urgency].label}</Badge>,
    },
    {
      key: 'left', header: 'Closes in', align: 'right', sortable: true, sortValue: (j) => j.daysLeft,
      cell: (j) => (
        <span className={cn('font-mono tnum text-xs', j.daysLeft <= 10 ? 'text-warning' : 'text-ink-3')}>
          {j.urgency === 'closed' ? '—' : `${j.daysLeft}d`}
        </span>
      ),
    },
    {
      key: 'match', header: 'Match', align: 'right', sortable: true, sortValue: (j) => j.matchScore ?? 0,
      cell: (j) => (j.matchScore != null ? <ScoreBadge score={j.matchScore} size="sm" /> : null),
    },
    {
      key: 'saved', header: 'Saved', align: 'right', hideBelow: 'lg', sortable: true, sortValue: (j) => j.savedAt,
      cell: (j) => <span className="font-mono text-xs text-ink-3">{relativeTime(j.savedAt)}</span>,
    },
    {
      key: 'actions', header: '', align: 'right',
      cell: (j) => (
        <Button variant="ghost" size="icon-sm" onClick={() => s.remove(j.id)} aria-label="Remove">
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Saved jobs</h1>
          <p className="font-mono text-xs text-ink-3">
            {s.list.length} saved / {s.list.filter((j) => j.urgency === 'closing').length} closing soon
          </p>
        </div>
        <SortSelect s={s} />
      </div>

      <DataTable
        rows={s.list}
        columns={columns}
        rowKey={(j) => j.id}
        selectable
        searchable={(j) => `${j.title} ${j.location}`}
        searchPlaceholder="Search saved jobs…"
        bulkActions={(sel, clear) => (
          <>
            <Button size="xs">Apply to {sel.length}</Button>
            <Button size="xs" variant="secondary" onClick={clear}>
              Remove
            </Button>
          </>
        )}
        empty={{ title: 'Nothing saved yet', description: 'Save a role and it waits here.' }}
      />
    </div>
  )
}

/* ══════════════════ C · board by urgency ══════════════════ */

function SavedC({ s }: { s: S }) {
  const columns: { key: Urgency; label: string; hint: string }[] = [
    { key: 'closing', label: 'Closing soon', hint: 'Apply in the next few days' },
    { key: 'open', label: 'Open', hint: 'No rush yet' },
    { key: 'closed', label: 'Closed', hint: 'No longer accepting' },
  ]

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-10 sm:px-6">
      <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
        Saved for later
      </h1>
      <p className="mt-3 text-lg text-ink-2">Grouped by how long you have left to act.</p>

      {s.list.length === 0 ? (
        <Empty />
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {columns.map((col) => {
            const items = s.list.filter((j) => j.urgency === col.key)
            return (
              <section key={col.key}>
                <div className="mb-4">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-ink">
                    {col.label}
                    <span className="font-mono tnum text-sm text-ink-3">{items.length}</span>
                  </h2>
                  <p className="text-sm text-ink-3">{col.hint}</p>
                </div>
                <Stagger className="space-y-4">
                  {items.map((j) => (
                    <StaggerItem key={j.id}>
                      <div className={cn(col.key === 'closed' && 'opacity-70')}>
                        <JobCard job={j} variant="c" onSave={() => s.remove(j.id)} />
                        {col.key === 'closing' && (
                          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-warning">
                            <Clock className="size-4" aria-hidden />
                            {j.daysLeft} days left · closes {shortDate(j.deadline)}
                          </p>
                        )}
                        {col.key === 'closed' && <ClosedBanner />}
                      </div>
                    </StaggerItem>
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-v border border-dashed border-line py-10 text-center text-sm text-ink-3">
                      Nothing here
                    </div>
                  )}
                </Stagger>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
