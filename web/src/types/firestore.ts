/**
 * Nomes de coleções usados no legado (`firebase-db.js`, `portal-app.js`).
 * Mantidos como constantes para evitar typos na migração gradual.
 */
export const FirestoreCollections = {
  employees: 'employees',
  careers: 'careers',
  evaluations: 'evaluations',
  users: 'users',
  teams: 'teams',
  excecoes: 'excecoes',
  purchases: 'purchases',
  suppliers: 'suppliers',
  products: 'products',
  notifications: 'notifications',
  inAppNotifications: 'in_app_notifications',
  internalComms: 'internal_comms',
  holerites: 'holerites',
  dailyAttendance: 'daily_attendance',
} as const

export type FirestoreCollectionName =
  (typeof FirestoreCollections)[keyof typeof FirestoreCollections]

/** Formato mínimo de documento em `users` (gestão + portal). Campos adicionais virão na migração. */
export interface FirestoreUserDoc {
  email?: string
  role?: string
  name?: string
  employeeId?: string
  password?: string
  /** Lista opcional de `pageId` (legado). Se existir, é preservada na sessão. */
  pages?: unknown
  /** Equipe vinculada, quando existir no documento. */
  team?: unknown
}

/** Formato mínimo de colaborador em `employees` (portal + RH). */
export interface FirestoreEmployeeDoc {
  name?: string
  rhMatricula?: string | null
  sector?: string
  currentRole?: string
  status?: string
  supervisor?: string
  rhLider?: string
  admission?: string
}
