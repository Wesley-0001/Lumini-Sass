import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useStaffAuth } from '@/app/providers/staffAuthContext'

export function GuestStaffRoute({ children }: { children: ReactNode }) {
  const { user, ready } = useStaffAuth()

  if (!ready) {
    return (
      <div className="app-loading">
        <p>Carregando…</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/app/dashboard" replace />
  }

  return children
}
