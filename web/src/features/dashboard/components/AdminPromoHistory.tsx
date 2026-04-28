import { useMemo } from 'react'
import { DEMO_STAFF_USERS } from '@/data/demoStaffUsers'
import { calcTenureMonths, formatTenureLabel } from '@/lib/dashboard/careerKpi'
import type { CareerEmployee } from '@/lib/dashboard/careerKpi'
import type { CareerEvaluation } from '@/lib/dashboard/careerEvaluation'
import { formatDate, getStatusInfo } from '@/lib/dashboard/adminLegacy'

/** Mesmo `ENTRY_ROLE` de `renderPromoHistory` em `js/app.js`. */
const ENTRY_ROLE = 'Ajudante de Produção'

type Props = {
  /** Prefixo dos ids (`sup-` na visão supervisor do legado). */
  prefix?: string
  employees: CareerEmployee[]
  evaluations: CareerEvaluation[]
  filteredEmployees?: CareerEmployee[] | null
}

/** Espelho de `renderPromoHistory(prefix, filteredEmployees)` em `js/app.js`. */
export function AdminPromoHistory({ prefix = '', employees, evaluations, filteredEmployees }: Props) {
  const list = filteredEmployees ?? employees

  const promoted = useMemo(() => list.filter((e) => e.currentRole !== ENTRY_ROLE), [list])
  const stillEntry = useMemo(() => list.filter((e) => e.currentRole === ENTRY_ROLE), [list])
  const approved = useMemo(
    () =>
      list.filter((e) =>
        ['approved', 'pending_samuel', 'pending_samuel_return', 'pending_carlos'].includes(e.status || ''),
      ),
    [list],
  )
  const total = list.length
  const taxaPct = total > 0 ? Math.round((promoted.length / total) * 100) : 0

  const destSorted = useMemo(() => {
    const destCounts: Record<string, number> = {}
    promoted.forEach((e) => {
      const r = e.currentRole || 'Outro'
      destCounts[r] = (destCounts[r] || 0) + 1
    })
    return Object.entries(destCounts).sort((a, b) => b[1] - a[1])
  }, [promoted])

  const maxDest = destSorted.length ? Math.max(...destSorted.map(([, n]) => n), 1) : 1

  const timelineItems = useMemo(() => {
    const promoEvs = evaluations.filter((e) => e.result === 'approved' || e.result === 'promoted')
    return [...promoEvs].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
  }, [evaluations])

  const allPromoted = useMemo(
    () =>
      list.filter(
        (e) =>
          e.currentRole !== ENTRY_ROLE ||
          ['approved', 'pending_samuel', 'pending_samuel_return', 'pending_carlos', 'promoted'].includes(
            e.status || '',
          ),
      ),
    [list],
  )

  const colors = ['#002B5B', '#1B4F8A', '#003366', '#FF6B9D', '#FFBED4', '#7B2D8B', '#B45309', '#0891B2']

  return (
    <div className="promo-history-section">
      <div className="promo-history-header">
        <div className="promo-history-title">
          <i className="fas fa-rocket" aria-hidden />
          <div>
            <h3>Histórico de Promoções</h3>
            <span>Jornada dos funcionários a partir do cargo de Ajudante de Produção</span>
          </div>
        </div>
        <div className="promo-kpis" id={`${prefix}promo-kpis`}>
          <div className="promo-kpi">
            <div className="promo-kpi-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              🚀
            </div>
            <div className="promo-kpi-val">{promoted.length}</div>
            <div className="promo-kpi-label">Promovidos</div>
          </div>
          <div className="promo-kpi">
            <div className="promo-kpi-icon" style={{ background: '#FFF7ED', color: '#F97316' }}>
              ⏳
            </div>
            <div className="promo-kpi-val">{stillEntry.length}</div>
            <div className="promo-kpi-label">Ainda Ajudantes</div>
          </div>
          <div className="promo-kpi">
            <div className="promo-kpi-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}>
              ✅
            </div>
            <div className="promo-kpi-val">{approved.length}</div>
            <div className="promo-kpi-label">Aprovados</div>
          </div>
          <div className="promo-kpi">
            <div className="promo-kpi-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
              📊
            </div>
            <div className="promo-kpi-val">{taxaPct}%</div>
            <div className="promo-kpi-label">Taxa de Promoção</div>
          </div>
        </div>
      </div>
      <div className="promo-charts-row">
        <div className="promo-chart-box">
          <h4>
            <i className="fas fa-chart-bar" aria-hidden /> Para onde foram os Ajudantes?
          </h4>
          <p className="promo-chart-sub">Cargos de destino dos promovidos</p>
          <div id={`${prefix}promo-dest-chart`} className="promo-dest-chart">
            {!destSorted.length ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <i className="fas fa-info-circle" aria-hidden />
                <p>Nenhum promovido ainda</p>
              </div>
            ) : (
              destSorted.map(([role, count], i) => {
                const pct = Math.round((count / maxDest) * 100)
                const color = colors[i % colors.length]
                return (
                  <div key={role} className="promo-dest-row">
                    <div className="promo-dest-label">{role}</div>
                    <div className="promo-dest-bar-wrap">
                      <div className="promo-dest-bar" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div className="promo-dest-count" style={{ color }}>
                      {count}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
        <div className="promo-chart-box">
          <h4>
            <i className="fas fa-history" aria-hidden /> Linha do Tempo das Promoções
          </h4>
          <p className="promo-chart-sub">Últimas promoções registradas</p>
          <div id={`${prefix}promo-timeline`} className="promo-timeline-list">
            {!timelineItems.length ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <i className="fas fa-history" aria-hidden />
                <p>Nenhum histórico ainda</p>
              </div>
            ) : (
              timelineItems.slice(0, 8).map((ev) => {
                const emp = list.find((e) => e.id === ev.employeeId)
                const name = emp ? emp.name : 'Funcionário'
                return (
                  <div key={ev.id} className="promo-timeline-item">
                    <div className="promo-tl-dot" />
                    <div className="promo-tl-content">
                      <div className="promo-tl-name">{name}</div>
                      <div className="promo-tl-detail">
                        {ev.fromRole || '—'} → {ev.toRole || '—'}
                      </div>
                      <div className="promo-tl-date">{formatDate(ev.date)}</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
      <div className="promo-table-box">
        <div className="promo-table-header">
          <h4>
            <i className="fas fa-list-alt" aria-hidden /> Detalhamento — Todos os Promovidos
          </h4>
          <span id={`${prefix}promo-table-count`} className="promo-count-badge">
            {allPromoted.length} registro{allPromoted.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div id={`${prefix}promo-detail-table`}>
          {!allPromoted.length ? (
            <div className="empty-state">
              <i className="fas fa-list-alt" aria-hidden />
              <p>Nenhum registro de promoção</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Funcionário</th>
                    <th>Cargo Atual</th>
                    <th>Supervisor</th>
                    <th>Admissão</th>
                    <th>Tempo de Casa</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allPromoted.map((e) => {
                    const months = calcTenureMonths(e.admission)
                    const supUser = DEMO_STAFF_USERS.find((u) => u.email === e.supervisor)
                    const si = getStatusInfo(e)
                    return (
                      <tr key={e.id}>
                        <td>
                          <strong>{e.name}</strong>
                        </td>
                        <td>{e.currentRole}</td>
                        <td>{supUser ? supUser.name : e.supervisor || '—'}</td>
                        <td>{formatDate(e.admission)}</td>
                        <td>{formatTenureLabel(months)}</td>
                        <td>
                          <span className={`status-badge ${si.cls}`}>{si.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
