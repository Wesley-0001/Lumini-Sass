/**
 * RhDashboardPage.tsx
 * Espelha renderRHDashboard de rh-module.js
 * SEM window.* / LegacyBridge
 */
import { useEffect, useRef, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import { useHREmployees } from '@/features/hr/hooks/useHREmployees'
import { useRHNotificacoes } from '@/features/hr/hooks/useRHNotificacoes'
import {
  hrCalcTenure,
  hrFormatDate,
  hrCalcAge,
  hrGetYear,
  isAtivo,
  resolveSetor,
  SETORES_ORDER,
  SETOR_COLORS,
  hrTenureText,
  MONTH_NAMES,
} from '@/features/hr/data/hrHelpers'
import type { HREmployee } from '@/features/hr/types/hrTypes'
import styles from './RhDashboardPage.module.css'

// ─── Chart.js dinâmico ─────────────────────────────────────────────────────
declare global {
  interface Window {
    Chart?: any
  }
}

function useChartJs(cb: () => void, deps: unknown[]) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart) { cb(); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
    s.onload = cb
    document.head.appendChild(s)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// ─── Helpers analíticos ────────────────────────────────────────────────────
function calcYearStats(employees: HREmployee[], year: number) {
  const ativos = employees.filter(isAtivo)
  const admYear = employees.filter(
    (e) => hrGetYear(e.admissao) === year,
  )
  const demYear = employees.filter(
    (e) => e.demissao && hrGetYear(e.demissao) === year,
  )

  // Distribuição por setor (ativos)
  const setorCount: Record<string, number> = {}
  for (const e of ativos) {
    const s = resolveSetor(e)
    setorCount[s] = (setorCount[s] ?? 0) + 1
  }

  // Admissões vs demissões por mês
  const admMes = Array(12).fill(0)
  const demMes = Array(12).fill(0)
  for (const e of admYear) {
    const m = parseInt(e.admissao.split('-')[1]) - 1
    if (m >= 0 && m < 12) admMes[m]++
  }
  for (const e of demYear) {
    const m = e.demissao ? parseInt(e.demissao.split('-')[1]) - 1 : -1
    if (m >= 0 && m < 12) demMes[m]++
  }

  // Turnover mensal
  const turnoverMes = admMes.map((a, i) => {
    const base = ativos.length || 1
    return parseFloat((((a + demMes[i]) / 2 / base) * 100).toFixed(1))
  })

  // Faixas etárias (ativos com nascimento)
  const ageMap: Record<string, number> = {
    '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '55+': 0, 'N/I': 0,
  }
  for (const e of ativos) {
    const age = hrCalcAge(e.nascimento)
    if (age === null) ageMap['N/I']++
    else if (age <= 25) ageMap['18-25']++
    else if (age <= 35) ageMap['26-35']++
    else if (age <= 45) ageMap['36-45']++
    else if (age <= 55) ageMap['46-55']++
    else ageMap['55+']++
  }

  // Faixas de tempo de empresa (ativos)
  const tenureMap: Record<string, number> = {
    '< 6m': 0, '6m-1a': 0, '1-3a': 0, '3-5a': 0, '5+a': 0,
  }
  for (const e of ativos) {
    const t = hrCalcTenure(e.admissao)
    if (t < 6) tenureMap['< 6m']++
    else if (t < 12) tenureMap['6m-1a']++
    else if (t < 36) tenureMap['1-3a']++
    else if (t < 60) tenureMap['3-5a']++
    else tenureMap['5+a']++
  }

  return { ativos, admYear, demYear, setorCount, admMes, demMes, turnoverMes, ageMap, tenureMap }
}

// ─── Componente principal ──────────────────────────────────────────────────
export function RhDashboardPage() {
  const hrState = useHREmployees()
  const { pendentes } = useRHNotificacoes()

  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const chartAdmDemRef  = useRef<HTMLCanvasElement>(null)
  const chartSetorRef   = useRef<HTMLCanvasElement>(null)
  const chartTurnRef    = useRef<HTMLCanvasElement>(null)
  const chartAgeRef     = useRef<HTMLCanvasElement>(null)
  const chartTenureRef  = useRef<HTMLCanvasElement>(null)

  const chartInstances = useRef<Record<string, any>>({})

  const employees: HREmployee[] = useMemo(() => {
    if (hrState.status === 'ready' || hrState.status === 'error') return hrState.employees
    return []
  }, [hrState])

  const stats = useMemo(() => calcYearStats(employees, year), [employees, year])

  // anos disponíveis (a partir de 2020)
  const anos = useMemo(() => {
    const ys = new Set<number>()
    for (const e of employees) {
      const y = hrGetYear(e.admissao)
      if (y && y >= 2020) ys.add(y)
    }
    for (let y = 2020; y <= currentYear; y++) ys.add(y)
    return Array.from(ys).sort((a, b) => b - a)
  }, [employees, currentYear])

  function destroyChart(key: string) {
    if (chartInstances.current[key]) {
      try { chartInstances.current[key].destroy() } catch { /* */ }
      delete chartInstances.current[key]
    }
  }

  function renderCharts() {
    const C = window.Chart
    if (!C) return

    // ── Admissões vs Demissões ──
    if (chartAdmDemRef.current) {
      destroyChart('admDem')
      chartInstances.current['admDem'] = new C(chartAdmDemRef.current, {
        type: 'bar',
        data: {
          labels: [...MONTH_NAMES],
          datasets: [
            { label: 'Admissões', data: stats.admMes, backgroundColor: '#4361ee' },
            { label: 'Demissões', data: stats.demMes, backgroundColor: '#ef4444' },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      })
    }

    // ── Setor (pizza) ──
    if (chartSetorRef.current) {
      destroyChart('setor')
      const setorLabels = SETORES_ORDER.filter((s) => (stats.setorCount[s] ?? 0) > 0)
      chartInstances.current['setor'] = new C(chartSetorRef.current, {
        type: 'doughnut',
        data: {
          labels: setorLabels,
          datasets: [{
            data: setorLabels.map((s) => stats.setorCount[s] ?? 0),
            backgroundColor: setorLabels.map((s) => SETOR_COLORS[s] ?? '#ccc'),
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'right' } },
        },
      })
    }

    // ── Turnover mensal ──
    if (chartTurnRef.current) {
      destroyChart('turn')
      chartInstances.current['turn'] = new C(chartTurnRef.current, {
        type: 'line',
        data: {
          labels: [...MONTH_NAMES],
          datasets: [{
            label: 'Turnover (%)',
            data: stats.turnoverMes,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.15)',
            fill: true,
            tension: 0.3,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: { y: { beginAtZero: true } },
        },
      })
    }

    // ── Faixa etária ──
    if (chartAgeRef.current) {
      destroyChart('age')
      const ageLabels = Object.keys(stats.ageMap)
      chartInstances.current['age'] = new C(chartAgeRef.current, {
        type: 'bar',
        data: {
          labels: ageLabels,
          datasets: [{
            label: 'Colaboradores',
            data: ageLabels.map((k) => stats.ageMap[k]),
            backgroundColor: '#06d6a0',
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      })
    }

    // ── Tempo de empresa ──
    if (chartTenureRef.current) {
      destroyChart('tenure')
      const tenLabels = Object.keys(stats.tenureMap)
      chartInstances.current['tenure'] = new C(chartTenureRef.current, {
        type: 'bar',
        data: {
          labels: tenLabels,
          datasets: [{
            label: 'Colaboradores',
            data: tenLabels.map((k) => stats.tenureMap[k]),
            backgroundColor: '#a78bfa',
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      })
    }
  }

  useChartJs(renderCharts, [stats])

  // re-render quando stats mudar (Chart.js já carregado)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart) renderCharts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats])

  // cleanup
  useEffect(() => {
    return () => {
      Object.keys(chartInstances.current).forEach(destroyChart)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Admissões/demissões recentes ──
  const recentAdm = useMemo(
    () =>
      employees
        .filter((e) => hrGetYear(e.admissao) === year)
        .sort((a, b) => b.admissao.localeCompare(a.admissao))
        .slice(0, 8),
    [employees, year],
  )
  const recentDem = useMemo(
    () =>
      employees
        .filter((e) => e.demissao && hrGetYear(e.demissao) === year)
        .sort((a, b) => (b.demissao ?? '').localeCompare(a.demissao ?? ''))
        .slice(0, 8),
    [employees, year],
  )

  if (hrState.status === 'loading') {
    return (
      <div className={styles.loadWrap}>
        <div className={styles.spinner} />
        <span>Carregando dados de RH…</span>
      </div>
    )
  }

  const totalAtivos = stats.ativos.length
  const totalAdm    = stats.admYear.length
  const totalDem    = stats.demYear.length
  const taxaMed     = totalAtivos
    ? ((totalAdm + totalDem) / 2 / totalAtivos * 100).toFixed(1)
    : '0.0'

  return (
    <div className={styles.page}>
      <PageHeader
        title="Dashboard RH"
        subtitle={`Visão geral dos colaboradores — ${year}`}
        icon="fa-heartbeat"
        actions={
          <select
            className={styles.yearSelect}
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {anos.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        }
      />

      {hrState.status === 'error' && (
        <div className={styles.warnBanner}>
          <i className="fas fa-exclamation-triangle" /> {hrState.message} (usando seed local)
        </div>
      )}

      {/* ── KPIs ── */}
      <div className={styles.kpiGrid}>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#dbeafe' }}>
            <i className="fas fa-users" style={{ color: '#4361ee' }} />
          </div>
          <div>
            <div className={styles.kpiVal}>{totalAtivos}</div>
            <div className={styles.kpiLbl}>Ativos</div>
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#dcfce7' }}>
            <i className="fas fa-user-plus" style={{ color: '#16a34a' }} />
          </div>
          <div>
            <div className={styles.kpiVal}>{totalAdm}</div>
            <div className={styles.kpiLbl}>Admissões {year}</div>
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#fee2e2' }}>
            <i className="fas fa-user-minus" style={{ color: '#dc2626' }} />
          </div>
          <div>
            <div className={styles.kpiVal}>{totalDem}</div>
            <div className={styles.kpiLbl}>Desligamentos {year}</div>
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#fef9c3' }}>
            <i className="fas fa-percentage" style={{ color: '#ca8a04' }} />
          </div>
          <div>
            <div className={styles.kpiVal}>{taxaMed}%</div>
            <div className={styles.kpiLbl}>Turnover Médio</div>
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#ede9fe' }}>
            <i className="fas fa-bell" style={{ color: '#7c3aed' }} />
          </div>
          <div>
            <div className={styles.kpiVal}>{pendentes.length}</div>
            <div className={styles.kpiLbl}>Promoções Pendentes</div>
          </div>
        </Card>
      </div>

      {/* ── Gráficos linha 1 ── */}
      <div className={styles.chartGrid2}>
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Admissões vs Demissões — {year}</h3>
          <div className={styles.chartWrap}>
            <canvas ref={chartAdmDemRef} />
          </div>
        </Card>
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Distribuição por Setor</h3>
          <div className={styles.chartWrap}>
            <canvas ref={chartSetorRef} />
          </div>
        </Card>
      </div>

      {/* ── Gráficos linha 2 ── */}
      <div className={styles.chartGrid3}>
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Turnover Mensal (%) — {year}</h3>
          <div className={styles.chartWrap}>
            <canvas ref={chartTurnRef} />
          </div>
        </Card>
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Faixa Etária (Ativos)</h3>
          <div className={styles.chartWrap}>
            <canvas ref={chartAgeRef} />
          </div>
        </Card>
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Tempo de Empresa (Ativos)</h3>
          <div className={styles.chartWrap}>
            <canvas ref={chartTenureRef} />
          </div>
        </Card>
      </div>

      {/* ── Listas recentes ── */}
      <div className={styles.listsGrid}>
        <Card>
          <h3 className={styles.listTitle}>
            <i className="fas fa-user-plus" /> Admissões {year}
            <span className={styles.listBadge}>{totalAdm}</span>
          </h3>
          <table className={styles.miniTable}>
            <thead>
              <tr><th>Nome</th><th>Cargo</th><th>Data</th></tr>
            </thead>
            <tbody>
              {recentAdm.map((e) => (
                <tr key={e.matricula}>
                  <td>{e.nome}</td>
                  <td className={styles.gray}>{e.cargo}</td>
                  <td className={styles.mono}>{hrFormatDate(e.admissao)}</td>
                </tr>
              ))}
              {recentAdm.length === 0 && (
                <tr><td colSpan={3} className={styles.empty}>Nenhuma admissão</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card>
          <h3 className={styles.listTitle}>
            <i className="fas fa-user-minus" /> Desligamentos {year}
            <span className={`${styles.listBadge} ${styles.badgeRed}`}>{totalDem}</span>
          </h3>
          <table className={styles.miniTable}>
            <thead>
              <tr><th>Nome</th><th>Cargo</th><th>Data</th></tr>
            </thead>
            <tbody>
              {recentDem.map((e) => (
                <tr key={e.matricula}>
                  <td>{e.nome}</td>
                  <td className={styles.gray}>{e.cargo}</td>
                  <td className={styles.mono}>{hrFormatDate(e.demissao)}</td>
                </tr>
              ))}
              {recentDem.length === 0 && (
                <tr><td colSpan={3} className={styles.empty}>Nenhum desligamento</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* ── Promoções pendentes ── */}
      {pendentes.length > 0 && (
        <Card className={styles.promoCard}>
          <h3 className={styles.chartTitle}>
            <i className="fas fa-bell" /> Promoções Aguardando Homologação
            <span className={styles.listBadge} style={{ background: '#fef9c3', color: '#92400e' }}>
              {pendentes.length}
            </span>
          </h3>
          <div className={styles.promoList}>
            {pendentes.map((p) => (
              <div key={p.id} className={styles.promoItem}>
                <div className={styles.promoAvatar}>
                  {p.employeeName.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div className={styles.promoName}>{p.employeeName}</div>
                  <div className={styles.promoRole}>
                    {p.fromRole} → <strong>{p.toRole}</strong>
                  </div>
                  <div className={styles.promoMeta}>
                    Supervisor: {p.supervisor} · Score: {p.score} · {hrFormatDate(p.approvedAt)}
                  </div>
                </div>
                <div className={styles.promoScore}>
                  {p.stars} <i className="fas fa-star" style={{ color: '#f59e0b' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Quadro por setor ── */}
      <Card>
        <h3 className={styles.chartTitle}>Quadro Atual por Setor</h3>
        <div className={styles.setorGrid}>
          {SETORES_ORDER.map((s) => {
            const count = stats.setorCount[s] ?? 0
            return (
              <div key={s} className={styles.setorCard} style={{ borderLeftColor: SETOR_COLORS[s] }}>
                <div className={styles.setorCount}>{count}</div>
                <div className={styles.setorName}>{s}</div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
