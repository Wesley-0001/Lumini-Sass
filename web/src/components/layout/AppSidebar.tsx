import { NavLink } from 'react-router-dom'
import type { StaffNavSectionDef } from '@/features/navigation/staffNavConfig'
import styles from '@/components/layout/AppSidebar.module.css'
import { Badge } from '@/components/ui/Badge'

const LOGO = '/images/logo-white.png'

export interface AppSidebarProps {
  sections: StaffNavSectionDef[]
  onNavigate?: () => void
  onLogout: () => void
}

export function AppSidebar({ sections, onNavigate, onLogout }: AppSidebarProps) {
  return (
    <div className={styles.sidebarInner}>
      <div className={styles.head}>
        <img src={LOGO} alt="" className={styles.logo} width={36} height={36} />
        <span className={styles.brand} translate="no">
          Lumini
        </span>
      </div>
      <nav className={styles.nav} aria-label="Principal">
        {sections.map((sec, idx) => (
          <div key={`${sec.title}-${idx}`}>
            {idx > 0 ? <div className={styles.sep} aria-hidden /> : null}
            <div className={sec.variant === 'sub' ? styles.sectionTitleSub : styles.sectionTitle}>{sec.title}</div>
            {sec.links.map((link) => (
              <NavLink
                key={`${link.pageId}-${link.to}`}
                to={link.to}
                end={link.to === '/app/dashboard'}
                onClick={() => onNavigate?.()}
                className={({ isActive }) =>
                  [styles.navLink, isActive ? styles.active : ''].filter(Boolean).join(' ')
                }
              >
                <i className={`fas ${link.icon}`} aria-hidden />
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className={styles.footer}>
        <button type="button" className={styles.footerBtn} title="Configurar notificações (em breve)">
          <i className="fas fa-bell" aria-hidden />
          <span className={styles.footerBtnLabel}>Notificações Ativas</span>
        </button>
        <button type="button" className={styles.footerBtn} title="Ajuda (em breve)">
          <i className="fas fa-question-circle" aria-hidden />
          <span className={styles.footerBtnLabel}>Ajuda &amp; Tutorial</span>
          <Badge kind="menu">NOVO</Badge>
        </button>
        <button type="button" className={`${styles.navLink} ${styles.logout}`} onClick={onLogout}>
          <i className="fas fa-sign-out-alt" aria-hidden />
          Sair
        </button>
      </div>
    </div>
  )
}
