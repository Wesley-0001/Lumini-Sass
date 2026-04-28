/**
 * TurnoverPage.tsx
 * Espelha renderRHTurnover de rh-module.js (linhas 1200-1400)
 * SEM window.* / LegacyBridge
 */
import { useEffect, useRef, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import { useHREmployees } from '@/features/hr/hooks/useHREmployees'
import {
  hrCalcTenure,
  hrFormatDate,
  hrGetYear,
  isAtivo,
  resolveSetor,
  SETORES_ORDER,
  SETOR_COLORS,
  hrTenureText,
} from '@/features/hr/data/hrHelpers'
import type { HREmployee, AnoTurnoverStat } from '@/features/hr/types/hrTypes'
import styles from './TurnoverPage.module.css'

declare global { interface Window { Chart?: any } }

// ─── Helpers ──────────────────────────────────────────────────────────────
function calcTurnoverStats(employees: HREmployee[]): AnoTurnoverStat[] {
  const years = new Set<number>()
  for (const e of employees) {
    const ya = hrGetYear(e.admissao)
    const yd = e.demissao ? hrGetYear(e.demissao) : null
    if (ya && ya >= 2020) years.add(ya)
    if (yd && yd >= 2020) years.add(yd)
  }
  const currentYear = new Date().getFullYear()
  for (let y = 2020; y <= currentYear; y++) years.add(y)

  return Array.from(years)
    .sort((a, b) => a - b)
    .map((ano) => {
      const adm = employees.filter((e) => hrGetYear(e.admissao) === ano).length
      const dem = employees.filter((e) => e.demissao && hrGetYear(e.demissao) === ano).length
      const ativos = employees.filter(isAtivo).length
      const quadroMedio = ativos + Math.round((dem - adm) / 2)
      const base = Math.max(quadroMedio, 1)
      const taxa = (((adm + dem) / 2 / base) * 100).toFixed(1)
      return { ano, admissoes: adm, desligamentos: dem, quadroMedio: Math.max(quadroMedio, 0), taxa }
    })
}

type ExitBucket = { label: string; count: number; pct: string }

function calcExitBuckets(employees: HREmployee[], year: number | null): ExitBucket[] {
  const desligados = employees.filter(
    (e) => e.situacao === 'DESLIGADO' && (year === null || hrGetYear(e.demissao) === year),
  )
  const total = desligados.length || 1
  const buckets: Record<string, number> = {
    '< 6 meses': 0,
    '6m – 1 ano': 0,
    '1 – 2 anos': 0,
    '2 – 5 anos': 0,
    '> 5 anos': 0,
  }
  for (const e of desligados) {
    const t = hrCalcTenure(e.admissao, e.demissao ?? undefined)
    if (t < 6) buckets['< 6 meses']++
    else if (t < 12) buckets['6m – 1 ano']++
    else if (t < 24) buckets['1 – 2 anos']++
    else if (t < 60) buckets['2 – 5 anos']++
    else buckets['> 5 anos']++
  }
  return Object.entries(buckets).map(([label, count]) => ({
    label,
    count,
    pct: ((count / total) * 100).toFixed(1),
  }))
}

// ─── Componente ───────────────────────────────────────────────────────────
export function TurnoverPage() {
  const hrState = useHREmployees()
  const currentYear = new Date().getFullYear()
  const [filterYear, setFilterYear] = useState<number | 'all'>('all')
  const [search, setSearch] = useState('')

  const chartYearRef   = useRef<HTMLCanvasElement>(null)
  const chartTenureRef = useRef<HTMLCanvasElement>(null)
  const chartSetorRef  = useRef<HTMLCanvasElement>(null)
  const chartTopRef    = useRef<HTMLCanvasElement>(null)
  const chartInst      = useRef<Record<string, any>>({})

  const employees: HREmployee[] = useMemo(() => {
    if (hrState.status === 'ready' || hrState.status === 'error') return hrState.employees
    return []
  }, [hrState])

  const yearStats = useMemo(() => calcTurnoverStats(employees), [employees])

  const anos = useMemo(() => {
    const ys = new Set<number>()
    for (const e of employees) {
      const ya = hrGetYear(e.admissao)
      const yd = e.demissao ? hrGetYear(e.demissao) : null
      if (ya && ya >= 2020) ys.add(ya)
      if (yd && yd >= 2020) ys.add(yd)
    }
    for (let y = 2020; y <= currentYear; y++) ys.add(y)
    return Array.from(ys).sort((a, b) => b - a)
  }, [employees, currentYear])

  const exitBuckets = useMemo(
    () => calcExitBuckets(employees, filterYear === 'all' ? null : filterYear),
    [employees, filterYear],
  )

  // ── lista de desligados com filtros ──
  const desligadosList = useMemo(() => {
    let list = employees.filter((e) => e.situacao === 'DESLIGADO')
    if (filterYear !== 'all') list = list.filter((e) => hrGetYear(e.demissao) === filterYear)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          e.nome.toLowerCase().includes(q) ||
          e.cargo.toLowerCase().includes(q) ||
          resolveSetor(e).toLowerCase().includes(q),
      )
    }
    return list.sort((a, b) => (b.demissao ?? '').localeCompare(a.demissao ?? ''))
  }, [employees, filterYear, search])

  function destroyChart(k: string) {
    if (chartInst.current[k]) { try { chartInst.current[k].destroy() } catch { /**/ } delete chartInst.current[k] }
  }

  function renderCharts() {
    const C = (typeof window !== 'undefined' && window.Chart) ? window.Chart : null
    if (!C) return

    // ── Taxa por ano ──
    if (chartYearRef.current) {
      destroyChart('year')
      chartInst.current['year'] = new C(chartYearRef.current, {
        type: 'bar',
        data: {
          labels: yearStats.map((s) => String(s.ano)),
          datasets: [
            { label: 'Admissões', data: yearStats.map((s) => s.admissoes), backgroundColor: '#4361ee' },
            { label: 'Desligamentos', data: yearStats.map((s) => s.desligamentos), backgroundColor: '#ef4444' },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      })
    }

    // ── Tempo na empresa (desligados) ──
    if (chartTenureRef.current) {
      destroyChart('tenure')
      chartInst.current['tenure'] = new C(chartTenureRef.current, {
        type: 'bar',
        data: {
          labels: exitBuckets.map((b) => b.label),
          datasets: [{
            label: 'Desligados',
            data: exitBuckets.map((b) => b.count),
            backgroundColor: ['#4361ee', '#06d6a0', '#f59e0b', '#a78bfa', '#ef4444'],
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      })
    }

    // ── Setor (desligados) ──
    if (chartSetorRef.current) {
      destroyChart('setor')
      const year = filterYear === 'all' ? null : filterYear
      const dem = employees.filter(
        (e) => e.situacao === 'DESLIGADO' && (year === null || hrGetYear(e.demissao) === year),
      )
      const setorCount: Record<string, number> = {}
      for (const e of dem) {
        const s = resolveSetor(e)
        setorCount[s] = (setorCount[s] ?? 0) + 1
      }
      const labels = SETORES_ORDER.filter((s) => (setorCount[s] ?? 0) > 0)
      chartInst.current['setor'] = new C(chartSetorRef.current, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: labels.map((s) => setorCount[s]),
            backgroundColor: labels.map((s) => SETOR_COLORS[s] ?? '#ccc'),
          }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } },
      })
    }

    // ── Top cargos com mais saídas ──
    if (chartTopRef.current) {
      destroyChart('top')
      const year = filterYear === 'all' ? null : filterYear
      const dem = employees.filter(
        (e) => e.situacao === 'DESLIGADO' && (year === null || hrGetYear(e.demissao) === year),
      )
      const cargoCount: Record<string, number> = {}
      for (const e of dem) cargoCount[e.cargo] = (cargoCount[e.cargo] ?? 0) + 1
      const sorted = Object.entries(cargoCount).sort((a, b) => b[1] - a[1]).slice(0, 8)
      chartInst.current['top'] = new C(chartTopRef.current, {
        type: 'bar',
        data: {
          labels: sorted.map(([c]) => c),
          datasets: [{ label: 'Saídas', data: sorted.map(([, v]) => v), backgroundColor: '#06d6a0' }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
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
  }, [yearStats, exitBuckets, filterYear])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart) renderCharts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearStats, exitBuckets, filterYear])

  useEffect(() => () => { Object.keys(chartInst.current).forEach(destroyChart) }, [])

  if (hrState.status === 'loading') {
    return <div className={styles.loadWrap}><div className={styles.spinner} /><span>Carregando…</span></div>
  }

  const totalDem = employees.filter((e) => e.situacao === 'DESLIGADO').length
  const totalAtivos = employees.filter(isAtivo).length
  const taxaGeral = totalAtivos
    ? ((totalDem / totalAtivos) * 100).toFixed(1)
    : '0.0'
  const mediaTenure = (() => {
    const dem = employees.filter((e) => e.situacao === 'DESLIGADO')
    if (!dem.length) return '—'
    const avg = dem.reduce((acc, e) => acc + hrCalcTenure(e.admissao, e.demissao ?? undefined), 0) / dem.length
    return hrTenureText(Math.round(avg))
  })()

  return (
    <div className={styles.page}>
      <PageHeader
        title="Turnover & Rotatividade"
        subtitle="Análise histórica de entradas e saídas de colaboradores"
        icon="fa-sync-alt"
        actions={
          <select
            className={styles.yearSelect}
            value={String(filterYear)}
            onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          >
            <option value="all">Todos os anos</option>
            {anos.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        }
      />

      {hrState.status === 'error' && (
        <div className={styles.warnBanner}>
          <i className="fas fa-exclamation-triangle" /> {hrState.message}
        </div>
      )}

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#fee2e2' }}>
            <i className="fas fa-user-minus" style={{ color: '#dc2626' }} />
          </div>
          <div>
            <div className={styles.kpiVal}>{totalDem}</div>
            <div className={styles.kpiLbl}>Total Desligados</div>
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#dbeafe' }}>
            <i className="fas fa-users" style={{ color: '#4361ee' }} />
          </div>
          <div>
            <div className={styles.kpiVal}>{totalAtivos}</div>
            <div className={styles.kpiLbl}>Ativos Hoje</div>
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#fef9c3' }}>
            <i className="fas fa-percentage" style={{ color: '#ca8a04' }} />
          </div>
          <div>
            <div className={styles.kpiVal}>{taxaGeral}%</div>
            <div className={styles.kpiLbl}>Taxa de Turnover Geral</div>
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#ede9fe' }}>
            <i className="fas fa-clock" style={{ color: '#7c3aed' }} />
          </div>
          <div>
            <div className={styles.kpiVal}>{mediaTenure}</div>
            <div className={styles.kpiLbl}>Tempo Médio (desligados)</div>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className={styles.chartGrid2}>
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Admissões vs Desligamentos por Ano</h3>
          <div className={styles.chartWrap}><canvas ref={chartYearRef} /></div>
        </Card>
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Tempo de Empresa (Desligados)</h3>
          <div className={styles.chartWrap}><canvas ref={chartTenureRef} /></div>
        </Card>
      </div>
      <div className={styles.chartGrid2}>
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Setor dos Desligados</h3>
          <div className={styles.chartWrap}><canvas ref={chartSetorRef} /></div>
        </Card>
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Top Cargos com Mais Saídas</h3>
          <div className={styles.chartWrap}><canvas ref={chartTopRef} /></div>
        </Card>
      </div>

      {/* Tabela de anos */}
      <Card>
        <h3 className={styles.chartTitle}>Resumo por Ano</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ano</th>
                <th>Admissões</th>
                <th>Desligamentos</th>
                <th>Quadro Médio</th>
                <th>Taxa Turnover</th>
              </tr>
            </thead>
            <tbody>
              {yearStats.map((s) => (
                <tr key={s.ano} className={s.ano === currentYear ? styles.rowCurrent : ''}>
                  <td><strong>{s.ano}</strong></td>
                  <td className={styles.green}>{s.admissoes}</td>
                  <td className={styles.red}>{s.desligamentos}</td>
                  <td>{s.quadroMedio}</td>
                  <td>
                    <span className={`${styles.badge} ${parseFloat(s.taxa) > 5 ? styles.badgeWarn : styles.badgeOk}`}>
                      {s.taxa}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Lista de desligados */}
      <Card>
        <div className={styles.listHeader}>
          <h3 className={styles.chartTitle}>
            Lista de Desligamentos
            <span className={styles.countBadge}>{desligadosList.length}</span>
          </h3>
          <input
            className={styles.searchInput}
            placeholder="Buscar por nome, cargo ou setor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Setor</th>
                <th>Admissão</th>
                <th>Demissão</th>
                <th>Tempo</th>
              </tr>
            </thead>
            <tbody>
              {desligadosList.slice(0, 50).map((e) => {
                const tenure = hrCalcTenure(e.admissao, e.demissao ?? undefined)
                return (
                  <tr key={e.matricula}>
                    <td><strong>{e.nome}</strong></td>
                    <td className={styles.gray}>{e.cargo}</td>
                    <td>
                      <span className={styles.setorTag}>{resolveSetor(e)}</span>
                    </td>
                    <td className={styles.mono}>{hrFormatDate(e.admissao)}</td>
                    <td className={styles.mono}>{hrFormatDate(e.demissao)}</td>
                    <td className={styles.tenureTag}>{hrTenureText(tenure)}</td>
                  </tr>
                )
              })}
              {desligadosList.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>Nenhum desligamento encontrado</td></tr>
              )}
            </tbody>
          </table>
          {desligadosList.length > 50 && (
            <div className={styles.moreHint}>
              Exibindo 50 de {desligadosList.length} registros. Use o filtro para refinar.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
