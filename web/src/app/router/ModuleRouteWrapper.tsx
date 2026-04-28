import { Navigate, useParams } from 'react-router-dom'
import { RequirePermission } from '@/components/shared/RequirePermission'
import { ModulePlaceholderPage } from '@/features/system/ModulePlaceholderPage'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { PurchasesPage } from '@/features/purchases/pages/PurchasesPage'
import { isPermissionModule } from '@/lib/permissionModule'
import { LegacyBridgePage } from '@/features/system/LegacyBridgePage'

export function ModuleRouteWrapper() {
  const { moduleId } = useParams()

  if (!isPermissionModule(moduleId)) {
    return <Navigate to="/app/dashboard" replace />
  }

  // Mapeamento pragmático: cada rota React chama o renderer legado correspondente.
  const legacy = (() => {
    switch (moduleId) {
      case 'teams':
        return (
          <LegacyBridgePage
            containerId="page-admin-teams"
            render={({ role }) => {
              if (role === 'boss') return window._teamsRenderBoss?.()
              if (role === 'admin') return window._teamsRenderAdmin?.()
              if (role === 'manager') return window._teamsRenderManager?.()
              return window._teamsRenderSup?.()
            }}
          />
        )
      case 'comms':
        return (
          <LegacyBridgePage
            containerId="page-comms"
            render={() => window._commsRenderPage?.()}
          />
        )
      case 'rh':
        return (
          <LegacyBridgePage
            containerId="page-rh-dashboard"
            render={({ role }) => {
              const readOnly = role === 'boss'
              // usa o modo "In" para não depender do HTML legado completo
              return window._rhRenderDashboardIn?.('page-rh-dashboard', readOnly) ?? window._rhRenderDashboard?.()
            }}
          />
        )
      case 'turnover':
        return (
          <LegacyBridgePage
            containerId="page-rh-turnover"
            render={({ role }) => {
              const readOnly = role === 'boss'
              return window._rhRenderTurnoverIn?.('page-rh-turnover', readOnly) ?? window._rhRenderTurnover?.()
            }}
          />
        )
      case 'careers':
        return (
          <LegacyBridgePage
            containerId="legacy-careers"
            template="admin-careers"
            render={() => (window as any).renderCareers?.()}
          />
        )
      case 'evaluations':
        return (
          <LegacyBridgePage
            containerId="legacy-evaluations"
            template="admin-evaluations"
            render={() => (window as any).renderEvaluationsList?.()}
          />
        )
      case 'matrix':
        return (
          <LegacyBridgePage
            containerId="legacy-matrix"
            template="admin-matrix"
            render={() => (window as any).renderMatrix?.()}
          />
        )
      case 'reports':
        return (
          <LegacyBridgePage
            containerId="legacy-reports"
            template="admin-reports"
            render={() => (window as any).renderReports?.()}
          />
        )
      default:
        return null
    }
  })()

  return (
    <RequirePermission module={moduleId}>
      {moduleId === 'purchases' ? (
        <PurchasesPage />
      ) : moduleId === 'users' ? (
        <UsersPage />
      ) : (
        legacy ?? <ModulePlaceholderPage />
      )}
    </RequirePermission>
  )
}
