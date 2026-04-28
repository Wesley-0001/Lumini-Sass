import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'
import { FirestoreCollections } from '@/types/firestore'
import type { InAppNotification, InAppNotificationInput } from '@/features/notifications/types'

function normEmail(v: string): string {
  return String(v || '')
    .trim()
    .toLowerCase()
}

function makeId(): string {
  return `ntn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function subscribeInAppNotifications(opts: {
  db: Firestore
  userEmail: string
  onData: (items: InAppNotification[]) => void
  onError?: (message: string) => void
}): Unsubscribe {
  const em = normEmail(opts.userEmail)
  const q = query(collection(opts.db, FirestoreCollections.inAppNotifications), where('userEmail', '==', em))
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ ...(d.data() as any), id: d.id })) as InAppNotification[]
      opts.onData(items)
    },
    (err) => {
      opts.onError?.(err?.message ?? 'Erro ao assinar notificações.')
    },
  )
}

export async function addInAppNotification(opts: { db: Firestore; notification: InAppNotificationInput }): Promise<string> {
  const id = opts.notification.id || makeId()
  const clean = JSON.parse(
    JSON.stringify({
      ...opts.notification,
      id,
      userEmail: normEmail(opts.notification.userEmail),
      read: !!opts.notification.read,
      createdAt: opts.notification.createdAt || Date.now(),
    }),
  )
  await setDoc(doc(opts.db, FirestoreCollections.inAppNotifications, id), clean)
  return id
}

export async function batchAddInAppNotifications(opts: {
  db: Firestore
  notifications: InAppNotificationInput[]
}): Promise<void> {
  const list = opts.notifications.filter(Boolean)
  if (list.length === 0) return

  const chunk = 450
  for (let i = 0; i < list.length; i += chunk) {
    const batch = writeBatch(opts.db)
    list.slice(i, i + chunk).forEach((raw) => {
      const id = raw.id || makeId()
      const clean = JSON.parse(
        JSON.stringify({
          ...raw,
          id,
          userEmail: normEmail(raw.userEmail),
          read: !!raw.read,
          createdAt: raw.createdAt || Date.now(),
        }),
      )
      batch.set(doc(opts.db, FirestoreCollections.inAppNotifications, id), clean)
    })
    await batch.commit()
  }
}

export async function markInAppNotificationRead(opts: { db: Firestore; id: string }): Promise<void> {
  if (!opts.id) return
  await updateDoc(doc(opts.db, FirestoreCollections.inAppNotifications, opts.id), { read: true })
}

export async function markAllInAppNotificationsRead(opts: { db: Firestore; items: InAppNotification[] }): Promise<void> {
  const unread = opts.items.filter((n) => !n.read && n.id)
  for (let i = 0; i < unread.length; i += 450) {
    const batch = writeBatch(opts.db)
    unread.slice(i, i + 450).forEach((n) => {
      batch.update(doc(opts.db, FirestoreCollections.inAppNotifications, n.id), { read: true })
    })
    await batch.commit()
  }
}

