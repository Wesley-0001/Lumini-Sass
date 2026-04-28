import type { CareerEmployee } from '@/lib/dashboard/careerKpi'
import { calcTenureMonths, formatTenureLabel } from '@/lib/dashboard/careerKpi'
import { getInitials, getStatusInfo } from '@/lib/dashboard/adminLegacy'

export type EmployeesFilterState = {
  search: string
  status: string
  role: string
  supervisor: string
}

export const EMP_STATUS_ALL = '__ALL__'
export const EMP_STATUS_EMPTY = '__EMPTY__'
export const EMP_ROLE_ALL = '__ALL__'
export const EMP_SUPERVISOR_ALL = '__ALL__'

export type StaffUserLite = { email: string; name: string }

export type EmployeeRowModel = {
  id: string
  name: string
  rhMatricula: string | null
  supervisorLabel: string
  sectorLabel: string
  currentRoleLabel: string
  desiredRoleLabel: string | null
  tenureLabel: string
  progressPct: number
  progressColor: 'green' | 'yellow' | 'red'
  statusLabel: string
  statusClass: string
}

export type EmployeesTableModel = {
  totalEmployees: number
  filteredEmployees: number
  noRhLinkCount: number
  statusOptions: { key: string; label: string }[]
  roleOptions: { key: string; label: string }[]
  supervisorOptions: { key: string; label: string }[]
  rows: EmployeeRowModel[]
}

function safeLower(v: string | undefined | null): string {
  return (v || '').trim().toLowerCase()
}

function progressColorFor(pct: number): 'green' | 'yellow' | 'red' {
  if (pct >= 100) return 'green'
  if (pct >= 50) return 'yellow'
  return 'red'
}

function matchSearch(e: CareerEmployee, q: string): boolean {
  if (!q) return true
  const name = safeLower(e.name)
  const role = safeLower(e.currentRole)
  const sector = safeLower(e.sector)
  const mat = safeLower(e.rhMatricula == null ? '' : String(e.rhMatricula))
  return name.includes(q) || role.includes(q) || sector.includes(q) || mat.includes(q)
}

function matchStatus(e: CareerEmployee, statusKey: string): boolean {
  if (statusKey === EMP_STATUS_ALL) return true
  const s = (e.status || '').trim()
  if (statusKey === EMP_STATUS_EMPTY) return !s
  return s === statusKey
}

function matchRole(e: CareerEmployee, roleKey: string): boolean {
  if (roleKey === EMP_ROLE_ALL) return true
  return (e.currentRole || '').trim() === roleKey
}

function matchSupervisor(e: CareerEmployee, supervisorKey: string): boolean {
  if (supervisorKey === EMP_SUPERVISOR_ALL) return true
  return safeLower(e.supervisor) === safeLower(supervisorKey)
}

function buildSupervisorLabel(e: CareerEmployee, staffUsers: readonly StaffUserLite[]): string {
  const supEmail = (e.supervisor || '').trim()
  if (!supEmail) return '—'
  const sup = staffUsers.find((u) => safeLower(u.email) === safeLower(supEmail))
  const supName = sup?.name || supEmail
  const rhLeader = (e.rhLider || '').trim()
  if (rhLeader && rhLeader !== supName) return `${supName} · Líder: ${rhLeader}`
  return supName
}

function buildSectorLabel(e: CareerEmployee): string {
  return (e.sector || '').trim() || 'Produção'
}

function buildStatusOptions(employees: CareerEmployee[]): { key: string; label: string }[] {
  const seen = new Map<string, string>()
  for (const e of employees) {
    const s = (e.status || '').trim()
    const key = s || EMP_STATUS_EMPTY
    seen.set(key, s || '(sem status)')
  }
  return Array.from(seen.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

function buildRoleOptions(employees: CareerEmployee[]): { key: string; label: string }[] {
  const seen = new Set<string>()
  for (const e of employees) {
    const r = (e.currentRole || '').trim()
    if (r) seen.add(r)
  }
  return Array.from(seen.values())
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((r) => ({ key: r, label: r }))
}

function buildSupervisorOptions(
  employees: CareerEmployee[],
  staffUsers: readonly StaffUserLite[],
): { key: string; label: string }[] {
  const seen = new Set<string>()
  for (const e of employees) {
    const sup = (e.supervisor || '').trim()
    if (sup) seen.add(sup)
  }
  const entries = Array.from(seen.values()).map((email) => {
    const u = staffUsers.find((s) => safeLower(s.email) === safeLower(email))
    return { key: email, label: u?.name || email }
  })
  entries.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  return entries
}

export function buildEmployeesTableModel(args: {
  employees: CareerEmployee[]
  staffUsers: readonly StaffUserLite[]
  filter: EmployeesFilterState
}): EmployeesTableModel {
  const { employees, staffUsers, filter } = args

  const q = safeLower(filter.search)
  const base = employees.filter(
    (e) =>
      matchSearch(e, q) &&
      matchStatus(e, filter.status) &&
      matchRole(e, filter.role) &&
      matchSupervisor(e, filter.supervisor),
  )

  const rows: EmployeeRowModel[] = base.map((e) => {
    const months = calcTenureMonths(e.admission)
    const tenureLabel = formatTenureLabel(months)
    const si = getStatusInfo(e)
    const progressColor = progressColorFor(si.pct)
    return {
      id: e.id,
      name: (e.name || '—').trim(),
      rhMatricula: e.rhMatricula == null || e.rhMatricula === '' ? null : String(e.rhMatricula),
      supervisorLabel: buildSupervisorLabel(e, staffUsers),
      sectorLabel: buildSectorLabel(e),
      currentRoleLabel: (e.currentRole || '—').trim(),
      desiredRoleLabel: e.desiredRole == null || e.desiredRole === '' ? null : e.desiredRole,
      tenureLabel,
      progressPct: si.pct,
      progressColor,
      statusLabel: si.label,
      statusClass: si.cls,
    }
  })

  const noRhLinkCount = employees.filter((e) => !e.rhMatricula).length

  return {
    totalEmployees: employees.length,
    filteredEmployees: base.length,
    noRhLinkCount,
    statusOptions: buildStatusOptions(employees),
    roleOptions: buildRoleOptions(employees),
    supervisorOptions: buildSupervisorOptions(employees, staffUsers),
    rows,
  }
}

export function employeeAvatarInitials(name: string | undefined): string {
  return getInitials(name)
}

