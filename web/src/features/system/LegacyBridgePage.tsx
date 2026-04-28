import { useEffect, useMemo, useRef, useState } from 'react'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import { loadLegacyRuntime } from '@/lib/legacyLoader'
import { useNotifications } from '@/features/notifications/NotificationsProvider'

type LegacyBridgeProps = {
  /** ID do container que o legado espera manipular. */
  containerId: string
  /** Função que chama o renderer legado correto (após scripts carregados). */
  render: (ctx: { role: string }) => void
  /**
   * Quando o renderer legado depende de um esqueleto DOM pré-existente
   * (ex.: careers/evaluations/matrix/reports), passamos um template mínimo.
   */
  template?: 'admin-careers' | 'admin-evaluations' | 'admin-matrix' | 'admin-reports'
}

const TEMPLATES: Record<NonNullable<LegacyBridgeProps['template']>, string> = {
  'admin-careers': `
    <div id="page-admin-careers" class="page-section">
      <div class="page-header career-trail-header">
        <div class="career-trail-title-block">
          <h2><i class="fas fa-sitemap"></i> Trilha de Carreira</h2>
          <span class="page-sub career-trail-sub">Cargos por nível e requisitos — Setor de Produção</span>
        </div>
        <button class="btn-primary career-trail-btn-new" type="button" onclick="openAddCareer()">
          <i class="fas fa-plus"></i> Novo Cargo
        </button>
      </div>
      <div class="career-trail-visual">
        <div id="career-trail-flow"></div>
      </div>
      <details class="career-trail-table-details">
        <summary class="career-trail-table-summary">Lista completa em tabela (opcional)</summary>
        <div class="career-trail-table-wrap table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cargo</th>
                <th>Tempo Mínimo (meses)</th>
                <th>Competências</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="careers-tbody"></tbody>
          </table>
        </div>
      </details>
    </div>
  `,
  'admin-evaluations': `
    <div id="page-admin-evaluations" class="page-section">
      <div class="page-header">
        <h2><i class="fas fa-clipboard-list"></i> Histórico de Avaliações</h2>
        <button class="btn-outline" onclick="printEvaluations()">
          <i class="fas fa-print"></i> Imprimir
        </button>
      </div>
      <div id="evaluations-list" class="evaluations-container"></div>
    </div>
  `,
  'admin-matrix': `
    <div id="page-admin-matrix" class="page-section">
      <div class="page-header">
        <h2><i class="fas fa-th"></i> Matriz de Polivalência</h2>
        <div class="matrix-filters">
          <select id="matrix-sector-filter" onchange="renderMatrix()">
            <option value="">Todos os Setores</option>
          </select>
        </div>
      </div>
      <div class="matrix-legend">
        <span class="leg-item"><span class="leg-dot red"></span> Não Treinado</span>
        <span class="leg-item"><span class="leg-dot yellow"></span> Em Treinamento</span>
        <span class="leg-item"><span class="leg-dot green"></span> Competente</span>
        <span class="leg-item"><span class="leg-dot star"></span> Referência</span>
      </div>
      <div class="matrix-wrapper">
        <div id="matrix-container"></div>
      </div>
    </div>
  `,
  'admin-reports': `
    <div id="page-admin-reports" class="page-section">
      <div class="page-header">
        <h2><i class="fas fa-chart-bar"></i> Relatórios</h2>
        <button class="btn-outline" onclick="window.print()">
          <i class="fas fa-print"></i> Imprimir Relatório
        </button>
      </div>
      <div class="reports-grid">
        <div class="chart-card">
          <h3><i class="fas fa-chart-pie"></i> Distribuição por Status</h3>
          <div style="height:240px; position:relative;">
            <canvas id="chart-pie-status"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <h3><i class="fas fa-chart-bar"></i> Avaliações por Resultado</h3>
          <div style="height:240px; position:relative;">
            <canvas id="chart-eval-result"></canvas>
          </div>
        </div>
      </div>
      <div class="report-table-card">
        <h3><i class="fas fa-list"></i> Resumo por Funcionário</h3>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Cargo Atual</th>
                <th>Cargo Desejado</th>
                <th>Tempo de Casa</th>
                <th>Última Avaliação</th>
                <th>Resultado</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="report-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `,
}

export function LegacyBridgePage({ containerId, render, template }: LegacyBridgeProps) {
  const { user } = useStaffAuth()
  const [ready, setReady] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)
  const { closePanel } = useNotifications()

  const role = user?.role ?? 'supervisor'

  const templateHtml = useMemo(() => (template ? TEMPLATES[template] : ''), [template])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      await loadLegacyRuntime()
      if (cancelled) return
      setReady(true)
      render({ role })
    })()

    return () => {
      cancelled = true

      try {
        cleanupRef.current?.()
      } finally {
        cleanupRef.current = null
        const el = document.getElementById(containerId)
        if (el) el.innerHTML = ''
        // fecha painéis flutuantes do legado (ex.: notificações) para evitar "sobras"
        closePanel()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId, role, render])

  return (
    <div>
      {/* evita duplicar layout legado; renderiza só conteúdo interno */}
      <div id={containerId} className="page-section">
        {template ? <div dangerouslySetInnerHTML={{ __html: templateHtml }} /> : null}
        {!template && !ready ? (
          <div style={{ padding: 16, color: 'var(--text-muted, #9CA3AF)', fontSize: 14 }}>Carregando…</div>
        ) : null}
      </div>
    </div>
  )
}

