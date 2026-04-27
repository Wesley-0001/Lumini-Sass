import { createContext, useContext } from 'react'
import type { PermissionModule } from '@/types/permissions'

export type PermissionsContextValue = {
  merged: Record<PermissionModule, boolean> | null
  /** Espelho de `window.hasPermission` (RBAC + overrides `nt_perms_*`). */
  hasPermission: (module: PermissionModule) => boolean
  /** `user.pages` + `DEFAULT_ROLE_PAGES` / admin com acesso total. */
  canSeePage: (pageId: string) => boolean
  /** `hasPermission` cruzado com `user.pages` para rotas `/app/m/:id` (quando há pageIds mapeados). */
  canAccessModule: (module: PermissionModule) => boolean
}

export const PermissionsContext = createContext<PermissionsContextValue | null>(null)

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext)
  if (!ctx) throw new Error('usePermissions deve ser usado dentro de PermissionsProvider.')
  return ctx
}
