import * as React from 'react'
import { Link } from 'react-router'
import {
  Bell, CalendarDays, ClipboardCheck, Sparkles, MessageSquare, GitBranch,
  BellRing, Settings2, Users, Gavel, CreditCard, CheckCheck, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { notificationFeed, recruiterNotificationFeed } from '@/data/console'
import { relativeTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/overlay'
import { Stagger, StaggerItem } from '@/components/motion'
import { useAuth } from '@/store/auth'

/**
 * Top-bar notification bell.
 *
 * Shows the most recent few in a popover with a "View all" link, rather
 * than making the bell a bare link to a full page. Each type keeps its
 * own hue, matching the notification centre.
 */

const TYPE_META: Record<string, { icon: React.ElementType; tone: string }> = {
  interview:    { icon: CalendarDays,   tone: 'bg-tone-violet-bg text-tone-violet' },
  assessment:   { icon: ClipboardCheck, tone: 'bg-tone-indigo-bg text-tone-indigo' },
  match:        { icon: Sparkles,       tone: 'bg-tone-fuchsia-bg text-tone-fuchsia' },
  message:      { icon: MessageSquare,  tone: 'bg-tone-sky-bg text-tone-sky' },
  stage:        { icon: GitBranch,      tone: 'bg-tone-teal-bg text-tone-teal' },
  alert:        { icon: BellRing,       tone: 'bg-tone-amber-bg text-tone-amber' },
  system:       { icon: Settings2,      tone: 'bg-subtle text-ink-2' },
  applicant:    { icon: Users,          tone: 'bg-tone-indigo-bg text-tone-indigo' },
  feedback:     { icon: ClipboardCheck, tone: 'bg-tone-rose-bg text-tone-rose' },
  moderation:   { icon: Gavel,          tone: 'bg-tone-teal-bg text-tone-teal' },
  subscription: { icon: CreditCard,     tone: 'bg-tone-amber-bg text-tone-amber' },
}

export function NotificationBell({ persona }: { persona: 'candidate' | 'recruiter' | 'admin' }) {
  const { token } = useAuth()
  const [items, setItems] = React.useState<any[]>([])
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    let active = true
    fetch('http://localhost:8000/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => res.ok ? res.json() : [])
      .then(data => {
        if (active) setItems(Array.isArray(data) ? data : [])
      })
      .catch(() => { if (active) setItems([]) })
    return () => { active = false }
  }, [token])

  const unread = items.filter((n) => !n.read).length
  const latest = items.slice(0, 5)
  const allHref = `/${persona === 'admin' ? 'recruiter' : persona}/notifications`

  const markAll = () => {
    // In a real app we'd bulk update, for now just update local state
    setItems((l) => l.map((n) => ({ ...n, read: true })))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative rounded-v-control p-2 text-ink-2 transition-v hover:bg-hover hover:text-ink"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-tone-rose-vivid px-1 text-[10px] font-bold text-white ring-2 ring-paper">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[380px] overflow-hidden p-0">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Notifications</h2>
            <p className="text-xs text-ink-3">
              {unread > 0 ? `${unread} unread` : 'You are all caught up'}
            </p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="xs" onClick={markAll}>
              <CheckCheck className="size-3.5" />
              Mark read
            </Button>
          )}
        </div>

        {/* the latest few — the full list lives on its own page */}
        <Stagger className="max-h-[380px] divide-y divide-line overflow-y-auto" whenVisible={false}>
          {latest.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.system
            const Icon = meta.icon
            return (
              <StaggerItem key={n.id}>
                <Link
                  to={allHref}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-v hover:bg-hover',
                    !n.read && 'bg-brand-50/40',
                  )}
                >
                  <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg', meta.tone)}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink">
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-600" aria-label="unread" />
                      )}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-ink-2">
                      {n.body}
                    </span>
                    <span className="mt-1 block font-mono text-[11px] text-ink-3">
                      {relativeTime(n.at)}
                    </span>
                  </span>
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>

        <Link
          to={allHref}
          onClick={() => setOpen(false)}
          className="flex items-center justify-center gap-1.5 border-t border-line bg-canvas px-4 py-2.5 text-sm font-medium text-brand-600 transition-v hover:bg-brand-50"
        >
          View all {items.length} notifications
          <ArrowRight className="size-3.5" />
        </Link>
      </PopoverContent>
    </Popover>
  )
}
