import styles from '@/components/layout/AppHeader.module.css'
import { useNotifications } from '@/features/notifications/NotificationsProvider'
import { NotificationsPanel } from '@/features/notifications/NotificationsPanel'

export function NotificationBell() {
  const { unreadCount, togglePanel } = useNotifications()

  return (
    <div className="nt-notif-wrap" onClick={(e) => e.stopPropagation()}>
      <button type="button" className={styles.notifBtn} title="Notificações" onClick={() => togglePanel()}>
        <i className="fas fa-bell" aria-hidden />
        <span className={styles.badgeCount} style={{ display: unreadCount > 0 ? 'flex' : 'none' }}>
          {unreadCount > 99 ? '99+' : String(unreadCount)}
        </span>
      </button>
      <NotificationsPanel />
    </div>
  )
}

