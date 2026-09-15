import * as React from 'react'
import { Link } from 'react-router'
import {
  CalendarDays, ClipboardCheck, Sparkles, MessageSquare, GitBranch, BellRing,
  Settings2, Gavel, Users, CreditCard, CheckCheck, ChevronDown, Inbox,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { notificationFeed, recruiterNotificationFeed } from '@/data/console'
import { relativeTime, shortDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState, PageHeader } from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { useAuth } from '@/store/auth'

/**
 * C14 / R17 — Notification centre (PRD Part 25).
 *
 * One implementation, two personas. The rule that matters: a batched
 * digest ("6 new matches") renders as ONE expandable row, never as six
 * rows — otherwise the centre becomes unusable within a week.
 */

type Item = {
  id: string
  type: string
  title: string
  body: string
  at: string
  read: boolean
  batched?: number
}

const TYPE_META: Record<string, { icon: React.ElementType; label: string; tone: string }> = {
  interview: { icon: CalendarDays, label: 'Interviews', tone: 'text-stage-interview bg-stage-interview-bg' },
  assessment: { icon: ClipboardCheck, label: 'Assessments', tone: 'text-stage-assessment bg-stage-assessment-bg' },
  match: { icon: Sparkles, label: 'Matches', tone: 'text-accent-700 bg-accent-50' },
  message: { icon: MessageSquare, label: 'Messages', tone: 'text-brand-700 bg-brand-50' },
  stage: { icon: GitBranch, label: 'Pipeline', tone: 'text-stage-shortlisted bg-stage-shortlisted-bg' },
  alert: { icon: BellRing, label: 'Job alerts', tone: 'text-warning bg-warning-bg' },
  system: { icon: Settings2, label: 'System', tone: 'text-ink-2 bg-subtle' },
  applicant: { icon: Users, label: 'Applicants', tone: 'text-brand-700 bg-brand-50' },
  feedback: { icon: ClipboardCheck, label: 'Feedback', tone: 'text-danger bg-danger-bg' },
  moderation: { icon: Gavel, label: 'Moderation', tone: 'text-stage-screening bg-stage-screening-bg' },
  subscription: { icon: CreditCard, label: 'Billing', tone: 'text-warning bg-warning-bg' },
}

function bucket(at: string): 'Today' | 'This week' | 'Earlier' {
  const days = (Date.now() - new Date(at).getTime()) / 86400000
  if (days < 1) return 'Today'
  if (days < 7) return 'This week'
  return 'Earlier'
}

export function NotificationsPage({ persona }: { persona: 'candidate' | 'recruiter' }) {
  const variant = useVariant()
  const { token } = useAuth()
  
  const [items, setItems] = React.useState<Item[]>([])
  const [filter, setFilter] = React.useState<string | null>(null)
  const [openId, setOpenId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    fetch('http://localhost:8000/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => res.ok ? res.json() : [])
      .then(data => {
        if (active) {
          setItems(Array.isArray(data) && data.length > 0 ? data : [])
        }
      })
      .catch(() => { if (active) setItems([]) })
    return () => { active = false }
  }, [token])

  const types = [...new Set(items.map((i) => i.type))]
  const shown = filter ? items.filter((i) => i.type === filter) : items
  const unread = items.filter((i) => !i.read).length

  const markAll = () => {
    // In a real app we'd bulk update, for now just update local state
    setItems((l) => l.map((i) => ({ ...i, read: true })))
  }
  const markOne = (id: string) => {
    fetch(`http://localhost:8000/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    })
    setItems((l) => l.map((i) => (i.id === id ? { ...i, read: true } : i)))
  }

  const groups: Record<string, Item[]> = {}
  for (const i of shown) {
    const b = bucket(i.at)
    ;(groups[b] ??= []).push(i)
  }

  const filterBar = (
    <div className="flex flex-wrap items-center gap-1.5">
      <FilterChip active={filter === null} onClick={() => setFilter(null)}>
        All
        <span className="ml-1 font-mono tnum text-[11px] opacity-70">{items.length}</span>
      </FilterChip>
      {types.map((t) => (
        <FilterChip key={t} active={filter === t} onClick={() => setFilter(t)}>
          {TYPE_META[t]?.label ?? t}
          <span className="ml-1 font-mono tnum text-[11px] opacity-70">
            {items.filter((i) => i.type === t).length}
          </span>
        </FilterChip>
      ))}
    </div>
  )

  const header = (
    <PageHeader
      title="Notifications"
      description={unread > 0 ? `${unread} unread` : 'You are all caught up'}
      actions={
        <Button variant="secondary" size="sm" onClick={markAll} disabled={unread === 0}>
          <CheckCheck className="size-4" />
          Mark all read
        </Button>
      }
    />
  )

  const body =
    shown.length === 0 ? (
      <EmptyState
        icon={Inbox}
        title="Nothing here"
        description="When something happens on your applications, it lands here first."
        action={{ label: 'Clear filter', onClick: () => setFilter(null) }}
      />
    ) : (
      Object.entries(groups).map(([label, list]) => (
        <section key={label} className="mt-6 first:mt-0">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">{label}</h2>
          <Stagger
            className={cn(
              variant === 'b'
                ? 'divide-y divide-line border-y border-line'
                : 'space-y-2',
            )}
            whenVisible={false}
          >
            {list.map((n) => (
              <StaggerItem key={n.id}>
                <Row
                  item={n}
                  dense={variant === 'b'}
                  open={openId === n.id}
                  onToggle={() => {
                    setOpenId((o) => (o === n.id ? null : n.id))
                    markOne(n.id)
                  }}
                  persona={persona}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      ))
    )

  /* ── C · two-pane inbox ── */
  if (variant === 'c') {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
          Notifications
        </h1>
        <p className="mt-3 text-lg text-ink-2">
          {unread > 0 ? `${unread} things need your attention.` : 'You are all caught up.'}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          {filterBar}
          <Button variant="secondary" onClick={markAll} disabled={unread === 0}>
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        </div>
        <Reveal className="mt-8 rounded-v bg-paper p-6 shadow-lg">{body}</Reveal>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6',
        variant === 'b' ? 'max-w-[1400px] py-4' : 'max-w-[1280px] py-6',
      )}
    >
      {header}
      <div className="mt-4">{filterBar}</div>
      <div className="mt-5">{body}</div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs font-medium transition-v',
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-line bg-paper text-ink-2 hover:border-brand-300 hover:text-brand-700',
      )}
    >
      {children}
    </button>
  )
}

function Row({
  item,
  dense,
  open,
  onToggle,
  persona,
}: {
  item: Item
  dense?: boolean
  open: boolean
  onToggle: () => void
  persona: 'candidate' | 'recruiter'
}) {
  const meta = TYPE_META[item.type] ?? TYPE_META.system
  const Icon = meta.icon

  return (
    <div
      className={cn(
        !dense &&
          'rounded-v border-[length:var(--v-card-border)] border-line bg-paper shadow-v-card',
        !item.read && !dense && 'border-brand-200 bg-brand-50/30',
        !item.read && dense && 'bg-brand-50/40',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={item.batched ? open : undefined}
        className={cn(
          'flex w-full items-start gap-3 text-left transition-v',
          dense ? 'px-3 py-2 hover:bg-hover' : 'p-3.5',
        )}
      >
        <span
          className={cn(
            'mt-0.5 grid shrink-0 place-items-center rounded-full',
            dense ? 'size-6' : 'size-8',
            meta.tone,
          )}
        >
          <Icon className={dense ? 'size-3.5' : 'size-4'} aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-2">
            <span className={cn('font-medium text-ink', dense && 'text-sm')}>{item.title}</span>
            {!item.read && (
              <span className="size-1.5 rounded-full bg-brand-600" aria-label="unread" />
            )}
            {item.batched && (
              <Badge tone="neutral" size="sm">
                {item.batched} items
              </Badge>
            )}
          </span>
          <span className={cn('mt-0.5 block text-ink-2', dense ? 'text-xs' : 'text-sm')}>
            {item.body}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[11px] text-ink-3">{relativeTime(item.at)}</span>
          {item.batched && (
            <ChevronDown
              className={cn('size-4 text-ink-3 transition-transform', open && 'rotate-180')}
              aria-hidden
            />
          )}
        </span>
      </button>

      {/* A digest expands in place — never twenty separate rows. */}
      {item.batched && open && (
        <div className={cn('border-t border-line bg-canvas', dense ? 'px-3 py-2' : 'p-3.5')}>
          <ul className="space-y-1.5">
            {Array.from({ length: Math.min(item.batched, 5) }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-ink-2">
                  {item.type === 'match'
                    ? ['Senior React Developer · Northwind Labs', 'Frontend Engineer · Meridian Health', 'Product Designer · Verdant Studio', 'DevOps Engineer · Arclight', 'Backend Engineer · Cobalt'][i]
                    : item.type === 'applicant'
                      ? ['Ananya Rao', 'Karthik Iyer', 'Vikram Shetty', 'Priya Menon', 'Rahul Deshpande'][i]
                      : `Item ${i + 1}`}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-ink-3">
                  {shortDate(item.at)}
                </span>
              </li>
            ))}
          </ul>
          {item.batched > 5 && (
            <p className="mt-2 text-xs text-ink-3">and {item.batched - 5} more</p>
          )}
          <Link
            to={persona === 'candidate' ? '/candidate/jobs' : '/recruiter/jobs/j1/applicants'}
            className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            See all
          </Link>
        </div>
      )}
    </div>
  )
}
