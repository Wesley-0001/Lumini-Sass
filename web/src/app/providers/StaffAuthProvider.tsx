import { signOut } from 'firebase/auth'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { StaffAuthContext } from '@/app/providers/staffAuthContext'
import { tryStaffDemoLogin } from '@/services/auth/staffCredentialsLogin'
import { tryStaffFirebaseLogin } from '@/services/auth/staffFirebaseLogin'
import { getFirebaseAuth } from '@/services/firebase/app'
import { isFirebaseConfigured } from '@/services/firebase/config'
import {
  clearStaffSessionStorage,
  readStaffSessionFromStorage,
  writeStaffSessionToStorage,
} from '@/services/auth/staffSession'

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(() => readStaffSessionFromStorage())

  const login = useCallback(async (email: string, password: string) => {
    const fb = await tryStaffFirebaseLogin(email, password)
    if (fb.kind === 'success') {
      writeStaffSessionToStorage(fb.user)
      setUser(fb.user)
      return { ok: true as const }
    }
    if (fb.kind === 'error') {
      return { ok: false as const, message: fb.message }
    }
    const next = tryStaffDemoLogin(email, password)
    if (!next) return { ok: false as const, message: 'E-mail ou senha incorretos.' }
    writeStaffSessionToStorage(next)
    setUser(next)
    return { ok: true as const }
  }, [])

  const logout = useCallback(() => {
    clearStaffSessionStorage()
    setUser(null)
    void (async () => {
      if (isFirebaseConfigured()) {
        try {
          await signOut(getFirebaseAuth())
        } catch {
          /* session Auth ausente ou já encerrada */
        }
      }
      window.location.assign('/app/login')
    })()
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready: true,
      login,
      logout,
    }),
    [user, login, logout],
  )

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>
}
