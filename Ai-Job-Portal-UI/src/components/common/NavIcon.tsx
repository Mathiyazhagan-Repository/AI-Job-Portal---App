import * as React from 'react'
import { useReducedMotion } from 'motion/react'
import {
  LayoutDashboardIcon, SearchIcon, BookmarkIcon, BellRingIcon, FileTextIcon,
  CalendarDaysIcon, MessageSquareIcon, UserIcon, BellIcon, SettingsIcon,
  UsersIcon, CreditCardIcon, SparklesIcon, ListChecksIcon, StoreIcon,
  ChartColumnIcon, ShieldCheckIcon, FlagIcon, FileClockIcon,
} from '@animateicons/react/lucide'
import { cn } from '@/lib/utils'
import { TONE_CLASS, type Tone } from './StatCard'

/**
 * The sidebar icon: a solid hue-filled tile whose glyph animates at the path
 * level when you hover anywhere on the nav row.
 *
 * Icons come from `@animateicons/react` (animateicons.in), which builds each
 * one on Motion with a typed imperative handle. Two details of that API drive
 * the code below:
 *
 *  1. An icon left without a ref self-animates on its own hover. Attaching a
 *     ref hands control over instead — so we attach one and fire it from the
 *     whole NavLink, otherwise you would have to hit the 16px glyph exactly.
 *  2. The handle is only wired on mount, so `startAnimation` has to be called
 *     through the ref, never re-created per render.
 *
 * Not every lucide glyph exists in the set yet (Briefcase is the one this nav
 * needs), so `NavIcon` falls back to the plain lucide component and lets the
 * tile carry the motion. The metaphor stays correct rather than being bent to
 * fit whatever happens to be animated.
 *
 * Reduced motion is enforced here rather than trusted to the library: most of
 * its icons guard `startAnimation` against `useReducedMotion`, but some — the
 * `User` glyph this nav uses among them — do not, and animate anyway when
 * driven imperatively. Gating the handle covers every icon uniformly.
 */

export interface AnimatedIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

type AnimatedIcon = React.ForwardRefExoticComponent<
  { size?: number; duration?: number; className?: string } & React.RefAttributes<AnimatedIconHandle>
>

/**
 * Maps the lucide name used in the nav to its animated counterpart.
 * Where the set has no exact match, the nearest honest metaphor is used —
 * "Reports" reads better as a flag than a shield anyway.
 */
export const ANIMATED: Record<string, AnimatedIcon> = {
  LayoutDashboard: LayoutDashboardIcon,
  Search: SearchIcon,
  Bookmark: BookmarkIcon,
  BellRing: BellRingIcon,
  FileText: FileTextIcon,
  CalendarDays: CalendarDaysIcon,
  MessageSquare: MessageSquareIcon,
  User: UserIcon,
  Bell: BellIcon,
  Settings: SettingsIcon,
  Users: UsersIcon,
  CreditCard: CreditCardIcon,
  Sparkles: SparklesIcon,
  ClipboardList: ListChecksIcon,
  Building2: StoreIcon,
  BarChart3: ChartColumnIcon,
  Gavel: ShieldCheckIcon,
  Shield: FlagIcon,
  ScrollText: FileClockIcon,
}

export interface NavIconProps {
  /** The lucide component, used as the fallback and to look up the animation. */
  icon: React.ElementType
  /** The lucide export name, e.g. "LayoutDashboard". */
  name: string
  tone: Tone
  active?: boolean
  /** Set by the parent row on hover, so the whole link is the trigger. */
  hovered?: boolean
  size?: number
  className?: string
}

export const NavIcon = React.forwardRef<AnimatedIconHandle, NavIconProps>(function NavIcon(
  { icon: Fallback, name, tone, active, hovered, size = 16, className },
  ref,
) {
  const Animated = ANIMATED[name]
  const t = TONE_CLASS[tone]
  const reduced = useReducedMotion() ?? false
  const inner = React.useRef<AnimatedIconHandle>(null)

  React.useImperativeHandle(
    ref,
    () => ({
      startAnimation: () => {
        if (reduced) return
        inner.current?.startAnimation()
      },
      stopAnimation: () => inner.current?.stopAnimation(),
    }),
    [reduced],
  )

  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-lg',
        'transition-[transform,box-shadow,filter] duration-200 ease-[var(--v-ease)]',
        // every tile is solid in its own hue — the glyph sits on it in white
        t.fill,
        'text-white',
        active ? 'shadow-md ring-2 ring-white/70' : 'shadow-sm',
        hovered && (reduced ? 'brightness-110' : 'scale-110 shadow-md brightness-110'),
        className,
      )}
      aria-hidden
    >
      {Animated ? (
        <Animated ref={inner} size={size} />
      ) : (
        <Fallback style={{ width: size, height: size }} />
      )}
    </span>
  )
})
