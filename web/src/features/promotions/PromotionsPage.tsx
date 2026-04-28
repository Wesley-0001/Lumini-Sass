import { useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import { DEMO_STAFF_USERS } from '@/data/demoStaffUsers'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import { useCareerDashboardData } from '@/features/dashboard/hooks/useCareerDashboardData'
import { buildPromotionHistoryModel, filterTeamForPromoHistory } from '@/features/promotions/promotionService'

export function PromotionsPage() {
  const { user } = useStaffAuth()
  const data = useCareerDashboardData()

  const model = useMemo(() => {
    if (!user || data.status !== 'ready') return null
    const list = filterTeamForPromoHistory({ employees: data.employees, role: user.role, email: user.email })
    return buildPromotionHistoryModel({
      employees: list,
      evaluations: data.evaluations,
      staffUsers: DEMO_STAFF_USERS.map((u) => ({ email: u.email, name: u.name })),
    })
  }, [user, data])

  return (
    <section>
      <PageHeader
        icon="fa-rocket"
        title="Histórico de Promoções"
        subtitle="Mesmo recorte e cálculos do legado (`renderPromoHistory`), sem window.*"
      />

      {data.status === 'loading' && (
        <p style={{ color: 'var(--text-muted, #9CA3AF)', fontSize: 14 }}>
          <i className="fas fa-spinner fa-pulse" aria-hidden /> Carregando…
        </p>
      )}

      {data.status === 'no_firebase' && (
        <Card>
          <p style={{ color: 'var(--text-muted, #9CA3AF)', fontSize: 14 }}>
            Não foi possível conectar ao Firebase no momento. Verifique a configuração do app.
          </p>
        </Card>
      )}

      {data.status === 'error' && (
        <Card>
          <p style={{ color: '#DC2626', fontSize: 14 }}>
            <i className="fas fa-exclamation-triangle" aria-hidden /> {data.message}
          </p>
        </Card>
      )}

      {model && (
        <div className="promo-history-section">
          <div className="promo-history-header">
            <div className="promo-history-title">
              <i className="fas fa-rocket" aria-hidden />
              <div>
                <h3>Histórico de Promoções</h3>
                <span>Jornada dos funcionários a partir do cargo de Ajudante de Produção</span>
              </div>
            </div>

            <div className="promo-kpis">
              <div className="promo-kpi">
                <div className="promo-kpi-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                  🚀
                </div>
                <div className="promo-kpi-val">{model.kpis.promotedCount}</div>
                <div className="promo-kpi-label">Promovidos</div>
              </div>

              <div className="promo-kpi">
                <div className="promo-kpi-icon" style={{ background: '#FFF7ED', color: '#F97316' }}>
                  ⏳
                </div>
                <div className="promo-kpi-val">{model.kpis.stillEntryCount}</div>
                <div className="promo-kpi-label">Ainda Ajudantes</div>
              </div>

              <div className="promo-kpi">
                <div className="promo-kpi-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                  ✅
                </div>
                <div className="promo-kpi-val">{model.kpis.approvedCount}</div>
                <div className="promo-kpi-label">Aprovados</div>
              </div>

              <div className="promo-kpi">
                <div className="promo-kpi-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                  📊
                </div>
                <div className="promo-kpi-val">{model.kpis.promotionRatePct}%</div>
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

              <div className="promo-dest-chart">
                {model.destinations.length === 0 ? (
                  <div className="empty-state" style={{ padding: 20 }}>
                    <i className="fas fa-info-circle" aria-hidden />
                    <p>Nenhum promovido ainda</p>
                  </div>
                ) : (
                  model.destinations.map((row, i) => {
                    const colors = [
                      '#002B5B',
                      '#1B4F8A',
                      '#003366',
                      '#FF6B9D',
                      '#FFBED4',
                      '#7B2D8B',
                      '#B45309',
                      '#0891B2',
                    ]
                    const color = colors[i % colors.length]
                    return (
                      <div key={row.role} className="promo-dest-row">
                        <div className="promo-dest-label">{row.role}</div>
                        <div className="promo-dest-bar-wrap">
                          <div className="promo-dest-bar" style={{ width: `${row.pctOfMax}%`, background: color }} />
                        </div>
                        <div className="promo-dest-count" style={{ color }}>
                          {row.count}
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

              <div className="promo-timeline-list">
                {model.timeline.length === 0 ? (
                  <div className="empty-state" style={{ padding: 20 }}>
                    <i className="fas fa-history" aria-hidden />
                    <p>Nenhum histórico ainda</p>
                  </div>
                ) : (
                  model.timeline.map((ev) => (
                    <div key={ev.id} className="promo-timeline-item">
                      <div className="promo-tl-dot" />
                      <div className="promo-tl-content">
                        <div className="promo-tl-name">{ev.employeeName}</div>
                        <div className="promo-tl-detail">
                          {ev.fromRole} → {ev.toRole}
                        </div>
                        <div className="promo-tl-date">{ev.dateLabel}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="promo-table-box">
            <div className="promo-table-header">
              <h4>
                <i className="fas fa-list-alt" aria-hidden /> Detalhamento — Todos os Promovidos
              </h4>
              <span className="promo-count-badge">
                {model.table.total} registro{model.table.total !== 1 ? 's' : ''}
              </span>
            </div>

            {model.table.rows.length === 0 ? (
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
                    {model.table.rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.name}</strong>
                        </td>
                        <td>{row.currentRole}</td>
                        <td>{row.supervisorLabel}</td>
                        <td>{row.admissionLabel}</td>
                        <td>{row.tenureLabel}</td>
                        <td>
                          <span className={`status-badge ${row.statusClass}`}>{row.statusLabel}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

