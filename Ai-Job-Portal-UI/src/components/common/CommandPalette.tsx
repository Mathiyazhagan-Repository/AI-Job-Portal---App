import * as React from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router'
import {
  Search, Briefcase, Users, LayoutDashboard, Building2, FileText, Bell,
  Settings, Shield, Sparkles, Layers, Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/overlay'
import { Kbd } from './index'
import { useVariantControl, type Variant } from '@/hooks'

/**
 * ⭐ DESIGN.md §7.5 — global ⌘K palette.
 * In Direction B this is the PRIMARY navigation model.
 */

interface Action {
  id: string
  label: string
  hint?: string
  icon: React.ElementType
  group: string
  run: () => void
  keywords?: string
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  const { set: setVariant } = useVariantControl()

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = React.useCallback(
    (to: string) => () => {
      navigate(to)
      setOpen(false)
    },
    [navigate],
  )

  const actions: Action[] = React.useMemo(
    () => [
      { id: 'home', label: 'Home', icon: LayoutDashboard, group: 'Public', run: go('/') },
      { id: 'jobs', label: 'Browse jobs', icon: Briefcase, group: 'Public', run: go('/jobs') },
      { id: 'companies', label: 'Companies', icon: Building2, group: 'Public', run: go('/companies') },
      { id: 'pricing', label: 'Pricing', icon: FileText, group: 'Public', run: go('/pricing') },

      { id: 'c-dash', label: 'Candidate dashboard', icon: LayoutDashboard, group: 'Candidate', run: go('/candidate') },
      { id: 'c-jobs', label: 'Job search & recommendations', icon: Search, group: 'Candidate', run: go('/candidate/jobs') },
      { id: 'c-apps', label: 'My applications', icon: FileText, group: 'Candidate', run: go('/candidate/applications') },
      { id: 'c-profile', label: 'My profile', icon: Users, group: 'Candidate', run: go('/candidate/profile') },
      { id: 'c-notif', label: 'Notifications', icon: Bell, group: 'Candidate', run: go('/candidate/notifications') },

      { id: 'r-dash', label: 'Recruiter dashboard', icon: LayoutDashboard, group: 'Recruiter', run: go('/recruiter') },
      { id: 'r-jobs', label: 'Manage jobs', icon: Briefcase, group: 'Recruiter', run: go('/recruiter/jobs') },
      { id: 'r-appl', label: 'Applicant triage — Senior React Developer', hint: 'the money screen', icon: Users, group: 'Recruiter', run: go('/recruiter/jobs/j1/applicants') },
      { id: 'r-new', label: 'Create a job with the AI JD generator', icon: Sparkles, group: 'Recruiter', run: go('/recruiter/jobs/new') },

      { id: 'a-dash', label: 'Admin dashboard', icon: Shield, group: 'Admin', run: go('/admin') },
      { id: 'a-mod', label: 'Job moderation queue', icon: Shield, group: 'Admin', run: go('/admin/jobs') },

      { id: 'v-gallery', label: 'Compare all three design directions', icon: Layers, group: 'Design', run: go('/variants') },
      { id: 'v-style', label: 'Style guide — every component, every state', icon: Palette, group: 'Design', run: go('/styleguide') },
      ...(['a', 'b', 'c'] as Variant[]).map((v) => ({
        id: `set-${v}`,
        label: `Switch to Direction ${v.toUpperCase()}`,
        hint: { a: 'Editorial Clarity', b: 'Command Console', c: 'Expressive Canvas' }[v],
        icon: Layers,
        group: 'Design',
        run: () => {
          setVariant(v)
          setOpen(false)
        },
      })),

      { id: 'settings', label: 'Settings', icon: Settings, group: 'Account', run: go('/candidate/settings') },
    ],
    [go, setVariant],
  )

  const groups = React.useMemo(() => {
    const map = new Map<string, Action[]>()
    for (const a of actions) {
      if (!map.has(a.group)) map.set(a.group, [])
      map.get(a.group)!.push(a)
    }
    return [...map.entries()]
  }, [actions])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        hideClose
        className="p-0 md:max-w-xl overflow-hidden"
        aria-label="Command palette"
      >
        <Command
          label="Command palette"
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ink-3"
        >
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search className="size-4 shrink-0 text-ink-3" aria-hidden />
            <Command.Input
              autoFocus
              placeholder="Search pages, jobs, candidates, actions…"
              className="h-12 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-3 outline-none"
            />
            <Kbd>ESC</Kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-ink-3">
              Nothing matches that.
            </Command.Empty>

            {groups.map(([group, items]) => (
              <Command.Group key={group} heading={group}>
                {items.map((a) => (
                  <Command.Item
                    key={a.id}
                    value={`${a.label} ${a.group} ${a.keywords ?? ''}`}
                    onSelect={a.run}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-v-control px-3 py-2 text-sm text-ink-2',
                      'data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-700',
                    )}
                  >
                    <a.icon className="size-4 shrink-0" aria-hidden />
                    <span className="flex-1 truncate">{a.label}</span>
                    {a.hint && <span className="text-xs text-ink-3 truncate">{a.hint}</span>}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          <div className="flex items-center gap-3 border-t border-line px-3 py-2 text-[11px] text-ink-3">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> open
            </span>
            <span className="ml-auto flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd> toggle
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
