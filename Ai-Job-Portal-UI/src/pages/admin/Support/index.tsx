import * as React from 'react'
import { Link } from 'react-router'
import { LifeBuoy, Clock, Send, User, Briefcase, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant, useAnnounce } from '@/hooks'
import { tickets as seed, type Ticket, type TicketPriority } from '@/data/console'
import { relativeTime, timeOfDay, shortDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/controls'
import { Textarea } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/controls'
import { PageHeader, EmptyState, DataTable, type Column } from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'

/**
 * A9 / A10 — Support queue and ticket detail (PRD Part 49).
 *
 * The SLA chip is the organising idea: a ticket that has breached its
 * first-response target should be impossible to miss.
 */

const PRIORITY: Record<TicketPriority, { tone: 'danger' | 'warning' | 'neutral' | 'outline'; label: string }> = {
  urgent: { tone: 'danger', label: 'Urgent' },
  high: { tone: 'warning', label: 'High' },
  normal: { tone: 'neutral', label: 'Normal' },
  low: { tone: 'outline', label: 'Low' },
}

const STATUS_TONE = {
  open: 'warning', in_progress: 'brand', resolved: 'success', closed: 'neutral',
} as const

/** Hours until (or past) the first-response target. */
function slaState(t: Ticket) {
  if (t.firstResponseHours != null) {
    return { met: true, hoursLeft: 0, label: `answered in ${t.firstResponseHours}h` }
  }
  const elapsed = (Date.now() - new Date(t.createdAt).getTime()) / 3600000
  const left = t.slaHours - elapsed
  return {
    met: left > 0,
    hoursLeft: left,
    label: left > 0 ? `${left.toFixed(1)}h left to respond` : `${Math.abs(left).toFixed(1)}h overdue`,
  }
}

function SlaChip({ t, large }: { t: Ticket; large?: boolean }) {
  const s = slaState(t)
  const breached = !s.met
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs',
        s.met && t.firstResponseHours != null && 'bg-score-elite-bg text-score-elite',
        s.met && t.firstResponseHours == null && 'bg-warning-bg text-warning',
        breached && 'bg-danger-bg text-danger',
      )}
    >
      <Clock className={cn(large ? 'size-4' : 'size-3', breached && 'animate-pulse')} aria-hidden />
      {s.label}
    </span>
  )
}

function useSupport() {
  const [list, setList] = React.useState<Ticket[]>(seed)
  const [filter, setFilter] = React.useState<'queue' | 'all'>('queue')
  const [activeId, setActiveId] = React.useState(seed[0].id)
  const [reply, setReply] = React.useState('')
  const announce = useAnnounce()

  const rows = filter === 'queue' ? list.filter((t) => t.status === 'open' || t.status === 'in_progress') : list
  // breached first, then by priority
  const sorted = [...rows].sort((a, b) => {
    const order: TicketPriority[] = ['urgent', 'high', 'normal', 'low']
    const aB = !slaState(a).met ? 0 : 1
    const bB = !slaState(b).met ? 0 : 1
    if (aB !== bB) return aB - bB
    return order.indexOf(a.priority) - order.indexOf(b.priority)
  })
  const active = list.find((t) => t.id === activeId) ?? sorted[0]

  const send = () => {
    if (!reply.trim() || !active) return
    setList((l) =>
      l.map((t) =>
        t.id === active.id
          ? {
              ...t,
              status: 'in_progress',
              firstResponseHours: t.firstResponseHours ?? 0.1,
              thread: [...t.thread, { from: 'agent' as const, body: reply.trim(), at: new Date().toISOString() }],
            }
          : t,
      ),
    )
    setReply('')
    announce('Reply sent')
  }

  const setStatus = (id: string, status: Ticket['status']) => {
    setList((l) => l.map((t) => (t.id === id ? { ...t, status } : t)))
    announce(`Ticket ${status.replace('_', ' ')}`)
  }

  const assign = (id: string) =>
    setList((l) => l.map((t) => (t.id === id ? { ...t, assignedTo: 'Support Desk' } : t)))

  return { list, rows: sorted, filter, setFilter, active, activeId, setActiveId, reply, setReply, send, setStatus, assign }
}

type S = ReturnType<typeof useSupport>

export function Component() {
  const variant = useVariant()
  const s = useSupport()
  const Views = { a: SupportA, b: SupportB, c: SupportC }
  const View = Views[variant] ?? SupportA
  return <View s={s} />
}
Component.displayName = 'AdminSupport'

/* ══════════════════ shared ══════════════════ */

function Thread({ t, s, large }: { t: Ticket; s: S; large?: boolean }) {
  return (
    <div>
      <div className="space-y-3">
        {t.thread.map((m, i) => (
          <div key={i} className={cn('flex', m.from === 'agent' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[80%]', m.from === 'agent' && 'text-right')}>
              <div
                className={cn(
                  'inline-block rounded-v px-3.5 py-2.5 text-left leading-relaxed',
                  large ? 'text-base' : 'text-sm',
                  m.from === 'agent'
                    ? 'bg-brand-600 text-white'
                    : 'border border-line bg-subtle text-ink-2',
                )}
              >
                {m.body}
              </div>
              <p className="mt-1 text-[11px] text-ink-3">
                {m.from === 'agent' ? t.assignedTo ?? 'Support' : t.raisedBy} · {relativeTime(m.at)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {t.status !== 'closed' && (
        <div className="mt-4 border-t border-line pt-4">
          <Textarea
            rows={3}
            value={s.reply}
            onChange={(e) => s.setReply(e.target.value)}
            placeholder="Reply to the person who raised this…"
            aria-label="Reply"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" onClick={s.send} disabled={!s.reply.trim()}>
              <Send className="size-4" />
              Send reply
            </Button>
            {t.status !== 'resolved' && (
              <Button size="sm" variant="secondary" onClick={() => s.setStatus(t.id, 'resolved')}>
                <Check className="size-4" />
                Mark resolved
              </Button>
            )}
            {!t.assignedTo && (
              <Button size="sm" variant="ghost" onClick={() => s.assign(t.id)}>
                Assign to me
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Scope note — Support Agents are read-mostly (PRD Part 9). */
function ScopeRail({ t }: { t: Ticket }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Raised by</h3>
        <div className="mt-2 flex items-center gap-2.5">
          <Avatar name={t.raisedBy} id={t.id} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{t.raisedBy}</p>
            <p className="text-xs text-ink-3">{t.category}</p>
          </div>
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        {[
          ['Ticket', t.id],
          ['Opened', shortDate(t.createdAt)],
          ['Priority', PRIORITY[t.priority].label],
          ['SLA target', `${t.slaHours}h first response`],
          ['Assigned to', t.assignedTo ?? 'unassigned'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 border-b border-line pb-1.5">
            <dt className="text-ink-3">{k}</dt>
            <dd className="text-right font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-v border border-line bg-canvas p-3">
        <p className="text-xs font-semibold text-ink">What you can see</p>
        <ul className="mt-2 space-y-1 text-xs text-ink-2">
          {[
            ['This ticket and its thread', true],
            ['The profile of the person who raised it', true],
            ['The job or application they referenced', true],
            ['Any other user or company', false],
            ['Match scores or candidate rankings', false],
          ].map(([label, can]) => (
            <li key={String(label)} className="flex items-start gap-1.5">
              <span className={cn('mt-0.5', can ? 'text-score-elite' : 'text-ink-3')}>
                {can ? '✓' : '✕'}
              </span>
              <span className={can ? 'text-ink-2' : 'text-ink-3'}>{String(label)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] leading-snug text-ink-3">
          Support access is scoped to the ticket. This is enforced by the backend, not just hidden
          in the interface.
        </p>
      </div>
    </div>
  )
}

function TicketRow({ t, s, dense }: { t: Ticket; s: S; dense?: boolean }) {
  const active = t.id === s.active?.id
  const breached = !slaState(t).met
  return (
    <button
      type="button"
      onClick={() => s.setActiveId(t.id)}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'relative flex w-full items-start gap-3 border-b border-line text-left transition-v',
        'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:transition-v',
        dense ? 'px-3 py-2' : 'p-3.5',
        active ? 'bg-brand-50 before:bg-brand-600' : 'hover:bg-hover',
        breached && !active && 'before:bg-danger',
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-ink-3">{t.id}</span>
          <Badge tone={PRIORITY[t.priority].tone} size="sm">
            {PRIORITY[t.priority].label}
          </Badge>
        </span>
        <span className={cn('mt-0.5 block truncate font-medium text-ink', dense && 'text-sm')}>
          {t.subject}
        </span>
        <span className="block truncate text-xs text-ink-3">
          {t.raisedBy} · {t.category}
        </span>
      </span>
      <span className="shrink-0">
        <SlaChip t={t} />
      </span>
    </button>
  )
}

function FilterTabs({ s }: { s: S }) {
  const openCount = s.list.filter((t) => t.status === 'open' || t.status === 'in_progress').length
  return (
    <Tabs value={s.filter} onValueChange={(v) => s.setFilter(v as typeof s.filter)}>
      <TabsList>
        <TabsTrigger value="queue">Queue ({openCount})</TabsTrigger>
        <TabsTrigger value="all">All ({s.list.length})</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

/* ══════════════════ A · inbox ══════════════════ */

function SupportA({ s }: { s: S }) {
  const breached = s.list.filter((t) => !slaState(t).met).length
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={LifeBuoy}
        tone="violet"
        title="Support"
        description={
          breached > 0
            ? `${breached} ticket${breached === 1 ? '' : 's'} past the first-response target`
            : 'Every ticket is within its SLA'
        }
        actions={<FilterTabs s={s} />}
      />

      {s.rows.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="Queue is empty" description="No open tickets." />
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr_260px]">
          <div className="overflow-hidden rounded-v border border-line bg-paper shadow-v-card">
            <Stagger whenVisible={false}>
              {s.rows.map((t) => (
                <StaggerItem key={t.id}>
                  <TicketRow t={t} s={s} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          {s.active && (
            <Reveal key={s.active.id} className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-ink">{s.active.subject}</h2>
                  <p className="text-sm text-ink-3">
                    {s.active.id} · {s.active.category}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[s.active.status]} size="sm">
                  {s.active.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="mt-4">
                <Thread t={s.active} s={s} />
              </div>
            </Reveal>
          )}

          {s.active && (
            <aside className="rounded-v border border-line bg-paper p-v-card shadow-v-card lg:sticky lg:top-24 lg:self-start">
              <ScopeRail t={s.active} />
            </aside>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════ B · dense table ══════════════════ */

function SupportB({ s }: { s: S }) {
  const columns: Column<Ticket>[] = [
    { key: 'id', header: 'ID', cell: (t) => <span className="font-mono text-xs text-ink-3">{t.id}</span> },
    {
      key: 'subject', header: 'Subject', primary: true,
      cell: (t) => <span className="font-medium text-ink">{t.subject}</span>,
    },
    { key: 'by', header: 'Raised by', hideBelow: 'md', cell: (t) => <span className="text-ink-2">{t.raisedBy}</span> },
    { key: 'cat', header: 'Category', hideBelow: 'lg', cell: (t) => <span className="text-xs text-ink-3">{t.category}</span> },
    {
      key: 'pri', header: 'Priority',
      cell: (t) => <Badge tone={PRIORITY[t.priority].tone} size="sm">{PRIORITY[t.priority].label}</Badge>,
    },
    {
      key: 'sla', header: 'SLA', align: 'right', sortable: true,
      sortValue: (t) => slaState(t).hoursLeft,
      cell: (t) => <SlaChip t={t} />,
    },
    {
      key: 'status', header: 'Status', align: 'center',
      cell: (t) => <Badge tone={STATUS_TONE[t.status]} size="sm">{t.status.replace('_', ' ')}</Badge>,
    },
  ]

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Support</h1>
          <p className="font-mono text-xs text-ink-3">
            {s.rows.length} in queue · {s.list.filter((t) => !slaState(t).met).length} breached
          </p>
        </div>
        <FilterTabs s={s} />
      </div>

      <DataTable
        rows={s.rows}
        columns={columns}
        rowKey={(t) => t.id}
        activeKey={s.active?.id}
        onRowClick={(t) => s.setActiveId(t.id)}
        searchable={(t) => `${t.id} ${t.subject} ${t.raisedBy} ${t.category}`}
        searchPlaceholder="Search tickets…"
        expanded={(t) => (
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <Thread t={t} s={s} />
            <ScopeRail t={t} />
          </div>
        )}
        empty={{ title: 'Queue is empty' }}
      />
    </div>
  )
}

/* ══════════════════ C · kanban by status ══════════════════ */

function SupportC({ s }: { s: S }) {
  const columns = [
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'resolved', label: 'Resolved' },
  ] as const

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
            Support
          </h1>
          <p className="mt-3 text-lg text-ink-2">
            {s.list.filter((t) => !slaState(t).met).length} tickets are past their response target.
          </p>
        </div>
        <FilterTabs s={s} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {columns.map((col) => {
          const items = s.list.filter((t) => t.status === col.key)
          return (
            <section key={col.key}>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-ink">
                {col.label}
                <span className="font-mono tnum text-sm text-ink-3">{items.length}</span>
              </h2>
              <Stagger className="space-y-4">
                {items.map((t) => (
                  <StaggerItem key={t.id}>
                    <button
                      type="button"
                      onClick={() => s.setActiveId(t.id)}
                      className={cn(
                        'w-full rounded-v bg-paper p-5 text-left shadow-v-card transition-v hover-lift',
                        t.id === s.active?.id && 'ring-2 ring-brand-500',
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-ink-3">{t.id}</span>
                        <Badge tone={PRIORITY[t.priority].tone} size="sm">
                          {PRIORITY[t.priority].label}
                        </Badge>
                      </div>
                      <p className="mt-2 font-semibold text-ink">{t.subject}</p>
                      <p className="text-sm text-ink-3">{t.raisedBy}</p>
                      <div className="mt-3">
                        <SlaChip t={t} />
                      </div>
                    </button>
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

      {s.active && (
        <Reveal key={s.active.id} className="mt-10 grid gap-6 rounded-v bg-paper p-8 shadow-lg lg:grid-cols-[1fr_280px]">
          <div className="min-w-0">
            <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">
              {s.active.subject}
            </h2>
            <p className="mt-1 text-ink-3">
              {s.active.id} · {s.active.category}
            </p>
            <div className="mt-6">
              <Thread t={s.active} s={s} large />
            </div>
          </div>
          <ScopeRail t={s.active} />
        </Reveal>
      )}
    </div>
  )
}
