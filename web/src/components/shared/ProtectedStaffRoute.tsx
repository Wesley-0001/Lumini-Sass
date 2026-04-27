import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useStaffAuth } from '@/app/providers/staffAuthContext'

export function ProtectedStaffRoute({ children }: { children: ReactNode }) {
  const { user, ready } = useStaffAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="app-loading">
        <p>Carregando sessão…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/app/login" replace state={{ from: location.pathname }} />
  }

  return children
}
