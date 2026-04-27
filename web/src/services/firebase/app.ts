import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getFirebaseOptionsFromEnv } from '@/services/firebase/config'

let app: FirebaseApp | undefined
let db: Firestore | undefined
let auth: Auth | undefined

/**
 * App Firebase singleton. Só inicializa se as variáveis de ambiente estiverem definidas.
 * Módulos migrados devem usar `getFirestoreDb()` em vez de importar Firestore direto nos componentes.
 */
export function getFirebaseApp(): FirebaseApp {
  if (app) return app
  const options = getFirebaseOptionsFromEnv()
  if (!options?.apiKey) {
    throw new Error(
      '[Lumini] Firebase não configurado. Copie web/.env.example para web/.env.local e preencha VITE_FIREBASE_*.',
    )
  }
  app = initializeApp(options)
  return app
}

export function getFirestoreDb(): Firestore {
  if (db) return db
  db = getFirestore(getFirebaseApp())
  return db
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth
  auth = getAuth(getFirebaseApp())
  return auth
}

/** Para UI de desenvolvimento: evita crash antes do .env.local existir. */
export function tryGetFirestoreDb(): Firestore | null {
  try {
    return getFirestoreDb()
  } catch {
    return null
  }
}
