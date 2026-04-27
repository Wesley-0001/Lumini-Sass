import { useMemo, type ReactNode } from 'react'
import { PermissionsContext } from '@/app/providers/permissionsContext'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import { canAccessModuleRoute, canSeePage as legacyCanSeePage } from '@/lib/legacyAccess'
import { hasModuleAccess, mergeRolePermissions } from '@/lib/permissions'
import type { PermissionModule } from '@/types/permissions'

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useStaffAuth()

  const merged = useMemo(() => {
    if (!user) return null
    return mergeRolePermissions(user.role, user.email)
  }, [user])

  const value = useMemo(() => {
    const hasPermission = (module: PermissionModule) => hasModuleAccess(user, module, merged)
    const canSeePage = (pageId: string) => (user ? legacyCanSeePage(user, pageId) : false)
    const canAccessModule = (module: PermissionModule) => canAccessModuleRoute(user, module, merged)

    return { merged, hasPermission, canSeePage, canAccessModule }
  }, [user, merged])

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}
