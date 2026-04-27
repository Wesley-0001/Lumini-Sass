import { DEMO_STAFF_USERS } from '@/data/demoStaffUsers'
import { canonStaffEmail } from '@/lib/legacyEmailMap'
import type { StaffSessionUser } from '@/types/user'

/**
 * Mesma regra que `doLogin` em `js/app.js`: valida contra `DEMO_USERS`.
 * Usado depois de `tryStaffFirebaseLogin` (Firebase Auth + `users` no Firestore) como fallback.
 */
export function tryStaffDemoLogin(emailRaw: string, passwordRaw: string): StaffSessionUser | null {
  const email = canonStaffEmail(emailRaw.trim().toLowerCase())
  const password = passwordRaw.trim()
  const row = DEMO_STAFF_USERS.find((u) => u.email.toLowerCase() === email && u.password === password)
  if (!row) return null
  return {
    email: row.email,
    name: row.name,
    role: row.role,
    pages: row.pages,
    team: row.team,
    supervisor: row.supervisor,
  }
}
