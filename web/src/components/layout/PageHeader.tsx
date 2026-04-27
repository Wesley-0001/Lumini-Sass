import type { ReactNode } from 'react'
import styles from '@/components/layout/PageHeader.module.css'

export interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Ícone Font Awesome (sem `fas`). */
  icon?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <header className={styles.wrap}>
      <div className={styles.text}>
        <h2 className={styles.title}>
          {icon ? <i className={`fas ${icon} ${styles.titleIcon}`} aria-hidden /> : null}
          {title}
        </h2>
        {subtitle ? <span className={styles.sub}>{subtitle}</span> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  )
}
