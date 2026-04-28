import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import { tryGetFirestoreDb } from '@/services/firebase/app'
import {
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
  subscribeInAppNotifications,
} from '@/features/notifications/notificationsApi'
import type { InAppNotification } from '@/features/notifications/types'

const PANEL_LIMIT = 20

function sortForDisplay(arr: InAppNotification[]): InAppNotification[] {
  return arr
    .slice()
    .sort((a, b) => {
      const ua = a.read ? 0 : 1
      const ub = b.read ? 0 : 1
      if (ua !== ub) return ub - ua
      return Number(b.createdAt || 0) - Number(a.createdAt || 0)
    })
}

function normEmail(v: string): string {
  return String(v || '')
    .trim()
    .toLowerCase()
}

export interface NotificationsContextValue {
  items: InAppNotification[]
  recent: InAppNotification[]
  unreadCount: number
  panelOpen: boolean
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  openNotification: (n: InAppNotification) => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useStaffAuth()
  const nav = useNavigate()
  const { pushToast } = useToast()

  const [items, setItems] = useState<InAppNotification[]>([])
  const [panelOpen, setPanelOpen] = useState(false)

  const email = normEmail(user?.email || '')
  const db = useMemo(() => tryGetFirestoreDb(), [])
  const unsubRef = useRef<null | (() => void)>(null)

  useEffect(() => {
    if (unsubRef.current) {
      try {
        unsubRef.current()
      } finally {
        unsubRef.current = null
      }
    }

    if (!db || !email) {
      setItems([])
      return
    }

    unsubRef.current = subscribeInAppNotifications({
      db,
      userEmail: email,
      onData: (next) => setItems(next),
      onError: () => {
        // evita spam de toast; manter silencioso (legado só fazia console.warn)
      },
    })

    return () => {
      if (unsubRef.current) {
        try {
          unsubRef.current()
        } finally {
          unsubRef.current = null
        }
      }
    }
  }, [db, email])

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items])
  const recent = useMemo(() => sortForDisplay(items).slice(0, PANEL_LIMIT), [items])

  const openPanel = useCallback(() => setPanelOpen(true), [])
  const closePanel = useCallback(() => setPanelOpen(false), [])
  const togglePanel = useCallback(() => setPanelOpen((v) => !v), [])

  useEffect(() => {
    if (!panelOpen) return
    const close = () => setPanelOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [panelOpen])

  const markRead = useCallback(
    async (id: string) => {
      if (!db) return
      if (!id) return
      try {
        await markInAppNotificationRead({ db, id })
      } catch {
        /* ignore */
      }
    },
    [db],
  )

  const markAllRead = useCallback(async () => {
    if (!db) return
    try {
      await markAllInAppNotificationsRead({ db, items })
      pushToast('Todas as notificações foram marcadas como lidas.', 'success')
    } catch {
      /* ignore */
    }
  }, [db, items, pushToast])

  const openNotification = useCallback(
    async (n: InAppNotification) => {
      if (!n) return
      if (!n.read) {
        await markRead(n.id)
      }

      if (n.link) {
        // mantém shape legado: link = 'comms' etc. Rotas do staff usam '/app/m/:key'
        const to = `/app/m/${String(n.link)}`
        nav(to)
      }

      if (n.type === 'comms' && n.meta?.commId) {
        const commId = String(n.meta.commId)
        window.setTimeout(() => {
          try {
            window.dispatchEvent(new CustomEvent('nt:comms:open', { detail: { commId } }))
          } catch {
            // ignore
          }
        }, 350)
      }

      closePanel()
    },
    [closePanel, markRead, nav],
  )

  const value = useMemo<NotificationsContextValue>(
    () => ({
      items,
      recent,
      unreadCount,
      panelOpen,
      openPanel,
      closePanel,
      togglePanel,
      markRead,
      markAllRead,
      openNotification,
    }),
    [items, recent, unreadCount, panelOpen, openPanel, closePanel, togglePanel, markRead, markAllRead, openNotification],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications(): NotificationsContextValue {
  const v = useContext(NotificationsContext)
  if (!v) throw new Error('useNotifications deve ser usado dentro de NotificationsProvider')
  return v
}

