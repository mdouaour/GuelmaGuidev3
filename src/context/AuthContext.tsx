'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getMe, login, logout as logoutApi, register, type AuthUser } from '@/lib/api'

interface RegisterResult {
  needsVerification: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthLoading: boolean
  loginUser: (email: string, password: string) => Promise<void>
  registerUser: (email: string, password: string) => Promise<RegisterResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then((me) => setUser(me))
      .catch(() => setUser(null))
      .finally(() => setIsAuthLoading(false))
  }, [])

  const loginUser = async (email: string, password: string) => {
    const response = await login({ email, password })
    setUser(response.user)
  }

  const registerUser = async (email: string, password: string): Promise<RegisterResult> => {
    await register({ email, password })
    // Registration no longer auto-logs the user in: email verification is required first.
    return { needsVerification: true }
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch (err) {
      // Server-side session cleanup failed; local state is still cleared.
      console.error('Logout request failed:', err)
    }
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isAuthLoading,
      loginUser,
      registerUser,
      logout,
    }),
    [user, isAuthLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
