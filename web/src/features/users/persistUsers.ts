import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import { tryGetFirestoreDb } from '@/services/firebase/app'
import type { ManagedUser } from '@/features/users/usersModel'
import { FirestoreCollections } from '@/types/firestore'

/** Espelho de `loadCollection('users')` em `js/firestore-db.js`. */
export async function loadUsersFromFirestore(): Promise<ManagedUser[]> {
  const db = tryGetFirestoreDb()
  if (!db) return []
  const snap = await getDocs(collection(db, FirestoreCollections.users))
  return snap.docs.map((d) => ({ ...(d.data() as object), id: d.id })) as ManagedUser[]
}

/** Espelho de `persistCollection('users', safe)` em `js/firestore-db.js`. */
export async function persistUsersCollection(users: ManagedUser[]): Promise<void> {
  const db = tryGetFirestoreDb()
  if (!db) return
  try {
    const safe = users.map((u) => {
      if (u.role === 'employee') return { ...u }
      const { password, ...rest } = u
      return rest
    })
    if (safe.length === 0) return
    const batch = writeBatch(db)
    safe.forEach((item) => {
      const clean = JSON.parse(JSON.stringify(item)) as ManagedUser
      const ref = doc(db, FirestoreCollections.users, String(clean.id))
      batch.set(ref, clean, { merge: true })
    })
    await batch.commit()
  } catch (e) {
    console.error('[Firebase] Erro ao salvar users:', e)
  }
}
