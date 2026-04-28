import { calcTenureMonths, formatTenureLabel } from '@/lib/dashboard/careerKpi'
import type { CareerEmployee } from '@/lib/dashboard/careerKpi'
import type { CareerEvaluation } from '@/lib/dashboard/careerEvaluation'
import { formatDate, getStatusInfo } from '@/lib/dashboard/adminLegacy'

/** Mesmo `ENTRY_ROLE` de `renderPromoHistory` em `js/app.js`. */
export const PROMO_ENTRY_ROLE = 'Ajudante de Produção'

const APPROVED_STATUSES = ['approved', 'pending_samuel', 'pending_samuel_return', 'pending_carlos'] as const

export type PromoSupervisorUser = {
  email: string
  name: string
}

export type PromotionKpis = {
  promotedCount: number
  stillEntryCount: number
  approvedCount: number
  promotionRatePct: number
}

export type PromotionDestinationRow = {
  role: string
  count: number
  pctOfMax: number
}

export type PromotionTimelineItem = {
  id: string
  employeeId: string
  employeeName: string
  fromRole: string
  toRole: string
  dateLabel: string
  dateRaw: string
}

export type PromotionTableRow = {
  id: string
  name: string
  currentRole: string
  supervisorLabel: string
  admissionLabel: string
  tenureLabel: string
  statusLabel: string
  statusClass: string
}

export type PromotionHistoryModel = {
  kpis: PromotionKpis
  destinations: PromotionDestinationRow[]
  timeline: PromotionTimelineItem[]
  table: {
    total: number
    rows: PromotionTableRow[]
  }
}

export function buildPromotionHistoryModel(args: {
  employees: CareerEmployee[]
  evaluations: CareerEvaluation[]
  staffUsers: PromoSupervisorUser[]
}): PromotionHistoryModel {
  const list = args.employees
  const total = list.length

  const promoted = list.filter((e) => e.currentRole !== PROMO_ENTRY_ROLE)
  const stillEntry = list.filter((e) => e.currentRole === PROMO_ENTRY_ROLE)
  const approved = list.filter((e) => APPROVED_STATUSES.includes((e.status || '') as (typeof APPROVED_STATUSES)[number]))
  const promotionRatePct = total > 0 ? Math.round((promoted.length / total) * 100) : 0

  const destCounts: Record<string, number> = {}
  for (const e of promoted) {
    const r = e.currentRole || 'Outro'
    destCounts[r] = (destCounts[r] || 0) + 1
  }
  const destSorted = Object.entries(destCounts).sort((a, b) => b[1] - a[1])
  const maxDest = destSorted.length ? Math.max(...destSorted.map(([, n]) => n), 1) : 1
  const destinations: PromotionDestinationRow[] = destSorted.map(([role, count]) => ({
    role,
    count,
    pctOfMax: Math.round((count / maxDest) * 100),
  }))

  const promoEvs = args.evaluations.filter((e) => e.result === 'approved' || e.result === 'promoted')
  const timeline: PromotionTimelineItem[] = [...promoEvs]
    .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
    .slice(0, 8)
    .map((ev) => {
      const emp = list.find((e) => e.id === ev.employeeId)
      return {
        id: ev.id,
        employeeId: ev.employeeId || '',
        employeeName: (emp?.name || 'Funcionário').trim(),
        fromRole: ev.fromRole || '—',
        toRole: ev.toRole || '—',
        dateLabel: formatDate(ev.date),
        dateRaw: ev.date || '',
      }
    })

  const allPromoted = list.filter(
    (e) =>
      e.currentRole !== PROMO_ENTRY_ROLE ||
      [...APPROVED_STATUSES, 'promoted'].includes((e.status || '') as (typeof APPROVED_STATUSES)[number] | 'promoted'),
  )

  const tableRows: PromotionTableRow[] = allPromoted.map((e) => {
    const months = calcTenureMonths(e.admission)
    const supUser = args.staffUsers.find((u) => u.email === e.supervisor)
    const si = getStatusInfo(e)
    return {
      id: e.id,
      name: (e.name || '—').trim(),
      currentRole: e.currentRole || '—',
      supervisorLabel: supUser ? supUser.name : e.supervisor || '—',
      admissionLabel: formatDate(e.admission),
      tenureLabel: formatTenureLabel(months),
      statusLabel: si.label,
      statusClass: si.cls,
    }
  })

  return {
    kpis: {
      promotedCount: promoted.length,
      stillEntryCount: stillEntry.length,
      approvedCount: approved.length,
      promotionRatePct,
    },
    destinations,
    timeline,
    table: { total: allPromoted.length, rows: tableRows },
  }
}

export function filterTeamForPromoHistory(args: {
  employees: CareerEmployee[]
  role: string | null | undefined
  email: string | null | undefined
}): CareerEmployee[] {
  // Espelha `renderSupervisorPromoPage`: supervisor vê apenas seu time; outros perfis veem todos.
  if (args.role === 'supervisor' && args.email) {
    return args.employees.filter((e) => e.supervisor === args.email)
  }
  return args.employees
}
