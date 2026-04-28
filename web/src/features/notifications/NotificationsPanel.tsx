import { useMemo } from 'react'
import { useNotifications } from '@/features/notifications/NotificationsProvider'
import type { InAppNotification } from '@/features/notifications/types'

function iconForType(type: string): string {
  const t = String(type || '')
  if (t === 'comms') return '📢'
  if (t === 'promo') return '📈'
  return '🛒'
}

function fmtRelativeTime(ts: number): string {
  if (!ts) return ''
  const t = Number(ts)
  const now = Date.now()
  const diff = now - t
  if (diff < 0) return 'agora'
  const sec = Math.floor(diff / 1000)
  if (sec < 45) return 'agora'
  const min = Math.floor(sec / 60)
  if (min < 60) return min === 1 ? 'há 1 minuto' : `há ${min} minutos`
  const hr = Math.floor(min / 60)
  if (hr < 24) return hr === 1 ? 'há 1 hora' : `há ${hr} horas`
  const d = new Date(t)
  const today = new Date()
  const yest = new Date(today)
  yest.setDate(yest.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'ontem'
  const days = Math.floor(hr / 24)
  if (days < 7) {
    return (
      d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) +
      ' · ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    )
  }
  return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function NotificationsPanel() {
  const { recent, markRead, markAllRead, openNotification, panelOpen } = useNotifications()

  const hint = useMemo(() => {
    return 'Últimas 20 notificações · Não lidas primeiro'
  }, [])

  if (!panelOpen) return null

  return (
    <div
      id="nt-notif-panel"
      className={`nt-notif-panel ${panelOpen ? '' : 'hidden'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="nt-notif-head">
        <div className="nt-notif-head-text">
          <span className="nt-notif-head-title">Notificações</span>
          <span className="nt-notif-head-hint">{hint}</span>
        </div>
        <button type="button" className="nt-notif-markall" onClick={() => void markAllRead()}>
          Marcar todas como lidas
        </button>
      </div>

      <div id="nt-notif-list" className="nt-notif-list">
        {recent.length === 0 ? (
          <div className="nt-notif-empty">Nenhuma notificação no momento</div>
        ) : (
          recent.map((n: InAppNotification) => {
            const unread = !n.read
            return (
              <div
                key={n.id}
                className={`nt-notif-item ${unread ? 'nt-notif-unread' : 'nt-notif-read'}`}
                data-nt-id={n.id}
              >
                <div className="nt-notif-item-row">
                  <div
                    className="nt-notif-item-main"
                    role="link"
                    tabIndex={0}
                    aria-label="Abrir notificação"
                    onClick={() => void openNotification(n)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        void openNotification(n)
                      }
                    }}
                  >
                    <div className="nt-notif-item-title-row">
                      <span className="nt-notif-type-icon" aria-hidden="true">
                        {iconForType(n.type)}
                      </span>
                      <span className="nt-notif-item-title">{n.title}</span>
                    </div>
                    <div className="nt-notif-item-msg">{n.message}</div>
                    <div className="nt-notif-item-time">{fmtRelativeTime(n.createdAt)}</div>
                  </div>
                  {unread ? (
                    <button type="button" className="nt-notif-readbtn" onClick={() => void markRead(n.id)}>
                      Marcar como lido
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

