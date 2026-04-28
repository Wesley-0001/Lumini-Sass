import { useMemo } from 'react'
import { DEMO_STAFF_USERS } from '@/data/demoStaffUsers'
import { calcTenureMonths, formatTenureLabel } from '@/lib/dashboard/careerKpi'
import type { CareerEmployee } from '@/lib/dashboard/careerKpi'
import type { CareerEvaluation } from '@/lib/dashboard/careerEvaluation'
import { getInitials } from '@/lib/dashboard/adminLegacy'
import { AdminCharts } from '@/features/dashboard/components/AdminCharts'
import { AdminPromoHistory } from '@/features/dashboard/components/AdminPromoHistory'

type Props = {
  employees: CareerEmployee[]
  evaluations: CareerEvaluation[]
}

/** Espelho visual de `renderAdminDashboard` + `renderPromoHistory('', null)` em `js/app.js`. */
export function AdminDashboardLegacy({ employees, evaluations }: Props) {
  const total = employees.length
  const apt = employees.filter((e) => e.minMonths && calcTenureMonths(e.admission) >= (e.minMonths as number)).length
  const pending = employees.filter((e) => e.status === 'ready').length
  const promoted = employees.filter((e) =>
    ['promoted', 'approved', 'pending_samuel', 'pending_samuel_return', 'pending_carlos'].includes(e.status || ''),
  ).length

  const eligible = useMemo(() => employees.filter((e) => e.status === 'ready'), [employees])

  const recentAside = (
    <div className="recent-card">
      <h3>
        <i className="fas fa-bell" aria-hidden /> Aguardando Avaliação
      </h3>
      <div className="recent-list">
        {!eligible.length ? (
          <div className="empty-state">
            <i className="fas fa-check-circle" aria-hidden />
            <p>Nenhum funcionário aguardando avaliação</p>
          </div>
        ) : (
          eligible.map((e) => {
            const months = calcTenureMonths(e.admission)
            const supUser = DEMO_STAFF_USERS.find((u) => u.email === e.supervisor)
            return (
              <div key={e.id} className="recent-item">
                <div className="recent-avatar">{getInitials(e.name)}</div>
                <div className="recent-info">
                  <div className="recent-name">{e.name}</div>
                  <div className="recent-detail">
                    {e.currentRole}
                    {e.desiredRole ? ` → ${e.desiredRole}` : ''} · {supUser ? supUser.name : e.supervisor}
                  </div>
                </div>
                <span className="recent-badge">{formatTenureLabel(months)}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  return (
    <>
      <div className="cards-grid">
        <div className="stat-card blue">
          <div className="stat-icon">
            <i className="fas fa-users" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{total}</span>
            <span className="stat-label">Total de Funcionários</span>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">
            <i className="fas fa-clock" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{apt}</span>
            <span className="stat-label">Aptos para Avaliação</span>
          </div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon">
            <i className="fas fa-hourglass-half" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{pending}</span>
            <span className="stat-label">Avaliações Pendentes</span>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">
            <i className="fas fa-trophy" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{promoted}</span>
            <span className="stat-label">Promoções Aprovadas</span>
          </div>
        </div>
      </div>

      <AdminCharts employees={employees} statusAside={recentAside} />

      <AdminPromoHistory prefix="" employees={employees} evaluations={evaluations} />
    </>
  )
}
