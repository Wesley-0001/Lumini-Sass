import { collection, doc, getDocs, setDoc, type Firestore } from 'firebase/firestore'
import { FirestoreCollections } from '@/types/firestore'
import type { InternalComm } from '@/features/comms/pages/CommsPage'

function clean<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function withId<T extends object>(raw: unknown, id: string): T {
  const base = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return { ...base, id } as T
}

export async function loadInternalComms(db: Firestore): Promise<InternalComm[]> {
  const snap = await getDocs(collection(db, FirestoreCollections.internalComms))
  return snap.docs.map((d) => withId<InternalComm>(d.data(), d.id))
}

export async function upsertInternalComm(db: Firestore, item: InternalComm): Promise<void> {
  if (!item?.id) return
  const c = clean(item)
  await setDoc(doc(db, FirestoreCollections.internalComms, String(c.id)), c, { merge: true })
}

