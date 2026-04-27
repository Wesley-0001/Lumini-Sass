import type { PermissionModule } from '@/types/permissions'
import type { StaffRole } from '@/types/user'

export interface StaffNavLinkDef {
  to: string
  label: string
  icon: string
  /** `data-page` / `user.pages` (espelho do legado e do Firestore). */
  pageId: string
  /** Exige permissão do módulo (mesmo modelo do `data-permission` legado). */
  module?: PermissionModule
  /** Se definido, o item só aparece para esses perfis. */
  roles?: StaffRole[]
}

export interface StaffNavSectionDef {
  title: string
  variant?: 'primary' | 'sub'
  links: StaffNavLinkDef[]
}

function filterLinks(
  links: StaffNavLinkDef[],
  role: StaffRole,
  hasPermission: (m: PermissionModule) => boolean,
  canSeePage: (pageId: string) => boolean,
): StaffNavLinkDef[] {
  return links.filter((l) => {
    if (l.roles && !l.roles.includes(role)) return false
    if (l.module && !hasPermission(l.module)) return false
    if (!canSeePage(l.pageId)) return false
    return true
  })
}

export function staffNavSectionsForRole(
  role: StaffRole,
  hasPermission: (m: PermissionModule) => boolean,
  canSeePage: (pageId: string) => boolean,
): StaffNavSectionDef[] {
  const blocks = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.supervisor
  return blocks
    .map((sec) => ({
      ...sec,
      links: filterLinks(sec.links, role, hasPermission, canSeePage),
    }))
    .filter((sec) => sec.links.length > 0)
}

/** Espelha grupos e rótulos próximos ao `index.html` legado; rotas apontam para a casca React. */
const NAV_BY_ROLE: Record<StaffRole, StaffNavSectionDef[]> = {
  admin: [
    {
      title: 'ADMINISTRADOR',
      variant: 'primary',
      links: [
        { to: '/app/dashboard', pageId: 'admin-dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', roles: ['admin'] },
        { to: '/app/m/comms', pageId: 'comms', label: 'Comunicados', icon: 'fa-bullhorn', module: 'comms' },
        { to: '/app/p/admin-employees', pageId: 'admin-employees', label: 'Funcionários (Carreira)', icon: 'fa-users', roles: ['admin'] },
        { to: '/app/m/careers', pageId: 'admin-careers', label: 'Trilha de Carreira', icon: 'fa-sitemap', module: 'careers' },
        { to: '/app/p/admin-supervisors', pageId: 'admin-supervisors', label: 'Por Supervisor', icon: 'fa-user-tie', roles: ['admin'] },
        { to: '/app/m/evaluations', pageId: 'admin-evaluations', label: 'Avaliações', icon: 'fa-clipboard-list', module: 'evaluations' },
        { to: '/app/m/matrix', pageId: 'admin-matrix', label: 'Matriz de Polivalência', icon: 'fa-th', module: 'matrix' },
        { to: '/app/m/reports', pageId: 'admin-reports', label: 'Relatórios', icon: 'fa-chart-bar', module: 'reports' },
      ],
    },
    {
      title: 'PRODUÇÃO',
      variant: 'sub',
      links: [{ to: '/app/m/teams', pageId: 'admin-teams', label: 'Equipes de Produção', icon: 'fa-layer-group', module: 'teams' }],
    },
    {
      title: 'COMPRAS',
      variant: 'sub',
      links: [{ to: '/app/m/purchases', pageId: 'purchases', label: 'Compras', icon: 'fa-shopping-cart', module: 'purchases' }],
    },
    {
      title: 'RH & TURNOVER',
      variant: 'sub',
      links: [
        { to: '/app/m/rh', pageId: 'admin-rh-dashboard', label: 'Dashboard RH', icon: 'fa-heartbeat', module: 'rh' },
        { to: '/app/rh/employees', pageId: 'admin-rh-employees', label: 'Colaboradores (179)', icon: 'fa-id-card', module: 'rh' },
        { to: '/app/m/turnover', pageId: 'admin-rh-turnover', label: 'Turnover & Rotatividade', icon: 'fa-sync-alt', module: 'turnover' },
        { to: '/app/p/admin-rh-holerites', pageId: 'admin-rh-holerites', label: 'Publicar Holerite', icon: 'fa-file-invoice-dollar', module: 'rh' },
      ],
    },
    {
      title: 'SISTEMA',
      variant: 'sub',
      links: [{ to: '/app/m/users', pageId: 'admin-users', label: 'Usuários & Permissões', icon: 'fa-user-cog', module: 'users' }],
    },
  ],
  rh: [
    {
      title: 'RH — RECURSOS HUMANOS',
      variant: 'primary',
      links: [
        { to: '/app/m/comms', pageId: 'comms', label: 'Comunicados', icon: 'fa-bullhorn', module: 'comms' },
        { to: '/app/dashboard', pageId: 'rh-dashboard', label: 'Dashboard RH', icon: 'fa-heartbeat', roles: ['rh'] },
        { to: '/app/rh/employees', pageId: 'rh-employees', label: 'Cadastro de Colaboradores', icon: 'fa-id-card', module: 'rh' },
        { to: '/app/m/turnover', pageId: 'rh-turnover', label: 'Turnover & Rotatividade', icon: 'fa-sync-alt', module: 'turnover' },
        { to: '/app/p/rh-promocoes', pageId: 'rh-promocoes', label: 'Promoções Homologadas', icon: 'fa-envelope-open-text', roles: ['rh'] },
        { to: '/app/p/rh-holerites', pageId: 'rh-holerites', label: 'Publicar Holerite', icon: 'fa-file-invoice-dollar', module: 'rh' },
      ],
    },
  ],
  supervisor: [
    {
      title: 'SUPERVISOR',
      variant: 'primary',
      links: [
        { to: '/app/dashboard', pageId: 'supervisor-home', label: 'Início', icon: 'fa-home', roles: ['supervisor'] },
        { to: '/app/m/comms', pageId: 'comms', label: 'Comunicados', icon: 'fa-bullhorn', module: 'comms' },
        { to: '/app/p/supervisor-employees', pageId: 'supervisor-employees', label: 'Minha Equipe', icon: 'fa-users', roles: ['supervisor'] },
        { to: '/app/m/careers', pageId: 'admin-careers', label: 'Trilha de Carreira', icon: 'fa-sitemap', module: 'careers' },
        { to: '/app/p/supervisor-team-attendance', pageId: 'supervisor-team-attendance', label: 'Frequência da Equipe', icon: 'fa-clipboard-check', roles: ['supervisor'] },
        { to: '/app/p/supervisor-promo-history', pageId: 'supervisor-promo-history', label: 'Histórico de Promoções', icon: 'fa-rocket', roles: ['supervisor'] },
        { to: '/app/p/supervisor-excecoes', pageId: 'supervisor-excecoes', label: 'Solicitações de Exceção', icon: 'fa-paper-plane', roles: ['supervisor'] },
        { to: '/app/m/matrix', pageId: 'admin-matrix', label: 'Matriz de Polivalência', icon: 'fa-th', module: 'matrix' },
      ],
    },
  ],
  manager: [
    {
      title: 'GERENTE',
      variant: 'primary',
      links: [
        { to: '/app/dashboard', pageId: 'supervisor-home', label: 'Início', icon: 'fa-home', roles: ['manager'] },
        { to: '/app/m/comms', pageId: 'comms', label: 'Comunicados', icon: 'fa-bullhorn', module: 'comms' },
        { to: '/app/p/supervisor-employees', pageId: 'supervisor-employees', label: 'Minha Equipe', icon: 'fa-users', roles: ['manager'] },
        { to: '/app/m/careers', pageId: 'admin-careers', label: 'Trilha de Carreira', icon: 'fa-sitemap', module: 'careers' },
        { to: '/app/m/teams', pageId: 'manager-teams', label: 'Equipes de Produção', icon: 'fa-layer-group', module: 'teams' },
        { to: '/app/p/manager-excecoes', pageId: 'manager-excecoes', label: 'Aprovar Exceções', icon: 'fa-shield-alt', roles: ['manager'] },
        { to: '/app/p/manager-promo-approvals', pageId: 'manager-promo-approvals', label: 'Aprovar Promoções', icon: 'fa-user-check', roles: ['manager'] },
        { to: '/app/p/admin-supervisors', pageId: 'admin-supervisors', label: 'Visão por Supervisor', icon: 'fa-chart-bar', roles: ['manager'] },
        { to: '/app/m/matrix', pageId: 'admin-matrix', label: 'Matriz de Polivalência', icon: 'fa-th', module: 'matrix' },
        { to: '/app/m/purchases', pageId: 'purchases', label: 'Compras', icon: 'fa-shopping-cart', module: 'purchases' },
      ],
    },
  ],
  boss: [
    {
      title: 'DIRETOR GERAL',
      variant: 'primary',
      links: [
        { to: '/app/dashboard', pageId: 'boss-dashboard', label: 'Painel Geral', icon: 'fa-crown', roles: ['boss'] },
        { to: '/app/m/comms', pageId: 'comms', label: 'Comunicados', icon: 'fa-bullhorn', module: 'comms' },
        { to: '/app/p/boss-promo-approvals', pageId: 'boss-promo-approvals', label: 'Aprovação Final', icon: 'fa-trophy', roles: ['boss'] },
        { to: '/app/p/admin-supervisors', pageId: 'admin-supervisors', label: 'Visão por Equipe', icon: 'fa-chart-bar', roles: ['boss'] },
        { to: '/app/m/matrix', pageId: 'admin-matrix', label: 'Matriz de Polivalência', icon: 'fa-th', module: 'matrix' },
        { to: '/app/m/purchases', pageId: 'purchases', label: 'Compras', icon: 'fa-shopping-cart', module: 'purchases' },
      ],
    },
    {
      title: 'RH & TURNOVER',
      variant: 'sub',
      links: [
        { to: '/app/m/rh', pageId: 'boss-rh-dashboard', label: 'Dashboard RH', icon: 'fa-heartbeat', module: 'rh' },
        { to: '/app/m/turnover', pageId: 'boss-rh-turnover', label: 'Turnover & Rotatividade', icon: 'fa-sync-alt', module: 'turnover' },
      ],
    },
  ],
}
