import { useParams } from 'react-router-dom'
import { ALL_MODULES } from '@/lib/permissions'
import { isPermissionModule } from '@/lib/permissionModule'
import type { PermissionModule } from '@/types/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import styles from '@/features/system/ModulePlaceholderPage.module.css'

const LEGACY_HINTS: Partial<Record<PermissionModule, string>> = {
  rh: 'js/rh-module.js, js/rh-holerites-module.js, js/rh-data.js',
  teams: 'js/teams-module.js',
  careers: 'Trilhas em js/data.js + telas admin-careers no index.html',
  evaluations: 'js/app.js (renderers de avaliação)',
  purchases: 'Migrado para React (sem purchases-module.js no runtime React)',
  users: 'js/users-module.js',
  comms: 'js/comms-module.js',
  matrix: 'js/app.js (matriz)',
  reports: 'js/app.js (relatórios)',
  turnover: 'js/rh-module.js (turnover)',
}

export function ModulePlaceholderPage() {
  const { moduleId } = useParams()

  if (!isPermissionModule(moduleId)) {
    return <p className={styles.muted}>Módulo inválido.</p>
  }

  const mod = ALL_MODULES.find((m) => m.key === moduleId)

  return (
    <section>
      <PageHeader
        icon={mod?.icon}
        title={mod?.label ?? moduleId}
        subtitle="Área reservada para migração incremental do legado. Nenhuma regra de negócio foi reescrita aqui ainda."
      />

      <Card>
        <h3 className="section-title">
          <i className="fas fa-code-branch" aria-hidden />
          Status da migração
        </h3>
        <p className={styles.lead}>
          Use esta casca para plugar dados e fluxos; mantenha regras de negócio em hooks/serviços separados da UI.
        </p>
        {LEGACY_HINTS[moduleId] ? (
          <p className={styles.hint}>
            <span className={styles.hintLabel}>Legado:</span> {LEGACY_HINTS[moduleId]}
          </p>
        ) : null}
      </Card>
    </section>
  )
}
