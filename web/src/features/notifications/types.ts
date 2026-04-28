export type NotificationType =
  | 'comms'
  | 'promo'
  | 'purchase_approved'
  | 'purchase_cancel_request'
  | 'purchase_cancel_ok'
  | 'purchase_cancel_denied'
  | (string & {})

export type NotificationLink = 'comms' | 'purchases' | 'supervisor-promo-history' | (string & {})

export interface InAppNotificationMeta {
  commId?: string
  purchaseId?: string
  employeeId?: string
  [k: string]: unknown
}

export interface InAppNotification {
  id: string
  userEmail: string
  userId: string | null
  type: NotificationType
  title: string
  message: string
  link: NotificationLink
  read: boolean
  createdAt: number
  meta?: InAppNotificationMeta
}

export type InAppNotificationInput = Omit<InAppNotification, 'id'> & { id?: string }

