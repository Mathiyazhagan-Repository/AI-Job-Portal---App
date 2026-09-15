import * as React from 'react'
import { Link } from 'react-router'
import { Check, Inbox, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/layouts/Logo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea, Field } from '@/components/ui/input'
import {
  Checkbox, Switch, Progress, Skeleton, Avatar, Separator,
  Tabs, TabsList, TabsTrigger, Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/controls'
import { MatchPrism, ScoreBadge, ScoreRing, SkillConstellation, StageRail, StagePill, AIProvenanceChip, RecommendationReason } from '@/components/brand'
import { EmptyState, StatTile, FunnelChart, Sparkline, Kbd, VariantSwitcher } from '@/components/common'
import { SCORE_BANDS, buildBreakdown } from '@/lib/scoring'
import { ACTIVE_STAGES, STAGES } from '@/lib/pipeline'
import { useVariant, VARIANT_META } from '@/hooks'

/**
 * The kitchen sink. Every component in every state, in whichever
 * direction is active — our visual-regression surface (DESIGN.md §15).
 */

const DEMO = buildBreakdown({
  skills: 92, experience: 85, location: 100, education: 90, title: 82, preferences: 85,
})

export function Component() {
  const variant = useVariant()
  const meta = VARIANT_META[variant]

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 px-6 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Logo />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-ink">Style guide</h1>
            <p className="text-xs text-ink-3">
              Direction {variant.toUpperCase()} · {meta.name}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <VariantSwitcher />
            <Button variant="secondary" size="sm" asChild>
              <Link to="/variants">Compare directions</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-12 px-6 py-10">
        <Section title="Colour tokens" note="Colour never varies by direction — only shape does.">
          <div className="space-y-6">
            <Swatches
              label="Brand"
              items={[
                ['brand-50', 'bg-brand-50'], ['brand-100', 'bg-brand-100'], ['brand-500', 'bg-brand-500'],
                ['brand-600', 'bg-brand-600'], ['brand-700', 'bg-brand-700'],
                ['accent-500', 'bg-accent-500'], ['accent-600', 'bg-accent-600'],
              ]}
            />
            <Swatches
              label="Paper & ink"
              items={[
                ['paper', 'bg-paper'], ['canvas', 'bg-canvas'], ['subtle', 'bg-subtle'],
                ['hover', 'bg-hover'], ['line', 'bg-line'], ['line-strong', 'bg-line-strong'],
                ['ink-3', 'bg-ink-3'], ['ink-2', 'bg-ink-2'], ['ink', 'bg-ink'],
              ]}
            />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
                Score bands — colour + label + glyph, never colour alone
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SCORE_BANDS).map(([k, b]) => (
                  <span
                    key={k}
                    className={cn('rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset', b.bg, b.text, b.ring)}
                  >
                    {b.glyph} {b.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
                Pipeline stages
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(STAGES).map((s) => (
                  <StagePill key={s} stage={s as never} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="Typography">
          <div className="space-y-3">
            <p className="font-display tracking-tight text-display-1 font-bold text-ink">Display 1</p>
            <p className="font-display tracking-tight text-display-2 font-semibold text-ink">Display 2</p>
            <p className="text-4xl font-semibold text-ink">Heading 4xl</p>
            <p className="text-2xl font-semibold text-ink">Heading 2xl</p>
            <p className="text-base text-ink-2">
              Body — Inter at 16px with a 1.5 line height. The quick brown fox jumps over the lazy dog.
            </p>
            <p className="font-mono tnum text-base text-ink-2">
              Mono tabular — 0123456789 · 87% · ₹24L–₹38L
            </p>
          </div>
        </Section>

        <Section title="Buttons — all 8 states">
          <div className="space-y-3">
            {(['primary', 'secondary', 'ghost', 'subtle', 'danger'] as const).map((v) => (
              <div key={v} className="flex flex-wrap items-center gap-2">
                <span className="w-20 text-xs text-ink-3">{v}</span>
                <Button variant={v}>Default</Button>
                <Button variant={v} className="hover:brightness-100">Hover →</Button>
                <Button variant={v} loading>Loading</Button>
                <Button variant={v} disabled>Disabled</Button>
                <Button variant={v} size="sm">Small</Button>
                <Button variant={v} size="lg">Large</Button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Form controls">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default" htmlFor="f1" hint="With a helpful hint">
              <Input placeholder="Type something…" />
            </Field>
            <Field label="With error" htmlFor="f2" error="This field is required" required>
              <Input defaultValue="bad@" />
            </Field>
            <Field label="Disabled" htmlFor="f3">
              <Input disabled defaultValue="Locked" />
            </Field>
            <Field label="Textarea" htmlFor="f4">
              <Textarea rows={3} placeholder="Longer text…" />
            </Field>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked /> Checked</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox /> Unchecked</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox disabled /> Disabled</label>
              <label className="flex items-center gap-2 text-sm"><Switch defaultChecked /> Switch on</label>
              <label className="flex items-center gap-2 text-sm"><Switch /> Switch off</label>
            </div>
            <div className="space-y-3">
              <Progress value={78} />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2">
                {(['xs','sm','md','lg','xl'] as const).map((s) => (
                  <Avatar key={s} name="Aarav Sharma" id={s} size={s} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            {(['neutral','brand','accent','success','warning','danger','info','outline'] as const).map((t) => (
              <Badge key={t} tone={t}>{t}</Badge>
            ))}
          </div>
        </Section>

        <Section title="⭐ MatchPrism — three layouts, one component" note="The product's hero component. Score and reasoning always ship together.">
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-semibold text-ink-3">layout="panel" · A</p>
              <MatchPrism score={87} breakdown={DEMO} matchedSkills={['React','TypeScript','Node.js']} missingSkills={['GraphQL']} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-ink-3">layout="inline" · B</p>
              <div className="rounded-v border border-line bg-paper p-3">
                <MatchPrism score={72} breakdown={DEMO} matchedSkills={['React']} missingSkills={['GraphQL','Node.js']} layout="inline" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-ink-3">layout="ring" · C</p>
              <MatchPrism score={44} breakdown={DEMO} meetsHardRequirements={false} matchedSkills={['React']} missingSkills={['TypeScript','Node.js','GraphQL']} layout="ring" size="lg" />
            </div>
          </div>
        </Section>

        <Section title="Score indicators">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {[96, 84, 68, 41].map((s) => <ScoreBadge key={s} score={s} showLabel />)}
              <ScoreBadge score={52} meetsHardRequirements={false} showLabel />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              {(['sm','md','lg','xl'] as const).map((s) => (
                <ScoreRing key={s} score={87} size={s} />
              ))}
            </div>
          </div>
        </Section>

        <Section title="Pipeline">
          <div className="space-y-4">
            {ACTIVE_STAGES.slice(0, 5).map((s) => (
              <div key={s} className="flex items-center gap-4">
                <StageRail stage={s} showLabel />
              </div>
            ))}
            <StageRail stage="rejected" showLabel />
          </div>
        </Section>

        <Section title="Skill constellation">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex justify-center pb-6">
              <SkillConstellation
                variant={variant === 'b' ? 'a' : variant}
                matched={[{ name: 'React', years: 6 }, { name: 'TypeScript', years: 5 }, { name: 'Node.js', years: 4 }]}
                missing={[{ name: 'GraphQL' }, { name: 'Kubernetes' }]}
                bonus={[{ name: 'AWS', years: 3 }, { name: 'Terraform', years: 2 }]}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-ink-3">Direction B degrades to chip rows</p>
              <SkillConstellation
                variant="b"
                matched={[{ name: 'React', years: 6 }, { name: 'TypeScript', years: 5 }]}
                missing={[{ name: 'GraphQL' }]}
                bonus={[{ name: 'AWS', years: 3 }]}
              />
            </div>
          </div>
        </Section>

        <Section title="AI provenance & recommendations" note="AIProvenanceChip is the one component identical in all three directions — it's a compliance surface, not a style choice.">
          <div className="space-y-3">
            <AIProvenanceChip what="ranked and explained this match" />
            <RecommendationReason reason="Because you saved 3 React roles in Bengaluru this week." onDismiss={() => {}} />
            <RecommendationReason variant="b" reason="Because you saved 3 React roles in Bengaluru." />
          </div>
        </Section>

        <Section title="Data display">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Active jobs" value={14} delta={2} hint="vs last month" />
            <StatTile label="Applicants" value="312" delta={48} hint="this week" />
            <StatTile label="Time to hire" value="18d" delta={-3} hint="improving" />
            <StatTile label="Offer rate" value="33%" />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-v border border-line bg-paper p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">Funnel</p>
              <FunnelChart data={[
                { stage: 'Applied', count: 148 }, { stage: 'Screening', count: 92 },
                { stage: 'Shortlisted', count: 41 }, { stage: 'Interview', count: 12 },
                { stage: 'Offer', count: 4 },
              ]} />
            </div>
            <div className="rounded-v border border-line bg-paper p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-3">Sparkline</p>
              <Sparkline values={[12, 18, 14, 22, 26, 21, 30, 28, 34, 31, 38, 42]} />
            </div>
          </div>
        </Section>

        <Section title="Tabs & accordion">
          <div className="space-y-6">
            <Tabs defaultValue="one">
              <TabsList>
                <TabsTrigger value="one">Overview</TabsTrigger>
                <TabsTrigger value="two">Applicants</TabsTrigger>
                <TabsTrigger value="three">Analytics</TabsTrigger>
              </TabsList>
            </Tabs>
            <Accordion type="single" collapsible className="rounded-v border border-line bg-paper px-4">
              <AccordionItem value="a">
                <AccordionTrigger>How is the match score calculated?</AccordionTrigger>
                <AccordionContent>
                  Six weighted components: skills 35%, experience 20%, location 15%, education 10%,
                  title relevance 10%, preferences 10%. Every score opens into the full table.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="b" className="border-b-0">
                <AccordionTrigger>Does the AI ever reject a candidate?</AccordionTrigger>
                <AccordionContent>
                  No. AI ranks, scores, drafts and explains. Every state-changing hiring decision is
                  a human action, written to the audit log.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </Section>

        <Section title="Empty state">
          <div className="rounded-v border border-line bg-paper">
            <EmptyState
              icon={Inbox}
              title="No applicants yet"
              description="Share this job to start receiving applications. Most roles see their first applicant within 12 hours."
              action={{ label: 'Copy job link' }}
              secondaryAction={{ label: 'Show QR code' }}
            />
          </div>
        </Section>

        <Section title="Keyboard">
          <div className="flex flex-wrap items-center gap-4 text-sm text-ink-2">
            <span className="flex items-center gap-1"><Kbd>⌘</Kbd><Kbd>K</Kbd> palette</span>
            <span className="flex items-center gap-1"><Kbd>J</Kbd><Kbd>K</Kbd> navigate</span>
            <span className="flex items-center gap-1"><Kbd>S</Kbd> shortlist</span>
            <span className="flex items-center gap-1"><Kbd>R</Kbd> reject</span>
          </div>
        </Section>
      </div>
    </div>
  )
}

Component.displayName = 'Styleguide'

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 border-b border-line pb-2">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {note && <p className="mt-1 text-sm text-ink-2">{note}</p>}
      </div>
      {children}
    </section>
  )
}

function Swatches({ label, items }: { label: string; items: [string, string][] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map(([name, cls]) => (
          <div key={name} className="w-24">
            <div className={cn('h-12 rounded-v-control border border-line', cls)} />
            <p className="mt-1 font-mono text-[10px] text-ink-3">{name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
