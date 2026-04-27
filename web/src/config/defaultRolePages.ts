import type { StaffRole } from '@/types/user'

/**
 * IDs de página alinhados a `pageId` em `config/staffNavigation.ts` (legado / placeholders).
 * Usado quando o documento `users` não define `pages` customizadas.
 */
export const DEFAULT_ROLE_PAGES: Record<StaffRole, string[]> = {
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
  rh: ['comms', 'rh-dashboard', 'rh-employees', 'rh-turnover', 'rh-promocoes', 'rh-holerites'],
  supervisor: [
    'supervisor-home',
    'comms',
    'supervisor-employees',
    'admin-careers',
    'supervisor-team-attendance',
    'supervisor-promo-history',
    'supervisor-excecoes',
    'admin-matrix',
  ],
  manager: [
    'supervisor-home',
    'comms',
    'supervisor-employees',
    'admin-careers',
    'manager-teams',
    'manager-excecoes',
    'manager-promo-approvals',
    'admin-supervisors',
    'admin-matrix',
    'purchases',
  ],
  boss: [
    'boss-dashboard',
    'comms',
    'boss-promo-approvals',
    'admin-supervisors',
    'admin-matrix',
    'purchases',
    'boss-rh-dashboard',
    'boss-rh-turnover',
  ],
}
