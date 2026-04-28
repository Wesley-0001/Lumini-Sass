import { useEffect, useMemo, useRef, useState } from 'react'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import { usePermissions } from '@/app/providers/permissionsContext'
import { ALL_MODULES } from '@/lib/permissions'
import { staffRoleLabel } from '@/lib/roleUi'
import { buildDashboardKpis, buildReadyToEvaluateList, type ReadyToEvaluateItem } from '@/lib/dashboard/careerKpi'
import { useCareerDashboardData } from '@/features/dashboard/hooks/useCareerDashboardData'
import { loadLegacyRuntime } from '@/lib/legacyLoader'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import { AdminDashboardLegacy } from '@/features/dashboard/components/AdminDashboardLegacy'
import styles from '@/features/dashboard/pages/DashboardHomePage.module.css'

type LegacyDashboardRole = 'admin' | 'boss' | 'supervisor' | 'manager' | 'rh'

const DASHBOARD_TEMPLATES: Record<Exclude<LegacyDashboardRole, 'rh'>, string> = {
  admin: `
    <div class="page-section">
      <div class="cards-grid">
        <div class="stat-card blue"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-value" id="stat-total">0</span><span class="stat-label">Total de Funcionários</span></div></div>
        <div class="stat-card orange"><div class="stat-icon"><i class="fas fa-clock"></i></div><div class="stat-info"><span class="stat-value" id="stat-apt">0</span><span class="stat-label">Aptos para Avaliação</span></div></div>
        <div class="stat-card yellow"><div class="stat-icon"><i class="fas fa-hourglass-half"></i></div><div class="stat-info"><span class="stat-value" id="stat-pending">0</span><span class="stat-label">Avaliações Pendentes</span></div></div>
        <div class="stat-card green"><div class="stat-icon"><i class="fas fa-trophy"></i></div><div class="stat-info"><span class="stat-value" id="stat-promoted">0</span><span class="stat-label">Promoções Aprovadas</span></div></div>
      </div>

      <div class="dashboard-row dashboard-row-charts">
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <h3><i class="fas fa-id-badge"></i> <span id="chart-role-title">Funcionários por Cargo</span></h3>
              <span class="chart-sub">Clique em uma equipe para filtrar <span id="chart-role-filter-tag"></span></span>
            </div>
          </div>
          <div style="height:280px; position:relative;">
            <canvas id="chart-by-role"></canvas>
          </div>
        </div>
        <div class="chart-card chart-card-team">
          <div class="chart-card-header">
            <div>
              <h3><i class="fas fa-layer-group"></i> Por Equipe</h3>
              <span class="chart-sub">Funcionários por supervisor</span>
            </div>
          </div>
          <div class="team-chart-wrap">
            <div style="height:180px; position:relative;">
              <canvas id="chart-by-team"></canvas>
            </div>
            <div id="chart-team-legend" class="chart-team-legend"></div>
          </div>
        </div>
      </div>

      <div class="dashboard-row">
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <h3><i class="fas fa-chart-bar"></i> Funcionários por Status</h3>
              <span class="chart-sub">Situação atual no plano de carreira</span>
            </div>
          </div>
          <div style="height:200px; position:relative;">
            <canvas id="chart-status"></canvas>
          </div>
        </div>
        <div class="recent-card">
          <h3><i class="fas fa-bell"></i> Aguardando Avaliação</h3>
          <div id="recent-eligible-list" class="recent-list"></div>
        </div>
      </div>

      <div class="promo-history-section">
        <div class="promo-history-header">
          <div class="promo-history-title">
            <i class="fas fa-rocket"></i>
            <div>
              <h3>Histórico de Promoções</h3>
              <span>Jornada dos funcionários a partir do cargo de Ajudante de Produção</span>
            </div>
          </div>
          <div class="promo-kpis" id="promo-kpis"></div>
        </div>
        <div class="promo-charts-row">
          <div class="promo-chart-box">
            <h4><i class="fas fa-chart-bar"></i> Para onde foram os Ajudantes?</h4>
            <p class="promo-chart-sub">Cargos de destino dos promovidos</p>
            <div id="promo-dest-chart" class="promo-dest-chart"></div>
          </div>
          <div class="promo-chart-box">
            <h4><i class="fas fa-history"></i> Linha do Tempo das Promoções</h4>
            <p class="promo-chart-sub">Últimas promoções registradas</p>
            <div id="promo-timeline" class="promo-timeline-list"></div>
          </div>
        </div>
        <div class="promo-table-box">
          <div class="promo-table-header">
            <h4><i class="fas fa-list-alt"></i> Detalhamento — Todos os Promovidos</h4>
            <span id="promo-table-count" class="promo-count-badge">0 registros</span>
          </div>
          <div id="promo-detail-table"></div>
        </div>
      </div>
    </div>
  `,
  boss: `
    <div class="page-section">
      <div id="boss-urgent-alert" class="alert-banner urgent hidden">
        <i class="fas fa-exclamation-circle"></i>
        <span><strong><span id="boss-urgent-count">0</span> promoção(ões)</strong> aguardando sua aprovação final!</span>
        <button class="alert-action-btn" onclick="navigateTo('boss-promo-approvals')">Ver Agora</button>
      </div>
      <div class="cards-grid">
        <div class="stat-card blue"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-value" id="boss-kpi-total">0</span><span class="stat-label">Colaboradores</span></div></div>
        <div class="stat-card orange"><div class="stat-icon"><i class="fas fa-hourglass-half"></i></div><div class="stat-info"><span class="stat-value" id="boss-kpi-progress">0</span><span class="stat-label">Em Promoção</span></div></div>
        <div class="stat-card yellow"><div class="stat-icon"><i class="fas fa-crown"></i></div><div class="stat-info"><span class="stat-value" id="boss-kpi-await">0</span><span class="stat-label">Aguardam Decisão</span></div></div>
        <div class="stat-card green"><div class="stat-icon"><i class="fas fa-trophy"></i></div><div class="stat-info"><span class="stat-value" id="boss-kpi-promoted">0</span><span class="stat-label">Promovidos</span></div></div>
      </div>
      <div class="cards-grid" style="margin-top:12px">
        <div class="stat-card purple"><div class="stat-icon"><i class="fas fa-clipboard-list"></i></div><div class="stat-info"><span class="stat-value" id="boss-kpi-evals">0</span><span class="stat-label">Avaliações Feitas</span></div></div>
        <div class="stat-card teal"><div class="stat-icon"><i class="fas fa-clock"></i></div><div class="stat-info"><span class="stat-value" id="boss-kpi-apt">0</span><span class="stat-label">Aptos p/ Avaliação</span></div></div>
      </div>
      <div class="dashboard-row dashboard-row-charts">
        <div class="chart-card">
          <h3><i class="fas fa-layer-group"></i> Por Equipe</h3>
          <div style="height:220px; position:relative;">
            <canvas id="boss-chart-team"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <h3><i class="fas fa-chart-pie"></i> Por Status</h3>
          <div style="height:220px; position:relative;">
            <canvas id="boss-chart-status"></canvas>
          </div>
        </div>
      </div>
      <div style="margin-top:20px">
        <button class="btn-primary" onclick="navigateTo('boss-promo-approvals')" style="width:100%;padding:16px;font-size:16px">
          <i class="fas fa-trophy"></i> Ver Promoções Aguardando Aprovação Final
          <span id="boss-kpi-await-btn"></span>
        </button>
      </div>
    </div>
  `,
  supervisor: `
    <div class="page-section">
      <div class="page-header">
        <h2><i class="fas fa-home"></i> Meu Painel</h2>
        <span class="page-sub" id="supervisor-greeting">Olá!</span>
      </div>
      <div id="supervisor-alert" class="alert-banner hidden">
        <i class="fas fa-bell"></i>
        <span id="supervisor-alert-text"></span>
      </div>
      <div class="cards-grid-2">
        <div class="stat-card blue"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-value" id="sup-stat-total">0</span><span class="stat-label">Minha Equipe</span></div></div>
        <div class="stat-card orange"><div class="stat-icon"><i class="fas fa-clipboard-check"></i></div><div class="stat-info"><span class="stat-value" id="sup-stat-pending">0</span><span class="stat-label">Aguardam Avaliação</span></div></div>
      </div>
      <h3 class="section-title"><i class="fas fa-user-clock"></i> Funcionários Aptos para Avaliação</h3>
      <div id="sup-eligible-list" class="employee-cards-list"></div>
      <h3 class="section-title mt-20"><i class="fas fa-users"></i> Toda a Equipe</h3>
      <div id="sup-all-list" class="employee-cards-list"></div>
      <div class="promo-shortcut-banner" id="promo-shortcut-banner-container" onclick="navigateTo('supervisor-promo-history')" style="margin-top:20px;display:none">
        <div class="promo-shortcut-content">
          <i class="fas fa-rocket"></i>
          <span><strong><span id="promo-pipeline-count">0</span> promoção(ões)</strong> em andamento — clique para ver o histórico</span>
        </div>
        <i class="fas fa-chevron-right"></i>
      </div>
    </div>
  `,
  manager: `
    <div class="page-section">
      <div class="page-header">
        <h2><i class="fas fa-home"></i> Meu Painel</h2>
        <span class="page-sub" id="supervisor-greeting">Olá!</span>
      </div>
      <div id="supervisor-alert" class="alert-banner hidden">
        <i class="fas fa-bell"></i>
        <span id="supervisor-alert-text"></span>
      </div>
      <div class="cards-grid-2">
        <div class="stat-card blue"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-value" id="sup-stat-total">0</span><span class="stat-label">Minha Equipe</span></div></div>
        <div class="stat-card orange"><div class="stat-icon"><i class="fas fa-clipboard-check"></i></div><div class="stat-info"><span class="stat-value" id="sup-stat-pending">0</span><span class="stat-label">Aguardam Avaliação</span></div></div>
      </div>
      <h3 class="section-title"><i class="fas fa-user-clock"></i> Funcionários Aptos para Avaliação</h3>
      <div id="sup-eligible-list" class="employee-cards-list"></div>
      <h3 class="section-title mt-20"><i class="fas fa-users"></i> Toda a Equipe</h3>
      <div id="sup-all-list" class="employee-cards-list"></div>
      <div class="promo-shortcut-banner" id="promo-shortcut-banner-container" onclick="navigateTo('supervisor-promo-history')" style="margin-top:20px;display:none">
        <div class="promo-shortcut-content">
          <i class="fas fa-rocket"></i>
          <span><strong><span id="promo-pipeline-count">0</span> promoção(ões)</strong> em andamento — clique para ver o histórico</span>
        </div>
        <i class="fas fa-chevron-right"></i>
      </div>
    </div>
  `,
}

function LegacyDashboardBridge({ role }: { role: LegacyDashboardRole }) {
  const containerId = useMemo(() => `legacy-dashboard-${role}`, [role])
  const [active, setActive] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  const templateHtml = useMemo(() => {
    if (role === 'rh') return ''
    return DASHBOARD_TEMPLATES[role]
  }, [role])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      await loadLegacyRuntime()
      if (cancelled) return

      const el = document.getElementById(containerId)
      if (!el) return

      // Garante o esqueleto DOM esperado antes de chamar o renderer legado.
      if (role !== 'rh') {
        el.innerHTML = templateHtml
      }

      const ok =
        (role === 'admin' && typeof window.renderAdminDashboard === 'function') ||
        (role === 'boss' && typeof window.renderBossDashboard === 'function') ||
        ((role === 'supervisor' || role === 'manager') && typeof window.renderSupervisorHome === 'function') ||
        (role === 'rh' && typeof window.renderRHDashboard === 'function')

      if (!ok) {
        setActive(false)
        return
      }

      setActive(true)

      if (role === 'admin') window.renderAdminDashboard?.()
      else if (role === 'boss') window.renderBossDashboard?.()
      else if (role === 'supervisor' || role === 'manager') window.renderSupervisorHome?.()
      else if (role === 'rh') window.renderRHDashboard?.(containerId)
    })()

    return () => {
      cancelled = true

      try {
        cleanupRef.current?.()
      } finally {
        cleanupRef.current = null
        const el = document.getElementById(containerId)
        if (el) el.innerHTML = ''
        window._ntClosePanel?.()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId, role, templateHtml])

  if (!active) return null

  return (
    <div id={containerId} className="page-section">
      {/* conteúdo legado é injetado via templateHtml + renderers window.* */}
    </div>
  )
}

export function DashboardHomePage() {
  const { user } = useStaffAuth()
  const { canAccessModule } = usePermissions()
  const data = useCareerDashboardData()

  const allowed = ALL_MODULES.filter((m) => canAccessModule(m.key))

  const kpis = useMemo(() => {
    if (!user || data.status !== 'ready') return []
    return buildDashboardKpis(user.role, user.email, data.employees, data.evaluationsCount)
  }, [user, data])

  const readyToEvaluate = useMemo((): { items: ReadyToEvaluateItem[]; total: number } => {
    if (!user || data.status !== 'ready') return { items: [], total: 0 }
    return buildReadyToEvaluateList(user.role, user.email, data.employees)
  }, [user, data])

  if (!user) return null

  const ready =
    data.status === 'ready'
      ? data
      : null

  const showAdminLegacy = user.role === 'admin' && ready !== null

  const legacyRole = ((): LegacyDashboardRole | null => {
    if (!ready) return null
    if (user.role === 'admin') return 'admin'
    if (user.role === 'boss') return 'boss'
    if (user.role === 'supervisor') return 'supervisor'
    if (user.role === 'manager') return 'manager'
    if (user.role === 'rh') return 'rh'
    return null
  })()

  const shouldUseLegacyDashboard = legacyRole !== null

  // Quando o legado estiver ativo e pronto, ele passa a ser o principal.
  if (shouldUseLegacyDashboard) {
    return (
      <section>
        <LegacyDashboardBridge role={legacyRole} />
      </section>
    )
  }

  return (
    <section>
      <PageHeader
        icon="fa-tachometer-alt"
        title="Dashboard"
        subtitle="Indicadores alinhados ao painel do legado após o login, com os mesmos cortes por perfil."
      />

      <p className={styles.lead}>
        Olá, <strong>{user.name}</strong> — <strong>{staffRoleLabel(user.role)}</strong>.
      </p>

      {data.status === 'loading' && (
        <p className={styles.mutedLine} role="status">
          <i className="fas fa-spinner fa-pulse" aria-hidden /> Carregando indicadores…
        </p>
      )}

      {data.status === 'error' && (
        <Card>
          <p className={styles.errorText}>
            <i className="fas fa-exclamation-triangle" aria-hidden /> {data.message}
          </p>
        </Card>
      )}

      {showAdminLegacy && ready ? (
        <AdminDashboardLegacy employees={ready.employees} evaluations={ready.evaluations} />
      ) : null}

      {!showAdminLegacy && ready && ready.employees.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-users" aria-hidden />
          <p>
            Ainda não há colaboradores no cadastro de carreira. Quando houver registros na coleção{' '}
            <code className={styles.code}>employees</code>, os indicadores serão preenchidos automaticamente.
          </p>
        </div>
      )}

      {!showAdminLegacy && ready && ready.employees.length > 0 && (
        <div className={`cards-grid ${styles.kpiAnim}`}>
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
      )}

      {!showAdminLegacy && ready && ready.employees.length > 0 && (
        <Card className={styles.spaced}>
          <h3 className="section-title">
            <i className="fas fa-clipboard-check" aria-hidden />
            Prontos para avaliar
          </h3>
          {readyToEvaluate.total === 0 ? (
            <div className="empty-state" role="status">
              <i className="fas fa-check-circle" aria-hidden />
              <p>Nenhum colaborador aguardando avaliação.</p>
            </div>
          ) : (
            <>
              <ul className={styles.readyList} aria-label="Colaboradores prontos para avaliação">
                {readyToEvaluate.items.map((row) => (
                  <li key={row.id} className={styles.readyRow}>
                    <div className={styles.readyAvatar} aria-hidden>
                      {row.initials}
                    </div>
                    <div className={styles.readyInfo}>
                      <div className={styles.readyName}>{row.name}</div>
                      <div className={styles.readyMeta}>
                        <span className={styles.readyCargo}>{row.roleLine}</span>
                        <span className={styles.readyDot} aria-hidden>
                          ·
                        </span>
                        <span className={styles.readyTeam}>{row.teamOrSetor}</span>
                      </div>
                    </div>
                    <span className={styles.readyBadge}>{row.tenureLabel}</span>
                  </li>
                ))}
              </ul>
              {readyToEvaluate.total > readyToEvaluate.items.length ? (
                <p className={styles.readyMore}>
                  Exibindo {readyToEvaluate.items.length} de {readyToEvaluate.total}.
                </p>
              ) : null}
            </>
          )}
        </Card>
      )}

      <Card className={styles.spaced}>
        <h3 className="section-title">
          <i className="fas fa-th-large" aria-hidden />
          Módulos liberados para você
        </h3>
        {allowed.length === 0 ? (
          <p className={styles.pMuted}>Nenhum módulo além do painel (verificar role e overrides em localStorage).</p>
        ) : (
          <ul className={styles.list}>
            {allowed.map((m) => (
              <li key={m.key}>
                <strong>{m.label}</strong> — <code className={styles.code}>/app/m/{m.key}</code>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  )
}
