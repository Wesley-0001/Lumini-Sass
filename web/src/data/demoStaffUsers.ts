import { DEFAULT_ROLE_PAGES } from '@/config/defaultRolePages'
import type { StaffRole } from '@/types/user'

export interface DemoStaffUserRecord {
  email: string
  password: string
  role: StaffRole
  name: string
  pages: string[]
  team: string | null
  supervisor: boolean | null
}

function demoPages(role: StaffRole): string[] {
  return [...DEFAULT_ROLE_PAGES[role]]
}

/** Espelho de `DEMO_USERS` em `js/data.js`. */
export const DEMO_STAFF_USERS: readonly DemoStaffUserRecord[] = [
  {
    email: 'admin@lumini',
    password: 'Luminiadmin',
    role: 'admin',
    name: 'Wesley',
    pages: demoPages('admin'),
    team: null,
    supervisor: null,
  },
  {
    email: 'admin2@lumini',
    password: 'Luminiadmin2',
    role: 'admin',
    name: 'Gustavo',
    pages: demoPages('admin'),
    team: null,
    supervisor: null,
  },
  {
    email: 'diretor@lumini',
    password: 'Luminidiretor',
    role: 'boss',
    name: 'Carlos',
    pages: demoPages('boss'),
    team: null,
    supervisor: null,
  },
  {
    email: 'gerente@lumini',
    password: 'Luminigerente',
    role: 'manager',
    name: 'Samuel',
    pages: demoPages('manager'),
    team: null,
    supervisor: null,
  },
  {
    email: 'sup1@lumini',
    password: 'Luminisup1',
    role: 'supervisor',
    name: 'Daniel',
    pages: demoPages('supervisor'),
    team: null,
    supervisor: true,
  },
  {
    email: 'sup2@lumini',
    password: 'Luminisup2',
    role: 'supervisor',
    name: 'Kauê',
    pages: demoPages('supervisor'),
    team: null,
    supervisor: true,
  },
  {
    email: 'sup3@lumini',
    password: 'Luminisup3',
    role: 'supervisor',
    name: 'Toni',
    pages: demoPages('supervisor'),
    team: null,
    supervisor: true,
  },
  {
    email: 'sup4@lumini',
    password: 'Luminisup4',
    role: 'supervisor',
    name: 'Hélcio',
    pages: demoPages('supervisor'),
    team: null,
    supervisor: true,
  },
  {
    email: 'rh@lumini',
    password: 'Luminirh',
    role: 'rh',
    name: 'RH',
    pages: demoPages('rh'),
    team: null,
    supervisor: null,
  },
]
