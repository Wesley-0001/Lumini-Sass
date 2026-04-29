import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import { useCareerDashboardData } from '@/features/dashboard/hooks/useCareerDashboardData'
import { useHREmployees } from '@/features/hr/hooks/useHREmployees'
import { DEMO_STAFF_USERS } from '@/data/demoStaffUsers'
import { getInitials } from '@/lib/dashboard/adminLegacy'
import { buildSupervisorOverviewModel, type SupervisorOverviewRow } from '@/features/supervisor/supervisorService'
import type { CareerEmployee } from '@/lib/dashboard/careerKpi'
import type { HREmployee } from '@/features/hr/types/hrTypes'

type SortKey = 'name' | 'team' | 'pending' | 'efficiency'

function sortRows(rows: SupervisorOverviewRow[], sort: SortKey): SupervisorOverviewRow[] {
  const copy = [...rows]
  copy.sort((a, b) => {
    if (sort === 'name') return a.sup.name.localeCompare(b.sup.name, 'pt-BR')
    if (sort === 'team') return b.team.length - a.team.length
    if (sort === 'pending') return b.ready - a.ready
    if (sort === 'efficiency') return (b.efficiency ?? -1) - (a.efficiency ?? -1)
    return 0
  })
  return copy
}

function normalizeHumanName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function mapHRToCareerEmployees(hrEmployees: HREmployee[]): CareerEmployee[] {
  const staffByName = new Map(
    DEMO_STAFF_USERS.map((u) => [normalizeHumanName(u.name), u.email] as const),
  )

  return hrEmployees
    .filter((e) => e.situacao !== 'DESLIGADO')
    .map((e) => {
      const leaderName = typeof e.lider === 'string' ? e.lider.trim() : ''
      const supervisorEmail = leaderName ? staffByName.get(normalizeHumanName(leaderName)) : undefined
      return {
        id: String(e.matricula ?? '').trim() || `hr:${(e.nome || '').trim() || 'sem-matricula'}`,
        name: (e.nome || '').trim() || undefined,
        rhMatricula: e.matricula ? String(e.matricula) : undefined,
        admission: (e.admissao || '').trim() || undefined,
        status: 'ready',
        minMonths: null,
        supervisor: supervisorEmail,
        rhLider: leaderName || undefined,
        currentRole: (e.cargo || '').trim() || undefined,
        desiredRole: null,
        sector: (e.setor || '').trim() || undefined,
        team: (e.setor || '').trim() || undefined,
      }
    })
}

export function SupervisorOverviewPage() {
  const data = useCareerDashboardData()
  const hr = useHREmployees()

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('name')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const effectiveData = useMemo(() => {
    if (data.status === 'ready') {
      return { employees: data.employees, evaluations: data.evaluations, source: 'firebase' as const }
    }

    if (hr.status === 'ready') {
      return { employees: mapHRToCareerEmployees(hr.employees), evaluations: [], source: 'hr_seed' as const }
    }

    if (hr.status === 'error') {
      return { employees: mapHRToCareerEmployees(hr.employees), evaluations: [], source: 'hr_seed' as const }
    }

    return null
  }, [data, hr])

  const model = useMemo(() => {
    if (!effectiveData) return null
    return buildSupervisorOverviewModel({
      employees: effectiveData.employees,
      evaluations: effectiveData.evaluations,
      staffUsers: DEMO_STAFF_USERS,
    })
  }, [effectiveData])

  const filtered = useMemo(() => {
    if (!model) return []
    const q = query.trim().toLowerCase()
    const base = q
      ? model.rows.filter((d) => {
          return d.sup.name.toLowerCase().includes(q) || d.team.some((e) => (e.name || '').toLowerCase().includes(q))
        })
      : model.rows
    return sortRows(base, sort)
  }, [model, query, sort])

  return (
    <section>
      <PageHeader
        icon="fa-user-tie"
        title="Acompanhamento por Supervisor"
        subtitle="Eficiência de cada equipe — visão hierárquica completa"
      />

      {(data.status === 'loading' || hr.status === 'loading') && !model && (
        <p style={{ color: 'var(--text-muted, #9CA3AF)', fontSize: 14 }}>
          <i className="fas fa-spinner fa-pulse" aria-hidden /> Carregando…
        </p>
      )}

      {data.status === 'no_firebase' && (
        <Card>
          <p style={{ color: 'var(--text-muted, #9CA3AF)', fontSize: 14 }}>
            Não foi possível conectar ao Firebase no momento. Exibindo dados locais para não bloquear a página.
          </p>
        </Card>
      )}

      {data.status === 'error' && (
        <Card>
          <p style={{ color: '#DC2626', fontSize: 14 }}>
            <i className="fas fa-exclamation-triangle" aria-hidden /> {data.message}
          </p>
          {effectiveData?.source === 'hr_seed' ? (
            <p style={{ color: 'var(--text-muted, #9CA3AF)', fontSize: 12, marginTop: 6 }}>
              Exibindo dados locais (RH seed) enquanto o Firebase está indisponível.
            </p>
          ) : null}
        </Card>
      )}

      {model && (
        <>
          {/* KPIs (mesmos cards do legado) */}
          <div className="sup-ov-kpis-grid" aria-label="KPIs por supervisor">
            <div className="stat-card blue">
              <div className="stat-icon" aria-hidden>
                <i className="fas fa-users" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{model.kpis.totalEmployees}</span>
                <span className="stat-label">Total Funcionários</span>
              </div>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon" aria-hidden>
                <i className="fas fa-clock" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{model.kpis.awaitingEvaluation}</span>
                <span className="stat-label">Aguardam Avaliação</span>
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon" aria-hidden>
                <i className="fas fa-trophy" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{model.kpis.inPromotion}</span>
                <span className="stat-label">Em Promoção</span>
              </div>
            </div>
            <div className="stat-card yellow">
              <div className="stat-icon" aria-hidden>
                <i className="fas fa-clipboard-list" />
              </div>
              <div className="stat-info">
                <span className="stat-value">{model.kpis.evaluationsDone}</span>
                <span className="stat-label">Avaliações Feitas</span>
              </div>
            </div>
          </div>

          {/* Toolbar (mesma UI do legado) */}
          <div className="sup-ov-toolbar">
            <div className="sup-ov-search-wrap">
              <i className="fas fa-search" aria-hidden />
              <input
                type="text"
                value={query}
                placeholder="Buscar supervisor ou funcionário..."
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="sup-ov-select">
              <option value="name">Ordenar: Nome</option>
              <option value="team">Ordenar: Tamanho da Equipe</option>
              <option value="pending">Ordenar: Pendências</option>
              <option value="efficiency">Ordenar: Eficiência</option>
            </select>
          </div>

          {!filtered.length ? (
            <div className="empty-state">
              <i className="fas fa-search" aria-hidden />
              <p>Nenhum resultado encontrado</p>
            </div>
          ) : (
            <div>
              {filtered.map((row) => {
                const supEmail = row.sup.email
                const isExpanded = !!expanded[supEmail]
                const teamToShow = isExpanded ? row.team : row.team.slice(0, 5)
                const remaining = Math.max(0, row.team.length - 5)

                return (
                  <div key={supEmail} className="sup-ov-card">
                    <div className="sup-ov-header" style={{ background: row.colors.bg }}>
                      <div className="sup-ov-avatar" style={{ background: 'rgba(255,255,255,0.2)' }} aria-hidden>
                        {getInitials(row.sup.name)}
                      </div>
                      <div className="sup-ov-info">
                        <div className="sup-ov-name">{row.sup.name}</div>
                        <div className="sup-ov-role">{row.roleLabel}</div>
                      </div>
                      <div className="sup-ov-efficiency">
                        <div className="sup-ov-eff-value">{row.efficiency !== null ? `${row.efficiency}%` : '—'}</div>
                        <div className="sup-ov-eff-label">{row.efficiency !== null ? 'Eficiência' : 'Sem dados'}</div>
                      </div>
                    </div>

                    <div className="sup-ov-stats">
                      <div className="sup-ov-stat">
                        <span className="sup-stat-val">{row.team.length}</span>
                        <span className="sup-stat-lbl">Equipe</span>
                      </div>
                      <div className="sup-ov-stat">
                        <span className="sup-stat-val" style={{ color: '#D97706' }}>
                          {row.ready}
                        </span>
                        <span className="sup-stat-lbl">Aguardam Aval.</span>
                      </div>
                      <div className="sup-ov-stat">
                        <span className="sup-stat-val" style={{ color: '#16A34A' }}>
                          {row.promoted}
                        </span>
                        <span className="sup-stat-lbl">Em Promoção</span>
                      </div>
                      <div className="sup-ov-stat">
                        <span className="sup-stat-val" style={{ color: '#7C3AED' }}>
                          {row.evalsDone}
                        </span>
                        <span className="sup-stat-lbl">Avaliações</span>
                      </div>
                    </div>

                    <div className="sup-ov-team-list">
                      {row.team.length === 0 ? (
                        <div className="sup-ov-empty">Nenhum funcionário nesta equipe</div>
                      ) : (
                        <>
                          {teamToShow.map((e) => {
                            // statusLabel/statusClass precisam ser exatamente os do legado; reaproveitamos supervisorService (preview)
                            const preview = row.teamPreview.find((p) => p.id === e.id)
                            const statusLabel = preview?.statusLabel ?? '📋 Cadastrado'
                            const statusClass = preview?.statusClass ?? 'status-registered'
                            const empName = (e.name || '—').trim()
                            const empRole = (e.currentRole || '—').trim()
                            return (
                              <div key={e.id} className="sup-ov-emp">
                                <div
                                  className="sup-ov-emp-avatar"
                                  style={{ background: `${row.colors.bg}20`, color: row.colors.bg }}
                                  aria-hidden
                                >
                                  {getInitials(empName)}
                                </div>
                                <div className="sup-ov-emp-info">
                                  <div className="sup-ov-emp-name">{empName}</div>
                                  <div className="sup-ov-emp-role">{empRole}</div>
                                </div>
                                <span className={['status-badge', statusClass].join(' ')} style={{ fontSize: 10 }}>
                                  {statusLabel}
                                </span>
                              </div>
                            )
                          })}

                          {row.team.length > 5 ? (
                            <button
                              type="button"
                              className="sup-ov-more"
                              onClick={() => setExpanded((p) => ({ ...p, [supEmail]: !isExpanded }))}
                              style={isExpanded ? { background: '#DBEAFE', color: '#1B4F8A' } : undefined}
                            >
                              {isExpanded ? (
                                <>
                                  <i className="fas fa-chevron-up" aria-hidden /> Recolher lista
                                </>
                              ) : (
                                `+${remaining} mais funcionários`
                              )}
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </section>
  )
}

