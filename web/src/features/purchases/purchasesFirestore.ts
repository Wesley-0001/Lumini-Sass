import { collection, deleteDoc, doc, getDocs, setDoc, type Firestore } from 'firebase/firestore'
import { FirestoreCollections } from '@/types/firestore'
import type { PurchaseRequest } from '@/features/purchases/pages/PurchasesPage'

export type Supplier = { id: string; name?: string; contact?: string }
export type Product = { id: string; name?: string; unit?: string; price?: number }

function clean<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function withId<T extends object>(raw: unknown, id: string): T {
  const base = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return { ...base, id } as T
}

export async function loadSuppliers(db: Firestore): Promise<Supplier[]> {
  const snap = await getDocs(collection(db, FirestoreCollections.suppliers))
  return snap.docs.map((d) => withId<Supplier>(d.data(), d.id))
}

export async function loadProducts(db: Firestore): Promise<Product[]> {
  const snap = await getDocs(collection(db, FirestoreCollections.products))
  return snap.docs.map((d) => withId<Product>(d.data(), d.id))
}

export async function loadPurchases(db: Firestore): Promise<PurchaseRequest[]> {
  const snap = await getDocs(collection(db, FirestoreCollections.purchases))
  return snap.docs.map((d) => withId<PurchaseRequest>(d.data(), d.id))
}

export async function upsertPurchase(db: Firestore, purchase: PurchaseRequest): Promise<void> {
  if (!purchase?.id) return
  const c = clean(purchase)
  await setDoc(doc(db, FirestoreCollections.purchases, String(c.id)), c, { merge: true })
}

export async function deletePurchase(db: Firestore, id: string): Promise<void> {
  if (!id) return
  await deleteDoc(doc(db, FirestoreCollections.purchases, String(id)))
}

