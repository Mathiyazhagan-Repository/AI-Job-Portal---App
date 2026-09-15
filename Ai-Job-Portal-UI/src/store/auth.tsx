import * as React from 'react'
import { Navigate } from 'react-router'

const TOKEN_KEY = 'kairo.auth.token'
const API_URL = 'http://localhost:8000'

export interface AuthUser {
  id: string | number | null
  name: string
  email: string
  location?: string
  role?: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  signIn: (token: string, user?: Partial<AuthUser>) => void
  signOut: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialToken = readToken()
  const [token, setToken] = React.useState<string | null>(initialToken)
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(Boolean(initialToken))

  React.useEffect(() => {
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    let active = true
    setIsLoading(true)
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session expired')
        return response.json() as Promise<AuthUser>
      })
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        if (!active) return
        try { localStorage.removeItem(TOKEN_KEY) } catch {}
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [token])

  const signIn = (nextToken: string, nextUser?: Partial<AuthUser>) => {
    try { localStorage.setItem(TOKEN_KEY, nextToken) } catch {}
    setToken(nextToken)
    if (nextUser) {
      setUser({
        id: nextUser.id ?? null,
        name: nextUser.name ?? '',
        email: nextUser.email ?? '',
        location: nextUser.location ?? '',
        role: nextUser.role,
      })
    }
  }

  const signOut = () => {
    try { localStorage.removeItem(TOKEN_KEY) } catch {}
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

export function RequireAuth({ children, role }: { children: React.ReactNode, role?: string | string[] }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />

  if (role) {
    const roles = Array.isArray(role) ? role : [role]
    if (!roles.includes(user.role || 'candidate')) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return <>{children}</>
}
