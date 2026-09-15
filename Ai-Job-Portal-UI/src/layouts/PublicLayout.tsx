import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { Menu, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Logo, PrismMark } from './Logo'
import { VariantSwitcher, CommandPalette, Kbd } from '@/components/common'
import { useAuth } from '@/store/auth'

const NAV = [
  { to: '/jobs', label: 'Find jobs' },
  { to: '/companies', label: 'Companies' },
  { to: '/pricing', label: 'For employers' },
]

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, isLoading, signOut } = useAuth()

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-v-control focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      {/* Glass nav — the one place glassmorphism is allowed (DESIGN.md §4) */}
      <header className="header-tint sticky top-0 z-40 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto grid h-20 max-w-[1480px] grid-cols-[1fr_auto_1fr] items-center gap-6 px-4 sm:px-6 lg:px-12">
          <Logo size={34} className="justify-self-start" />

          <nav className="hidden items-center gap-1 justify-self-center md:flex" aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2.5 text-[15px] font-medium transition-v',
                    isActive
                      ? 'bg-tone-sky-vivid text-white'
                      : 'text-ink-2 hover:bg-[var(--color-tone-sky-bg)] hover:text-tone-sky',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 justify-self-end">
            <VariantSwitcher />
            {!isLoading && user ? (
              <>
                <Button variant="ghost" size="md" asChild className="hidden sm:inline-flex">
                  <Link to="/candidate">My dashboard</Link>
                </Button>
                <Button size="md" onClick={signOut} className="hidden sm:inline-flex">
                  Sign out
                </Button>
              </>
            ) : !isLoading ? (
              <>
                <Button variant="ghost" size="md" asChild className="hidden sm:inline-flex">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="md" asChild className="hidden sm:inline-flex">
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            ) : null}
            <button
              type="button"
              className="rounded-v-control p-2.5 text-ink-2 hover:bg-hover md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="header-tint space-y-1 border-t border-line px-4 py-3 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="block rounded-v-control px-3 py-2.5 text-sm font-medium text-ink-2 hover:bg-hover"
              >
                {item.label}
              </Link>
            ))}
            {!isLoading && user ? (
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" size="sm" className="flex-1" asChild>
                  <Link to="/candidate">My dashboard</Link>
                </Button>
                <Button size="sm" className="flex-1" onClick={signOut}>Sign out</Button>
              </div>
            ) : !isLoading ? (
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" size="sm" className="flex-1" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link to="/register">Get started</Link>
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {/* one clean brand rule rather than a spectrum — this bar sits over
            every public page, so it should not compete with any of them */}
        <span className="block h-0.5 w-full bg-tone-sky-vivid" aria-hidden />
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <PublicFooter />
      <CommandPalette />
    </div>
  )
}

function PublicFooter() {
  const cols = [
    {
      title: 'For candidates',
      links: [
        ['Browse jobs', '/jobs'],
        ['Companies', '/companies'],
        ['My dashboard', '/candidate'],
        ['My applications', '/candidate/applications'],
      ],
    },
    {
      title: 'For employers',
      links: [
        ['Post a job', '/recruiter/jobs/new'],
        ['Recruiter dashboard', '/recruiter'],
        ['Pricing', '/pricing'],
        ['Applicant triage', '/recruiter/jobs/j1/applicants'],
      ],
    },
    {
      title: 'Company',
      links: [
        ['FAQ', '/faq'],
        ['Contact', '/contact'],
        ['Career resources', '/resources'],
      ],
    },
    {
      title: 'Design system',
      links: [
        ['Compare directions', '/variants'],
        ['Style guide', '/styleguide'],
        ['Admin console', '/admin'],
      ],
    },
  ]

  return (
    <footer className="footer-tint border-t-2 border-tone-sky-vivid">
      <div className="mx-auto max-w-[1480px] px-4 py-14 sm:px-6 lg:px-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-2">
              AI finds the fit. You make the call. Explainable matching, a full ATS pipeline, and a
              job board in one place.
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-2">
              Press <Kbd>⌘</Kbd>
              <Kbd>K</Kbd> anywhere to jump around
            </p>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-tone-sky">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="text-sm text-ink-2 transition-colors hover:text-tone-sky">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-2">
          <p>© 2026 Kairo — design prototype. Product name is a placeholder.</p>
          <p className="flex items-center gap-1.5">
            <PrismMark size={14} />
            AI is advisory. Every hiring decision is human.
          </p>
        </div>
      </div>
    </footer>
  )
}
