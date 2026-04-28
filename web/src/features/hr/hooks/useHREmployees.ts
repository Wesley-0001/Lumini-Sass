/**
 * useHREmployees.ts — Hook para carregar colaboradores RH
 * Tenta Firebase primeiro (coleção hrEmployees), fallback para seed local
 * SEM usar window.* ou LegacyBridge
 */
import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { tryGetFirestoreDb } from '@/services/firebase/app'
import { HR_EMPLOYEES_SEED } from '@/features/hr/data/hrSeed'
import type { HREmployee } from '@/features/hr/types/hrTypes'

export type HREmployeesState =
  | { status: 'loading' }
  | { status: 'ready'; employees: HREmployee[]; fromFirebase: boolean }
  | { status: 'error'; message: string; employees: HREmployee[] }

export function useHREmployees(): HREmployeesState {
  const [state, setState] = useState<HREmployeesState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    const run = async () => {
      const db = tryGetFirestoreDb()
      if (!db) {
        if (!cancelled)
          setState({ status: 'ready', employees: HR_EMPLOYEES_SEED, fromFirebase: false })
        return
      }

      try {
        const snap = await getDocs(collection(db, 'hrEmployees'))
        if (cancelled) return

        if (snap.docs.length > 0) {
          const employees = snap.docs.map((d) => {
            const raw = d.data() as Partial<HREmployee>
            return { ...raw, matricula: raw.matricula ?? d.id } as HREmployee
          })
          setState({ status: 'ready', employees, fromFirebase: true })
        } else {
          setState({ status: 'ready', employees: HR_EMPLOYEES_SEED, fromFirebase: false })
        }
      } catch {
        if (!cancelled)
          setState({
            status: 'error',
            message: 'Erro ao carregar do Firebase, usando dados locais.',
            employees: HR_EMPLOYEES_SEED,
          })
      }
    }

    void run()
    return () => { cancelled = true }
  }, [])

  return state
}
