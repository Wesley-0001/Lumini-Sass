/**
 * ReportsPage.tsx
 * Espelha renderReports de app.js
 * SEM window.* / LegacyBridge
 */
import { useEffect, useRef, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import { useCareerDashboardData } from '@/features/dashboard/hooks/useCareerDashboardData'
import { calcTenureMonths, formatTenureLabel } from '@/lib/dashboard/careerKpi'
import styles from './ReportsPage.module.css'

declare global { interface Window { Chart?: any } }

// ─── Helpers ──────────────────────────────────────────────────────────────
type StatusInfo = { label: string; cls: string }

function getStatusInfo(status?: string, admission?: string, minMonths?: number | null): StatusInfo {
  switch (status) {
    case 'registered':    return { label: 'Cadastrado',    cls: 'gray' }
    case 'ready':         return { label: 'Apto p/ Aval.', cls: 'blue' }
    case 'approved':      return { label: 'Aprovado',      cls: 'green' }
    case 'promoted':      return { label: 'Promovido',     cls: 'purple' }
    case 'pending_samuel':
    case 'pending_samuel_return':
    case 'pending_carlos': return { label: 'Em Promoção',  cls: 'yellow' }
    default: {
      const months = admission ? calcTenureMonths(admission) : 0
      if (minMonths && months < minMonths) return { label: 'Em Período', cls: 'orange' }
      return { label: status ?? 'Cadastrado', cls: 'gray' }
    }
  }
}

function formatDate(d?: string): string {
  if (!d) return '—'
  const p = d.split('-')
  if (p.length !== 3) return d
  return `${p[2]}/${p[1]}/${p[0]}`
}

// ─── Componente ───────────────────────────────────────────────────────────
export function ReportsPage() {
  const state = useCareerDashboardData()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'tenure' | 'status'>('name')

  const chartPieRef  = useRef<HTMLCanvasElement>(null)
  const chartEvalRef = useRef<HTMLCanvasElement>(null)
  const chartInst    = useRef<Record<string, any>>({})

  const { employees, evaluations } = useMemo(() => {
    if (state.status !== 'ready') return { employees: [], evaluations: [] }
    return { employees: state.employees, evaluations: state.evaluations }
  }, [state])

  // ── Contagens para gráficos ──
  const pieCounts = useMemo(() => ({
    'Cadastrado':    employees.filter((e) => e.status === 'registered').length,
    'Em Período':    employees.filter((e) => {
      const m = e.admission ? calcTenureMonths(e.admission) : 0
      const pending = ['ready','approved','promoted','pending_samuel','pending_samuel_return','pending_carlos']
      return !pending.includes(e.status ?? '') && e.status !== 'registered' && m < (e.minMonths ?? 999)
    }).length,
    'Apto p/ Aval.': employees.filter((e) => e.status === 'ready').length,
    'Em Promoção':   employees.filter((e) =>
      ['pending_samuel','pending_samuel_return','pending_carlos'].includes(e.status ?? '')
    ).length,
    'Aprovado':      employees.filter((e) => e.status === 'approved').length,
    'Promovido':     employees.filter((e) => e.status === 'promoted').length,
  }), [employees])

  const evalCounts = useMemo(() => ({
    approved: evaluations.filter((e) => e.result === 'approved').length,
    reproved: evaluations.filter((e) => e.result === 'reproved').length,
    pending:  evaluations.filter((e) => e.result === 'pending').length,
  }), [evaluations])

  function destroyChart(k: string) {
    if (chartInst.current[k]) { try { chartInst.current[k].destroy() } catch { /**/ } delete chartInst.current[k] }
  }

  function renderCharts() {
    const C = (typeof window !== 'undefined' && window.Chart) ? window.Chart : null
    if (!C) return

    // Pie: status dos funcionários
    if (chartPieRef.current) {
      destroyChart('pie')
      chartInst.current['pie'] = new C(chartPieRef.current, {
        type: 'pie',
        data: {
          labels: Object.keys(pieCounts),
          datasets: [{
            data: Object.values(pieCounts),
            backgroundColor: ['#E0E7FF','#FEE2E2','#FEF3C7','#DDD6FE','#DCFCE7','#EDE9FE'],
            borderWidth: 2,
          }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } },
      })
    }

    // Bar: resultado das avaliações
    if (chartEvalRef.current) {
      destroyChart('eval')
      chartInst.current['eval'] = new C(chartEvalRef.current, {
        type: 'bar',
        data: {
          labels: ['Aprovados', 'Reprovados', 'Pendentes'],
          datasets: [{
            data: [evalCounts.approved, evalCounts.reproved, evalCounts.pending],
            backgroundColor: ['#DCFCE7', '#FEE2E2', '#FEF3C7'],
            borderColor:     ['#16A34A', '#DC2626', '#D97706'],
            borderWidth: 2, borderRadius: 8,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } },
        },
      })
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.Chart) { renderCharts(); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
    s.onload = renderCharts
    document.head.appendChild(s)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieCounts, evalCounts])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart) renderCharts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieCounts, evalCounts])

  useEffect(() => () => { Object.keys(chartInst.current).forEach(destroyChart) }, [])

  // ── Tabela de relatório ──
  const reportRows = useMemo(() => {
    let rows = employees.map((e) => {
      const months = e.admission ? calcTenureMonths(e.admission) : 0
      const evals  = evaluations
        .filter((ev) => ev.employeeId === e.id)
        .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
      const last = evals[0]
      const si   = getStatusInfo(e.status, e.admission, e.minMonths)
      return { e, months, last, si }
    })

    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(
        ({ e }) =>
          (e.name ?? '').toLowerCase().includes(q) ||
          (e.currentRole ?? '').toLowerCase().includes(q) ||
          (e.desiredRole ?? '').toLowerCase().includes(q),
      )
    }

    switch (sortBy) {
      case 'tenure': rows.sort((a, b) => b.months - a.months); break
      case 'status': rows.sort((a, b) => a.si.label.localeCompare(b.si.label)); break
      default:       rows.sort((a, b) => (a.e.name ?? '').localeCompare(b.e.name ?? ''))
    }

    return rows
  }, [employees, evaluations, search, sortBy])

  if (state.status === 'loading') {
    return <div className={styles.loadWrap}><div className={styles.spinner} /><span>Carregando relatórios…</span></div>
  }

  if (state.status === 'no_firebase' || state.status === 'error') {
    return (
      <div className={styles.page}>
        <PageHeader title="Relatórios" subtitle="Visão consolidada dos colaboradores" icon="fa-chart-bar" />
        <Card className={styles.emptyCard}>
          <i className="fas fa-chart-bar" style={{ fontSize: '2rem', color: '#d1d5db' }} />
          <p>{state.status === 'no_firebase' ? 'Firebase não configurado.' : `Erro: ${state.message}`}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Relatórios"
        subtitle={`${employees.length} colaborador${employees.length !== 1 ? 'es' : ''} · ${evaluations.length} avaliação${evaluations.length !== 1 ? 'ões' : ''}`}
        icon="fa-chart-bar"
      />

      {/* Gráficos */}
      <div className={styles.chartGrid}>
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Status dos Colaboradores</h3>
          <div className={styles.chartWrap}><canvas ref={chartPieRef} /></div>
        </Card>
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Resultado das Avaliações</h3>
          <div className={styles.chartWrap}><canvas ref={chartEvalRef} /></div>
        </Card>
      </div>

      {/* KPI row */}
      <div className={styles.kpiRow}>
        {Object.entries(pieCounts).map(([label, count]) => (
          <Card key={label} className={styles.kpiMini}>
            <div className={styles.kpiMiniVal}>{count}</div>
            <div className={styles.kpiMiniLbl}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Tabela */}
      <Card>
        <div className={styles.tableHeader}>
          <h3 className={styles.chartTitle}>
            Detalhamento por Colaborador
            <span className={styles.countBadge}>{reportRows.length}</span>
          </h3>
          <div className={styles.tableControls}>
            <input
              className={styles.searchInput}
              placeholder="Buscar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={styles.select}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="name">Ordenar: Nome</option>
              <option value="tenure">Ordenar: Tempo</option>
              <option value="status">Ordenar: Status</option>
            </select>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Cargo Atual</th>
                <th>Cargo Desejado</th>
                <th>Tempo</th>
                <th>Última Aval.</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map(({ e, months, last, si }) => (
                <tr key={e.id}>
                  <td><strong>{e.name ?? '—'}</strong></td>
                  <td className={styles.gray}>{e.currentRole ?? '—'}</td>
                  <td className={styles.gray}>{e.desiredRole ?? '—'}</td>
                  <td className={styles.mono}>{formatTenureLabel(months)}</td>
                  <td className={styles.mono}>{formatDate(last?.date)}</td>
                  <td>
                    {last && typeof (last as any).score === 'number' ? (
                      <span className={`${styles.score} ${styles[(last as any).score >= 75 ? 'sGreen' : (last as any).score >= 50 ? 'sYellow' : 'sRed']}`}>
                        {(last as any).score}%
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[si.cls]}`}>{si.label}</span>
                  </td>
                </tr>
              ))}
              {reportRows.length === 0 && (
                <tr><td colSpan={7} className={styles.empty}>Nenhum colaborador encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
