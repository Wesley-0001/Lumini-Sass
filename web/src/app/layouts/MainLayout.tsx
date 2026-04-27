import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { usePermissions } from '@/app/providers/permissionsContext'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'
import shell from '@/components/layout/AppShell.module.css'
import { staffNavSectionsForRole } from '@/features/navigation/staffNavConfig'

const DARK_KEY = 'lum_staff_shell_dark'

export function MainLayout() {
  const { user, logout } = useStaffAuth()
  const { hasPermission, canSeePage } = usePermissions()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem(DARK_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(DARK_KEY, darkMode ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [darkMode])

  const sections = useMemo(() => {
    if (!user) return []
    return staffNavSectionsForRole(user.role, hasPermission, canSeePage)
  }, [user, hasPermission, canSeePage])

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), [])
  const toggleDark = useCallback(() => setDarkMode((v) => !v), [])

  if (!user) return null

  return (
    <div
      className={`${shell.root} lumAppShell`}
      data-legacy-dark={darkMode ? 'true' : undefined}
    >
      <AppHeader
        user={user}
        onLogout={logout}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        darkMode={darkMode}
        onToggleDarkMode={toggleDark}
      />
      <div
        className={`${shell.overlay} ${sidebarOpen ? shell.overlayActive : ''}`}
        aria-hidden={!sidebarOpen}
        onClick={closeSidebar}
      />
      <aside className={`${shell.sidebar} ${sidebarOpen ? shell.sidebarOpen : ''}`}>
        <AppSidebar sections={sections} onNavigate={closeSidebar} onLogout={logout} />
      </aside>
      <div className={shell.main}>
        <div className={shell.pageInner}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
