import * as React from 'react'
import { UserPlus, Trash2, Check, Minus, AlertTriangle, Mail, Users2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { PERMISSION_MATRIX, ROLE_LABEL, type TeamMember, type CompanyRole } from '@/data/console'
import { relativeTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/controls'
import { Input, Field, Label } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/overlay'
import { PageHeader, DataTable, type Column } from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { supabase } from '@/lib/supabase'

/** R4 — Team & permissions (PRD Part 9 / 23). */

const ROLES: CompanyRole[] = ['owner', 'admin', 'recruiter', 'hiring_manager', 'viewer']

const ROLE_TONE: Record<CompanyRole, 'brand' | 'accent' | 'success' | 'neutral' | 'outline'> = {
  owner: 'brand', admin: 'accent', recruiter: 'success', hiring_manager: 'neutral', viewer: 'outline',
}

function useTeam() {
  const [list, setList] = React.useState<TeamMember[]>([])
  const [previewRole, setPreviewRole] = React.useState<CompanyRole>('recruiter')
  const [removing, setRemoving] = React.useState<TeamMember | null>(null)
  const [inviting, setInviting] = React.useState(false)
  const [inviteError, setInviteError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    void (async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!authData.user) return

        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session) {
          const teamResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/team`, {
            headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
          })
          if (teamResponse.ok) {
            const teamData = await teamResponse.json()
            if (teamData.owner) {
              const owner: TeamMember = {
                id: teamData.owner.id,
                name: teamData.owner.full_name || 'Owner',
                email: teamData.owner.email || '',
                role: 'owner',
                jobsOwned: 0,
                lastActive: new Date().toISOString(),
                status: 'active',
              }
              const members = (teamData.members ?? []).map((member: any) => ({
                id: member.id,
                name: member.member_name,
                email: member.member_email,
                role: member.role,
                jobsOwned: member.jobs_owned ?? 0,
                lastActive: member.last_active || member.created_at,
                status: 'active',
              })) as TeamMember[]
              if (active) setList([owner, ...members.filter((member) => member.id !== owner.id)])
              return
            }
          }
        }

        let { data: company, error: companyError } = await supabase
          .from('companies')
          .select('id, recruiter_id')
          .eq('recruiter_id', authData.user.id)
          .maybeSingle()
        if (companyError) throw companyError

        if (!company) {
          const { data: membership, error: membershipError } = await supabase
            .from('Team')
            .select('company_id')
            .eq('member_id', authData.user.id)
            .eq('status', 'active')
            .maybeSingle()
          if (membershipError) throw membershipError
          if (membership) {
            const { data: memberCompany, error: memberCompanyError } = await supabase
              .from('companies')
              .select('id, recruiter_id')
              .eq('id', membership.company_id)
              .maybeSingle()
            if (memberCompanyError) throw memberCompanyError
            company = memberCompany
          }
        }
        if (!active) return

        if (!company) {
          setList([])
          return
        }

        const { data: recruiter, error: recruiterError } = await supabase
          .from('recruiters')
          .select('id, full_name, email')
          .eq('id', company.recruiter_id)
          .maybeSingle()
        if (recruiterError) throw recruiterError

        const owner: TeamMember = {
          id: company.recruiter_id,
          name: recruiter?.full_name || 'Owner',
          email: recruiter?.email || '',
          role: 'owner',
          jobsOwned: 0,
          lastActive: authData.user.last_sign_in_at || new Date().toISOString(),
          status: 'active',
        }

        const [{ data: members, error: membersError }, { count: jobsOwned, error: jobsError }] = await Promise.all([
          supabase
            .from('Team')
            .select('id, member_id, member_name, member_email, role, jobs_owned, last_active, status, created_at')
            .eq('company_id', company.id)
            .eq('status', 'active')
            .order('created_at', { ascending: true }),
          supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .eq('recruiter_id', company.recruiter_id),
        ])
        if (membersError) throw membersError
        if (jobsError) throw jobsError

        const team = (members ?? []).filter((member) => member.member_id !== authData.user.id).map((member) => ({
          id: member.id,
          name: member.member_name,
          email: member.member_email,
          role: member.role,
          jobsOwned: member.jobs_owned ?? 0,
          lastActive: member.last_active || member.created_at,
          status: member.status === 'invited' ? 'invited' : 'active',
        })) as TeamMember[]
        const ownerEntry = { ...owner, jobsOwned: jobsOwned ?? 0 }
        setList([ownerEntry, ...team])
      } catch {
        if (active) setList([])
      }
    })()
    return () => { active = false }
  }, [])

  const setRole = (id: string, role: CompanyRole) =>
    setList((l) => l.map((m) => (m.id === id ? { ...m, role } : m)))
  const remove = (id: string) => setList((l) => l.filter((m) => m.id !== id))

  const invite = async (name: string, email: string) => {
    setInviteError(null)
    if (!name.trim() || !email.trim()) {
      setInviteError('Name and work email are required.')
      return false
    }

    setInviting(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!authData.user) throw new Error('Please sign in before inviting a team member.')

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('recruiter_id', authData.user.id)
        .maybeSingle()
      if (companyError) throw companyError
      if (!company) throw new Error('Complete company setup before inviting team members.')

      const role = previewRole === 'owner' ? 'viewer' : previewRole
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) throw new Error('Please sign in before inviting a team member.')

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/team/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ company_id: company.id, name: name.trim(), email: email.trim(), role }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.detail || 'Unable to send invitation.')
      return true
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Unable to send invitation.')
      return false
    } finally {
      setInviting(false)
    }
  }

  const seatsUsed = list.filter((m) => m.status === 'active').length
  return { list, setRole, remove, invite, inviting, inviteError, previewRole, setPreviewRole, removing, setRemoving, seatsUsed, seatLimit: 5 }
}

type T = ReturnType<typeof useTeam>

export function Component() {
  const variant = useVariant()
  const t = useTeam()
  const Views = { a: TeamA, b: TeamB, c: TeamC }
  const View = Views[variant] ?? TeamA
  return (
    <>
      <View t={t} />
      <RemoveDialog t={t} />
    </>
  )
}
Component.displayName = 'RecruiterTeam'

/* ══════════════════ shared ══════════════════ */

function RoleSelect({ member, t }: { member: TeamMember; t: T }) {
  return (
    <select
      value={member.role}
      onChange={(e) => t.setRole(member.id, e.target.value as CompanyRole)}
      disabled={member.role === 'owner'}
      aria-label={`Role for ${member.name}`}
      className="h-8 rounded-v-control border border-line bg-paper px-2 text-sm text-ink outline-none focus:border-brand-500 disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]}
        </option>
      ))}
    </select>
  )
}

/**
 * The PRD Part 9 matrix, live. Picking a role highlights that column, so
 * an admin can see exactly what they are granting before they grant it.
 */
function PermissionMatrix({ t, compact }: { t: T; compact?: boolean }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-2">Show what a</span>
        <div className="flex flex-wrap gap-1">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => t.setPreviewRole(r)}
              aria-pressed={t.previewRole === r}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-v',
                t.previewRole === r
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-line bg-paper text-ink-2 hover:border-brand-300',
              )}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
        <span className="text-sm text-ink-2">can do</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <caption className="sr-only">Permissions by company role</caption>
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="py-2 text-xs font-medium text-ink-3">Module</th>
              {ROLES.map((r) => (
                <th
                  key={r}
                  scope="col"
                  className={cn(
                    'py-2 text-center text-xs font-medium transition-v',
                    t.previewRole === r ? 'text-brand-700' : 'text-ink-3',
                  )}
                >
                  {ROLE_LABEL[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {PERMISSION_MATRIX.map((row) => (
              <tr key={row.module} className="hover:bg-hover">
                <th scope="row" className={cn('text-left font-normal text-ink-2', compact ? 'py-1.5' : 'py-2.5')}>
                  {row.module}
                </th>
                {ROLES.map((r) => {
                  const v = row[r]
                  const highlighted = t.previewRole === r
                  return (
                    <td
                      key={r}
                      className={cn(
                        'text-center text-xs transition-v',
                        highlighted ? 'bg-brand-50 font-medium text-brand-800' : 'text-ink-3',
                      )}
                    >
                      {v === '—' ? <Minus className="mx-auto size-3.5 text-line-strong" aria-label="Not permitted" /> : v}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InviteSheet({ t, trigger }: { t: T; trigger: React.ReactNode }) {
  const full = t.seatsUsed >= t.seatLimit
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto p-5">
        <h2 className="text-lg font-semibold text-ink">Invite a team member</h2>
        <p className="mt-1 text-sm text-ink-2">
          They receive an email and pick their own password. Nothing is shared until they accept.
        </p>

        {full && (
          <div className="mt-4 flex items-start gap-2 rounded-v bg-warning-bg p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <p className="text-sm text-warning">
              All {t.seatLimit} seats on the Growth plan are in use. Upgrade, or remove someone
              first.
            </p>
          </div>
        )}

        <div className="mt-5 space-y-4">
          <Field label="Full name" htmlFor="inv-name" required>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Priya Sharma" />
          </Field>
          <Field label="Work email" htmlFor="inv-mail" required>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="name@company.com" />
          </Field>
          <div>
            <Label>Role</Label>
            <div className="mt-2 space-y-1.5">
              {ROLES.filter((r) => r !== 'owner').map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => t.setPreviewRole(r)}
                  aria-pressed={t.previewRole === r}
                  className={cn(
                    'flex w-full items-start gap-2.5 rounded-v border p-3 text-left transition-v',
                    t.previewRole === r
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-line hover:border-brand-300',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">{ROLE_LABEL[r]}</span>
                    <span className="block text-xs text-ink-3">
                      {PERMISSION_MATRIX.filter((m) => m[r] !== '—').length} of{' '}
                      {PERMISSION_MATRIX.length} modules
                    </span>
                  </span>
                  {t.previewRole === r && <Check className="ml-auto size-4 shrink-0 text-brand-600" aria-hidden />}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-v border border-line bg-canvas p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
              {ROLE_LABEL[t.previewRole]} will be able to
            </p>
            <ul className="space-y-1 text-sm">
              {PERMISSION_MATRIX.filter((m) => m[t.previewRole] !== '—').map((m) => (
                <li key={m.module} className="flex gap-2 text-ink-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-score-elite" aria-hidden />
                  {m.module} — {m[t.previewRole]}
                </li>
              ))}
            </ul>
          </div>

          {t.inviteError && <p className="rounded-v-control border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{t.inviteError}</p>}
          <Button
            className="w-full"
            disabled={full || t.inviting}
            onClick={async () => {
              const sent = await t.invite(name, email)
              if (sent) {
                setName('')
                setEmail('')
              }
            }}
          >
            <Mail className="size-4" />
            {t.inviting ? 'Sending...' : 'Send invitation'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function RemoveDialog({ t }: { t: T }) {
  const m = t.removing
  return (
    <Dialog open={Boolean(m)} onOpenChange={(o) => !o && t.setRemoving(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {m?.name}?</DialogTitle>
          <DialogDescription>They lose access immediately.</DialogDescription>
        </DialogHeader>
        {m && (
          <div className="px-5 pb-5">
            <div className="rounded-v bg-warning-bg p-3">
              <p className="flex items-start gap-2 text-sm text-warning">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <strong className="font-semibold">{m.jobsOwned} jobs</strong> are owned by this
                  person. The jobs and their applications stay with the company — an owner or admin
                  must reassign them.
                </span>
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => t.setRemoving(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  t.remove(m.id)
                  t.setRemoving(null)
                }}
              >
                Remove and reassign later
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SeatMeter({ t }: { t: T }) {
  const pct = (t.seatsUsed / t.seatLimit) * 100
  return (
    <div className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Seats</p>
      <p className="mt-1 font-mono tnum text-2xl font-bold text-ink">
        {t.seatsUsed}
        <span className="text-base font-normal text-ink-3"> / {t.seatLimit}</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle">
        <div
          className={cn('h-full rounded-full', pct >= 100 ? 'bg-warning' : 'bg-brand-600')}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink-3">
        {pct >= 100 ? 'All seats in use — upgrade to add more.' : `${t.seatLimit - t.seatsUsed} seats left on Growth.`}
      </p>
    </div>
  )
}

/* ══════════════════ A · table + matrix ══════════════════ */

function TeamA({ t }: { t: T }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={Users2}
        tone="emerald"
        title="Team"
        description="Who can see and do what inside Northwind Labs."
        actions={
          <InviteSheet
            t={t}
            trigger={
              <Button>
                <UserPlus className="size-4" />
                Invite
              </Button>
            }
          />
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-v border border-line bg-paper shadow-v-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-subtle text-left text-xs text-ink-3">
                  <th scope="col" className="px-4 py-2.5 font-medium">Member</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Role</th>
                  <th scope="col" className="hidden px-4 py-2.5 text-right font-medium md:table-cell">Jobs</th>
                  <th scope="col" className="hidden px-4 py-2.5 text-right font-medium lg:table-cell">Last active</th>
                  <th scope="col" className="px-4 py-2.5" />
                </tr>
              </thead>
              <Stagger as="tbody" className="divide-y divide-line" whenVisible={false}>
                {t.list.map((m) => (
                  <StaggerItem as="tr" key={m.id} className="hover:bg-hover">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={m.name} id={m.id} size="sm" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-ink">{m.name}</span>
                            {m.status === 'invited' && <Badge tone="warning" size="sm">invited</Badge>}
                          </span>
                          <span className="block truncate text-xs text-ink-3">{m.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3"><RoleSelect member={m} t={t} /></td>
                    <td className="hidden px-4 py-3 text-right font-mono tnum md:table-cell">{m.jobsOwned}</td>
                    <td className="hidden px-4 py-3 text-right text-xs text-ink-3 lg:table-cell">
                      {m.status === 'invited' ? 'not yet accepted' : relativeTime(m.lastActive)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => t.setRemoving(m)}
                        disabled={m.role === 'owner'}
                        aria-label={`Remove ${m.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </StaggerItem>
                ))}
              </Stagger>
            </table>
          </div>

          <section className="rounded-v border border-line bg-paper p-v-card shadow-v-card">
            <h2 className="mb-1 font-semibold text-ink">What each role can do</h2>
            <p className="mb-4 text-sm text-ink-2">
              Straight from the permission matrix the backend enforces — the interface is not the
              only thing checking this.
            </p>
            <PermissionMatrix t={t} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SeatMeter t={t} />
        </aside>
      </div>
    </div>
  )
}

/* ══════════════════ B · dense table ══════════════════ */

function TeamB({ t }: { t: T }) {
  const columns: Column<TeamMember>[] = [
    {
      key: 'name', header: 'Member', primary: true, sortable: true, sortValue: (m) => m.name,
      cell: (m) => (
        <span className="flex items-center gap-2">
          <span className="font-medium text-ink">{m.name}</span>
          {m.status === 'invited' && <Badge tone="warning" size="sm">invited</Badge>}
        </span>
      ),
    },
    { key: 'email', header: 'Email', hideBelow: 'lg', cell: (m) => <span className="font-mono text-xs text-ink-3">{m.email}</span> },
    { key: 'role', header: 'Role', cell: (m) => <RoleSelect member={m} t={t} /> },
    {
      key: 'jobs', header: 'Jobs', align: 'right', sortable: true, sortValue: (m) => m.jobsOwned,
      cell: (m) => <span className="font-mono tnum text-xs">{m.jobsOwned}</span>,
    },
    {
      key: 'active', header: 'Last active', align: 'right', hideBelow: 'md', sortable: true, sortValue: (m) => m.lastActive,
      cell: (m) => <span className="font-mono text-xs text-ink-3">{m.status === 'invited' ? '—' : relativeTime(m.lastActive)}</span>,
    },
    {
      key: 'actions', header: '', align: 'right',
      cell: (m) => (
        <Button variant="ghost" size="icon-sm" onClick={() => t.setRemoving(m)} disabled={m.role === 'owner'} aria-label="Remove">
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Team</h1>
          <p className="font-mono text-xs text-ink-3">
            {t.seatsUsed}/{t.seatLimit} seats · {t.list.filter((m) => m.status === 'invited').length} pending
          </p>
        </div>
        <InviteSheet t={t} trigger={<Button size="sm"><UserPlus className="size-4" />Invite</Button>} />
      </div>

      <DataTable
        rows={t.list}
        columns={columns}
        rowKey={(m) => m.id}
        searchable={(m) => `${m.name} ${m.email} ${m.role}`}
        searchPlaceholder="Search team…"
        empty={{ title: 'No team members' }}
      />

      <section className="mt-6 border-t border-line pt-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">
          Permission matrix
        </h2>
        <PermissionMatrix t={t} compact />
      </section>
    </div>
  )
}

/* ══════════════════ C · member cards ══════════════════ */

function TeamC({ t }: { t: T }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
            Your team
          </h1>
          <p className="mt-3 text-lg text-ink-2">
            {t.seatsUsed} of {t.seatLimit} seats in use at Northwind Labs.
          </p>
        </div>
        <InviteSheet
          t={t}
          trigger={
            <Button size="lg">
              <UserPlus className="size-4" />
              Invite someone
            </Button>
          }
        />
      </div>

      <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {t.list.map((m) => (
          <StaggerItem key={m.id}>
            <article className="h-full rounded-v bg-paper p-6 shadow-v-card hover-lift">
              <div className="flex items-start justify-between gap-3">
                <Avatar name={m.name} id={m.id} size="lg" />
                <Badge tone={ROLE_TONE[m.role]}>{ROLE_LABEL[m.role]}</Badge>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-ink">{m.name}</h2>
              <p className="truncate text-sm text-ink-3">{m.email}</p>

              <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-3">Jobs owned</dt>
                  <dd className="font-mono tnum font-medium text-ink">{m.jobsOwned}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-3">Last active</dt>
                  <dd className="text-ink-2">
                    {m.status === 'invited' ? 'not yet accepted' : relativeTime(m.lastActive)}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center gap-2">
                <RoleSelect member={m} t={t} />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => t.setRemoving(m)}
                  disabled={m.role === 'owner'}
                  aria-label={`Remove ${m.name}`}
                  className="ml-auto"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </article>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal className="mt-14 rounded-v bg-paper p-8 shadow-lg">
        <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">
          What each role can do
        </h2>
        <div className="mt-6">
          <PermissionMatrix t={t} />
        </div>
      </Reveal>
    </div>
  )
}
