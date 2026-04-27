import type { StaffRole } from '@/types/user'
import type { ModuleDefinition, PermissionModule, RolePermissionMap } from '@/types/permissions'

const PERMS_STORAGE_PREFIX = 'nt_perms_'

/** Espelho de `DEFAULT_ROLE_PERMISSIONS` em `js/permissions.js`. */
export const DEFAULT_ROLE_PERMISSIONS: Record<StaffRole, RolePermissionMap> = {
  admin: {
    rh: true,
    teams: true,
    turnover: true,
    careers: true,
    purchases: true,
    evaluations: true,
    reports: true,
    matrix: true,
    users: true,
    comms: true,
  },
  manager: {
    rh: false,
    teams: true,
    turnover: false,
    careers: true,
    purchases: true,
    evaluations: true,
    reports: true,
    matrix: true,
    users: false,
    comms: true,
  },
  supervisor: {
    rh: false,
    teams: false,
    turnover: false,
    careers: true,
    purchases: false,
    evaluations: true,
    reports: false,
    matrix: true,
    users: false,
    comms: true,
  },
  boss: {
    rh: true,
    teams: false,
    turnover: true,
    careers: false,
    purchases: true,
    evaluations: false,
    reports: true,
    matrix: true,
    users: false,
    comms: true,
  },
  rh: {
    rh: true,
    teams: false,
    turnover: true,
    careers: false,
    purchases: false,
    evaluations: false,
    reports: true,
    matrix: false,
    users: false,
    comms: true,
  },
}

export const ALL_MODULES: ModuleDefinition[] = [
  { key: 'rh', label: 'Módulo RH', icon: 'fa-heartbeat' },
  { key: 'teams', label: 'Equipes de Produção', icon: 'fa-layer-group' },
  { key: 'turnover', label: 'Turnover', icon: 'fa-sync-alt' },
  { key: 'careers', label: 'Trilha de Carreira', icon: 'fa-sitemap' },
  { key: 'evaluations', label: 'Avaliações', icon: 'fa-clipboard-list' },
  { key: 'reports', label: 'Relatórios', icon: 'fa-chart-bar' },
  { key: 'matrix', label: 'Matriz de Polivalência', icon: 'fa-th' },
  { key: 'purchases', label: 'Compras', icon: 'fa-shopping-cart' },
  { key: 'users', label: 'Usuários', icon: 'fa-user-cog' },
  { key: 'comms', label: 'Comunicados', icon: 'fa-bullhorn' },
]

export function loadSavedPermissionOverrides(email: string): Partial<Record<PermissionModule, boolean>> {
  try {
    const raw = localStorage.getItem(`${PERMS_STORAGE_PREFIX}${email}`)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Partial<Record<PermissionModule, boolean>>
  } catch {
    return {}
  }
}

export function mergeRolePermissions(
  role: StaffRole,
  email: string,
): Record<PermissionModule, boolean> {
  const base = DEFAULT_ROLE_PERMISSIONS[role]
  const saved = loadSavedPermissionOverrides(email)
  return { ...base, ...saved }
}

export function hasModuleAccess(
  user: { role: StaffRole; email: string } | null,
  module: PermissionModule,
  merged: Record<PermissionModule, boolean> | null,
): boolean {
  if (!user || !merged) return false
  if (user.role === 'admin') return true
  return merged[module] === true
}
