/** Chaves alinhadas a `permissions.js` e `data-permission` no HTML legado. */
export type PermissionModule =
  | 'rh'
  | 'teams'
  | 'turnover'
  | 'careers'
  | 'purchases'
  | 'evaluations'
  | 'reports'
  | 'matrix'
  | 'users'
  | 'comms'

export type RolePermissionMap = Record<PermissionModule, boolean>

export type PartialRoleOverrides = Partial<Record<PermissionModule, boolean>>

export interface ModuleDefinition {
  key: PermissionModule
  label: string
  icon: string
}
