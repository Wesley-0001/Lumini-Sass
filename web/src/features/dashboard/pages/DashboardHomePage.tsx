import { useMemo } from 'react'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import { usePermissions } from '@/app/providers/permissionsContext'
import { ALL_MODULES } from '@/lib/permissions'
import { staffRoleLabel } from '@/lib/roleUi'
import { buildDashboardKpis, buildReadyToEvaluateList, type ReadyToEvaluateItem } from '@/lib/dashboard/careerKpi'
import { useCareerDashboardData } from '@/features/dashboard/hooks/useCareerDashboardData'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import styles from '@/features/dashboard/pages/DashboardHomePage.module.css'

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

      {data.status === 'no_firebase' && (
        <div className="empty-state" role="status">
          <i className="fas fa-cloud" aria-hidden />
          <p>
            Conecte o Firebase (<code className={styles.code}>web/.env.local</code>) para exibir totais de funcionários e
            avaliações. Com o SDK ativo, os mesmos dados usados no legado passam a aparecer aqui.
          </p>
        </div>
      )}

      {data.status === 'error' && (
        <Card>
          <p className={styles.errorText}>
            <i className="fas fa-exclamation-triangle" aria-hidden /> {data.message}
          </p>
        </Card>
      )}

      {data.status === 'ready' && data.employees.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-users" aria-hidden />
          <p>
            Ainda não há colaboradores no cadastro de carreira. Quando houver registros na coleção{' '}
            <code className={styles.code}>employees</code>, os indicadores serão preenchidos automaticamente.
          </p>
        </div>
      )}

      {data.status === 'ready' && data.employees.length > 0 && (
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

      {data.status === 'ready' && data.employees.length > 0 && (
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
