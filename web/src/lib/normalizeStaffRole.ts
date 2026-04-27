import type { StaffRole } from '@/types/user'

const CANON: Record<string, StaffRole> = {
  admin: 'admin',
  administrador: 'admin',
  administrator: 'admin',
  boss: 'boss',
  director: 'boss',
  diretor: 'boss',
  diretoria: 'boss',
  manager: 'manager',
  gerente: 'manager',
  supervisor: 'supervisor',
  rh: 'rh',
  'recursos humanos': 'rh',
  recursoshumanos: 'rh',
}

/** Perfis de portal (não acessam o shell interno staff). */
export const PORTAL_ONLY_ROLE_MARKERS = new Set(['employee', 'colaborador', 'funcionario'])

/**
 * Converte `role` do Firestore / legado para `StaffRole` canônico.
 * Retorna `null` se não for um perfil staff conhecido.
 */
export function normalizeStaffRoleString(raw: string | undefined): StaffRole | null {
  if (raw == null || typeof raw !== 'string') return null
  const k = raw.trim().toLowerCase()
  if (!k) return null
  if (k in CANON) return CANON[k]!
  if (PORTAL_ONLY_ROLE_MARKERS.has(k)) return null
  return null
}

export function isEmployeePortalRoleString(raw: string | undefined): boolean {
  if (raw == null || typeof raw !== 'string') return false
  return PORTAL_ONLY_ROLE_MARKERS.has(raw.trim().toLowerCase())
}
