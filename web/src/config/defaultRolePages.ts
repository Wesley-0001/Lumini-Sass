import type { StaffRole } from '@/types/user'

/**
 * IDs de página alinhados a `pageId` em `config/staffNavigation.ts` (legado / placeholders).
 * Usado quando o documento `users` não define `pages` customizadas.
 *
 * REGRA: cada entrada deve conter pelo menos um pageId que corresponda a uma chave em
 * `LEGACY_MODULE_PAGE_IDS` para cada módulo que o perfil tem permissão no RBAC
 * (`DEFAULT_ROLE_PERMISSIONS`). Isso garante que `canAccessModuleRoute` retorne `true`
 * mesmo quando `user.pages` está vazio no Firestore.
 */
export const DEFAULT_ROLE_PAGES: Record<StaffRole, string[]> = {
  // Admin: acesso irrestrito — canSeePage retorna true sem consultar esta lista.
  admin: [
    'admin-dashboard',
    'comms',
    'admin-employees',
    'admin-careers',
    'admin-supervisors',
    'admin-evaluations',
    'admin-matrix',
    'admin-reports',
    'admin-teams',
    'purchases',
    'admin-rh-dashboard',
    'admin-rh-employees',
    'admin-rh-turnover',
    'admin-rh-holerites',
    'admin-users',
  ],
  // RH: rh ✅ | turnover ✅ | comms ✅ | reports ✅
  rh: [
    'comms',
    'rh-dashboard',      // → módulo rh
    'rh-employees',      // → módulo rh
    'rh-turnover',       // → módulo turnover
    'rh-promocoes',      // → módulo rh
    'rh-holerites',      // → módulo rh
    'admin-reports',     // → módulo reports  (rh tem reports: true no RBAC)
  ],
  // Supervisor: careers ✅ | evaluations ✅ | matrix ✅ | comms ✅
  supervisor: [
    'supervisor-home',
    'comms',
    'supervisor-employees',
    'admin-careers',             // → módulo careers
    'supervisor-team-attendance',
    'supervisor-promo-history',
    'supervisor-excecoes',
    'admin-matrix',              // → módulo matrix
    'admin-evaluations',         // → módulo evaluations (supervisor tem evaluations: true)
  ],
  // Manager: teams ✅ | careers ✅ | evaluations ✅ | reports ✅ | matrix ✅ | purchases ✅ | comms ✅
  manager: [
    'supervisor-home',
    'comms',
    'supervisor-employees',
    'admin-careers',             // → módulo careers
    'manager-teams',             // → módulo teams
    'manager-excecoes',
    'manager-promo-approvals',
    'admin-supervisors',
    'admin-matrix',              // → módulo matrix
    'purchases',                 // → módulo purchases
    'admin-evaluations',         // → módulo evaluations (manager tem evaluations: true)
    'admin-reports',             // → módulo reports     (manager tem reports: true)
  ],
  // Boss: rh ✅ | turnover ✅ | purchases ✅ | matrix ✅ | comms ✅ | reports ✅
  boss: [
    'boss-dashboard',
    'comms',
    'boss-promo-approvals',
    'admin-supervisors',
    'admin-matrix',              // → módulo matrix
    'purchases',                 // → módulo purchases
    'boss-rh-dashboard',         // → módulo rh
    'boss-rh-turnover',          // → módulo turnover
    'admin-reports',             // → módulo reports (boss tem reports: true)
  ],
}
