import { DEMO_STAFF_USERS } from '@/data/demoStaffUsers'
import type { DemoStaffUserRecord } from '@/data/demoStaffUsers'

/** Chave `nt_users_custom` — mesma do `users-module.js`. */
export const NT_USERS_CUSTOM_KEY = 'nt_users_custom'

/** Registro de usuário alinhado ao legado (`users-module.js`). */
export interface ManagedUser {
  id: string
  email: string
  name: string
  role: string
  active?: boolean
  isDemo?: boolean
  password?: string
  employeeId?: string
  createdAt?: number
  updatedAt?: number
}

export const USER_ROLES: ReadonlyArray<{ value: string; label: string; icon: string }> = [
  { value: 'admin', label: 'Administrador', icon: '🔑' },
  { value: 'manager', label: 'Gerente de Produção', icon: '📊' },
  { value: 'supervisor', label: 'Supervisor', icon: '👷' },
  { value: 'boss', label: 'Diretor Geral', icon: '👑' },
  { value: 'rh', label: 'Recursos Humanos', icon: '❤️' },
  { value: 'employee', label: 'Colaborador (Portal)', icon: '🌐' },
]

export function newUserId(): string {
  return 'usr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

export function mapDemoStaffToManaged(u: DemoStaffUserRecord): ManagedUser {
  return {
    id: 'demo-' + u.email.replace(/[@.]/g, '_'),
    email: u.email,
    name: u.name,
    role: u.role,
    active: true,
    isDemo: true,
    password: u.password,
  }
}

/** Espelho de `_getUsersFromStorage` em `users-module.js` (DEMO + `nt_users_custom`). */
export function mergeDemoUsersAndCustom(): ManagedUser[] {
  let custom: ManagedUser[] = []
  try {
    const saved = localStorage.getItem(NT_USERS_CUSTOM_KEY)
    const parsed = saved ? JSON.parse(saved) : []
    custom = Array.isArray(parsed) ? parsed : []
  } catch {
    custom = []
  }
  const demo = DEMO_STAFF_USERS.map(mapDemoStaffToManaged)
  const demoFiltered = demo.filter((d) => !custom.find((c) => c.email === d.email))
  return [...demoFiltered, ...custom]
}
