import * as React from 'react'
import { Link } from 'react-router'
import { Flag, Check, X, Briefcase, Building2, User, MessageSquare, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant, useAnnounce } from '@/hooks'
import { abuseReports as seed, type AbuseReport } from '@/data/console'
import { relativeTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/controls'
import { PageHeader, EmptyState, DataTable, type Column } from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'

/** A7 — Abuse reports (PRD Part 28). */

const ENTITY = {
  job: { icon: Briefcase, label: 'Job' },
  company: { icon: Building2, label: 'Company' },
  user: { icon: User, label: 'User' },
  message: { icon: MessageSquare, label: 'Message' },
}

function useReports() {
  const [list, setList] = React.useState<AbuseReport[]>(seed)
  const [filter, setFilter] = React.useState<'open' | 'all'>('open')
  const [activeId, setActiveId] = React.useState(seed[0].id)
  const [note, setNote] = React.useState('')
  const announce = useAnnounce()

  const rows = filter === 'open' ? list.filter((r) => r.status === 'open') : list
  const active = list.find((r) => r.id === activeId) ?? rows[0]

  const resolve = (id: string, status: 'resolved' | 'dismissed') => {
    setList((l) => l.map((r) => (r.id === id ? { ...r, status } : r)))
    setNote('')
    announce(`Report ${status}`)
  }

  return { list, rows, filter, setFilter, active, activeId, setActiveId, resolve, note, setNote }
}

type R = ReturnType<typeof useReports>

export function Component() {
  const variant = useVariant()
  const r = useReports()
  const Views = { a: ReportsA, b: ReportsB, c: ReportsC }
  const View = Views[variant] ?? ReportsA
  return <View r={r} />
}
Component.displayName = 'AdminReports'

/* ══════════════════ shared ══════════════════ */

function EntityChip({ report }: { report: AbuseReport }) {
  const meta = ENTITY[report.entityType]
  const Icon = meta.icon
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-subtle px-2 py-0.5 text-xs text-ink-2">
      <Icon className="size-3" aria-hidden />
      {meta.label}
    </span>
  )
}

/** The reported thing, previewed in place — an admin should not have to go hunting. */
function EntityPreview({ report, large }: { report: AbuseReport; large?: boolean }) {
  return (
    <div className={cn('rounded-v border border-line bg-canvas', large ? 'p-5' : 'p-3.5')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
          What was reported
        </p>
        <Button variant="ghost" size="xs">
          <ExternalLink className="size-3.5" />
          Open it
        </Button>
      </div>
      <p className={cn('mt-2 font-medium text-ink', large && 'text-lg')}>{report.entityLabel}</p>
      <p className={cn('mt-1 text-ink-2', large ? 'text-base' : 'text-sm')}>{report.detail}</p>
    </div>
  )
}

function Resolution({ r, report, large }: { r: R; report: AbuseReport; large?: boolean }) {
  if (report.status !== 'open') {
    return (
      <Badge tone={report.status === 'resolved' ? 'success' : 'neutral'} size="lg">
        {report.status === 'resolved' ? 'Resolved' : 'Dismissed'}
      </Badge>
    )
  }
  return (
    <div>
      <Textarea
        rows={3}
        value={r.note}
        onChange={(e) => r.setNote(e.target.value)}
        placeholder="What did you find, and what did you do about it? This becomes the audit entry."
        aria-label="Resolution note"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size={large ? 'md' : 'sm'} onClick={() => r.resolve(report.id, 'resolved')}>
          <Check className="size-4" />
          Action taken
        </Button>
        <Button size={large ? 'md' : 'sm'} variant="secondary" onClick={() => r.resolve(report.id, 'dismissed')}>
          <X className="size-4" />
          No action needed
        </Button>
      </div>
    </div>
  )
}

function FilterTabs({ r }: { r: R }) {
  return (
    <Tabs value={r.filter} onValueChange={(v) => r.setFilter(v as typeof r.filter)}>
      <TabsList>
        <TabsTrigger value="open">
          Open ({r.list.filter((x) => x.status === 'open').length})
        </TabsTrigger>
        <TabsTrigger value="all">All ({r.list.length})</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function Empty() {
  return (
    <EmptyState
      icon={Check}
      title="No open reports"
      description="Everything users have flagged has been reviewed."
      action={{ label: 'Back to dashboard', to: '/admin' }}
    />
  )
}

/* ══════════════════ A · queue with preview ══════════════════ */

function ReportsA({ r }: { r: R }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={Flag}
        tone="rose"
        title="Reports"
        description="Jobs, companies, users and messages flagged by people using the platform."
        actions={<FilterTabs r={r} />}
      />

      {r.rows.length === 0 ? (
        <Empty />
      ) : (
        <Stagger className="mt-6 space-y-3" whenVisible={false}>
          {r.rows.map((report) => (
            <StaggerItem key={report.id}>
              <article className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <EntityChip report={report} />
                      <h2 className="font-semibold text-ink">{report.reason}</h2>
                    </div>
                    <p className="mt-1 text-sm text-ink-3">
                      reported by {report.reportedBy} · {relativeTime(report.at)}
                    </p>
                  </div>
                  {report.status !== 'open' && (
                    <Badge tone={report.status === 'resolved' ? 'success' : 'neutral'} size="sm">
                      {report.status}
                    </Badge>
                  )}
                </div>

                <div className="mt-3">
                  <EntityPreview report={report} />
                </div>

                <div className="mt-4 border-t border-line pt-3">
                  <Resolution r={r} report={report} />
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}

/* ══════════════════ B · table ══════════════════ */

function ReportsB({ r }: { r: R }) {
  const columns: Column<AbuseReport>[] = [
    {
      key: 'reason', header: 'Reason', primary: true,
      cell: (x) => (
        <span className="flex items-center gap-2">
          <EntityChip report={x} />
          <span className="font-medium text-ink">{x.reason}</span>
        </span>
      ),
    },
    { key: 'entity', header: 'Target', hideBelow: 'md', cell: (x) => <span className="truncate text-ink-2">{x.entityLabel}</span> },
    { key: 'by', header: 'Reported by', hideBelow: 'lg', cell: (x) => <span className="text-ink-3">{x.reportedBy}</span> },
    {
      key: 'at', header: 'When', align: 'right', sortable: true, sortValue: (x) => x.at,
      cell: (x) => <span className="font-mono text-xs text-ink-3">{relativeTime(x.at)}</span>,
    },
    {
      key: 'status', header: 'Status', align: 'center',
      cell: (x) => (
        <Badge tone={x.status === 'open' ? 'warning' : x.status === 'resolved' ? 'success' : 'neutral'} size="sm">
          {x.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Reports</h1>
          <p className="font-mono text-xs text-ink-3">
            {r.list.filter((x) => x.status === 'open').length} open / {r.list.length} total
          </p>
        </div>
        <FilterTabs r={r} />
      </div>

      <DataTable
        rows={r.rows}
        columns={columns}
        rowKey={(x) => x.id}
        activeKey={r.active?.id}
        onRowClick={(x) => r.setActiveId(x.id)}
        searchable={(x) => `${x.reason} ${x.entityLabel} ${x.reportedBy}`}
        searchPlaceholder="Search reports…"
        expanded={(x) => (
          <div>
            <EntityPreview report={x} />
            <div className="mt-3">
              <Resolution r={r} report={x} />
            </div>
          </div>
        )}
        empty={{ title: 'No open reports' }}
      />
    </div>
  )
}

/* ══════════════════ C · two-pane ══════════════════ */

function ReportsC({ r }: { r: R }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
            Reports
          </h1>
          <p className="mt-3 text-lg text-ink-2">
            {r.list.filter((x) => x.status === 'open').length} things people flagged for a human.
          </p>
        </div>
        <FilterTabs r={r} />
      </div>

      {r.rows.length === 0 ? (
        <Empty />
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
          <Stagger className="space-y-3">
            {r.rows.map((report) => (
              <StaggerItem key={report.id}>
                <button
                  type="button"
                  onClick={() => r.setActiveId(report.id)}
                  aria-current={report.id === r.active?.id ? 'true' : undefined}
                  className={cn(
                    'w-full rounded-v bg-paper p-5 text-left shadow-v-card transition-v hover-lift',
                    report.id === r.active?.id && 'ring-2 ring-brand-500',
                  )}
                >
                  <EntityChip report={report} />
                  <p className="mt-2 font-semibold text-ink">{report.reason}</p>
                  <p className="truncate text-sm text-ink-3">{report.entityLabel}</p>
                  <p className="mt-1 font-mono text-xs text-ink-3">{relativeTime(report.at)}</p>
                </button>
              </StaggerItem>
            ))}
          </Stagger>

          {r.active && (
            <Reveal key={r.active.id} className="rounded-v bg-paper p-8 shadow-lg lg:sticky lg:top-24 lg:self-start">
              <div className="flex flex-wrap items-center gap-2">
                <EntityChip report={r.active} />
                <Badge tone={r.active.status === 'open' ? 'warning' : 'success'}>{r.active.status}</Badge>
              </div>
              <h2 className="font-display tracking-tight mt-3 text-2xl font-semibold text-ink">
                {r.active.reason}
              </h2>
              <p className="mt-1 text-ink-3">
                reported by {r.active.reportedBy} · {relativeTime(r.active.at)}
              </p>

              <div className="mt-6">
                <EntityPreview report={r.active} large />
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <Resolution r={r} report={r.active} large />
              </div>
            </Reveal>
          )}
        </div>
      )}
    </div>
  )
}
