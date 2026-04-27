import type { FirebaseOptions } from 'firebase/app'

function readEnv(key: string): string {
  return String(import.meta.env[key] ?? '').trim()
}

/** Config a partir de `.env.local` (não versionar credenciais). */
export function getFirebaseOptionsFromEnv(): FirebaseOptions | null {
  const apiKey = readEnv('VITE_FIREBASE_API_KEY')
  if (!apiKey) return null

  return {
    apiKey,
    authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readEnv('VITE_FIREBASE_APP_ID'),
  }
}

export const isFirebaseConfigured = (): boolean => Boolean(readEnv('VITE_FIREBASE_API_KEY'))
