import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '@/app/layouts/MainLayout'
import { ModuleRouteWrapper } from '@/app/router/ModuleRouteWrapper'
import { LegacyPlaceholderPage } from '@/features/system/LegacyPlaceholderPage'
import { DashboardHomePage } from '@/features/dashboard/pages/DashboardHomePage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { RhEmployeesPage } from '@/features/rh/pages/RhEmployeesPage'
import { RequirePermission } from '@/components/shared/RequirePermission'
import { StaffLoginPage } from '@/features/auth/pages/StaffLoginPage'
import { LandingPage } from '@/features/landing/pages/LandingPage'
import { PortalHomeStubPage } from '@/features/portal/pages/PortalHomeStubPage'
import { PortalLoginStubPage } from '@/features/portal/pages/PortalLoginStubPage'
import { GuestStaffRoute } from '@/components/shared/GuestStaffRoute'
import { ProtectedStaffRoute } from '@/components/shared/ProtectedStaffRoute'
import { useStaffAuth } from '@/app/providers/staffAuthContext'

function DashboardRoute() {
  const { user } = useStaffAuth()

  // Incremental: apenas admin migra para React nesta fase.
  // Demais perfis continuam com o DashboardHomePage (com legado + fallback).
  if (user?.role === 'admin') return <DashboardPage />
  return <DashboardHomePage />
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/portal/login" element={<PortalLoginStubPage />} />
      <Route path="/portal" element={<PortalHomeStubPage />} />

      <Route
        path="/app/login"
        element={
          <GuestStaffRoute>
            <StaffLoginPage />
          </GuestStaffRoute>
        }
      />

      <Route
        path="/app"
        element={
          <ProtectedStaffRoute>
            <MainLayout />
          </ProtectedStaffRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRoute />} />
        <Route
          path="rh/employees"
          element={
            <RequirePermission module="rh">
              <RhEmployeesPage />
            </RequirePermission>
          }
        />
        <Route path="p/:pageId" element={<LegacyPlaceholderPage />} />
        <Route path="m/:moduleId" element={<ModuleRouteWrapper />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
