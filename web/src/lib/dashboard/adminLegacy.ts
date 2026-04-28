import { calcTenureMonths } from '@/lib/dashboard/careerKpi'
import type { CareerEmployee } from '@/lib/dashboard/careerKpi'

/** Espelho de `getInitials` em `js/app.js`. */
export function getInitials(name: string | undefined): string {
  if (!name?.trim()) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

/** Espelho de `formatDate` em `js/app.js`. */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

/** Espelho de `getStatusInfo` em `js/app.js`. */
export function getStatusInfo(employee: CareerEmployee): { label: string; cls: string; pct: number; months: number } {
  const months = calcTenureMonths(employee.admission)
  if (!employee.desiredRole || employee.status === 'registered') {
    return { label: '📋 Cadastrado', cls: 'status-registered', pct: 0, months }
  }
  const pct = Math.min(100, Math.round((months / (employee.minMonths as number)) * 100))
  if (employee.status === 'promoted') return { label: '⭐ Promovido', cls: 'status-promoted', pct, months }
  if (employee.status === 'approved') return { label: '✅ Aprovado', cls: 'status-approved', pct, months }
  if (employee.status === 'pending_carlos')
    return { label: '👑 Aguardando Diretor', cls: 'status-pending-carlos', pct, months }
  if (employee.status === 'pending_samuel')
    return { label: '⏳ Ag. Samuel', cls: 'status-pending-samuel', pct, months }
  if (employee.status === 'pending_samuel_return')
    return { label: '↩️ Retorno do Diretor', cls: 'status-pending-samuel-return', pct, months }
  if (months >= (employee.minMonths as number))
    return { label: '🟡 Apto para Avaliação', cls: 'status-ready', pct: 100, months }
  return { label: '🔴 Em Período', cls: 'status-period', pct, months }
}
