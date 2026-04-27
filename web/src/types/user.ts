export type StaffRole = 'admin' | 'manager' | 'supervisor' | 'boss' | 'rh'

/** Usuário da sessão do sistema principal (legado: sessionStorage `cp_user`). */
export interface StaffSessionUser {
  email: string
  name: string
  role: StaffRole
  /** IDs de página (`pageId` legado); se ausente no Firestore, aplica-se `DEFAULT_ROLE_PAGES[role]`. */
  pages: string[]
  /** Equipe vinculada (ex. ID ou nome), quando aplicável ao perfil. */
  team: string | null
  supervisor: boolean | null
}

export type PortalRole = 'employee'

export interface PortalSessionPayload {
  userId: string
  email: string
  employeeId: string
}
