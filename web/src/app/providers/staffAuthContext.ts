import { createContext, useContext } from 'react'
import type { StaffSessionUser } from '@/types/user'

export type StaffAuthContextValue = {
  user: StaffSessionUser | null
  ready: boolean
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => void
}

export const StaffAuthContext = createContext<StaffAuthContextValue | null>(null)

export function useStaffAuth(): StaffAuthContextValue {
  const ctx = useContext(StaffAuthContext)
  if (!ctx) throw new Error('useStaffAuth deve ser usado dentro de StaffAuthProvider.')
  return ctx
}
