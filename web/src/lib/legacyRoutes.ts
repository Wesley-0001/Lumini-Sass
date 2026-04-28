import { ALL_MODULES } from '@/lib/permissions'
import type { PermissionModule } from '@/types/permissions'

/** Mapeia `data-page` do HTML legado para rota de módulo com permissão explícita (espelho do legado + rotas da casca). */
const PAGE_TO_MODULE: Partial<Record<string, PermissionModule>> = {
  // Módulos diretos
  comms: 'comms',
  purchases: 'purchases',
  // Careers
  'admin-careers': 'careers',
  // Matrix
  'admin-matrix': 'matrix',
  // Users
  'admin-users': 'users',
  // Evaluations
  'admin-evaluations': 'evaluations',
  // Reports
  'admin-reports': 'reports',
  // Teams
  'admin-teams': 'teams',
  'manager-teams': 'teams',
  // Turnover
  'rh-turnover': 'turnover',
  'admin-rh-turnover': 'turnover',
  'boss-rh-turnover': 'turnover',
  // RH
  'rh-dashboard': 'rh',
  'admin-rh-dashboard': 'rh',
  'boss-rh-dashboard': 'rh',
  'rh-employees': 'rh',
  'admin-rh-employees': 'rh',
  'rh-holerites': 'rh',
  'admin-rh-holerites': 'rh',
  'rh-promocoes': 'rh',
}

const _moduleToPages: Record<PermissionModule, string[]> = {
  rh: [],
  teams: [],
  turnover: [],
  careers: [],
  purchases: [],
  evaluations: [],
  reports: [],
  matrix: [],
  users: [],
  comms: [],
}

for (const [pageId, mod] of Object.entries(PAGE_TO_MODULE) as [string, PermissionModule][]) {
  if (_moduleToPages[mod] && !_moduleToPages[mod].includes(pageId)) {
    _moduleToPages[mod].push(pageId)
  }
}

/** PageIds do legado que habilitam acesso a `/app/m/<módulo>` (cruzamento com `user.pages`). */
export const LEGACY_MODULE_PAGE_IDS: Readonly<Record<PermissionModule, readonly string[]>> =
  ALL_MODULES.reduce(
    (acc, m) => {
      acc[m.key] = Object.freeze([...(_moduleToPages[m.key] ?? [])])
      return acc
    },
    {} as Record<PermissionModule, readonly string[]>,
  )

const HOME_PAGES = new Set([
  'admin-dashboard',
  'boss-dashboard',
  'rh-dashboard',
  'supervisor-home',
])

/** Rotas React da casca (sem alterar regras de negócio do legado). */
export function resolveStaffHref(pageId: string): string {
  if (HOME_PAGES.has(pageId)) return '/app/dashboard'

  const mod = PAGE_TO_MODULE[pageId]
  if (mod) return `/app/m/${mod}`

  return `/app/p/${pageId}`
}

/** Títulos para breadcrumb / placeholders (espelho dos rótulos do menu legado). */
export const LEGACY_PAGE_TITLES: Record<string, string> = {
  'admin-dashboard': 'Dashboard',
  'admin-employees': 'Funcionários (Carreira)',
  'admin-supervisors': 'Por Supervisor',
  'admin-careers': 'Trilha de Carreira',
  'admin-evaluations': 'Avaliações',
  'admin-matrix': 'Matriz de Polivalência',
  'admin-reports': 'Relatórios',
  'admin-teams': 'Equipes de Produção',
  'admin-rh-dashboard': 'Dashboard RH',
  'admin-rh-employees': 'Colaboradores (179)',
  'admin-rh-turnover': 'Turnover & Rotatividade',
  'admin-rh-holerites': 'Publicar Holerite',
  'admin-users': 'Usuários & Permissões',
  comms: 'Comunicados',
  purchases: 'Compras',
  'rh-dashboard': 'Dashboard RH',
  'rh-employees': 'Cadastro de Colaboradores',
  'rh-turnover': 'Turnover & Rotatividade',
  'rh-promocoes': 'Promoções Homologadas',
  'rh-holerites': 'Publicar Holerite',
  'supervisor-home': 'Início',
  'supervisor-employees': 'Minha Equipe',
  'supervisor-team-attendance': 'Frequência da Equipe',
  'supervisor-promo-history': 'Histórico de Promoções',
  'supervisor-excecoes': 'Solicitações de Exceção',
  'manager-teams': 'Equipes de Produção',
  'manager-excecoes': 'Aprovar Exceções',
  'manager-promo-approvals': 'Aprovar Promoções',
  'boss-dashboard': 'Painel Geral',
  'boss-promo-approvals': 'Aprovação Final',
  'boss-rh-dashboard': 'Dashboard RH',
  'boss-rh-turnover': 'Turnover & Rotatividade',
}

/** Conjunto de pageIds conhecidos na migração (para validar `/app/p/:pageId`). */
export const KNOWN_LEGACY_PAGE_IDS = new Set<string>([...Object.keys(LEGACY_PAGE_TITLES)])
