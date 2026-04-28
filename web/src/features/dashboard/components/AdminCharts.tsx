import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import { calcTenureMonths } from '@/lib/dashboard/careerKpi'
import type { CareerEmployee } from '@/lib/dashboard/careerKpi'
import { teamMap } from '@/lib/dashboard/adminTeamMap'

type TeamAgg = {
  teamKeys: string[]
  teamLabels: string[]
  teamData: number[]
  teamBgs: string[]
}

function buildTeamAgg(employees: CareerEmployee[]): TeamAgg {
  const teamCounts: Record<string, number> = {}
  employees.forEach((e) => {
    const k = e.supervisor || 'outro'
    teamCounts[k] = (teamCounts[k] || 0) + 1
  })
  const teamKeys = Object.keys(teamCounts)
  const teamLabels = teamKeys.map((k) => (teamMap[k] || { name: k }).name)
  const teamData = teamKeys.map((k) => teamCounts[k])
  const teamBgs = teamKeys.map((k) => (teamMap[k] || { color: '#9CA3AF' }).color)
  return { teamKeys, teamLabels, teamData, teamBgs }
}

type Props = {
  employees: CareerEmployee[]
  /** Bloco à direita do gráfico de status (`recent-card` no legado). */
  statusAside: ReactNode
}

/** Espelho dos gráficos Chart.js criados por `renderAdminDashboard` (`chart-by-team`, `chart-by-role`, `chart-status`). */
export function AdminCharts({ employees, statusAside }: Props) {
  const teamCanvasRef = useRef<HTMLCanvasElement>(null)
  const roleCanvasRef = useRef<HTMLCanvasElement>(null)
  const statusCanvasRef = useRef<HTMLCanvasElement>(null)
  const chartTeamRef = useRef<Chart | null>(null)
  const chartRoleRef = useRef<Chart | null>(null)
  const chartStatusRef = useRef<Chart | null>(null)
  const [selectedTeamKey, setSelectedTeamKey] = useState<string | null>(null)

  const agg = useMemo(() => buildTeamAgg(employees), [employees])

  useEffect(() => {
    return () => {
      chartTeamRef.current?.destroy()
      chartTeamRef.current = null
      chartRoleRef.current?.destroy()
      chartRoleRef.current = null
      chartStatusRef.current?.destroy()
      chartStatusRef.current = null
    }
  }, [])

  useEffect(() => {
    setSelectedTeamKey(null)
  }, [employees])

  useEffect(() => {
    chartTeamRef.current?.destroy()
    chartTeamRef.current = null

    const teamCtx = teamCanvasRef.current
    if (!teamCtx || agg.teamKeys.length === 0) return

    chartTeamRef.current = new Chart(teamCtx, {
      type: 'doughnut',
      data: {
        labels: agg.teamLabels,
        datasets: [
          {
            data: agg.teamData,
            backgroundColor: agg.teamBgs,
            borderWidth: 2,
            borderColor: '#fff',
            hoverOffset: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        layout: { padding: 6 },
        animation: { duration: 350 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1F2937',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (c) =>
                ` ${c.label}: ${c.parsed} funcionário${c.parsed !== 1 ? 's' : ''}`,
            },
          },
        },
        onClick: (_evt, elements) => {
          if (!elements.length) {
            setSelectedTeamKey(null)
            return
          }
          const idx = elements[0].index
          const key = agg.teamKeys[idx]
          setSelectedTeamKey((prev) => (prev === key ? null : key))
        },
      },
    })

    return () => {
      chartTeamRef.current?.destroy()
      chartTeamRef.current = null
    }
  }, [employees, agg.teamKeys, agg.teamLabels, agg.teamData, agg.teamBgs])

  useEffect(() => {
    if (!chartTeamRef.current || agg.teamKeys.length === 0) return
    const ds = chartTeamRef.current.data.datasets[0]
    ds.backgroundColor = agg.teamKeys.map((k, i) =>
      !selectedTeamKey || k === selectedTeamKey ? agg.teamBgs[i] : agg.teamBgs[i] + '40',
    )
    ds.borderWidth = agg.teamKeys.map((k) => (selectedTeamKey && k === selectedTeamKey ? 4 : 2))
    chartTeamRef.current.update('none')
  }, [selectedTeamKey, agg.teamBgs, agg.teamKeys])

  useEffect(() => {
    chartRoleRef.current?.destroy()
    chartRoleRef.current = null

    const filterKey = selectedTeamKey
    const source = filterKey ? employees.filter((e) => e.supervisor === filterKey) : employees
    const counts: Record<string, number> = {}
    source.forEach((e) => {
      const r = e.currentRole || 'Sem Cargo'
      counts[r] = (counts[r] || 0) + 1
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const labels = sorted.map(([r]) => r)
    const data = sorted.map(([, n]) => n)
    const palette = [
      '#002B5B',
      '#1B4F8A',
      '#003366',
      '#FFBED4',
      '#FF6B9D',
      '#7B2D8B',
      '#B45309',
      '#0891B2',
      '#059669',
      '#9333EA',
      '#C2410C',
      '#0F766E',
      '#6D28D9',
      '#BE185D',
      '#1D4ED8',
    ]
    const baseColor = filterKey ? (teamMap[filterKey] || { color: '#002B5B' }).color : null
    const bgColors = labels.map((_, i) =>
      baseColor
        ? baseColor + (i === 0 ? 'FF' : Math.max(60, 255 - i * 28).toString(16).padStart(2, '0'))
        : palette[i % palette.length],
    )

    const ctx = roleCanvasRef.current
    if (!ctx) return

    chartRoleRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Funcionários',
            data,
            backgroundColor: bgColors,
            hoverBackgroundColor: bgColors.map((c) => c.slice(0, 7) + 'BB'),
            borderRadius: 7,
            borderSkipped: false,
            borderWidth: 0,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1F2937',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              title: (c) => c[0].label,
              label: (c) =>
                ` ${(c.parsed as { x: number }).x} funcionário${(c.parsed as { x: number }).x !== 1 ? 's' : ''}`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 }, color: '#9CA3AF' },
            grid: { color: '#F3F4F6' },
            border: { display: false },
          },
          y: {
            ticks: {
              font: { size: 11, weight: 500 },
              color: '#374151',
              callback: function (val) {
                const lbl = this.getLabelForValue(val as number)
                return lbl.length > 22 ? lbl.slice(0, 20) + '…' : lbl
              },
            },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
    })

    return () => {
      chartRoleRef.current?.destroy()
      chartRoleRef.current = null
    }
  }, [employees, selectedTeamKey])

  useEffect(() => {
    chartStatusRef.current?.destroy()
    chartStatusRef.current = null

    const ctx = statusCanvasRef.current
    if (!ctx) return

    const statusPeriod = employees.filter((e) => !e.minMonths || calcTenureMonths(e.admission) < (e.minMonths as number))
      .length
    const statusReady = employees.filter((e) => e.status === 'ready').length
    const statusApproved = employees.filter((e) => e.status === 'approved').length
    const statusPromoted = employees.filter((e) => e.status === 'promoted').length
    const statusPSamuel = employees.filter((e) =>
      ['pending_samuel', 'pending_samuel_return'].includes(e.status || ''),
    ).length
    const statusPCarlos = employees.filter((e) => e.status === 'pending_carlos').length
    const statusReg = employees.filter(
      (e) => e.status === 'registered' && (!e.minMonths || calcTenureMonths(e.admission) < (e.minMonths as number)),
    ).length

    chartStatusRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Cadastrado', 'Em Período', 'Apto p/ Aval.', 'Ag. Samuel', 'Ag. Carlos', 'Aprovado', 'Promovido'],
        datasets: [
          {
            label: 'Funcionários',
            data: [
              statusReg,
              statusPeriod,
              statusReady,
              statusPSamuel,
              statusPCarlos,
              statusApproved,
              statusPromoted,
            ],
            backgroundColor: ['#E0E7FF', '#FEE2E2', '#FEF3C7', '#FDE68A', '#DDD6FE', '#DCFCE7', '#EDE9FE'],
            borderColor: ['#6366F1', '#DC2626', '#D97706', '#B45309', '#7C3AED', '#16A34A', '#5D36C5'],
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) =>
                ` ${(c.parsed as { y: number }).y} funcionário${(c.parsed as { y: number }).y !== 1 ? 's' : ''}`,
            },
          },
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#F3F4F6' } },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    })

    return () => {
      chartStatusRef.current?.destroy()
      chartStatusRef.current = null
    }
  }, [employees])

  const filterMeta = selectedTeamKey ? teamMap[selectedTeamKey] || { name: selectedTeamKey, color: '#002B5B' } : null
  const maxTeam = agg.teamData.length ? Math.max(...agg.teamData, 1) : 1

  const roleTitle =
    selectedTeamKey && filterMeta ? `Cargos — Equipe ${filterMeta.name}` : 'Funcionários por Cargo'

  return (
    <>
      <div className="dashboard-row dashboard-row-charts">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>
                <i className="fas fa-id-badge" aria-hidden /> <span>{roleTitle}</span>
              </h3>
              <span className="chart-sub">
                Clique em uma equipe para filtrar{' '}
                {selectedTeamKey && filterMeta ? (
                  <span
                    className="role-filter-tag"
                    style={{
                      background: `${filterMeta.color}20`,
                      color: filterMeta.color,
                      borderColor: `${filterMeta.color}40`,
                    }}
                  >
                    <i className="fas fa-filter" aria-hidden /> {filterMeta.name}
                    <button type="button" title="Limpar filtro" onClick={() => setSelectedTeamKey(null)}>
                      ✕
                    </button>
                  </span>
                ) : null}
              </span>
            </div>
          </div>
          <div style={{ height: 280, position: 'relative' }}>
            <canvas ref={roleCanvasRef} />
          </div>
        </div>
        <div className="chart-card chart-card-team">
          <div className="chart-card-header">
            <div>
              <h3>
                <i className="fas fa-layer-group" aria-hidden /> Por Equipe
              </h3>
              <span className="chart-sub">Funcionários por supervisor</span>
            </div>
          </div>
          <div className="team-chart-wrap">
            <div style={{ height: 180, position: 'relative' }}>
              <canvas ref={teamCanvasRef} />
            </div>
            <div className="chart-team-legend">
              {agg.teamKeys.map((k, i) => {
                const pct = Math.round((agg.teamData[i] / maxTeam) * 100)
                const color = agg.teamBgs[i]
                const dim = !!(selectedTeamKey && selectedTeamKey !== k)
                const active = selectedTeamKey === k
                return (
                  <button
                    key={k}
                    type="button"
                    className={`team-legend-item${dim ? ' legend-dim' : ''}${active ? ' legend-active' : ''}`}
                    title={`Filtrar por ${agg.teamLabels[i]}`}
                    onClick={() => setSelectedTeamKey((prev) => (prev === k ? null : k))}
                  >
                    <span className="team-legend-dot" style={{ background: color }} />
                    <span className="team-legend-name">{agg.teamLabels[i]}</span>
                    <span className="team-legend-count-bar">
                      <span className="team-legend-count-fill" style={{ width: `${pct}%`, background: color }} />
                    </span>
                    <span className="team-legend-val" style={{ color }}>
                      {agg.teamData[i]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>
                <i className="fas fa-chart-bar" aria-hidden /> Funcionários por Status
              </h3>
              <span className="chart-sub">Situação atual no plano de carreira</span>
            </div>
          </div>
          <div style={{ height: 200, position: 'relative' }}>
            <canvas ref={statusCanvasRef} />
          </div>
        </div>
        {statusAside}
      </div>
    </>
  )
}
