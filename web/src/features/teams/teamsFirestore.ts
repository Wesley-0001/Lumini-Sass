import { collection, deleteDoc, doc, getDocs, setDoc, type Firestore } from 'firebase/firestore'
import { FirestoreCollections } from '@/types/firestore'

export type ProductionTeamDoc = {
  nome?: string
  lider?: string
  descricao?: string
  membros?: unknown[]
  atualizadoEm?: number
  criadoEm?: number
}

function clean<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function withId<T extends object>(raw: unknown, id: string): T {
  const base = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return { ...base, id } as T
}

export async function loadTeams(db: Firestore): Promise<Array<ProductionTeamDoc & { id: string }>> {
  const snap = await getDocs(collection(db, FirestoreCollections.teams))
  return snap.docs.map((d) => withId<ProductionTeamDoc & { id: string }>(d.data(), d.id))
}

export async function upsertTeam(
  db: Firestore,
  team: ProductionTeamDoc & { id: string },
): Promise<void> {
  if (!team?.id) return
  const c = clean(team)
  await setDoc(doc(db, FirestoreCollections.teams, String(c.id)), c, { merge: true })
}

export async function deleteTeam(db: Firestore, id: string): Promise<void> {
  if (!id) return
  await deleteDoc(doc(db, FirestoreCollections.teams, String(id)))
}

