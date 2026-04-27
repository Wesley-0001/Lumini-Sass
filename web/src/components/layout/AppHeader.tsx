import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ALL_MODULES } from '@/lib/permissions'
import { staffRoleLabel } from '@/lib/roleUi'
import type { StaffSessionUser } from '@/types/user'
import styles from '@/components/layout/AppHeader.module.css'

const LOGO = '/images/logo-white.png'

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean)
  if (p.length === 0) return '—'
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase()
  return (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

function crumbsForPath(pathname: string): string[] {
  if (pathname === '/app' || pathname === '/app/') return ['Início']
  if (pathname.startsWith('/app/dashboard')) return ['Início', 'Dashboard']
  const mod = pathname.match(/^\/app\/m\/([^/]+)/)?.[1]
  if (mod) {
    const def = ALL_MODULES.find((m) => m.key === mod)
    return ['Área', def?.label ?? mod]
  }
  return ['Lumini']
}

export interface AppHeaderProps {
  user: StaffSessionUser
  onLogout: () => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function AppHeader({
  user,
  onLogout,
  sidebarOpen,
  onToggleSidebar,
  darkMode,
  onToggleDarkMode,
}: AppHeaderProps) {
  const location = useLocation()
  const crumbs = useMemo(() => crumbsForPath(location.pathname), [location.pathname])
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.menuToggle}
        aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={sidebarOpen}
        onClick={onToggleSidebar}
      >
        <i className="fas fa-bars" aria-hidden />
      </button>
      <div className={styles.brandRow}>
        <img src={LOGO} alt="" className={styles.logo} width={36} height={36} />
        <span className={styles.brandName} translate="no">
          Lumini
        </span>
        <nav className={styles.breadcrumb} aria-label="Migalhas">
          {crumbs.map((c, i) => (
            <span key={`${c}-${i}`} style={{ display: 'contents' }}>
              {i > 0 ? <span className={styles.sep}>/</span> : null}
              <span className={styles.crumb}>{c}</span>
            </span>
          ))}
        </nav>
      </div>
      <div className={styles.right}>
        <div className={styles.darkWrap} title="Alternar modo claro/escuro">
          <label className={styles.darkToggle}>
            <input type="checkbox" checked={darkMode} onChange={() => onToggleDarkMode()} />
            <span className={styles.thumb} aria-hidden>
              {darkMode ? '🌙' : '☀️'}
            </span>
          </label>
        </div>
        <button type="button" className={styles.notifBtn} title="Notificações">
          <i className="fas fa-bell" aria-hidden />
          <span className={styles.badgeCount}>0</span>
        </button>
        <div className={styles.rel} ref={wrapRef}>
          <button
            type="button"
            className={styles.avatar}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            {initials(user.name)}
          </button>
          {menuOpen ? (
            <div className={styles.userMenu} role="menu">
              <div className={styles.userMenuName}>{user.name}</div>
              <div className={styles.userMenuRole}>{staffRoleLabel(user.role)}</div>
              <hr className={styles.hr} />
              <button type="button" className={styles.menuItem} role="menuitem" onClick={() => setMenuOpen(false)}>
                <i className="fas fa-question-circle" aria-hidden />
                Tutorial de Ajuda
              </button>
              <button
                type="button"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onLogout()
                }}
              >
                <i className="fas fa-sign-out-alt" aria-hidden />
                Sair
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
