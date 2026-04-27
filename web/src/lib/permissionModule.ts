import { ALL_MODULES } from '@/lib/permissions'
import type { PermissionModule } from '@/types/permissions'

const KEYS = new Set<PermissionModule>(ALL_MODULES.map((m) => m.key))

export function isPermissionModule(value: string | undefined): value is PermissionModule {
  if (!value) return false
  return KEYS.has(value as PermissionModule)
}
