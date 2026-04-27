import type { StaffRole } from '@/types/user'
import type { PermissionModule } from '@/types/permissions'

export type StaffNavNode =
  | { type: 'label'; text: string; sub?: boolean }
  | { type: 'separator' }
  | {
      type: 'link'
      pageId: string
      label: string
      icon: string
      permission?: PermissionModule
      navClass?: 'purchases' | 'users'
    }

const ADMIN: StaffNavNode[] = [
  { type: 'label', text: 'Administrador' },
  { type: 'link', pageId: 'admin-dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
  { type: 'link', pageId: 'comms', label: 'Comunicados', icon: 'fa-bullhorn', permission: 'comms' },
  { type: 'link', pageId: 'admin-employees', label: 'Funcionários (Carreira)', icon: 'fa-users' },
  { type: 'link', pageId: 'admin-careers', label: 'Trilha de Carreira', icon: 'fa-sitemap' },
  { type: 'link', pageId: 'admin-supervisors', label: 'Por Supervisor', icon: 'fa-user-tie' },
  { type: 'link', pageId: 'admin-evaluations', label: 'Avaliações', icon: 'fa-clipboard-list' },
  { type: 'link', pageId: 'admin-matrix', label: 'Matriz de Polivalência', icon: 'fa-th' },
  { type: 'link', pageId: 'admin-reports', label: 'Relatórios', icon: 'fa-chart-bar' },
  { type: 'separator' },
  { type: 'label', text: 'Produção', sub: true },
  { type: 'link', pageId: 'admin-teams', label: 'Equipes de Produção', icon: 'fa-layer-group' },
  { type: 'separator' },
  { type: 'label', text: 'Compras', sub: true },
  {
    type: 'link',
    pageId: 'purchases',
    label: 'Compras',
    icon: 'fa-shopping-cart',
    permission: 'purchases',
    navClass: 'purchases',
  },
  { type: 'separator' },
  { type: 'label', text: 'RH & Turnover', sub: true },
  { type: 'link', pageId: 'admin-rh-dashboard', label: 'Dashboard RH', icon: 'fa-heartbeat' },
  { type: 'link', pageId: 'admin-rh-employees', label: 'Colaboradores (179)', icon: 'fa-id-card' },
  { type: 'link', pageId: 'admin-rh-turnover', label: 'Turnover & Rotatividade', icon: 'fa-sync-alt' },
  { type: 'link', pageId: 'admin-rh-holerites', label: 'Publicar Holerite', icon: 'fa-file-invoice-dollar' },
  { type: 'separator' },
  { type: 'label', text: 'Sistema', sub: true },
  {
    type: 'link',
    pageId: 'admin-users',
    label: 'Usuários & Permissões',
    icon: 'fa-user-cog',
    navClass: 'users',
  },
]

const RH: StaffNavNode[] = [
  { type: 'label', text: 'RH — Recursos Humanos' },
  { type: 'link', pageId: 'comms', label: 'Comunicados', icon: 'fa-bullhorn', permission: 'comms' },
  { type: 'link', pageId: 'rh-dashboard', label: 'Dashboard RH', icon: 'fa-heartbeat' },
  { type: 'link', pageId: 'rh-employees', label: 'Cadastro de Colaboradores', icon: 'fa-id-card' },
  { type: 'link', pageId: 'rh-turnover', label: 'Turnover & Rotatividade', icon: 'fa-sync-alt' },
  { type: 'link', pageId: 'rh-promocoes', label: 'Promoções Homologadas', icon: 'fa-envelope-open-text' },
  { type: 'link', pageId: 'rh-holerites', label: 'Publicar Holerite', icon: 'fa-file-invoice-dollar' },
]

const SUPERVISOR: StaffNavNode[] = [
  { type: 'label', text: 'Supervisor' },
  { type: 'link', pageId: 'supervisor-home', label: 'Início', icon: 'fa-home' },
  { type: 'link', pageId: 'comms', label: 'Comunicados', icon: 'fa-bullhorn', permission: 'comms' },
  { type: 'link', pageId: 'supervisor-employees', label: 'Minha Equipe', icon: 'fa-users' },
  { type: 'link', pageId: 'admin-careers', label: 'Trilha de Carreira', icon: 'fa-sitemap', permission: 'careers' },
  { type: 'link', pageId: 'supervisor-team-attendance', label: 'Frequência da Equipe', icon: 'fa-clipboard-check' },
  { type: 'link', pageId: 'supervisor-promo-history', label: 'Histórico de Promoções', icon: 'fa-rocket' },
  { type: 'link', pageId: 'supervisor-excecoes', label: 'Solicitações de Exceção', icon: 'fa-paper-plane' },
  { type: 'link', pageId: 'admin-matrix', label: 'Matriz de Polivalência', icon: 'fa-th' },
]

const MANAGER: StaffNavNode[] = [
  { type: 'label', text: 'Gerente' },
  { type: 'link', pageId: 'supervisor-home', label: 'Início', icon: 'fa-home' },
  { type: 'link', pageId: 'comms', label: 'Comunicados', icon: 'fa-bullhorn', permission: 'comms' },
  { type: 'link', pageId: 'supervisor-employees', label: 'Minha Equipe', icon: 'fa-users' },
  { type: 'link', pageId: 'admin-careers', label: 'Trilha de Carreira', icon: 'fa-sitemap', permission: 'careers' },
  { type: 'link', pageId: 'manager-teams', label: 'Equipes de Produção', icon: 'fa-layer-group' },
  { type: 'link', pageId: 'manager-excecoes', label: 'Aprovar Exceções', icon: 'fa-shield-alt' },
  { type: 'link', pageId: 'manager-promo-approvals', label: 'Aprovar Promoções', icon: 'fa-user-check' },
  { type: 'link', pageId: 'admin-supervisors', label: 'Visão por Supervisor', icon: 'fa-chart-bar' },
  { type: 'link', pageId: 'admin-matrix', label: 'Matriz de Polivalência', icon: 'fa-th' },
  { type: 'separator' },
  { type: 'label', text: 'Compras', sub: true },
  {
    type: 'link',
    pageId: 'purchases',
    label: 'Compras',
    icon: 'fa-shopping-cart',
    permission: 'purchases',
    navClass: 'purchases',
  },
]

const BOSS: StaffNavNode[] = [
  { type: 'label', text: 'Diretor Geral' },
  { type: 'link', pageId: 'boss-dashboard', label: 'Painel Geral', icon: 'fa-crown' },
  { type: 'link', pageId: 'comms', label: 'Comunicados', icon: 'fa-bullhorn', permission: 'comms' },
  { type: 'link', pageId: 'boss-promo-approvals', label: 'Aprovação Final', icon: 'fa-trophy' },
  { type: 'link', pageId: 'admin-supervisors', label: 'Visão por Equipe', icon: 'fa-chart-bar' },
  { type: 'link', pageId: 'admin-matrix', label: 'Matriz de Polivalência', icon: 'fa-th' },
  { type: 'separator' },
  { type: 'label', text: 'Compras', sub: true },
  {
    type: 'link',
    pageId: 'purchases',
    label: 'Compras',
    icon: 'fa-shopping-cart',
    permission: 'purchases',
    navClass: 'purchases',
  },
  { type: 'separator' },
  { type: 'label', text: 'RH & Turnover', sub: true },
  { type: 'link', pageId: 'boss-rh-dashboard', label: 'Dashboard RH', icon: 'fa-heartbeat' },
  { type: 'link', pageId: 'boss-rh-turnover', label: 'Turnover & Rotatividade', icon: 'fa-sync-alt' },
]

const BY_ROLE: Record<StaffRole, StaffNavNode[]> = {
  admin: ADMIN,
  rh: RH,
  supervisor: SUPERVISOR,
  manager: MANAGER,
  boss: BOSS,
}

function collapseSeparators(nav: StaffNavNode[]): StaffNavNode[] {
  const out: StaffNavNode[] = []
  for (const n of nav) {
    if (n.type === 'separator') {
      if (out.length === 0 || out[out.length - 1].type === 'separator') continue
      out.push(n)
    } else {
      out.push(n)
    }
  }
  while (out.length > 0 && out[out.length - 1].type === 'separator') {
    out.pop()
  }
  return out
}

export function getStaffNavigation(
  role: StaffRole,
  hasPermission: (m: PermissionModule) => boolean,
): StaffNavNode[] {
  const raw = BY_ROLE[role] ?? ADMIN
  const filtered: StaffNavNode[] = []
  for (const n of raw) {
    if (n.type === 'link' && n.permission && !hasPermission(n.permission)) continue
    filtered.push(n)
  }
  return collapseSeparators(filtered)
}
