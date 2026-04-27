import type { StaffRole } from '@/types/user'

/** Registro vindo de `employees` (mesmas regras do legado, `getEmployees` / `renderAdminDashboard`). */
export interface CareerEmployee {
  id: string
  name?: string
  /** Matrícula RH quando existir no documento. */
  rhMatricula?: string | null
  admission?: string
  status?: string
  minMonths?: number | null
  supervisor?: string
  currentRole?: string
  desiredRole?: string | null
  /** Setor / área, quando preenchido no Firestore. */
  sector?: string
  /** Nome de equipe / time, se existir no documento (`team` ou `equipe`). */
  team?: string
}

export interface DashboardKpiCard {
  label: string
  value: number
  icon: string
  tone: 'blue' | 'orange' | 'yellow' | 'green' | 'purple' | 'teal' | 'red'
}

const PROMO_PIPELINE = ['pending_samuel', 'pending_samuel_return', 'pending_carlos'] as const
const PROMO_AGG = ['promoted', 'approved', 'pending_samuel', 'pending_samuel_return', 'pending_carlos'] as const

function isPipelineStatus(s: string | undefined): boolean {
  return s != null && (PROMO_PIPELINE as readonly string[]).includes(s)
}

function isAggregatedPromoStatus(s: string | undefined): boolean {
  return s != null && (PROMO_AGG as readonly string[]).includes(s)
}

/** Espelha `calcTenure` de `app.js`. */
export function calcTenureMonths(admission: string | undefined): number {
  if (!admission) return 0
  const now = new Date()
  const adm = new Date(admission)
  if (Number.isNaN(adm.getTime())) return 0
  const months = (now.getFullYear() - adm.getFullYear()) * 12 + (now.getMonth() - adm.getMonth())
  return months < 0 ? 0 : months
}

/** Espelha `tenureText` do legado (`app.js`). */
export function formatTenureLabel(months: number): string {
  const y = Math.floor(months / 12)
  const m = months % 12
  const parts: string[] = []
  if (y > 0) parts.push(`${y} ano${y > 1 ? 's' : ''}`)
  if (m > 0) parts.push(`${m} mês${m > 1 ? 'es' : ''}`)
  return parts.length ? parts.join(' e ') : 'Recém admitido'
}

function employeeInitials(name: string | undefined): string {
  if (!name?.trim()) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function isEligibleStrict(e: CareerEmployee): boolean {
  return !!(
    e.minMonths &&
    calcTenureMonths(e.admission) >= (e.minMonths as number) &&
    e.status === 'ready'
  )
}

function isEligibleStatusReady(e: CareerEmployee): boolean {
  return e.status === 'ready'
}

/**
 * “Prontos para avaliar”: mesmos filtros de `renderAdminDashboard` (lista `recent-eligible`)
 * vs `renderSupervisorHome` (supervisor/gerente com corte de tempo mínimo + `ready`).
 */
export function filterReadyForEvaluation(
  role: StaffRole,
  userEmail: string,
  employees: CareerEmployee[],
): CareerEmployee[] {
  const myTeam = myTeamForRole(employees, role, userEmail)
  const useStrict = role === 'supervisor' || role === 'manager'
  const pred = useStrict ? isEligibleStrict : isEligibleStatusReady
  return myTeam.filter(pred)
}

export interface ReadyToEvaluateItem {
  id: string
  name: string
  roleLine: string
  teamOrSetor: string
  tenureLabel: string
  initials: string
}

const READY_LIST_MAX = 8

function buildRoleLine(e: CareerEmployee): string {
  const cur = e.currentRole || '—'
  if (e.desiredRole) return `${cur} → ${e.desiredRole}`
  return cur
}

/** Setor, ou suporte (e-mail resumido) como “equipe”, alinhado ao detalhe do legado. */
function buildTeamOrSetor(e: CareerEmployee): string {
  if (e.sector?.trim()) return e.sector.trim()
  const s = e.supervisor?.trim()
  if (!s) return '—'
  const at = s.indexOf('@')
  return at > 0 ? s.slice(0, at) : s
}

export function buildReadyToEvaluateList(
  role: StaffRole,
  userEmail: string,
  employees: CareerEmployee[],
  maxItems: number = READY_LIST_MAX,
): { items: ReadyToEvaluateItem[]; total: number } {
  const all = filterReadyForEvaluation(role, userEmail, employees)
  const total = all.length
  const sorted = [...all].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'))
  const items: ReadyToEvaluateItem[] = sorted.slice(0, maxItems).map((e) => {
    const months = calcTenureMonths(e.admission)
    return {
      id: e.id,
      name: e.name?.trim() || '—',
      roleLine: buildRoleLine(e),
      teamOrSetor: buildTeamOrSetor(e),
      tenureLabel: formatTenureLabel(months),
      initials: employeeInitials(e.name),
    }
  })
  return { items, total }
}

function filterSupervisorTeam(employees: CareerEmployee[], supervisorEmail: string): CareerEmployee[] {
  const k = supervisorEmail.toLowerCase()
  return employees.filter((e) => (e.supervisor || '').toLowerCase() === k)
}

function myTeamForRole(employees: CareerEmployee[], role: StaffRole, userEmail: string): CareerEmployee[] {
  if (role === 'supervisor') return filterSupervisorTeam(employees, userEmail)
  return employees
}

function buildAdminKpis(employees: CareerEmployee[]): DashboardKpiCard[] {
  const total = employees.length
  const apt = employees.filter((e) => e.minMonths && calcTenureMonths(e.admission) >= (e.minMonths as number)).length
  const pending = employees.filter((e) => e.status === 'ready').length
  const promotedAgg = employees.filter((e) => isAggregatedPromoStatus(e.status)).length
  return [
    { label: 'Total de Funcionários', value: total, icon: 'fa-users', tone: 'blue' },
    { label: 'Aptos para Avaliação', value: apt, icon: 'fa-clock', tone: 'orange' },
    { label: 'Avaliações Pendentes', value: pending, icon: 'fa-hourglass-half', tone: 'yellow' },
    { label: 'Promoções Aprovadas', value: promotedAgg, icon: 'fa-trophy', tone: 'green' },
  ]
}

function buildBossKpis(employees: CareerEmployee[], evaluationsCount: number): DashboardKpiCard[] {
  const total = employees.length
  const inProgress = employees.filter((e) => isPipelineStatus(e.status)).length
  const awaitBoss = employees.filter((e) => e.status === 'pending_carlos').length
  const promoted = employees.filter((e) => e.status === 'promoted').length
  const apt = employees.filter((e) => e.minMonths && calcTenureMonths(e.admission) >= (e.minMonths as number)).length
  return [
    { label: 'Colaboradores', value: total, icon: 'fa-users', tone: 'blue' },
    { label: 'Em Promoção', value: inProgress, icon: 'fa-hourglass-half', tone: 'orange' },
    { label: 'Aguardam Decisão', value: awaitBoss, icon: 'fa-crown', tone: 'yellow' },
    { label: 'Promovidos', value: promoted, icon: 'fa-trophy', tone: 'green' },
    { label: 'Avaliações Feitas', value: evaluationsCount, icon: 'fa-clipboard-list', tone: 'purple' },
    { label: 'Aptos p/ Avaliação', value: apt, icon: 'fa-clock', tone: 'teal' },
  ]
}

function buildSupKpis(myTeam: CareerEmployee[], managerView: boolean): DashboardKpiCard[] {
  const teamLabel = managerView ? 'Equipe (visão geral)' : 'Minha Equipe'
  const eligible = myTeam.filter(
    (e) =>
      e.minMonths &&
      calcTenureMonths(e.admission) >= (e.minMonths as number) &&
      e.status === 'ready',
  )
  const apt = myTeam.filter((e) => e.minMonths && calcTenureMonths(e.admission) >= (e.minMonths as number)).length
  const inPromo = myTeam.filter((e) => isPipelineStatus(e.status)).length
  return [
    { label: teamLabel, value: myTeam.length, icon: 'fa-users', tone: 'blue' },
    { label: 'Aguardam Avaliação', value: eligible.length, icon: 'fa-clipboard-check', tone: 'orange' },
    { label: 'Aptos p/ trilha', value: apt, icon: 'fa-clock', tone: 'yellow' },
    { label: 'Em aprovação', value: inPromo, icon: 'fa-rocket', tone: 'green' },
  ]
}

/**
 * Indicadores alinhados à primeira tela do legado após o login, conforme o papel
 * (admin-dashboard, boss-dashboard, supervisor-home com filtro, manager = equipe completa).
 */
export function buildDashboardKpis(
  role: StaffRole,
  userEmail: string,
  employees: CareerEmployee[],
  evaluationsCount: number,
): DashboardKpiCard[] {
  switch (role) {
    case 'admin':
    case 'rh':
      return buildAdminKpis(employees)
    case 'boss':
      return buildBossKpis(employees, evaluationsCount)
    case 'supervisor': {
      const myTeam = myTeamForRole(employees, 'supervisor', userEmail)
      return buildSupKpis(myTeam, false)
    }
    case 'manager': {
      const myTeam = myTeamForRole(employees, 'manager', userEmail)
      return buildSupKpis(myTeam, true)
    }
    default:
      return buildAdminKpis(employees)
  }
}

export { myTeamForRole, filterSupervisorTeam }
