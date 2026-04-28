import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import { useCareerDashboardData } from '@/features/dashboard/hooks/useCareerDashboardData'
import { calcTenureMonths, formatTenureLabel } from '@/lib/dashboard/careerKpi'
import styles from '@/features/dashboard/pages/DashboardPage.module.css'

type Kpi = {
  label: string
  value: number
  icon: string
  tone: 'blue' | 'orange' | 'yellow' | 'green'
}

const PROMO_APPROVED_STATUSES = ['promoted', 'approved', 'pending_samuel', 'pending_samuel_return', 'pending_carlos'] as const

type BarDatum = { label: string; value: number }

export function DashboardPage() {
  const { user } = useStaffAuth()
  const data = useCareerDashboardData()

  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const kpis = useMemo((): Kpi[] => {
    if (data.status !== 'ready') {
      return [
        { label: 'Total de funcionários', value: 0, icon: 'fa-users', tone: 'blue' },
        { label: 'Aptos para avaliação', value: 0, icon: 'fa-clock', tone: 'orange' },
        { label: 'Avaliações feitas', value: 0, icon: 'fa-clipboard-check', tone: 'yellow' },
        { label: 'Promoções aprovadas', value: 0, icon: 'fa-trophy', tone: 'green' },
      ]
    }

    const total = data.employees.length
    const apt = data.employees.filter((e) => e.minMonths && calcTenureMonths(e.admission) >= (e.minMonths as number)).length
    const evaluationsDone = data.evaluationsCount
    const promotedApproved = data.employees.filter((e) =>
      PROMO_APPROVED_STATUSES.includes((e.status || '') as (typeof PROMO_APPROVED_STATUSES)[number]),
    ).length

    return [
      { label: 'Total de funcionários', value: total, icon: 'fa-users', tone: 'blue' },
      { label: 'Aptos para avaliação', value: apt, icon: 'fa-clock', tone: 'orange' },
      { label: 'Avaliações feitas', value: evaluationsDone, icon: 'fa-clipboard-check', tone: 'yellow' },
      { label: 'Promoções aprovadas', value: promotedApproved, icon: 'fa-trophy', tone: 'green' },
    ]
  }, [data])

  const awaitingReview = useMemo(() => {
    if (data.status !== 'ready') return []
    const ready = data.employees.filter((e) => e.status === 'ready')
    return ready
      .map((e) => {
        const months = calcTenureMonths(e.admission)
        const supervisorRaw = (e.rhLider || e.supervisor || 'Sem líder') as string
        return {
          id: e.id,
          name: (e.name || '—').trim(),
          role: (e.currentRole || '—').trim(),
          status: ((e.status || 'sem status') as string).trim() || 'sem status',
          supervisor: supervisorRaw.trim() || 'Sem líder',
          months,
          tenureLabel: formatTenureLabel(months),
        }
      })
      .sort((a, b) => {
        const byTenure = b.months - a.months
        if (byTenure !== 0) return byTenure
        return a.name.localeCompare(b.name, 'pt-BR')
      })
  }, [data])

  const filteredAwaitingReview = useMemo(() => {
    return awaitingReview.filter((e) => {
      if (selectedSupervisor && e.supervisor !== selectedSupervisor) return false
      if (selectedStatus && e.status !== selectedStatus) return false
      if (selectedRole && e.role !== selectedRole) return false
      return true
    })
  }, [awaitingReview, selectedRole, selectedStatus, selectedSupervisor])

  const hasActiveFilter = selectedSupervisor !== null || selectedStatus !== null || selectedRole !== null

  const clearAllFilters = () => {
    setSelectedSupervisor(null)
    setSelectedStatus(null)
    setSelectedRole(null)
  }

  const employeesBySupervisor = useMemo((): BarDatum[] => {
    if (data.status !== 'ready') return []
    const counts: Record<string, number> = {}
    for (const e of data.employees) {
      const raw = (e.rhLider || e.supervisor || 'Sem líder') as string
      const key = raw.trim() || 'Sem líder'
      counts[key] = (counts[key] || 0) + 1
    }
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'pt-BR'))
  }, [data])

  const employeesByStatus = useMemo((): BarDatum[] => {
    if (data.status !== 'ready') return []
    const counts: Record<string, number> = {}
    for (const e of data.employees) {
      const raw = (e.status || 'sem status') as string
      const key = raw.trim() || 'sem status'
      counts[key] = (counts[key] || 0) + 1
    }
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'pt-BR'))
  }, [data])

  const employeesByRole = useMemo((): BarDatum[] => {
    if (data.status !== 'ready') return []
    const counts: Record<string, number> = {}
    for (const e of data.employees) {
      const raw = (e.currentRole || 'Sem cargo') as string
      const key = raw.trim() || 'Sem cargo'
      counts[key] = (counts[key] || 0) + 1
    }
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'pt-BR'))
  }, [data])

  return (
    <section>
      <PageHeader icon="fa-tachometer-alt" title="Dashboard" subtitle="Nova versão React (fase 1): KPIs." />

      {data.status === 'loading' && (
        <p className={styles.mutedLine} role="status">
          <i className="fas fa-spinner fa-pulse" aria-hidden /> Carregando indicadores…
        </p>
      )}

      {data.status === 'no_firebase' && (
        <Card>
          <p className={styles.mutedLine}>
            Não foi possível conectar ao Firebase no momento. Verifique a configuração do app.
          </p>
        </Card>
      )}

      {data.status === 'error' && (
        <Card>
          <p className={styles.errorText}>
            <i className="fas fa-exclamation-triangle" aria-hidden /> {data.message}
          </p>
        </Card>
      )}

      <div className={`cards-grid ${styles.kpiAnim}`} aria-label="KPIs do Dashboard">
        {kpis.map((k) => (
          <Card key={k.label} variant="stat" className={k.tone}>
            <div className="stat-icon" aria-hidden>
              <i className={`fas ${k.icon}`} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{k.value}</span>
              <span className="stat-label">{k.label}</span>
            </div>
          </Card>
        ))}
      </div>

      {user?.role === 'admin' && data.status === 'ready' && (
        <div className={styles.section}>
          <Card>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Aguardando avaliação</h2>
                <p className={styles.sectionSubtitle}>
                  {filteredAwaitingReview.length} colaborador{filteredAwaitingReview.length === 1 ? '' : 'es'} com status{' '}
                  <b>ready</b>
                  {hasActiveFilter ? (
                    <>
                      {' '}
                      (filtrado de {awaitingReview.length})
                    </>
                  ) : null}
                </p>
              </div>

              {hasActiveFilter ? (
                <button
                  type="button"
                  className={styles.clearFilterBtn}
                  onClick={clearAllFilters}
                >
                  Limpar todos
                </button>
              ) : null}
            </div>

            {hasActiveFilter ? (
              <div className={styles.activeFilters} aria-label="Filtros ativos">
                {selectedSupervisor ? (
                  <span className={styles.filterTag}>
                    <span className={styles.filterTagPrefix}>Supervisor</span>
                    <span className={styles.filterTagValue} title={selectedSupervisor}>
                      {selectedSupervisor}
                    </span>
                    <button
                      type="button"
                      className={styles.filterTagRemove}
                      onClick={() => setSelectedSupervisor(null)}
                      aria-label={`Remover filtro de supervisor: ${selectedSupervisor}`}
                      title="Remover filtro"
                    >
                      ✕
                    </button>
                  </span>
                ) : null}

                {selectedStatus ? (
                  <span className={styles.filterTag}>
                    <span className={styles.filterTagPrefix}>Status</span>
                    <span className={styles.filterTagValue} title={selectedStatus}>
                      {selectedStatus}
                    </span>
                    <button
                      type="button"
                      className={styles.filterTagRemove}
                      onClick={() => setSelectedStatus(null)}
                      aria-label={`Remover filtro de status: ${selectedStatus}`}
                      title="Remover filtro"
                    >
                      ✕
                    </button>
                  </span>
                ) : null}

                {selectedRole ? (
                  <span className={styles.filterTag}>
                    <span className={styles.filterTagPrefix}>Cargo</span>
                    <span className={styles.filterTagValue} title={selectedRole}>
                      {selectedRole}
                    </span>
                    <button
                      type="button"
                      className={styles.filterTagRemove}
                      onClick={() => setSelectedRole(null)}
                      aria-label={`Remover filtro de cargo: ${selectedRole}`}
                      title="Remover filtro"
                    >
                      ✕
                    </button>
                  </span>
                ) : null}
              </div>
            ) : null}

            {filteredAwaitingReview.length === 0 ? (
              <p className={styles.mutedLine}>Nenhum colaborador aguardando avaliação no momento.</p>
            ) : (
              <ul className={styles.simpleList} aria-label="Lista de colaboradores aguardando avaliação">
                {filteredAwaitingReview.map((e) => (
                  <li key={e.id} className={styles.simpleListItem}>
                    <div className={styles.empName}>{e.name}</div>
                    <div className={styles.empMeta}>
                      <span className={styles.empRole}>{e.role}</span>
                      <span className={styles.empSep} aria-hidden>
                        •
                      </span>
                      <span className={styles.empTenure}>{e.tenureLabel}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.chartSection} aria-label="Distribuição de funcionários por supervisor">
              <h3 className={styles.chartTitle}>Funcionários por supervisor</h3>

              {employeesBySupervisor.length === 0 ? (
                <p className={styles.mutedLine}>Sem dados de equipe para exibir.</p>
              ) : (
                <div className={styles.barChart} role="list" aria-label="Funcionários por supervisor">
                  {employeesBySupervisor.map((d) => {
                    const max = employeesBySupervisor[0]?.value || 1
                    const pct = Math.round((d.value / Math.max(max, 1)) * 100)
                    const active = selectedSupervisor === d.label
                    return (
                      <div
                        key={d.label}
                        className={`${styles.barRow} ${styles.barRowInteractive} ${active ? styles.barRowActive : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={active}
                        onClick={() => setSelectedSupervisor(d.label)}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault()
                            setSelectedSupervisor(d.label)
                          }
                        }}
                        title="Clique para filtrar a lista por supervisor"
                      >
                        <div className={styles.barLabel} title={d.label}>
                          {d.label}
                        </div>
                        <div className={styles.barTrack} aria-hidden>
                          <div className={`${styles.barFill} ${active ? styles.barFillActive : ''}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className={styles.barValue}>{d.value}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={styles.chartSection} aria-label="Distribuição de funcionários por status">
              <h3 className={styles.chartTitle}>Funcionários por status</h3>

              {employeesByStatus.length === 0 ? (
                <p className={styles.mutedLine}>Sem dados de status para exibir.</p>
              ) : (
                <div className={styles.barChart} role="list" aria-label="Funcionários por status">
                  {employeesByStatus.map((d) => {
                    const max = employeesByStatus[0]?.value || 1
                    const pct = Math.round((d.value / Math.max(max, 1)) * 100)
                    const active = selectedStatus === d.label
                    return (
                      <div
                        key={d.label}
                        className={`${styles.barRow} ${styles.barRowInteractive} ${active ? styles.barRowActive : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={active}
                        onClick={() => setSelectedStatus(d.label)}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault()
                            setSelectedStatus(d.label)
                          }
                        }}
                        title="Clique para filtrar a lista por status"
                      >
                        <div className={styles.barLabel} title={d.label}>
                          {d.label}
                        </div>
                        <div className={styles.barTrack} aria-hidden>
                          <div className={`${styles.barFill} ${active ? styles.barFillActive : ''}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className={styles.barValue}>{d.value}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={styles.chartSection} aria-label="Distribuição de funcionários por cargo">
              <h3 className={styles.chartTitle}>Funcionários por cargo</h3>

              {employeesByRole.length === 0 ? (
                <p className={styles.mutedLine}>Sem dados de cargo para exibir.</p>
              ) : (
                <div className={styles.barChart} role="list" aria-label="Funcionários por cargo">
                  {employeesByRole.map((d) => {
                    const max = employeesByRole[0]?.value || 1
                    const pct = Math.round((d.value / Math.max(max, 1)) * 100)
                    const active = selectedRole === d.label
                    return (
                      <div
                        key={d.label}
                        className={`${styles.barRow} ${styles.barRowInteractive} ${active ? styles.barRowActive : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={active}
                        onClick={() => setSelectedRole(d.label)}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault()
                            setSelectedRole(d.label)
                          }
                        }}
                        title="Clique para filtrar a lista por cargo"
                      >
                        <div className={styles.barLabel} title={d.label}>
                          {d.label}
                        </div>
                        <div className={styles.barTrack} aria-hidden>
                          <div className={`${styles.barFill} ${active ? styles.barFillActive : ''}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className={styles.barValue}>{d.value}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </section>
  )
}

