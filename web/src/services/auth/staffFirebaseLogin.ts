import { signInWithEmailAndPassword, signOut, type UserCredential } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { DEFAULT_ROLE_PAGES } from '@/config/defaultRolePages'
import { canonStaffEmail } from '@/lib/legacyEmailMap'
import { isEmployeePortalRoleString, normalizeStaffRoleString } from '@/lib/normalizeStaffRole'
import { getFirebaseAuth, getFirestoreDb } from '@/services/firebase/app'
import { isFirebaseConfigured } from '@/services/firebase/config'
import { FirestoreCollections, type FirestoreUserDoc } from '@/types/firestore'
import type { StaffRole, StaffSessionUser } from '@/types/user'

export type StaffFirebaseLoginOutcome =
  | { kind: 'success'; user: StaffSessionUser }
  | { kind: 'use_demo' }
  | { kind: 'error'; message: string }

function parseSupervisor(value: unknown): boolean | null {
  if (value === true || value === false) return value
  if (value === null || value === undefined) return null
  if (typeof value === 'string' && value.trim() !== '') return true
  return null
}

function pickPagesForRole(
  data: FirestoreUserDoc,
  role: StaffRole,
): string[] {
  const p = data.pages
  if (Array.isArray(p) && p.every((x) => typeof x === 'string')) {
    const list = p.map((x) => String(x).trim()).filter(Boolean)
    if (list.length > 0) return list
  }
  return [...DEFAULT_ROLE_PAGES[role]]
}

function pickTeam(data: FirestoreUserDoc): string | null {
  const t = (data as Record<string, unknown>).team
  if (t === null || t === undefined) return null
  if (typeof t === 'string' && t.trim() !== '') return t.trim()
  return null
}

/**
 * Mapeia documento `users` + e-mail canônico para o mesmo shape de `cp_user` (StaffSessionUser).
 */
function mapFirestoreUserDocToStaffSession(
  data: FirestoreUserDoc,
  emailFallback: string,
): StaffSessionUser | null {
  const email = typeof data.email === 'string' && data.email.trim() ? data.email.trim() : emailFallback
  const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : null
  const role = normalizeStaffRoleString(data.role)
  if (!name || !role) return null
  const raw = data as Record<string, unknown>
  return {
    email: canonStaffEmail(email.toLowerCase()),
    name,
    role,
    pages: pickPagesForRole(data, role),
    team: pickTeam(data),
    supervisor: parseSupervisor(raw.supervisor),
  }
}

type FirestoreStaffLoad =
  | { load: 'staff'; user: StaffSessionUser }
  | { load: 'employee_portal' }
  | { load: 'missing' }

function isEmployeeRoleField(data: FirestoreUserDoc): boolean {
  return isEmployeePortalRoleString(data.role)
}

async function loadUserDocAfterAuth(cred: UserCredential, canonicalEmail: string): Promise<FirestoreStaffLoad> {
  const db = getFirestoreDb()
  const uid = cred.user.uid
  const refByUid = doc(db, FirestoreCollections.users, uid)
  const snapUid = await getDoc(refByUid)
  if (snapUid.exists()) {
    const rawDoc = snapUid.data() as FirestoreUserDoc
    if (isEmployeeRoleField(rawDoc)) return { load: 'employee_portal' }
    const u = mapFirestoreUserDocToStaffSession(rawDoc, cred.user.email ?? canonicalEmail)
    if (u) return { load: 'staff', user: u }
  }
  const q = query(
    collection(db, FirestoreCollections.users),
    where('email', '==', canonicalEmail),
    limit(1),
  )
  const snapQ = await getDocs(q)
  const d = snapQ.docs[0]
  if (!d) return { load: 'missing' }
  const rawDoc = d.data() as FirestoreUserDoc
  if (isEmployeeRoleField(rawDoc)) return { load: 'employee_portal' }
  const u = mapFirestoreUserDocToStaffSession(rawDoc, cred.user.email ?? canonicalEmail)
  if (u) return { load: 'staff', user: u }
  return { load: 'missing' }
}

function signInErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido.'
    case 'auth/user-disabled':
      return 'Conta desativada. Fale com o administrador.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente de novo em instantes.'
    case 'auth/network-request-failed':
      return 'Sem conexão. Verifique a rede e tente de novo.'
    case 'auth/operation-not-allowed':
      return 'Login por e-mail e senha não habilitado no projeto Firebase.'
    default:
      return 'E-mail ou senha incorretos.'
  }
}

/**
 * Login staff via Firebase Auth + documento em `users`.
 * Não removê o demo: retorna `use_demo` para delegar a `tryStaffDemoLogin` quando fizer sentido.
 */
export async function tryStaffFirebaseLogin(
  emailRaw: string,
  passwordRaw: string,
): Promise<StaffFirebaseLoginOutcome> {
  const email = canonStaffEmail(emailRaw.trim().toLowerCase())
  const password = passwordRaw

  if (!isFirebaseConfigured()) {
    return { kind: 'use_demo' }
  }

  if (!email) {
    return { kind: 'error', message: 'Informe o e-mail.' }
  }

  try {
    const auth = getFirebaseAuth()
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const loaded = await loadUserDocAfterAuth(cred, email)

    if (loaded.load === 'employee_portal') {
      await signOut(auth)
      return { kind: 'error', message: 'Use o portal do colaborador para acessar com este perfil.' }
    }
    if (loaded.load === 'staff') {
      const staffUser = loaded.user
      return { kind: 'success', user: { ...staffUser, email: canonStaffEmail(staffUser.email.toLowerCase()) } }
    }

    await signOut(auth)
    return { kind: 'use_demo' }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    const code = err.code

    if (code === 'auth/user-not-found') {
      return { kind: 'use_demo' }
    }

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return { kind: 'use_demo' }
    }

    if (code === 'auth/network-request-failed') {
      return { kind: 'use_demo' }
    }

    if (code === 'auth/invalid-email' || code === 'auth/user-disabled' || code === 'auth/too-many-requests') {
      return { kind: 'error', message: signInErrorMessage(code) }
    }

    if (code === 'auth/operation-not-allowed') {
      return { kind: 'error', message: signInErrorMessage(code) }
    }

    return { kind: 'error', message: signInErrorMessage(code) }
  }
}
