import * as React from 'react'
import { Link, useNavigate } from 'react-router'
import { Eye, EyeOff, ArrowRight, Briefcase, UserRound, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Field, Label } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/controls'
import { useVariant } from '@/hooks'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/store/auth'

/* ══════════════════ Login ══════════════════ */

export function LoginPage() {
  const [show, setShow] = React.useState(false)
  const [error, setError] = React.useState<string>()
  const navigate = useNavigate()
  const { signIn } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-2">
        New here?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" className="w-full">
          <GoogleMark /> Google
        </Button>
        <Button variant="secondary" className="w-full">
          <LinkedInMark /> LinkedIn
        </Button>
      </div>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-ink-3">or with email</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const data = new FormData(e.currentTarget)
          const email = String(data.get('email') ?? '').trim()
          const password = String(data.get('password') ?? '').trim()

          if (!email.includes('@')) {
            setError('Enter a valid email address')
            return
          }

          setError(undefined)

          try {
            const res = await fetch('http://localhost:8000/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            })

            if (!res.ok) {
              let errText = 'Account not found. Please create an account first.'
              try {
                const errData = await res.json()
                if (errData?.detail) errText = errData.detail
              } catch {}
              setError(errText)
              return
            }

            const resData = await res.json()
            const candidate = resData.candidate
            signIn(resData.token, {
              id: candidate?.id,
              name: candidate?.full_name ?? '',
              email: candidate?.email ?? email,
              location: candidate?.location ?? '',
              role: candidate?.role,
            })

            try {
              localStorage.removeItem('kairo.profile.v1')
              localStorage.setItem(
                'kairo.signup.basics',
                JSON.stringify({
                  name: candidate?.full_name ?? '',
                  email: candidate?.email ?? email,
                  location: candidate?.location ?? '',
                }),
              )
            } catch {
              // storage may be blocked; login still continues
            }
            if (candidate?.role === 'recruiter') {
              navigate('/recruiter')
            } else if (candidate?.role === 'admin') {
              navigate('/admin')
            } else {
              navigate('/candidate')
            }
          } catch (loginError) {
            const message = loginError instanceof Error ? loginError.message : 'Unable to sign in right now.'
            setError(message)
          }
        }}
      >
        <Field label="Email" htmlFor="email" error={error} required>
          <Input name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-3 hover:text-ink"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-2">
          <Checkbox defaultChecked /> Keep me signed in
        </label>

        <Button type="submit" className="w-full" size="lg">
          Sign in
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-6 rounded-v-control bg-subtle p-3 text-xs leading-relaxed text-ink-2">
        <strong className="font-semibold text-ink">Prototype:</strong> any email works. Sign in to
        land on the candidate console, or jump straight to{' '}
        <Link to="/recruiter" className="font-medium text-brand-600 hover:underline">
          recruiter
        </Link>{' '}
        or{' '}
        <Link to="/admin" className="font-medium text-brand-600 hover:underline">
          admin
        </Link>
        .
      </p>
    </div>
  )
}

/* ══════════════════ Register ══════════════════ */

const ROLES = [
  {
    id: 'candidate' as const,
    icon: UserRound,
    title: "I'm looking for work",
    body: 'Build one profile, get ranked matches with the reasoning attached, track every application.',
    to: '/onboarding',
  },
  {
    id: 'recruiter' as const,
    icon: Briefcase,
    title: "I'm hiring",
    body: 'Draft job descriptions with AI, get an explainable ranked shortlist, run the full pipeline.',
    to: '/recruiter/company/setup',
  },
]

export function RegisterPage() {
  const variant = useVariant()
  const [role, setRole] = React.useState<'candidate' | 'recruiter' | null>(null)
  const [consent, setConsent] = React.useState(false)
  const [password, setPassword] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const strength = React.useMemo(() => {
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  }, [password])

  const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][strength]

  /* Step 0 — role choice. It changes the whole downstream journey,
     so it is a decision, not a dropdown (DESIGN.md §11.2 P12). */
  if (!role) {
    return (
      <div className={cn(variant === 'c' && 'text-center')}>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          First — which side are you on?
        </h1>
        <p className="mt-1.5 text-sm text-ink-2">
          This changes everything that follows, so we ask it up front.
        </p>

        <div className={cn('mt-6 grid gap-3', variant === 'c' && 'sm:grid-cols-2')}>
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={cn(
                'group flex gap-3 rounded-v border border-line bg-paper p-4 text-left transition-all',
                'hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md',
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-v-control bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <r.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink">{r.title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-ink-2">{r.body}</span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm text-ink-2">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  const chosen = ROLES.find((r) => r.id === role)!

  return (
    <div>
      <button
        type="button"
        onClick={() => setRole(null)}
        className="text-xs text-ink-3 hover:text-ink"
      >
        ← Change role
      </button>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-2">
        <chosen.icon className="size-4 text-brand-600" aria-hidden />
        {chosen.title}
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setError(null)

          const formData = new FormData(e.currentTarget)
          const name = String(formData.get('name') ?? '').trim()
          const email = String(formData.get('email') ?? '').trim()
          const candidatePassword = String(formData.get('password') ?? '').trim()

          if (!name || !email || !candidatePassword) {
            setError('Please fill in your name, email, and password.')
            return
          }

          if (!email.includes('@')) {
            setError('Enter a valid email address.')
            return
          }

          setIsSubmitting(true)

          try {
            const res = await fetch('http://localhost:8000/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                full_name: name,
                email,
                password: candidatePassword,
                role: chosen.id,
              }),
            })

            if (!res.ok) {
              let errText = 'Unable to create account.'
              try {
                const errData = await res.json()
                if (errData?.detail) errText = errData.detail
              } catch {}
              setError(errText)
              return
            }

            const resData = await res.json()
            const candidate = resData.candidate
            signIn(resData.token, {
              id: candidate?.id,
              name: candidate?.full_name ?? name,
              email: candidate?.email ?? email,
              location: candidate?.location ?? '',
              role: candidate?.role ?? role,
            })

            try {
              localStorage.setItem(
                'kairo.signup.basics',
                JSON.stringify({ name, email, location: '' }),
              )
            } catch {
              // storage may be blocked
            }

            navigate(chosen.to)
          } catch (saveError) {
            const message = saveError instanceof Error ? saveError.message : 'Unable to save your account.'
            setError(message)
          } finally {
            setIsSubmitting(false)
          }
        }}
      >
        <Field label="Full name" htmlFor="name" required>
          <Input name="name" autoComplete="name" />
        </Field>
        <Field label="Work email" htmlFor="email" required>
          <Input name="email" type="email" autoComplete="email" />
        </Field>

        <div>
          <Label htmlFor="pw">Password</Label>
          <Input
            id="pw"
            name="password"
            type="password"
            className="mt-1.5"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <div className="mt-2 flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i < strength
                      ? strength <= 1
                        ? 'bg-danger'
                        : strength <= 2
                          ? 'bg-warning'
                          : 'bg-success'
                      : 'bg-line',
                  )}
                />
              ))}
            </div>
            <span className="w-16 text-right text-xs text-ink-3">
              {password ? strengthLabel : ''}
            </span>
          </div>
        </div>

        {/* PRD Part 44 — plain-language consent, not a legal wall */}
        <label className="flex cursor-pointer gap-2.5 rounded-v-control border border-line p-3">
          <Checkbox
            checked={consent}
            onCheckedChange={(v) => setConsent(Boolean(v))}
            className="mt-0.5"
          />
          <span className="text-xs leading-relaxed text-ink-2">
            I agree that Kairo may read my resume to build a structured profile, and use it to score
            how well I match open roles.{' '}
            <strong className="font-medium text-ink">
              My age, gender, marital status, religion, disability and photo are never collected or
              used in scoring.
            </strong>{' '}
            I can export or delete everything at any time.
          </span>
        </label>

        {error && (
          <p className="rounded-v-control border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={!consent || isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Create account'}
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </div>
  )
}

/* ══════════════════ Forgot / reset ══════════════════ */

export function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false)

  if (sent) {
    return (
      <div>
        <span className="mb-4 grid size-12 place-items-center rounded-full bg-score-elite-bg text-score-elite">
          <Check className="size-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          If an account exists for that address, we've sent a reset link. It expires in one hour.
        </p>
        <Button variant="secondary" className="mt-6 w-full" onClick={() => setSent(false)}>
          Use a different email
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Reset your password</h1>
      <p className="mt-1.5 text-sm text-ink-2">We'll email you a link to set a new one.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setSent(true)
        }}
      >
        <Field label="Email" htmlFor="email" required>
          <Input name="email" type="email" autoComplete="email" />
        </Field>
        <Button type="submit" className="w-full" size="lg">
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-sm text-ink-2">
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  )
}

/* ── marks ── */

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="#0A66C2" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14M7.12 20.45H3.55V9h3.57zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0" />
    </svg>
  )
}
