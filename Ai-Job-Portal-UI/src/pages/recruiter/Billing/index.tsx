import * as React from 'react'
import { Link } from 'react-router'
import { CreditCard, Download, Info, ArrowUpRight, AlertTriangle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVariant } from '@/hooks'
import { billing } from '@/data/console'
import { shortDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader, DataTable, type Column } from '@/components/common'
import { Stagger, StaggerItem, Reveal, AnimatedNumber } from '@/components/motion'
import { supabase } from '@/lib/supabase'

/**
 * R19 — Billing (PRD Part 47).
 *
 * No payment provider is assumed, so this is a clearly-labelled stub
 * rather than a fake checkout. Usage meters and invoices are real UI;
 * the card form is deliberately absent.
 */

type Invoice = (typeof billing.invoices)[number]
type Usage = (typeof billing.usage)[number]
type BillingData = { usage: Usage[] }

const inr = (n: number) => (n < 0 ? '−' : '') + '₹' + Math.abs(n).toLocaleString('en-IN')

function ProviderStub({ large }: { large?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-v border border-warning/30 bg-warning-bg/50',
        large ? 'p-5' : 'p-4',
      )}
    >
      <Info className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
      <div>
        <p className={cn('font-semibold text-warning', large && 'text-lg')}>
          No payment provider is connected
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">
          PRD Part 47 leaves the gateway as a decision for Product, so this screen is a labelled
          stub, not a working checkout. The <code className="font-mono text-xs">payments</code> and{' '}
          <code className="font-mono text-xs">invoices</code> tables are provider-agnostic — a{' '}
          <code className="font-mono text-xs">provider_ref</code> field abstracts whichever gateway
          is chosen, so nothing above this layer has to change.
        </p>
      </div>
    </div>
  )
}

function UsageMeter({ u, large }: { u: (typeof billing.usage)[number]; large?: boolean }) {
  const unlimited = u.limit == null
  const pct = unlimited ? 0 : (u.used / u.limit!) * 100
  const full = !unlimited && pct >= 100
  const near = !unlimited && pct >= 80 && !full

  return (
    <div className={cn('rounded-v border border-line bg-paper', large ? 'p-6' : 'p-v-card')}>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-3">{u.label}</p>
      <p className={cn('mt-1 font-mono tnum font-bold text-ink', large ? 'text-4xl' : 'text-2xl')}>
        <AnimatedNumber value={u.used} />
        {!unlimited && <span className="text-base font-normal text-ink-3"> / {u.limit}</span>}
      </p>
      {unlimited ? (
        <p className="mt-2 text-xs text-ink-3">No limit on your plan</p>
      ) : (
        <>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-700',
                full ? 'bg-warning' : near ? 'bg-warning' : 'bg-brand-600',
              )}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <p className={cn('mt-2 text-xs', full ? 'text-warning' : 'text-ink-3')}>
            {full ? 'Limit reached — upgrade to add more' : `${u.limit! - u.used} left this period`}
          </p>
        </>
      )}
    </div>
  )
}

function PlanCard({ large }: { large?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-v border border-brand-200 bg-brand-50',
        large ? 'p-8' : 'p-v-card',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Current plan
          </p>
          <p className={cn('font-display tracking-tight mt-1 font-semibold text-ink', large ? 'text-4xl' : 'text-2xl')}>
            {billing.plan}
          </p>
        </div>
        <Badge tone="brand" size="lg">active</Badge>
      </div>

      <p className="mt-4 font-mono tnum text-xl font-bold text-ink">
        {inr(billing.amount)}
        <span className="text-sm font-normal text-ink-2"> / month</span>
      </p>
      <p className="mt-1 text-sm text-ink-2">
        Renews {shortDate(billing.renews)} · billed annually
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size={large ? 'md' : 'sm'} asChild>
          <Link to="/pricing">
            Change plan
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
        <Button size={large ? 'md' : 'sm'} variant="secondary" disabled>
          <CreditCard className="size-4" />
          Update payment method
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-ink-3">
        Payment method is disabled — no gateway is connected in this build.
      </p>
    </div>
  )
}

const invoiceColumns: Column<Invoice>[] = [
  {
    key: 'id', header: 'Invoice', primary: true,
    cell: (v) => <span className="font-mono text-xs font-medium text-ink">{v.id}</span>,
  },
  { key: 'period', header: 'Period', cell: (v) => <span className="text-ink-2">{v.period}</span> },
  {
    key: 'issued', header: 'Issued', hideBelow: 'md', sortable: true, sortValue: (v) => v.issued,
    cell: (v) => <span className="font-mono text-xs text-ink-3">{shortDate(v.issued)}</span>,
  },
  {
    key: 'amount', header: 'Amount', align: 'right', sortable: true, sortValue: (v) => v.amount,
    cell: (v) => (
      <span className={cn('font-mono tnum text-sm', v.amount < 0 ? 'text-warning' : 'text-ink')}>
        {inr(v.amount)}
      </span>
    ),
  },
  {
    key: 'status', header: 'Status', align: 'center',
    cell: (v) => (
      <Badge tone={v.status === 'paid' ? 'success' : 'warning'} size="sm">
        {v.status}
      </Badge>
    ),
  },
  {
    key: 'dl', header: '', align: 'right',
    cell: () => (
      <Button variant="ghost" size="icon-sm" aria-label="Download invoice">
        <Download className="size-4" />
      </Button>
    ),
  },
]

export function Component() {
  const variant = useVariant()
  const data = useBillingData()
  const Views = { a: BillingA, b: BillingB, c: BillingC }
  const View = Views[variant] ?? BillingA
  return <View data={data} />
}
Component.displayName = 'RecruiterBilling'

function useBillingData(): BillingData {
  const [usage, setUsage] = React.useState<Usage[]>(billing.usage)

  React.useEffect(() => {
    let active = true

    const loadUsage = async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return

      const [{ count: liveJobs }, { data: company }] = await Promise.all([
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('recruiter_id', authData.user.id)
          .eq('status', 'published'),
        supabase
          .from('companies')
          .select('id')
          .eq('recruiter_id', authData.user.id)
          .maybeSingle(),
      ])

      let teamSeats = 0
      if (company?.id) {
        const { count } = await supabase
          .from('Team')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .eq('status', 'active')
        teamSeats = count ?? 0
      }

      if (!active) return
      setUsage((current) => current.map((meter) => {
        if (meter.label === 'Live job posts') return { ...meter, used: liveJobs ?? 0 }
        if (meter.label === 'Team seats') return { ...meter, used: teamSeats }
        return meter
      }))
    }

    void loadUsage()
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void loadUsage()
    })
    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  return { usage }
}

/* ══════════════════ A · plan + meters + invoices ══════════════════ */

function BillingA({ data }: { data: BillingData }) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      <PageHeader
        icon={CreditCard}
        tone="rose"
        title="Billing"
        description="Your plan, what you have used this period, and past invoices."
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <PlanCard />
          <ProviderStub />
        </div>

        <div className="min-w-0 space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">Usage this period</h2>
            <Stagger className="grid gap-3 sm:grid-cols-2" whenVisible={false}>
              {data.usage.map((u) => (
                <StaggerItem key={u.label}>
                  <UsageMeter u={u} />
                </StaggerItem>
              ))}
            </Stagger>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">Invoices</h2>
            <div className="rounded-v border border-line bg-paper p-4 shadow-v-card">
              <DataTable
                rows={billing.invoices}
                columns={invoiceColumns}
                rowKey={(v) => v.id}
                empty={{ title: 'No invoices yet' }}
              />
              <p className="mt-3 text-xs text-ink-3">
                Refunds appear as negative entries, linked to the admin action that issued them.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════ B · everything on one screen ══════════════════ */

function BillingB({ data }: { data: BillingData }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div>
          <h1 className="text-base font-semibold text-ink">Billing</h1>
          <p className="font-mono text-xs text-ink-3">
            {billing.plan} · {inr(billing.amount)}/mo · renews {shortDate(billing.renews)}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link to="/pricing">Change plan</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-line pb-3 sm:grid-cols-4">
        {data.usage.map((u) => (
          <div key={u.label} className="px-1">
            <p className="text-[11px] uppercase tracking-wide text-ink-3">{u.label}</p>
            <p className="font-mono tnum text-lg font-bold text-ink">
              {u.used}
              {u.limit != null && <span className="text-sm font-normal text-ink-3">/{u.limit}</span>}
            </p>
            {u.limit != null && (
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-subtle">
                <div
                  className={cn(
                    'h-full rounded-full',
                    u.used / u.limit >= 1 ? 'bg-warning' : 'bg-brand-600',
                  )}
                  style={{ width: `${Math.min(100, (u.used / u.limit) * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Invoices</h2>
        <DataTable
          rows={billing.invoices}
          columns={invoiceColumns}
          rowKey={(v) => v.id}
          searchable={(v) => `${v.id} ${v.period}`}
          searchPlaceholder="Search invoices…"
          empty={{ title: 'No invoices' }}
        />
      </div>

      <div className="mt-4">
        <ProviderStub />
      </div>
    </div>
  )
}

/* ══════════════════ C · usage hero ══════════════════ */

function BillingC({ data }: { data: BillingData }) {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <h1 className="font-display tracking-tight text-display-2 font-semibold text-ink">Billing</h1>
      <p className="mt-3 text-lg text-ink-2">
        You are on {billing.plan}, renewing {shortDate(billing.renews)}.
      </p>

      <Reveal whenVisible={false} className="mt-10">
        <PlanCard large />
      </Reveal>

      <Reveal className="mt-10">
        <h2 className="font-display tracking-tight text-2xl font-semibold text-ink">
          What you have used
        </h2>
        <Stagger className="mt-6 grid gap-5 sm:grid-cols-2">
          {data.usage.map((u) => (
            <StaggerItem key={u.label}>
              <div className="rounded-v bg-paper shadow-lg">
                <UsageMeter u={u} large />
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Reveal>

      <Reveal className="mt-12 rounded-v bg-paper p-8 shadow-lg">
        <h2 className="font-display tracking-tight mb-6 text-2xl font-semibold text-ink">
          Invoices
        </h2>
        <DataTable
          rows={billing.invoices}
          columns={invoiceColumns}
          rowKey={(v) => v.id}
          empty={{ title: 'No invoices yet' }}
        />
      </Reveal>

      <div className="mt-10">
        <ProviderStub large />
      </div>
    </div>
  )
}
