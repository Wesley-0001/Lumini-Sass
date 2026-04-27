import { DEFAULT_ROLE_PAGES } from '@/config/defaultRolePages'
import { DEMO_STAFF_USERS } from '@/data/demoStaffUsers'
import { LUMINI_LEGACY_EMAIL_MAP, canonStaffEmail } from '@/lib/legacyEmailMap'
import { normalizeStaffRoleString } from '@/lib/normalizeStaffRole'
import type { StaffSessionUser } from '@/types/user'

export const STAFF_SESSION_STORAGE_KEY = 'cp_user'

function normalizeSessionUser(raw: unknown): StaffSessionUser | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const email = typeof o.email === 'string' ? o.email : ''
  const name = typeof o.name === 'string' ? o.name : ''
  const role = typeof o.role === 'string' ? normalizeStaffRoleString(o.role) : null
  const supervisor = o.supervisor === true || o.supervisor === false || o.supervisor === null ? o.supervisor : null
  if (!email || !name || !role) return null
  let pages: string[] = []
  if (Array.isArray(o.pages) && o.pages.every((x) => typeof x === 'string')) {
    pages = o.pages.map((x) => String(x).trim()).filter(Boolean)
  }
  if (pages.length === 0 && DEFAULT_ROLE_PAGES[role]) {
    pages = [...DEFAULT_ROLE_PAGES[role]]
  }
  let team: string | null = null
  if (typeof o.team === 'string' && o.team.trim() !== '') {
    team = o.team.trim()
  } else if (o.team === null) {
    team = null
  }
  return { email, name, role, pages, team, supervisor }
}

/**
 * Hidratação alinhada a `bootApp` em `js/app.js` (mapa de e-mails legados + `DEMO_USERS`).
 */
export function readStaffSessionFromStorage(): StaffSessionUser | null {
  try {
    const raw = sessionStorage.getItem(STAFF_SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    let user = normalizeSessionUser(parsed)
    if (!user) return null

    const key = String(user.email).toLowerCase()
    const mappedEmail = LUMINI_LEGACY_EMAIL_MAP[key]
    if (mappedEmail) {
      const fromDemo = DEMO_STAFF_USERS.find((u) => u.email === mappedEmail)
      const next = fromDemo
        ? {
            email: fromDemo.email,
            name: fromDemo.name,
            role: fromDemo.role,
            pages: fromDemo.pages,
            team: fromDemo.team,
            supervisor: fromDemo.supervisor,
          }
        : { ...user, email: mappedEmail }
      sessionStorage.setItem(STAFF_SESSION_STORAGE_KEY, JSON.stringify(next))
      user = next
    }

    return { ...user, email: canonStaffEmail(user.email.toLowerCase()) }
  } catch {
    return null
  }
}

export function writeStaffSessionToStorage(user: StaffSessionUser): void {
  sessionStorage.setItem(STAFF_SESSION_STORAGE_KEY, JSON.stringify(user))
}

export function clearStaffSessionStorage(): void {
  sessionStorage.removeItem(STAFF_SESSION_STORAGE_KEY)
}
