import * as React from 'react'
import { Download, ScrollText, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { auditLog as seed, type AuditEntry } from '@/data/console'
import { relativeTime, shortDate, timeOfDay } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PageHeader, DataTable, type Column, EmptyState } from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'

/**
 * A13 — Audit log (PRD Part 50).
 *
 * Append-only. The value is the diff: an admin needs to see exactly what
 * changed, not just that something did.
 */

function useAudit() {
  const [query, setQuery] = React.useState('')
  const [actor, setActor] = React.useState<string | null>(null)
  const [activeId, setActiveId] = React.useState<string | null>(seed[0].id)

  const actors = [...new Set(seed.map((e) => e.actor))]
  const rows = seed.filter((e) => {
    if (actor && e.actor !== actor) return false
    if (query) {
      const hay = `${e.actor} ${e.action} ${e.entityType} ${e.entityId}`.toLowerCase()
      if (!hay.includes(query.toLowerCase())) return false
    }
    return true
  })
  const active = rows.find((e) => e.id === activeId) ?? rows[0]

  return { rows, actors, actor, setActor, query, setQuery, active, activeId, setActiveId }
}

type A = ReturnType<typeof useAudit>

export function Component() {
  const variant = useVariant()
  const a = useAudit()
  const Views = { a: AuditA, b: AuditB, c: AuditB }
  const View = Views[variant] ?? AuditA
  return <View a={a} />
}
Component.displayName = 'AdminAudit'

/* ══════════════════ the diff ══════════════════ */

function JsonDiff({ entry, large }: { entry: AuditEntry; large?: boolean }) {
  const keys = [
    ...new Set([...Object.keys(entry.before ?? {}), ...Object.keys(entry.after ?? {})]),
  ]

  if (keys.length === 0) {
    return <p className="text-sm text-ink-3">No field-level change recorded.</p>
  }

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', large && 'gap-5')}>
      {(['before', 'after'] as const).map((side) => {
        const obj = entry[side]
        return (
          <div key={side}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">
              {side}
            </p>
            <div
              className={cn(
                'rounded-v border font-mono text-xs',
                side === 'before' ? 'border-line bg-canvas' : 'border-brand-200 bg-brand-50/50',
                large ? 'p-4' : 'p-3',
              )}
            >
              {obj == null ? (
                <span className="text-ink-3">null</span>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-ink-3">{'{'}</span>
                  {keys.map((k) => {
                    const v = obj[k]
                    const other = entry[side === 'before' ? 'after' : 'before']?.[k]
                    const changed = JSON.stringify(v) !== JSON.stringify(other)
                    return (
                      <div
                        key={k}
                        className={cn(
                          'ml-3 rounded px-1',
                          changed && (side === 'after' ? 'bg-score-elite-bg' : 'bg-warning-bg'),
                        )}
                      >
                        <span className={changed ? 'font-semibold text-ink' : 'text-ink-2'}>
                          {k}
                        </span>
                        <span className="text-ink-3">: </span>
                        <span className={changed ? 'font-semibold text-ink' : 'text-ink-2'}>
                          {v === undefined ? '—' : JSON.stringify(v)}
                        </span>
                      </div>
                    )
                  })}
                  <span className="text-ink-3">{'}'}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EntryMeta({ entry }: { entry: AuditEntry }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
      {[
        ['Actor', entry.actor],
        ['Action', entry.action],
        ['Entity', `${entry.entityType}/${entry.entityId}`],
        ['IP', entry.ip],
      ].map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-ink-3">{k}</dt>
          <dd className="truncate font-mono text-xs font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function Toolbar({ a }: { a: A }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={a.query}
        onChange={(e) => a.setQuery(e.target.value)}
        placeholder="Filter by actor, action or entity…"
        aria-label="Filter audit log"
        className="min-w-56 max-w-sm flex-1"
      />
      <select
        value={a.actor ?? ''}
        onChange={(e) => a.setActor(e.target.value || null)}
        aria-label="Filter by actor"
        className="h-9.5 rounded-v-control border border-line bg-paper px-2 text-sm text-ink outline-none focus:border-brand-500"
      >
        <option value="">All actors</option>
        {a.actors.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
      <Button variant="secondary" size="sm">
        <Download className="size-4" />
        Export CSV
      </Button>
    </div>
  )
}

function AppendOnlyNote() {
  return (
    <p className="rounded-v border border-line bg-canvas p-3 text-xs leading-relaxed text-ink-2">
      This log is append-only — entries cannot be edited or deleted, including by a super admin.
      Every admin action, pipeline stage change, permission change and AI-influenced transition is
      recorded here with the actor, IP and a full before/after snapshot.
    </p>
  )
}

/* ══════════════════ A · table, row expands to diff ══════════════════ */

function AuditA({ a }: { a: A }) {
  const columns: Column<AuditEntry>[] = [
    {
      key: 'at', header: 'When', sortable: true, sortValue: (e) => e.at,
      cell: (e) => (
        <span className="font-mono text-xs text-ink-3">
          {shortDate(e.at)} {timeOfDay(e.at)}
        </span>
      ),
    },
    {
      key: 'actor', header: 'Actor', primary: true, sortable: true, sortValue: (e) => e.actor,
      cell: (e) => <span className="font-mono text-xs font-medium text-ink">{e.actor}</span>,
    },
    {
      key: 'action', header: 'Action',
      cell: (e) => <Badge tone="neutral" size="sm">{e.action}</Badge>,
    },
    {
      key: 'entity', header: 'Entity', hideBelow: 'md',
      cell: (e) => (
        <span className="font-mono text-xs text-ink-2">
          {e.entityType}/{e.entityId}
        </span>
      ),
    },
    { key: 'ip', header: 'IP', align: 'right', hideBelow: 'lg', cell: (e) => <span className="font-mono text-xs text-ink-3">{e.ip}</span> },
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={ScrollText}
        tone="emerald"
        title="Audit log"
        description="Append-only record of every consequential action on the platform."
      />
      <div className="mt-4">
        <Toolbar a={a} />
      </div>

      <div className="mt-4 rounded-v border border-line bg-paper p-4 shadow-v-card">
        <DataTable
          rows={a.rows}
          columns={columns}
          rowKey={(e) => e.id}
          activeKey={a.activeId ?? undefined}
          onRowClick={(e) => a.setActiveId(a.activeId === e.id ? null : e.id)}
          expanded={(e) => (
            <div>
              <EntryMeta entry={e} />
              <div className="mt-4">
                <JsonDiff entry={e} />
              </div>
            </div>
          )}
          empty={{ title: 'No entries match' }}
        />
      </div>

      <div className="mt-4">
        <AppendOnlyNote />
      </div>
    </div>
  )
}

/* ══════════════════ B and C · two-pane, diff always visible ══════════════════ */

function AuditB({ a }: { a: A }) {
  const variant = useVariant()
  const large = variant === 'c'

  return (
    <div className={cn('mx-auto max-w-[1500px] px-4 sm:px-6', large ? 'py-10' : 'py-4')}>
      {large ? (
        <>
          <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
            Audit log
          </h1>
          <p className="mt-3 text-lg text-ink-2">
            Every consequential action, with what changed.
          </p>
        </>
      ) : (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
          <div>
            <h1 className="text-base font-semibold text-ink">Audit log</h1>
            <p className="font-mono text-xs text-ink-3">{a.rows.length} entries · append-only</p>
          </div>
        </div>
      )}

      <div className={cn(large && 'mt-8')}>
        <Toolbar a={a} />
      </div>

      {a.rows.length === 0 ? (
        <EmptyState icon={ScrollText} title="No entries match" description="Loosen the filter." />
      ) : (
        <div className={cn('grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]', large ? 'mt-8' : 'mt-3')}>
          {/* entry list */}
          <div
            className={cn(
              'overflow-hidden',
              large ? 'rounded-v bg-paper shadow-v-card' : 'rounded-v border border-line bg-paper',
            )}
          >
            <Stagger whenVisible={false}>
              {a.rows.map((e) => (
                <StaggerItem key={e.id}>
                  <button
                    type="button"
                    onClick={() => a.setActiveId(e.id)}
                    aria-current={e.id === a.active?.id ? 'true' : undefined}
                    className={cn(
                      'relative w-full border-b border-line px-3 py-2 text-left transition-v',
                      'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:transition-v',
                      e.id === a.active?.id
                        ? 'bg-brand-50 before:bg-brand-600'
                        : 'hover:bg-hover before:bg-transparent',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-medium text-ink">{e.action}</span>
                      <span className="shrink-0 font-mono text-[11px] text-ink-3">
                        {relativeTime(e.at)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-ink-3">
                      {e.actor} → {e.entityType}/{e.entityId}
                    </span>
                  </button>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          {/* the diff, always visible */}
          {a.active && (
            <Reveal
              key={a.active.id}
              className={cn(
                'lg:sticky lg:top-20 lg:self-start',
                large ? 'rounded-v bg-paper p-8 shadow-lg' : 'rounded-v border border-line bg-paper p-4',
              )}
            >
              <EntryMeta entry={a.active} />
              <p className="mt-2 font-mono text-xs text-ink-3">
                {shortDate(a.active.at)} {timeOfDay(a.active.at)}
              </p>
              <div className="mt-5">
                <JsonDiff entry={a.active} large={large} />
              </div>
              <div className="mt-5">
                <AppendOnlyNote />
              </div>
            </Reveal>
          )}
        </div>
      )}
    </div>
  )
}
