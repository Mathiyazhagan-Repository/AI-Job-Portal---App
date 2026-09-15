import * as React from 'react'
import { Link } from 'react-router'
import {
  Ban, CheckCircle2, ShieldAlert, Mail, FileWarning, UserCog, Users,
  UserPlus, Activity, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { adminUsers as seed, auditLog, type AdminUser, type PlatformRole } from '@/data/console'
import { relativeTime, shortDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/controls'
import { Sheet, SheetContent, Tooltip } from '@/components/ui/overlay'
import {
  PageHeader, DataTable, type Column, SectionHeading,
  StatCard, DonutChart, BarChart, TONE_CLASS, type Tone,
} from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'

/** A2 — User management. */

const ROLE_LABEL: Record<PlatformRole, string> = {
  candidate: 'Candidate',
  recruiter: 'Recruiter',
  company_admin: 'Company admin',
  platform_admin: 'Platform admin',
  support_agent: 'Support agent',
}

const ROLE_TONE: Record<PlatformRole, 'neutral' | 'brand' | 'accent' | 'success' | 'outline'> = {
  candidate: 'neutral',
  recruiter: 'brand',
  company_admin: 'accent',
  platform_admin: 'success',
  support_agent: 'outline',
}

const STATUS_TONE = { active: 'success', suspended: 'danger', pending: 'warning' } as const

function useUsers() {
  const [list, setList] = React.useState<AdminUser[]>(seed)
  const [role, setRole] = React.useState<PlatformRole | 'all'>('all')
  const [detail, setDetail] = React.useState<AdminUser | null>(null)

  const rows = role === 'all' ? list : list.filter((u) => u.role === role)

  const toggleSuspend = (id: string) =>
    setList((l) =>
      l.map((u) =>
        u.id === id ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u,
      ),
    )

  return { list, rows, role, setRole, detail, setDetail, toggleSuspend }
}

type U = ReturnType<typeof useUsers>

export function Component() {
  const variant = useVariant()
  const u = useUsers()
  const Views = { a: UsersA, b: UsersB, c: UsersC }
  const View = Views[variant] ?? UsersA
  return (
    <>
      <View u={u} />
      <DetailSheet u={u} />
    </>
  )
}
Component.displayName = 'AdminUsers'

/* ══════════════════ shared ══════════════════ */

function RoleFilter({ u }: { u: U }) {
  const roles: (PlatformRole | 'all')[] = [
    'all', 'candidate', 'recruiter', 'company_admin', 'support_agent',
  ]
  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => u.setRole(r)}
          aria-pressed={u.role === r}
          className={cn(
            'rounded-full border px-2.5 py-1 text-xs font-medium transition-v',
            u.role === r
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-line bg-paper text-ink-2 hover:border-brand-300',
          )}
        >
          {r === 'all' ? 'All' : ROLE_LABEL[r]}
          <span className="ml-1 font-mono tnum opacity-70">
            {r === 'all' ? u.list.length : u.list.filter((x) => x.role === r).length}
          </span>
        </button>
      ))}
    </div>
  )
}

function columns(u: U): Column<AdminUser>[] {
  return [
    {
      key: 'name', header: 'User', primary: true, sortable: true, sortValue: (x) => x.name,
      cell: (x) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={x.name} id={x.id} size="sm" />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="font-medium text-ink">{x.name}</span>
              {x.parseFailed && (
                <Tooltip content="This candidate's resume failed to parse — they may need help completing their profile.">
                  <FileWarning className="size-3.5 shrink-0 text-warning" aria-label="Parse failure" />
                </Tooltip>
              )}
            </span>
            <span className="block truncate text-xs text-ink-3">{x.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'role', header: 'Role',
      cell: (x) => <Badge tone={ROLE_TONE[x.role]} size="sm">{ROLE_LABEL[x.role]}</Badge>,
    },
    { key: 'company', header: 'Company', hideBelow: 'lg', cell: (x) => <span className="text-ink-2">{x.company ?? '—'}</span> },
    {
      key: 'status', header: 'Status',
      cell: (x) => <Badge tone={STATUS_TONE[x.status]} size="sm">{x.status}</Badge>,
    },
    {
      key: 'apps', header: 'Apps', align: 'right', hideBelow: 'md', sortable: true, sortValue: (x) => x.applications ?? -1,
      cell: (x) => <span className="font-mono tnum text-xs text-ink-3">{x.applications ?? '—'}</span>,
    },
    {
      key: 'joined', header: 'Joined', align: 'right', hideBelow: 'lg', sortable: true, sortValue: (x) => x.joined,
      cell: (x) => <span className="font-mono text-xs text-ink-3">{shortDate(x.joined)}</span>,
    },
    {
      key: 'active', header: 'Last active', align: 'right', sortable: true, sortValue: (x) => x.lastActive,
      cell: (x) => <span className="font-mono text-xs text-ink-3">{relativeTime(x.lastActive)}</span>,
    },
    {
      key: 'actions', header: '', align: 'right',
      cell: (x) => (
        <Tooltip content={x.status === 'suspended' ? 'Reactivate' : 'Suspend'}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              u.toggleSuspend(x.id)
            }}
            aria-label={x.status === 'suspended' ? 'Reactivate user' : 'Suspend user'}
          >
            {x.status === 'suspended' ? (
              <CheckCircle2 className="size-4 text-score-elite" />
            ) : (
              <Ban className="size-4" />
            )}
          </Button>
        </Tooltip>
      ),
    },
  ]
}

function bulkActions(u: U) {
  return (sel: string[], clear: () => void) => (
    <>
      <Button size="xs" variant="secondary" onClick={() => { sel.forEach(u.toggleSuspend); clear() }}>
        <Ban className="size-3.5" />
        Suspend {sel.length}
      </Button>
      <Button size="xs" variant="ghost">
        <Mail className="size-3.5" />
        Email
      </Button>
    </>
  )
}

/** Per-user audit trail — the point of opening a row. */
function DetailSheet({ u }: { u: U }) {
  const x = u.detail
  const trail = auditLog.filter((e) => e.actor === x?.email || e.entityId === x?.id)

  return (
    <Sheet open={Boolean(x)} onOpenChange={(o) => !o && u.setDetail(null)}>
      <SheetContent width="md:w-[520px]" className="overflow-y-auto">
        {x && (
          <div className="p-5">
            <div className="flex items-start gap-3">
              <Avatar name={x.name} id={x.id} size="lg" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-ink">{x.name}</h2>
                <p className="truncate text-sm text-ink-3">{x.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone={ROLE_TONE[x.role]} size="sm">{ROLE_LABEL[x.role]}</Badge>
                  <Badge tone={STATUS_TONE[x.status]} size="sm">{x.status}</Badge>
                </div>
              </div>
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              {[
                ['Joined', shortDate(x.joined)],
                ['Last active', relativeTime(x.lastActive)],
                ['Company', x.company ?? '—'],
                ['Applications', x.applications != null ? String(x.applications) : '—'],
                ['Profile completeness', x.profilePct != null ? `${x.profilePct}%` : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-line pb-1.5">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            {x.parseFailed && (
              <div className="mt-4 flex items-start gap-2 rounded-v bg-warning-bg p-3 text-sm text-warning">
                <FileWarning className="mt-0.5 size-4 shrink-0" aria-hidden />
                Resume parsing failed for this candidate. They were prompted to fill their profile
                manually — worth checking whether they got stuck.
              </div>
            )}

            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Audit trail
            </h3>
            {trail.length === 0 ? (
              <p className="mt-2 text-sm text-ink-3">No recorded actions for this user.</p>
            ) : (
              <ol className="mt-2 space-y-2">
                {trail.map((e) => (
                  <li key={e.id} className="rounded-v border border-line p-2.5">
                    <p className="font-mono text-xs font-medium text-ink">{e.action}</p>
                    <p className="text-xs text-ink-3">
                      {relativeTime(e.at)} · {e.entityType}/{e.entityId} · {e.ip}
                    </p>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
              <Button size="sm" variant={x.status === 'suspended' ? 'primary' : 'danger'} onClick={() => u.toggleSuspend(x.id)}>
                {x.status === 'suspended' ? 'Reactivate account' : 'Suspend account'}
              </Button>
              <Button size="sm" variant="secondary">
                <Mail className="size-4" />
                Email user
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-ink-3">
              Every admin action here is written to the audit log with your identity attached.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

/* ══════════════════ A · table + sheet ══════════════════ */

const ROLE_HUE: Record<PlatformRole, Tone> = {
  candidate: 'indigo',
  recruiter: 'fuchsia',
  company_admin: 'violet',
  support_agent: 'teal',
  platform_admin: 'amber',
}

/** Signups over the last 8 weeks — the shape admins actually watch. */
const SIGNUPS = [
  { label: 'W1', value: 214, tone: 'indigo' as Tone },
  { label: 'W2', value: 248, tone: 'sky' as Tone },
  { label: 'W3', value: 231, tone: 'teal' as Tone },
  { label: 'W4', value: 289, tone: 'emerald' as Tone },
  { label: 'W5', value: 312, tone: 'violet' as Tone },
  { label: 'W6', value: 298, tone: 'fuchsia' as Tone },
  { label: 'W7', value: 356, tone: 'amber' as Tone },
  { label: 'W8', value: 401, tone: 'rose' as Tone },
]

function UsersSummaryA({ u }: { u: U }) {
  const byRole = (Object.keys(ROLE_LABEL) as PlatformRole[])
    .map((r) => ({
      label: ROLE_LABEL[r],
      value: u.list.filter((x) => x.role === r).length,
      tone: ROLE_HUE[r],
    }))
    .filter((d) => d.value > 0)

  const suspended = u.list.filter((x) => x.status === 'suspended').length
  const pending = u.list.filter((x) => x.status === 'pending').length

  const cards = [
    { tone: 'sky' as Tone, icon: Users, label: 'Accounts', value: u.list.length,
      badge: { text: '+401', direction: 'up' as const }, caption: 'new this week, platform-wide' },
    { tone: 'emerald' as Tone, icon: Activity, label: 'Active', value: u.list.filter((x) => x.status === 'active').length,
      caption: 'signed in within 30 days' },
    { tone: 'amber' as Tone, icon: UserPlus, label: 'Pending verification', value: pending,
      caption: pending ? 'waiting on a document' : 'nothing waiting' },
    { tone: 'rose' as Tone, icon: Ban, label: 'Suspended', value: suspended,
      caption: 'every suspension is in the audit log' },
  ]

  return (
    <>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="rounded-v border border-line bg-paper p-v-card shadow-v-card lg:col-span-5">
          <SectionHeading title="Accounts by role" icon={UserCog} tone="violet" />
          <div className="flex items-center justify-center py-1">
            <DonutChart
              data={byRole}
              size={132}
              centerLabel="accounts"
              centerValue={String(u.list.length)}
            />
          </div>
        </div>
        <div className="rounded-v border border-line bg-paper p-v-card shadow-v-card lg:col-span-7">
          <SectionHeading title="Signups · last 8 weeks" icon={UserPlus} tone="emerald" />
          <BarChart data={SIGNUPS} height={168} />
        </div>
      </div>
    </>
  )
}


function UsersA({ u }: { u: U }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={Users}
        tone="sky"
        title="Users"
        description={`${u.list.length} accounts · ${u.list.filter((x) => x.status === 'suspended').length} suspended`}
      />
      <UsersSummaryA u={u} />

      <div className="mt-4">
        <RoleFilter u={u} />
      </div>
      <div className="mt-4 rounded-v border border-line bg-paper p-4 shadow-v-card">
        <DataTable
          rows={u.rows}
          columns={columns(u)}
          rowKey={(x) => x.id}
          selectable
          bulkActions={bulkActions(u)}
          onRowClick={(x) => u.setDetail(x)}
          searchable={(x) => `${x.name} ${x.email} ${x.company ?? ''}`}
          searchPlaceholder="Search by name, email or company…"
          empty={{ title: 'No users match' }}
        />
      </div>
    </div>
  )
}

/* ══════════════════ B · console table ══════════════════ */

function UsersB({ u }: { u: U }) {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Users</h1>
          <p className="font-mono text-xs text-ink-3">
            {u.rows.length} shown / {u.list.length} total
          </p>
        </div>
        <RoleFilter u={u} />
      </div>

      <DataTable
        rows={u.rows}
        columns={columns(u)}
        rowKey={(x) => x.id}
        selectable
        dense
        bulkActions={bulkActions(u)}
        onRowClick={(x) => u.setDetail(x)}
        searchable={(x) => `${x.name} ${x.email} ${x.company ?? ''}`}
        searchPlaceholder="name, email, company…"
        empty={{ title: 'No users match' }}
      />
    </div>
  )
}

/* ══════════════════ C · master-detail ══════════════════ */

function UsersC({ u }: { u: U }) {
  const [selected, setSelected] = React.useState(u.rows[0]?.id)
  const active = u.rows.find((x) => x.id === selected) ?? u.rows[0]

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-10 sm:px-6">
      <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">Users</h1>
      <p className="mt-3 text-lg text-ink-2">{u.list.length} accounts across the platform.</p>

      <div className="mt-8">
        <RoleFilter u={u} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Stagger className="space-y-2 lg:max-h-[70dvh] lg:overflow-y-auto lg:pr-2">
          {u.rows.map((x) => (
            <StaggerItem key={x.id}>
              <button
                type="button"
                onClick={() => setSelected(x.id)}
                aria-current={x.id === active?.id ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-v bg-paper p-4 text-left shadow-v-card transition-v hover-lift',
                  x.id === active?.id && 'ring-2 ring-brand-500',
                )}
              >
                <Avatar name={x.name} id={x.id} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{x.name}</span>
                  <span className="block truncate text-xs text-ink-3">{x.email}</span>
                </span>
                <Badge tone={STATUS_TONE[x.status]} size="sm">{x.status}</Badge>
              </button>
            </StaggerItem>
          ))}
        </Stagger>

        {active && (
          <Reveal key={active.id} className="rounded-v bg-paper p-8 shadow-lg lg:sticky lg:top-24 lg:self-start">
            <div className="flex items-start gap-4">
              <Avatar name={active.name} id={active.id} size="xl" />
              <div className="min-w-0">
                <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">
                  {active.name}
                </h2>
                <p className="text-ink-3">{active.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone={ROLE_TONE[active.role]}>{ROLE_LABEL[active.role]}</Badge>
                  <Badge tone={STATUS_TONE[active.status]}>{active.status}</Badge>
                </div>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4">
              {[
                ['Joined', shortDate(active.joined)],
                ['Last active', relativeTime(active.lastActive)],
                ['Company', active.company ?? '—'],
                ['Applications', active.applications != null ? String(active.applications) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-v-control bg-canvas p-3">
                  <dt className="text-xs text-ink-3">{k}</dt>
                  <dd className="mt-0.5 font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                variant={active.status === 'suspended' ? 'primary' : 'danger'}
                onClick={() => u.toggleSuspend(active.id)}
              >
                {active.status === 'suspended' ? 'Reactivate' : 'Suspend'}
              </Button>
              <Button variant="secondary" onClick={() => u.setDetail(active)}>
                <UserCog className="size-4" />
                Full audit trail
              </Button>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  )
}
