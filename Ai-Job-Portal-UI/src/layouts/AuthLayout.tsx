import { Outlet, Link, useLocation } from 'react-router'
import { Logo, PrismMark } from './Logo'
import { VariantSwitcher } from '@/components/common'
import { Photo } from '@/components/common/Photo'
import { useVariant } from '@/hooks'
import type { PhotoKey } from '@/lib/photos'
import { cn } from '@/lib/utils'

const PROOF = [
  { stat: '1.4 days', label: 'median time to first shortlist', sub: 'down from 6 days before AI ranking' },
  { stat: '100%', label: 'of scores show their full breakdown', sub: 'no black-box percentages, ever' },
  { stat: '0', label: 'candidates auto-rejected by AI', sub: 'every decision is made by a person' },
]

/** The panel picture answers the form beside it, so it changes with the route. */
const PANEL: Record<'login' | 'register', { photo: PhotoKey; alt: string }> = {
  login: {
    photo: 'authSignIn',
    alt: 'Two engineers working side by side in a bright office',
  },
  register: {
    photo: 'authJoin',
    alt: 'A hiring team working through a shortlist together',
  },
}

export function AuthLayout() {
  const variant = useVariant()
  const { pathname } = useLocation()
  // /forgot-password and /reset-password are the sign-in journey, so they
  // keep the sign-in frame rather than introducing a third picture.
  const panel = pathname.startsWith('/register') ? PANEL.register : PANEL.login

  // B · centred minimal card, nothing else on the page
  if (variant === 'b') {
    return (
      <div className="min-h-dvh grid place-items-center bg-canvas px-4">
        <div className="absolute right-4 top-4">
          <VariantSwitcher compact />
        </div>
        <div className="w-full max-w-[380px]">
          <Logo className="mb-6" />
          <Outlet />
        </div>
      </div>
    )
  }

  // C · full-bleed animated prism behind a lifted card
  if (variant === 'c') {
    return (
      <div className="relative min-h-dvh grid place-items-center overflow-hidden bg-canvas px-4 py-10">
        <PrismField />
        <div className="absolute right-4 top-4 z-10">
          <VariantSwitcher compact />
        </div>
        <div className="relative z-10 w-full max-w-md rounded-v bg-paper/90 p-8 shadow-xl backdrop-blur-xl">
          <Logo className="mb-6" />
          <Outlet />
        </div>
      </div>
    )
  }

  // A · split screen: form left, drifting prism right
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Logo />
          <VariantSwitcher compact />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </div>
        <p className="text-xs text-ink-3">
          <Link to="/" className="hover:text-ink-2">
            ← Back to Kairo
          </Link>
        </p>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-ink lg:block">
        {/* The photograph fills the panel; everything above it is scrim and
            brand light, so the copy never has to fight the picture. */}
        <Photo
          src={panel.photo}
          alt={panel.alt}
          width={900}
          height={1200}
          priority
          rounded={false}
          className="absolute inset-0 size-full"
        />
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              'linear-gradient(to top, rgba(11,18,32,.94) 0%, rgba(11,18,32,.86) 34%, rgba(11,18,32,.45) 62%, rgba(11,18,32,.18) 100%)',
          }}
        />
        {/* the prism keeps its drift, now reading as light on the photo */}
        <PrismField className="opacity-80 mix-blend-screen" />

        <div className="relative z-10 flex h-full flex-col justify-end p-12">
          <blockquote className="max-w-md">
            <p className="font-display text-3xl font-semibold leading-tight tracking-tight text-white">
              AI finds the fit.
              <br />
              <span className="bg-gradient-to-r from-brand-300 to-accent-200 bg-clip-text text-transparent">
                You make the call.
              </span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Kairo ranks and explains — it never decides. Every score opens into the exact
              weighting behind it, for the top candidate and the last one alike.
            </p>
          </blockquote>

          <dl className="mt-10 grid gap-5 border-t border-white/15 pt-8 sm:grid-cols-3">
            {PROOF.map((p) => (
              <div key={p.label}>
                <dt className="font-mono tnum text-2xl font-bold text-brand-300">{p.stat}</dt>
                <dd className="mt-1 text-xs leading-snug text-white/70">
                  {p.label}
                  <span className="mt-0.5 block text-white/45">{p.sub}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  )
}

/** Slow-drifting refracted light. Pure CSS — no images, no canvas. */
export function PrismField({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div
        className="animate-drift absolute -left-24 top-10 size-[420px] rounded-full opacity-[0.18] blur-3xl"
        style={{ background: 'radial-gradient(circle, #2563EB, transparent 70%)' }}
      />
      <div
        className="animate-drift absolute right-0 top-1/3 size-[380px] rounded-full opacity-[0.16] blur-3xl"
        style={{ background: 'radial-gradient(circle, #7C3AED, transparent 70%)', animationDelay: '-6s' }}
      />
      <div
        className="animate-drift absolute bottom-0 left-1/3 size-[340px] rounded-full opacity-[0.12] blur-3xl"
        style={{ background: 'radial-gradient(circle, #0891B2, transparent 70%)', animationDelay: '-12s' }}
      />
      <PrismMark size={180} className="absolute left-1/2 top-1/3 -translate-x-1/2 opacity-[0.06]" />
    </div>
  )
}
