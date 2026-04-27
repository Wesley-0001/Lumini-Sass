import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '@/app/providers/permissionsContext'
import type { PermissionModule } from '@/types/permissions'

export function RequirePermission({
  module,
  children,
}: {
  module: PermissionModule
  children: ReactNode
}) {
  const { canAccessModule } = usePermissions()

  if (!canAccessModule(module)) {
    return <Navigate to="/app/dashboard" replace />
  }

  return children
}
