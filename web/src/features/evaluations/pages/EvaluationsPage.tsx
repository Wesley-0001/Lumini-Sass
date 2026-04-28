/**
 * EvaluationsPage.tsx
 * Espelha renderEvaluationsList de app.js
 * SEM window.* / LegacyBridge
 */
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import { useCareerDashboardData } from '@/features/dashboard/hooks/useCareerDashboardData'
import styles from './EvaluationsPage.module.css'

type EvalResult = 'approved' | 'reproved' | 'pending' | string

function scoreBadgeClass(score: number): string {
  if (score >= 75) return 'green'
  if (score >= 50) return 'yellow'
  return 'red'
}

function resultLabel(result?: string): { label: string; cls: string } {
  switch (result) {
    case 'approved': return { label: 'Aprovado',  cls: 'green' }
    case 'reproved': return { label: 'Reprovado', cls: 'red' }
    case 'pending':  return { label: 'Pendente',  cls: 'yellow' }
    default:         return { label: result ?? '—', cls: 'gray' }
  }
}

function getInitials(name?: string): string {
  if (!name) return '??'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function formatDate(d?: string): string {
  if (!d) return '—'
  const parts = d.split('-')
  if (parts.length !== 3) return d
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export function EvaluationsPage() {
  const state = useCareerDashboardData()
  const [search,     setSearch]     = useState('')
  const [filterResult, setFilterResult] = useState<EvalResult | ''>('')

  const { evaluations, employees } = useMemo(() => {
    if (state.status !== 'ready') return { evaluations: [], employees: [] }
    return { evaluations: state.evaluations, employees: state.employees }
  }, [state])

  const filtered = useMemo(() => {
    let list = [...evaluations]
    if (filterResult) list = list.filter((ev) => ev.result === filterResult)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((ev) => {
        const emp = employees.find((e) => e.id === ev.employeeId)
        const name = (emp?.name ?? '').toLowerCase()
        return (
          name.includes(q) ||
          (ev.fromRole ?? '').toLowerCase().includes(q) ||
          (ev.toRole ?? '').toLowerCase().includes(q)
        )
      })
    }
    return list.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  }, [evaluations, employees, search, filterResult])

  // KPI counts
  const approved = evaluations.filter((ev) => ev.result === 'approved').length
  const reproved = evaluations.filter((ev) => ev.result === 'reproved').length
  const pending  = evaluations.filter((ev) => ev.result === 'pending').length

  if (state.status === 'loading') {
    return (
      <div className={styles.loadWrap}>
        <div className={styles.spinner} />
        <span>Carregando avaliações…</span>
      </div>
    )
  }

  if (state.status === 'no_firebase' || state.status === 'error') {
    return (
      <div className={styles.page}>
        <PageHeader title="Avaliações" subtitle="Lista de avaliações registradas" icon="fa-clipboard-list" />
        <Card className={styles.emptyCard}>
          <i className="fas fa-clipboard-list" style={{ fontSize: '2rem', color: '#d1d5db' }} />
          <p>
            {state.status === 'no_firebase'
              ? 'Firebase não configurado. Configure o .env para carregar avaliações.'
              : `Erro: ${state.message}`}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Avaliações"
        subtitle={`${evaluations.length} avaliação${evaluations.length !== 1 ? 'ões' : ''} registrada${evaluations.length !== 1 ? 's' : ''}`}
        icon="fa-clipboard-list"
      />

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <Card className={`${styles.kpiCard} ${styles.kpiGreen}`}>
          <i className="fas fa-check-circle" />
          <div>
            <div className={styles.kpiVal}>{approved}</div>
            <div className={styles.kpiLbl}>Aprovados</div>
          </div>
        </Card>
        <Card className={`${styles.kpiCard} ${styles.kpiRed}`}>
          <i className="fas fa-times-circle" />
          <div>
            <div className={styles.kpiVal}>{reproved}</div>
            <div className={styles.kpiLbl}>Reprovados</div>
          </div>
        </Card>
        <Card className={`${styles.kpiCard} ${styles.kpiYellow}`}>
          <i className="fas fa-clock" />
          <div>
            <div className={styles.kpiVal}>{pending}</div>
            <div className={styles.kpiLbl}>Pendentes</div>
          </div>
        </Card>
        <Card className={`${styles.kpiCard} ${styles.kpiBlue}`}>
          <i className="fas fa-list" />
          <div>
            <div className={styles.kpiVal}>{evaluations.length}</div>
            <div className={styles.kpiLbl}>Total</div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Buscar por funcionário, cargo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.select}
          value={filterResult}
          onChange={(e) => setFilterResult(e.target.value as EvalResult | '')}
        >
          <option value="">Todos os resultados</option>
          <option value="approved">Aprovados</option>
          <option value="reproved">Reprovados</option>
          <option value="pending">Pendentes</option>
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <Card className={styles.emptyCard}>
          <i className="fas fa-clipboard-list" style={{ fontSize: '2rem', color: '#d1d5db' }} />
          <p>Nenhuma avaliação encontrada.</p>
        </Card>
      ) : (
        <div className={styles.evalList}>
          {filtered.map((ev) => {
            const emp = employees.find((e) => e.id === ev.employeeId)
            const name = emp?.name ?? 'Funcionário'
            const res = resultLabel(ev.result)
            const score = typeof (ev as any).score === 'number' ? (ev as any).score : null
            const sections = (ev as any).sections as Record<string, { pct?: number }> | undefined

            return (
              <Card key={ev.id} className={styles.evalCard}>
                {/* Header */}
                <div className={styles.evalHeader}>
                  <div className={styles.evalAvatar}>{getInitials(name)}</div>
                  <div className={styles.evalInfo}>
                    <div className={styles.evalName}>{name}</div>
                    <div className={styles.evalMeta}>
                      {ev.fromRole ?? '—'} → <strong>{ev.toRole ?? '—'}</strong>
                      {ev.date && <> · {formatDate(ev.date)}</>}
                    </div>
                  </div>
                  <div className={styles.evalRight}>
                    {score !== null && (
                      <span className={`${styles.scoreBadge} ${styles[scoreBadgeClass(score)]}`}>
                        {score}%
                      </span>
                    )}
                    <span className={`${styles.resultBadge} ${styles[res.cls]}`}>{res.label}</span>
                  </div>
                </div>

                {/* Seções */}
                {sections && Object.keys(sections).length > 0 && (
                  <div className={styles.evalSections}>
                    {Object.entries(sections).map(([sec, data]) => {
                      const pct = data.pct ?? 0
                      const secLabel =
                        sec === 'tecnica'       ? 'Técnica'
                        : sec === 'comportamento' ? 'Comportamento'
                        : sec === 'seguranca'    ? 'Segurança'
                        : 'Potencial'
                      return (
                        <div key={sec} className={styles.sectionRow}>
                          <span className={styles.secLabel}>{secLabel}</span>
                          <div className={styles.secBar}>
                            <div
                              className={styles.secFill}
                              style={{
                                width: `${pct}%`,
                                background: pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626',
                              }}
                            />
                          </div>
                          <span className={styles.secPct}>{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Justificativa */}
                {(ev as any).justification && (
                  <div className={styles.justification}>
                    <i className="fas fa-quote-left" /> {(ev as any).justification}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
