import { ALL_MODULES, DEFAULT_ROLE_PERMISSIONS, loadSavedPermissionOverrides } from '@/lib/permissions'
import type { PermissionModule } from '@/types/permissions'
import type { StaffRole } from '@/types/user'

/** Espelho do mapa `employee` em `js/permissions.js`. */
export const EMPLOYEE_ROLE_PERMISSIONS: Record<PermissionModule, boolean> = {
  rh: false,
  teams: false,
  turnover: false,
  careers: false,
  purchases: false,
  evaluations: false,
  reports: false,
  matrix: false,
  users: false,
  comms: false,
}

/**
 * Equivalente a `getUserPermissions(email, role)` em `permissions.js`
 * (base do perfil + overrides em `nt_perms_${email}`).
 */
export function getLegacyUserPermissions(
  email: string | undefined,
  role: string,
): Record<PermissionModule, boolean> {
  const rawBase =
    role === 'employee'
      ? EMPLOYEE_ROLE_PERMISSIONS
      : (DEFAULT_ROLE_PERMISSIONS[role as StaffRole] ?? {})
  const saved = email?.trim() ? loadSavedPermissionOverrides(email) : {}
  const merged: Partial<Record<PermissionModule, boolean>> = { ...rawBase, ...saved }
  const out = {} as Record<PermissionModule, boolean>
  for (const m of ALL_MODULES) {
    out[m.key] = merged[m.key] === true
  }
  return out
}

/** Permissões “padrão do perfil” para o preview (novo usuário sem e-mail definido no preview). */
export function getRoleOnlyPermissionPreview(role: string): Record<PermissionModule, boolean> {
  return getLegacyUserPermissions(undefined, role)
}
