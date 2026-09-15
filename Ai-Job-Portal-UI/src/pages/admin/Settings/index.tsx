import * as React from 'react'
import { Settings2, Flag, AlertTriangle, Info, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant, useAnnounce } from '@/hooks'
import { systemSettings, featureFlags } from '@/data/console'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/controls'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Tooltip } from '@/components/ui/overlay'
import { PageHeader } from '@/components/common'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'

/** A12 — System settings and feature flags (PRD Part 28). */

const ENV_TONE = { dev: 'neutral', staging: 'warning', prod: 'success' } as const

function useSettings() {
  const [flags, setFlags] = React.useState(featureFlags)
  const [confirming, setConfirming] = React.useState<(typeof featureFlags)[number] | null>(null)
  const [editing, setEditing] = React.useState<string | null>(null)
  const announce = useAnnounce()

  const toggle = (key: string) => {
    setFlags((f) => f.map((x) => (x.key === key ? { ...x, on: !x.on } : x)))
    const flag = flags.find((x) => x.key === key)
    announce(`${flag?.label} ${flag?.on ? 'disabled' : 'enabled'}`)
    setConfirming(null)
  }

  const request = (flag: (typeof featureFlags)[number]) => {
    // Production flags get a confirmation — a toggle here changes the live product.
    if (flag.env === 'prod') setConfirming(flag)
    else toggle(flag.key)
  }

  return { flags, toggle, request, confirming, setConfirming, editing, setEditing }
}

type S = ReturnType<typeof useSettings>

export function Component() {
  const variant = useVariant()
  const s = useSettings()
  const [tab, setTab] = React.useState('settings')

  const settingsPanel = <SettingsGroups s={s} />
  const flagsPanel = <FlagList s={s} />

  /* ── B · left nav + panel ── */
  if (variant === 'b') {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
          <div>
            <h1 className="text-base font-semibold text-ink">System settings</h1>
            <p className="font-mono text-xs text-ink-3">
              {s.flags.filter((f) => f.on).length}/{s.flags.length} flags on
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="xs" variant={tab === 'settings' ? 'primary' : 'secondary'} onClick={() => setTab('settings')}>
              Settings
            </Button>
            <Button size="xs" variant={tab === 'flags' ? 'primary' : 'secondary'} onClick={() => setTab('flags')}>
              Feature flags
            </Button>
          </div>
        </div>
        {tab === 'settings' ? settingsPanel : flagsPanel}
        <ConfirmDialog s={s} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6',
        variant === 'c' ? 'max-w-[1040px] py-10' : 'max-w-[1280px] py-6',
      )}
    >
      {variant === 'c' ? (
        <>
          <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">
            System settings
          </h1>
          <p className="mt-3 text-lg text-ink-2">
            Platform-wide configuration and what is switched on where.
          </p>
        </>
      ) : (
        <PageHeader
        icon={Settings2}
        tone="teal"
          title="System settings"
          description="Platform-wide configuration and feature flags. Every change is written to the audit log."
        />
      )}

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings2 className="size-4" aria-hidden />
            Settings
          </TabsTrigger>
          <TabsTrigger value="flags">
            <Flag className="size-4" aria-hidden />
            Feature flags ({s.flags.filter((f) => f.on).length}/{s.flags.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <Reveal whenVisible={false}>{settingsPanel}</Reveal>
        </TabsContent>
        <TabsContent value="flags" className="mt-6">
          <Reveal whenVisible={false}>{flagsPanel}</Reveal>
        </TabsContent>
      </Tabs>

      <ConfirmDialog s={s} />
    </div>
  )
}
Component.displayName = 'AdminSettings'

/* ══════════════════ settings ══════════════════ */

function SettingsGroups({ s }: { s: S }) {
  return (
    <Stagger className="space-y-4" whenVisible={false}>
      {systemSettings.map((group) => (
        <StaggerItem key={group.group}>
          <section className="rounded-v border-[length:var(--v-card-border)] border-line bg-paper p-v-card shadow-v-card">
            <h2 className="font-semibold text-ink">{group.group}</h2>
            <dl className="mt-3 divide-y divide-line">
              {group.items.map((item) => (
                <div key={item.key} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <dt className="text-sm text-ink-2">{item.key}</dt>
                  <dd className="flex items-center gap-2">
                    {s.editing === item.key ? (
                      <>
                        <Input defaultValue={item.value} className="h-8 w-48" aria-label={item.key} />
                        <Button size="xs" onClick={() => s.setEditing(null)}>
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="font-mono text-sm font-medium text-ink">{item.value}</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => s.setEditing(item.key)}
                          aria-label={`Edit ${item.key}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </StaggerItem>
      ))}

      <StaggerItem>
        <p className="flex items-start gap-2 rounded-v border border-line bg-canvas p-3 text-xs leading-relaxed text-ink-2">
          <Info className="mt-0.5 size-3.5 shrink-0 text-ink-3" aria-hidden />
          Changing a value here affects every company on the platform immediately, and is recorded
          in the audit log with your identity. Elevated changes require re-authentication.
        </p>
      </StaggerItem>
    </Stagger>
  )
}

/* ══════════════════ feature flags ══════════════════ */

function FlagList({ s }: { s: S }) {
  return (
    <Stagger className="space-y-2" whenVisible={false}>
      {s.flags.map((f) => (
        <StaggerItem key={f.key}>
          <div
            className={cn(
              'flex flex-wrap items-center gap-3 rounded-v border-[length:var(--v-card-border)] bg-paper p-3.5 shadow-v-card transition-v',
              f.on ? 'border-brand-200' : 'border-line',
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink">{f.label}</p>
                <Badge tone={ENV_TONE[f.env]} size="sm">
                  {f.env}
                </Badge>
                {f.env === 'prod' && (
                  <Tooltip content="This flag is live in production — toggling it changes the product for every user right now.">
                    <AlertTriangle className="size-3.5 cursor-help text-warning" aria-label="Production flag" />
                  </Tooltip>
                )}
              </div>
              <p className="mt-0.5 font-mono text-xs text-ink-3">{f.key}</p>
              <p className="mt-1 text-sm text-ink-2">{f.note}</p>
            </div>
            <Switch checked={f.on} onCheckedChange={() => s.request(f)} aria-label={f.label} />
          </div>
        </StaggerItem>
      ))}

      <StaggerItem>
        <p className="flex items-start gap-2 rounded-v border border-line bg-canvas p-3 text-xs leading-relaxed text-ink-2">
          <Info className="mt-0.5 size-3.5 shrink-0 text-ink-3" aria-hidden />
          <span>
            <strong className="font-medium text-ink">Learning-to-rank stays off</strong> until the
            bias-parity panel has a clean run over a full sampling period. Enabling a model that
            learns from recruiter behaviour before that check is how proxy discrimination gets in.
          </span>
        </p>
      </StaggerItem>
    </Stagger>
  )
}

function ConfirmDialog({ s }: { s: S }) {
  const f = s.confirming
  return (
    <Dialog open={Boolean(f)} onOpenChange={(o) => !o && s.setConfirming(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change a production flag?</DialogTitle>
          <DialogDescription>
            This takes effect immediately for every user on the platform.
          </DialogDescription>
        </DialogHeader>
        {f && (
          <div className="px-5 pb-5">
            <div className="rounded-v bg-warning-bg p-3">
              <p className="flex items-start gap-2 text-sm text-warning">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  You are about to <strong className="font-semibold">{f.on ? 'disable' : 'enable'}</strong>{' '}
                  <span className="font-mono">{f.key}</span> in production. The change is logged with
                  your identity and can be reverted here.
                </span>
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => s.setConfirming(null)}>
                Cancel
              </Button>
              <Button variant={f.on ? 'danger' : 'primary'} onClick={() => s.toggle(f.key)}>
                {f.on ? 'Disable in production' : 'Enable in production'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
