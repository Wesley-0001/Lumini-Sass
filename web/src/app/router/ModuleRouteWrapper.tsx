import { Navigate, useParams } from 'react-router-dom'
import { RequirePermission } from '@/components/shared/RequirePermission'
import { ModulePlaceholderPage } from '@/features/system/ModulePlaceholderPage'
import { isPermissionModule } from '@/lib/permissionModule'

export function ModuleRouteWrapper() {
  const { moduleId } = useParams()

  if (!isPermissionModule(moduleId)) {
    return <Navigate to="/app/dashboard" replace />
  }

  return (
    <RequirePermission module={moduleId}>
      <ModulePlaceholderPage />
    </RequirePermission>
  )
}
