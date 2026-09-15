import { Outlet } from 'react-router'
import { Logo } from './Logo'
import { VariantSwitcher } from '@/components/common'

/**
 * Chrome-less shell for flows that must not be interrupted:
 * onboarding and assessment-taking (PRD Part 20 — distraction-free,
 * no nav, timer is the only persistent chrome).
 */
export function FocusLayout() {
  return (
    <div className="min-h-dvh bg-canvas flex flex-col">
      <div className="absolute left-4 top-4 z-10">
        <Logo size={24} />
      </div>
      <div className="absolute right-4 top-4 z-10">
        <VariantSwitcher compact />
      </div>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
