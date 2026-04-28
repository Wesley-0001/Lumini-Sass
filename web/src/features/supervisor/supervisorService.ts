import type { CareerEmployee } from '@/lib/dashboard/careerKpi'
import type { CareerEvaluation } from '@/lib/dashboard/careerEvaluation'
import type { DemoStaffUserRecord } from '@/data/demoStaffUsers'
import { getStatusInfo } from '@/lib/dashboard/adminLegacy'

const PROMO_AGG_STATUSES = ['promoted', 'approved', 'pending_samuel', 'pending_samuel_return', 'pending_carlos'] as const

export type SupervisorRole = 'supervisor' | 'manager'

export type SupervisorColors = { bg: string; light: string; text: string }

export type SupervisorOverviewKpis = {
  totalEmployees: number
  awaitingEvaluation: number
  inPromotion: number
  evaluationsDone: number
}

export type SupervisorOverviewRow = {
  sup: Pick<DemoStaffUserRecord, 'email' | 'name' | 'role'>
  roleLabel: string
  colors: SupervisorColors
  team: CareerEmployee[]
  ready: number
  promoted: number
  evalsDone: number
  efficiency: number | null
  teamPreview: {
    id: string
    name: string
    currentRole: string
    statusLabel: string
    statusClass: string
  }[]
}

export type SupervisorOverviewModel = {
  kpis: SupervisorOverviewKpis
  rows: SupervisorOverviewRow[]
}

const SUP_COLORS: Record<string, SupervisorColors> = {
  'sup1@lumini': { bg: '#003366', light: '#E0E9F5', text: '#fff' },
  'sup2@lumini': { bg: '#1B4F8A', light: '#D5E4F5', text: '#fff' },
  'sup3@lumini': { bg: '#0F766E', light: '#CCFBF1', text: '#fff' },
  'sup4@lumini': { bg: '#92400E', light: '#FEF3C7', text: '#fff' },
  'gerente@lumini': { bg: '#7B2D8B', light: '#F0E4F6', text: '#fff' },
  'diretor@lumini': { bg: '#B45309', light: '#FEF3C7', text: '#fff' },
}

function roleLabel(role: DemoStaffUserRecord['role']): string {
  if (role === 'manager') return 'Gerente'
  if (role === 'boss') return 'Diretor'
  return 'Supervisor'
}

function safeLower(s: string | undefined): string {
  return (s || '').trim().toLowerCase()
}

function isPromoAggStatus(status: string | undefined): boolean {
  return status != null && (PROMO_AGG_STATUSES as readonly string[]).includes(status)
}

export function buildSupervisorOverviewModel(args: {
  employees: CareerEmployee[]
  evaluations: CareerEvaluation[]
  staffUsers: readonly DemoStaffUserRecord[]
}): SupervisorOverviewModel {
  const { employees, evaluations, staffUsers } = args

  const supervisors = staffUsers.filter((u) => u.role === 'supervisor' || u.role === 'manager')

  const kpis: SupervisorOverviewKpis = {
    totalEmployees: employees.length,
    awaitingEvaluation: employees.filter((e) => e.status === 'ready').length,
    inPromotion: employees.filter((e) => isPromoAggStatus(e.status)).length,
    evaluationsDone: evaluations.length,
  }

  const rows: SupervisorOverviewRow[] = supervisors.map((sup) => {
    const team = employees.filter((e) => safeLower(e.supervisor) === safeLower(sup.email))
    const ready = team.filter((e) => e.status === 'ready').length
    const promoted = team.filter((e) => isPromoAggStatus(e.status)).length
    const evalsDone = evaluations.filter((ev) => team.some((e) => e.id === ev.employeeId)).length
    const efficiency = team.length > 0 ? Math.round(((team.length - ready) / team.length) * 100) : null
    const colors = SUP_COLORS[sup.email] ?? { bg: '#6B7280', light: '#F3F4F6', text: '#fff' }

    const teamPreview = team.slice(0, 5).map((e) => {
      const si = getStatusInfo(e)
      return {
        id: e.id,
        name: (e.name || '—').trim(),
        currentRole: (e.currentRole || '—').trim(),
        statusLabel: si.label,
        statusClass: si.cls,
      }
    })

    return {
      sup: { email: sup.email, name: sup.name, role: sup.role },
      roleLabel: roleLabel(sup.role),
      colors,
      team,
      ready,
      promoted,
      evalsDone,
      efficiency,
      teamPreview,
    }
  })

  return { kpis, rows }
}

