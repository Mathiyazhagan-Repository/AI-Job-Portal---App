import * as React from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import {
  LayoutDashboard, Search, Bookmark, BellRing, FileText, CalendarDays, MessageSquare,
  Bell, User, Settings, Shield, Briefcase, Users, BarChart3, CreditCard, Building2,
  ClipboardList, Gavel, ScrollText, Sparkles, PanelLeftClose, PanelLeft, Command as CmdIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo, PrismMark } from './Logo'
import { Avatar } from '@/components/ui/controls'
import { Button } from '@/components/ui/button'
import { VariantSwitcher, CommandPalette, Kbd, NotificationBell } from '@/components/common'
import { useVariant, useIsMobile } from '@/hooks'
import { TONE_CLASS, type Tone } from '@/components/common'
import { NavIcon, type AnimatedIconHandle } from '@/components/common/NavIcon'
import { candidate, jobs } from '@/data/mock'

export type Persona = 'candidate' | 'recruiter' | 'admin'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  /** The lucide export name, so NavIcon can find the animated version. */
  name: string
  end?: boolean
  badge?: number
  /** Each destination owns a hue, so the icon rail reads as a map. */
  tone: Tone
}

const NAV: Record<Persona, { groups: { title?: string; items: NavItem[] }[]; mobile: NavItem[] }> = {
  candidate: {
    groups: [
      {
        items: [
          { to: '/candidate', label: 'Dashboard', icon: LayoutDashboard, name: 'LayoutDashboard', end: true, tone: 'indigo' },
          { to: '/candidate/jobs', label: 'Find jobs', icon: Search, name: 'Search', tone: 'sky' },
          { to: '/candidate/saved', label: 'Saved jobs', icon: Bookmark, name: 'Bookmark', tone: 'teal' },
          { to: '/candidate/alerts', label: 'Job alerts', icon: BellRing, name: 'BellRing', tone: 'amber' },
        ],
      },
      {
        title: 'Pipeline',
        items: [
          { to: '/candidate/applications', label: 'Applications', icon: FileText, name: 'FileText', badge: 5, tone: 'violet' },
          { to: '/candidate/interviews', label: 'Interviews', icon: CalendarDays, name: 'CalendarDays', badge: 2, tone: 'fuchsia' },
          { to: '/candidate/messages', label: 'Messages', icon: MessageSquare, name: 'MessageSquare', tone: 'sky' },
        ],
      },
      {
        title: 'Account',
        items: [
          { to: '/candidate/profile', label: 'My profile', icon: User, name: 'User', tone: 'emerald' },
          { to: '/candidate/notifications', label: 'Notifications', icon: Bell, name: 'Bell', badge: 2, tone: 'rose' },
          { to: '/candidate/settings', label: 'Settings', icon: Settings, name: 'Settings', tone: 'teal' },
        ],
      },
    ],
    mobile: [
      { to: '/candidate', label: 'Home', icon: LayoutDashboard, name: 'LayoutDashboard', end: true, tone: 'indigo' },
      { to: '/candidate/jobs', label: 'Jobs', icon: Search, name: 'Search', tone: 'violet' },
      { to: '/candidate/applications', label: 'Applied', icon: FileText, name: 'FileText', tone: 'violet' },
      { to: '/candidate/messages', label: 'Messages', icon: MessageSquare, name: 'MessageSquare', tone: 'sky' },
      { to: '/candidate/profile', label: 'Profile', icon: User, name: 'User', tone: 'emerald' },
    ],
  },
  recruiter: {
    groups: [
      {
        items: [
          { to: '/recruiter', label: 'Dashboard', icon: LayoutDashboard, name: 'LayoutDashboard', end: true, tone: 'indigo' },
          { to: '/recruiter/jobs', label: 'Jobs', icon: Briefcase, name: 'Briefcase', badge: jobs.filter((j) => j.status === 'published').length, tone: 'violet' },
          { to: '/recruiter/candidates', label: 'Candidate search', icon: Users, name: 'Users', tone: 'sky' },
        ],
      },
      {
        title: 'Hiring',
        items: [
          { to: '/recruiter/interviews', label: 'Interviews', icon: CalendarDays, name: 'CalendarDays', badge: 3, tone: 'fuchsia' },
          { to: '/recruiter/assessments', label: 'Assessments', icon: ClipboardList, name: 'ClipboardList', tone: 'amber' },
          { to: '/recruiter/messages', label: 'Messages', icon: MessageSquare, name: 'MessageSquare', tone: 'sky' },
        ],
      },
      {
        title: 'Company',
        items: [
          { to: '/recruiter/company', label: 'Company profile', icon: Building2, name: 'Building2', tone: 'teal' },
          { to: '/recruiter/team', label: 'Team', icon: Users, name: 'Users', tone: 'emerald' },
          { to: '/recruiter/analytics', label: 'Analytics', icon: BarChart3, name: 'BarChart3', tone: 'fuchsia' },
          { to: '/recruiter/billing', label: 'Billing', icon: CreditCard, name: 'CreditCard', tone: 'rose' },
        ],
      },
    ],
    mobile: [
      { to: '/recruiter', label: 'Home', icon: LayoutDashboard, name: 'LayoutDashboard', end: true, tone: 'indigo' },
      { to: '/recruiter/jobs', label: 'Jobs', icon: Briefcase, name: 'Briefcase', tone: 'violet' },
      { to: '/recruiter/candidates', label: 'Search', icon: Users, name: 'Users', tone: 'sky' },
      { to: '/recruiter/interviews', label: 'Calendar', icon: CalendarDays, name: 'CalendarDays', tone: 'fuchsia' },
    ],
  },
  admin: {
    groups: [
      {
        items: [
          { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, name: 'LayoutDashboard', end: true, tone: 'indigo' },
          { to: '/admin/jobs', label: 'Job moderation', icon: Gavel, name: 'Gavel', badge: 23, tone: 'amber' },
          { to: '/admin/companies', label: 'Companies', icon: Building2, name: 'Building2', badge: 8, tone: 'teal' },
          { to: '/admin/reports', label: 'Reports', icon: Shield, name: 'Shield', badge: 4, tone: 'rose' },
        ],
      },
      {
        title: 'People',
        items: [
          { to: '/admin/users', label: 'Users', icon: Users, name: 'Users', tone: 'sky' },
          { to: '/admin/support', label: 'Support queue', icon: MessageSquare, name: 'MessageSquare', badge: 2, tone: 'violet' },
        ],
      },
      {
        title: 'Platform',
        items: [
          { to: '/admin/ai-monitoring', label: 'AI monitoring', icon: Sparkles, name: 'Sparkles', tone: 'fuchsia' },
          { to: '/admin/audit', label: 'Audit log', icon: ScrollText, name: 'ScrollText', tone: 'emerald' },
          { to: '/admin/settings', label: 'System settings', icon: Settings, name: 'Settings', tone: 'teal' },
        ],
      },
    ],
    mobile: [
      { to: '/admin', label: 'Home', icon: LayoutDashboard, name: 'LayoutDashboard', end: true, tone: 'indigo' },
      { to: '/admin/jobs', label: 'Moderate', icon: Gavel, name: 'Gavel', tone: 'amber' },
      { to: '/admin/users', label: 'Users', icon: Users, name: 'Users', tone: 'sky' },
      { to: '/admin/support', label: 'Support', icon: MessageSquare, name: 'MessageSquare', tone: 'violet' },
    ],
  },
}

const PERSONA_META: Record<Persona, { label: string; sub: string; accent: string }> = {
  candidate: { label: candidate.name, sub: candidate.headline, accent: 'text-brand-600' },
  recruiter: { label: 'Meera Krishnan', sub: 'Northwind Labs · Recruiter', accent: 'text-brand-600' },
  admin: { label: 'Platform Admin', sub: 'Kairo · Operations', accent: 'text-ink-2' },
}

/**
 * One sidebar row. Hovering anywhere on the link plays the icon's path
 * animation and fills its tile with the destination's hue — the glyph itself
 * is only 16px, so it is far too small to be the hover target.
 */
/** The same filled tile, sized for a 44px touch target. */
function MobileTab({ item }: { item: NavItem }) {
  const icon = React.useRef<AnimatedIconHandle>(null)

  return (
    <NavLink
      to={item.to}
      end={item.end}
      // touch has no hover, so the tap itself is the trigger
      onPointerDown={() => icon.current?.startAnimation()}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
          // 44px minimum touch target (PRD Part 42)
          'min-h-11 justify-center',
          isActive ? 'text-brand-600' : 'text-ink-3',
        )
      }
    >
      {({ isActive }) => (
        <>
          <NavIcon
            ref={icon}
            icon={item.icon}
            name={item.name}
            tone={item.tone}
            active={isActive}
            size={18}
            className="size-8"
          />
          {item.label}
        </>
      )}
    </NavLink>
  )
}

function NavRow({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const [hovered, setHovered] = React.useState(false)
  const icon = React.useRef<AnimatedIconHandle>(null)

  const enter = () => {
    setHovered(true)
    icon.current?.startAnimation()
  }
  const leave = () => {
    setHovered(false)
    icon.current?.stopAnimation()
  }

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        title={collapsed ? item.label : undefined}
        onMouseEnter={enter}
        onMouseLeave={leave}
        onFocus={enter}
        onBlur={leave}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-2.5 overflow-hidden rounded-v-control text-sm font-medium transition-colors',
            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
            // the row takes its destination's hue, not a neutral grey — hover
            // and active read as the same colour the icon already carries
            isActive || hovered ? TONE_CLASS[item.tone].text : 'text-ink-2',
          )
        }
        // A wash that fades out to the right. The `-bg` token is a 5% chip
        // tint — too faint to read as a highlight across a whole row — so this
        // mixes the vivid stop up to ~16%, which still clears AA for the
        // tone's own text colour sitting on it.
        style={({ isActive }) =>
          isActive || hovered
            ? {
                backgroundImage: `linear-gradient(90deg, color-mix(in oklab, var(--color-tone-${item.tone}-vivid) 16%, white), color-mix(in oklab, var(--color-tone-${item.tone}-vivid) 5%, white) 70%, transparent 96%)`,
              }
            : undefined
        }
      >
        {({ isActive }) => (
          <>
            <NavIcon
              ref={icon}
              icon={item.icon}
              name={item.name}
              tone={item.tone}
              active={isActive}
              hovered={hovered}
              size={18}
              className="size-7"
            />
            {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            {!collapsed && item.badge != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 font-mono tnum text-xs font-semibold transition-v',
                  // on a tinted row the pill has to be lighter than the row,
                  // not darker — a solid fill here reads as a second button
                  isActive || hovered
                    ? cn('bg-paper/75', TONE_CLASS[item.tone].text)
                    : cn(TONE_CLASS[item.tone].bg, TONE_CLASS[item.tone].text),
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  )
}

import { useProfileStore } from '@/store/profile'
import { useAuth } from '@/store/auth'

export function AppLayout({ persona }: { persona: Persona }) {
  const variant = useVariant()
  const isMobile = useIsMobile()
  const location = useLocation()
  const profile = useProfileStore()
  const auth = useAuth()
  // Direction B collapses the sidebar to an icon rail by default —
  // the palette is the primary navigation there (DESIGN.md §6.3).
  const [collapsed, setCollapsed] = React.useState(variant === 'b')

  React.useEffect(() => setCollapsed(variant === 'b'), [variant])

  const nav = NAV[persona]
  let meta = PERSONA_META[persona]
  if (persona === 'candidate') {
    meta = {
      label: auth.user?.name || profile.data.name || candidate.name,
      sub: profile.data.headline || candidate.headline,
      accent: 'text-brand-600',
    }
  } else if (persona === 'recruiter') {
    meta = {
      label: auth.user?.name || 'Meera Krishnan',
      sub: 'Northwind Labs · Recruiter',
      accent: 'text-brand-600',
    }
  }
  const railWidth = collapsed ? 'lg:w-[80px]' : 'lg:w-[290px]'

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-v-control focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      {/* ── Sidebar (desktop) ───────────────────────────────── */}
      <aside
        className={cn(
          'sidebar-zoom fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col border-r border-line bg-paper transition-[width] duration-200 ease-[var(--ease-out-soft)]',
          railWidth,
        )}
      >
        <div className={cn('flex h-16 items-center border-b border-line', collapsed ? 'justify-center px-2' : 'px-4')}>
          {collapsed ? <Logo showWord={false} size={29} /> : <Logo />}
        </div>

        {/* Persona strip — makes it unmistakable which console you're in */}
        <div
          className={cn(
            'flex items-center gap-2.5 border-b border-line py-3',
            collapsed ? 'justify-center px-2' : 'px-4',
          )}
        >
          <Avatar name={meta.label} id={persona} size={collapsed ? 'sm' : 'md'} />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{meta.label}</p>
              <p className="truncate text-xs text-ink-3">{meta.sub}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-4" aria-label="Sidebar">
          {nav.groups.map((group, gi) => (
            <div key={gi}>
              {group.title && !collapsed && (
                <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                  {group.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <NavRow key={item.to} item={item} collapsed={collapsed} />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-2 space-y-1">
          {!collapsed && (
            <Link
              to="/variants"
              className="flex items-center gap-2 rounded-v-control px-3 py-2 text-xs text-ink-3 hover:bg-hover hover:text-ink transition-colors"
            >
              <PrismMark size={15} />
              Compare design directions
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-v-control px-3 py-2 text-sm text-ink-3 hover:bg-hover hover:text-ink transition-colors',
              collapsed && 'justify-center px-2',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft className="size-4.5" /> : <PanelLeftClose className="size-4.5" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────── */}
      <div className={cn('flex min-h-dvh flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[80px]' : 'lg:pl-[290px]')}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="lg:hidden">
            <Logo showWord={false} size={29} />
          </div>

          <CommandTrigger />

          <div className="ml-auto flex items-center gap-2">
            <VariantSwitcher compact />
            <NotificationBell persona={persona} />
            <Avatar name={meta.label} id={persona} size="sm" />
          </div>
        </header>

        <main id="main" className="flex-1 pb-20 lg:pb-0" key={location.pathname}>
          <Outlet />
        </main>
      </div>

      {/* ── Bottom tab bar (mobile) — PRD Part 41 ───────────── */}
      {isMobile && (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-paper/95 backdrop-blur-xl lg:hidden"
          aria-label="Primary"
        >
          {nav.mobile.map((item) => (
            <MobileTab key={item.to} item={item} />
          ))}
        </nav>
      )}

      <CommandPalette />
    </div>
  )
}

function CommandTrigger() {
  const fire = () =>
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    )
  return (
    <button
      type="button"
      onClick={fire}
      className={cn(
        'flex h-9 max-w-md flex-1 items-center gap-2 rounded-v-control border border-line bg-canvas px-3',
        'text-sm text-ink-3 transition-colors hover:border-line-strong hover:bg-subtle',
      )}
    >
      <CmdIcon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">Search jobs, candidates, actions…</span>
      <span className="ml-auto hidden shrink-0 items-center gap-0.5 sm:flex">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  )
}
