import { DEFAULT_ROLE_PAGES } from '@/config/defaultRolePages'
import { LEGACY_MODULE_PAGE_IDS } from '@/lib/legacyRoutes'
import { hasModuleAccess } from '@/lib/permissions'
import type { PermissionModule } from '@/types/permissions'
import type { StaffSessionUser } from '@/types/user'

/**
 * `canSeePage` / escopo de telas: mesma ideia de `user.pages` + `DEFAULT_ROLE_PAGES` do `cp_user`
 * (o legado HTML não expõe essa lista no objeto demo, mas o Firestore e a casca React sim).
 */
export function canSeePage(user: StaffSessionUser | null, pageId: string): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  const pid = String(pageId).trim()
  if (!pid) return false
  const pages = user.pages
  if (!pages || pages.length === 0) {
    return (DEFAULT_ROLE_PAGES[user.role] ?? []).includes(pid)
  }
  return pages.includes(pid)
}

/**
 * Combina `hasPermission` (RBAC, espelho de `js/permissions.js`) com `user.pages` quando
 * existir pageId associado ao módulo (espelho de `guardPage` + rota de módulo na casca).
 *
 * Fallback: se `user.pages` está vazio, usa `DEFAULT_ROLE_PAGES[role]` como lista efectiva,
 * garantindo que perfis sem `pages` explícitas no Firestore ainda tenham acesso correto.
 */
export function canAccessModuleRoute(
  user: StaffSessionUser | null,
  module: PermissionModule,
  merged: Record<PermissionModule, boolean> | null,
): boolean {
  if (!user || !merged) return false
  if (!hasModuleAccess(user, module, merged)) return false
  // Admin tem acesso irrestrito a todos os módulos.
  if (user.role === 'admin') return true
  const candidates = LEGACY_MODULE_PAGE_IDS[module] ?? []
  // Módulo sem pageIds mapeados → acesso liberado pelo RBAC.
  if (candidates.length === 0) return true
  // Usa user.pages quando preenchido; caso contrário, fallback para DEFAULT_ROLE_PAGES.
  const effectivePages =
    user.pages && user.pages.length > 0
      ? user.pages
      : (DEFAULT_ROLE_PAGES[user.role] ?? [])
  return candidates.some((p) => effectivePages.includes(p))
}
