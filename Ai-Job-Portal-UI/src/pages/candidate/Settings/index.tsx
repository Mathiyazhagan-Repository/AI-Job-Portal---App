import * as React from 'react'
import { User, Lock, Bell, AlertOctagon, Check, Smartphone, Monitor, Settings2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { candidate } from '@/data/mock'
import { shortDate, relativeTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input, Field, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch, Checkbox, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/controls'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/overlay'
import { PageHeader } from '@/components/common'
import { Reveal } from '@/components/motion'
import { useAuth } from '@/store/auth'

/** C15 — Account settings. */

const NOTIFY_ROWS = [
  { key: 'stage', label: 'Application stage changes', hint: 'Shortlisted, rejected, moved forward' },
  { key: 'interview', label: 'Interview invitations and reminders', hint: 'Plus reschedules and cancellations' },
  { key: 'assessment', label: 'Assessment assigned or due soon', hint: 'Due-soon fires 48 hours before' },
  { key: 'match', label: 'New job matches', hint: 'Batched into one digest, never one email per job' },
  { key: 'alert', label: 'Job alert digests', hint: 'Follows each alert’s own frequency' },
  { key: 'message', label: 'Recruiter messages', hint: 'Only from recruiters you have applied to' },
  { key: 'product', label: 'Product news', hint: 'Occasional — never more than monthly' },
]

const SESSIONS = [
  { id: 's1', device: 'Chrome · Windows', where: 'Bengaluru, IN', last: new Date().toISOString(), current: true, icon: Monitor },
  { id: 's2', device: 'Safari · iPhone', where: 'Bengaluru, IN', last: new Date(Date.now() - 2 * 86400000).toISOString(), current: false, icon: Smartphone },
]

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'danger', label: 'Danger zone', icon: AlertOctagon },
]

function useSettings() {
  const [prefs, setPrefs] = React.useState<Record<string, { app: boolean; email: boolean }>>(
    Object.fromEntries(NOTIFY_ROWS.map((r) => [r.key, { app: true, email: r.key !== 'product' }])),
  )
  const [saved, setSaved] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const set = (key: string, ch: 'app' | 'email', v: boolean) => {
    setPrefs((p) => ({ ...p, [key]: { ...p[key], [ch]: v } }))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }
  return { prefs, set, saved, confirmDelete, setConfirmDelete }
}

type S = ReturnType<typeof useSettings>

export function Component() {
  const { signOut } = useAuth()
  const variant = useVariant()
  const s = useSettings()
  const [tab, setTab] = React.useState('account')

  const panels: Record<string, React.ReactNode> = {
    account: <AccountPanel signOut={signOut} />,
    security: <SecurityPanel />,
    notifications: <NotifyPanel s={s} />,
    danger: <DangerPanel s={s} />,
  }

  /* B · left nav + panel */
  if (variant === 'b') {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
        <h1 className="mb-3 border-b border-line pb-2 text-base font-semibold text-ink">Settings</h1>
        <div className="grid gap-5 lg:grid-cols-[200px_1fr]">
          <nav aria-label="Settings sections">
            <ul className="space-y-0.5">
              {TABS.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setTab(t.id)}
                    aria-current={tab === t.id ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-v-control px-2.5 py-1.5 text-sm transition-v',
                      tab === t.id ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-2 hover:bg-hover',
                    )}
                  >
                    <t.icon className="size-4" aria-hidden />
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <Reveal key={tab} className="min-w-0">{panels[tab]}</Reveal>
        </div>
        <SavedToast s={s} />
        <DeleteDialog s={s} />
      </div>
    )
  }

  /* A and C · tabs */
  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6',
        variant === 'c' ? 'max-w-[1040px] py-10' : 'max-w-[1280px] py-6',
      )}
    >
      {variant === 'c' ? (
        <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">Settings</h1>
      ) : (
        <PageHeader icon={Settings2} tone="teal" title="Account settings" description="Your account, security and what we email you." />
      )}

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList fill>
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              <t.icon className="size-4" aria-hidden />
              <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.id} value={t.id} className="mt-6">
            <Reveal whenVisible={false}>{panels[t.id]}</Reveal>
          </TabsContent>
        ))}
      </Tabs>

      <SavedToast s={s} />
      <DeleteDialog s={s} />
    </div>
  )
}
Component.displayName = 'CandidateSettings'

/* ══════════════════ panels ══════════════════ */

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-v border-[length:var(--v-card-border)] border-line bg-paper p-v-card shadow-v-card">
      <h2 className="font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-2">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function AccountPanel({ signOut }: { signOut: () => void }) {
  return (
    <div className="space-y-4">
      <Card title="Your details" description="Shown to recruiters only in the context of an application.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="st-name"><Input defaultValue={candidate.name} /></Field>
          <Field label="Email" htmlFor="st-mail" hint="Used for sign-in and notifications">
            <Input defaultValue={candidate.email} type="email" />
          </Field>
          <Field label="Phone" htmlFor="st-phone" hint="Optional — only shared once you apply">
            <Input placeholder="+91 " />
          </Field>
          <Field label="Location" htmlFor="st-loc"><Input defaultValue={candidate.location} /></Field>
        </div>
        <Button className="mt-4">Save changes</Button>
      </Card>

      <Card title="Language and region">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="st-lang">Interface language</Label>
            <select
              id="st-lang"
              className="mt-1.5 h-9.5 w-full rounded-v-control border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand-500"
            >
              <option>English</option>
              <option disabled>हिन्दी — coming later</option>
            </select>
          </div>
          <div>
            <Label htmlFor="st-tz">Timezone</Label>
            <select
              id="st-tz"
              className="mt-1.5 h-9.5 w-full rounded-v-control border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand-500"
            >
              <option>Asia/Kolkata (IST)</option>
              <option>Asia/Dubai (GST)</option>
              <option>Europe/London (GMT)</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-3">
          Interview times are always shown in this timezone, and labelled with it.
        </p>
      </Card>
    </div>
  )
}

function SecurityPanel() {
  return (
    <div className="space-y-4">
      <Card title="Password">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current password" htmlFor="st-cur"><Input type="password" /></Field>
          <div />
          <Field label="New password" htmlFor="st-new"><Input type="password" /></Field>
          <Field label="Confirm new password" htmlFor="st-conf"><Input type="password" /></Field>
        </div>
        <Button className="mt-4">Update password</Button>
      </Card>

      <Card title="Two-factor authentication" description="An extra code at sign-in, from an authenticator app.">
        <div className="flex items-center justify-between gap-4 rounded-v-control border border-line p-3">
          <div>
            <p className="font-medium text-ink">Authenticator app</p>
            <p className="text-sm text-ink-3">Not set up yet</p>
          </div>
          <Button variant="secondary" size="sm">Set up</Button>
        </div>
      </Card>

      <Card title="Where you are signed in">
        <ul className="space-y-2">
          {SESSIONS.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-v-control border border-line p-3">
              <s.icon className="size-5 shrink-0 text-ink-3" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                  {s.device}
                  {s.current && <Badge tone="success" size="sm">this device</Badge>}
                </p>
                <p className="text-xs text-ink-3">
                  {s.where} · last active {relativeTime(s.last)}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut}>
                {s.current ? 'Sign out' : 'End session'}
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Account security log" description="Sign-ins and password changes on your account. Admins see a broader audit log; this one is yours.">
        <ul className="space-y-1.5 text-sm">
          {[
            ['Signed in', 'Chrome · Windows · Bengaluru', 0.02],
            ['Password changed', 'Chrome · Windows', 48],
            ['Signed in', 'Safari · iPhone · Bengaluru', 2],
          ].map(([what, where, days]) => (
            <li key={String(what) + days} className="flex justify-between gap-3 border-b border-line pb-1.5">
              <span className="text-ink-2">
                <span className="font-medium text-ink">{what}</span> · {where}
              </span>
              <span className="shrink-0 font-mono text-xs text-ink-3">
                {relativeTime(new Date(Date.now() - Number(days) * 86400000).toISOString())}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function NotifyPanel({ s }: { s: S }) {
  return (
    <Card
      title="What we send you"
      description="In-app always shows in your notification centre. Email is what actually lands in your inbox."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="pb-2 text-xs font-medium text-ink-3">Event</th>
              <th scope="col" className="w-20 pb-2 text-center text-xs font-medium text-ink-3">In-app</th>
              <th scope="col" className="w-20 pb-2 text-center text-xs font-medium text-ink-3">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {NOTIFY_ROWS.map((r) => (
              <tr key={r.key}>
                <th scope="row" className="py-2.5 text-left font-normal">
                  <span className="block font-medium text-ink">{r.label}</span>
                  <span className="block text-xs text-ink-3">{r.hint}</span>
                </th>
                <td className="text-center">
                  <Checkbox
                    checked={s.prefs[r.key].app}
                    onCheckedChange={(v) => s.set(r.key, 'app', Boolean(v))}
                    aria-label={`${r.label} in app`}
                  />
                </td>
                <td className="text-center">
                  <Checkbox
                    checked={s.prefs[r.key].email}
                    onCheckedChange={(v) => s.set(r.key, 'email', Boolean(v))}
                    aria-label={`${r.label} by email`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-ink-3">
        Security emails — password changes and new sign-ins — are always sent and cannot be turned off.
      </p>
    </Card>
  )
}

function DangerPanel({ s }: { s: S }) {
  return (
    <div className="space-y-4">
      <Card title="Pause your profile" description="Stay signed up, but stop appearing in recruiter searches.">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-ink-2">
            Your applications stay active. You simply stop showing up in new candidate searches.
          </p>
          <Switch aria-label="Pause profile visibility" />
        </div>
      </Card>

      <section className="rounded-v border border-danger/25 bg-danger-bg/40 p-v-card">
        <h2 className="font-semibold text-danger">Delete your account</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
          Your profile is soft-deleted immediately and permanently purged after 30 days. Active
          applications are marked withdrawn and the recruiters are notified. This cannot be undone
          once the purge runs.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => s.setConfirmDelete(true)}>
          Delete my account
        </Button>
      </section>
    </div>
  )
}

function DeleteDialog({ s }: { s: S }) {
  const [text, setText] = React.useState('')
  return (
    <Dialog open={s.confirmDelete} onOpenChange={s.setConfirmDelete}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            Type <strong className="font-semibold text-ink">DELETE</strong> to confirm. This starts a
            30-day purge that cannot be reversed once complete.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          <ul className="mb-4 space-y-1.5 text-sm text-ink-2">
            {[
              'Your profile stops appearing in every search immediately',
              '5 active applications are marked withdrawn',
              'Resumes and parsed data are deleted after 30 days',
              'Interview and message history is retained for audit, anonymised',
            ].map((l) => (
              <li key={l} className="flex gap-2">
                <span aria-hidden className="text-ink-3">·</span>
                {l}
              </li>
            ))}
          </ul>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => s.setConfirmDelete(false)}>
              Keep my account
            </Button>
            <Button variant="danger" disabled={text !== 'DELETE'}>
              Delete permanently
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SavedToast({ s }: { s: S }) {
  if (!s.saved) return null
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-lg"
    >
      <Check className="mr-1.5 inline size-4" aria-hidden />
      Preferences saved
    </div>
  )
}
