import { Navigate, useParams } from 'react-router-dom'
import { RequirePermission } from '@/components/shared/RequirePermission'
import { ModulePlaceholderPage } from '@/features/system/ModulePlaceholderPage'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { PurchasesPage } from '@/features/purchases/pages/PurchasesPage'
import { TeamsPage } from '@/features/teams/pages/TeamsPage'
import { CommsPage } from '@/features/comms/pages/CommsPage'
import { RhDashboardPage } from '@/features/rh/pages/RhDashboardPage'
import { TurnoverPage } from '@/features/rh/pages/TurnoverPage'
import { CareersPage } from '@/features/careers/pages/CareersPage'
import { EvaluationsPage } from '@/features/evaluations/pages/EvaluationsPage'
import { MatrixPage } from '@/features/matrix/pages/MatrixPage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
import { isPermissionModule } from '@/lib/permissionModule'

export function ModuleRouteWrapper() {
  const { moduleId } = useParams()

  if (!isPermissionModule(moduleId)) {
    return <Navigate to="/app/dashboard" replace />
  }

  function resolveModule() {
    switch (moduleId) {
      case 'teams':       return <TeamsPage />
      case 'comms':       return <CommsPage />
      case 'purchases':   return <PurchasesPage />
      case 'users':       return <UsersPage />
      case 'rh':          return <RhDashboardPage />
      case 'turnover':    return <TurnoverPage />
      case 'careers':     return <CareersPage />
      case 'evaluations': return <EvaluationsPage />
      case 'matrix':      return <MatrixPage />
      case 'reports':     return <ReportsPage />
      default:            return <ModulePlaceholderPage />
    }
  }

  return (
    <RequirePermission module={moduleId}>
      {resolveModule()}
    </RequirePermission>
  )
}
