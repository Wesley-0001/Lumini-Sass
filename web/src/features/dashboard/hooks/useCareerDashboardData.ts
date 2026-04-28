import { useEffect, useState } from 'react'
import { collection, getDocs, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore'
import { tryGetFirestoreDb } from '@/services/firebase/app'
import { FirestoreCollections } from '@/types/firestore'
import type { CareerEmployee } from '@/lib/dashboard/careerKpi'
import type { CareerEvaluation } from '@/lib/dashboard/careerEvaluation'

export type CareerDashboardState =
  | { status: 'no_firebase' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; employees: CareerEmployee[]; evaluations: CareerEvaluation[]; evaluationsCount: number }

const initial: CareerDashboardState = { status: 'loading' }

function mapEmployeeDocs(docs: QueryDocumentSnapshot<DocumentData>[]): CareerEmployee[] {
  return docs.map((d) => {
    const raw = d.data() as Record<string, unknown>
    const teamFromRaw =
      typeof raw.team === 'string' ? raw.team : typeof raw.equipe === 'string' ? raw.equipe : undefined
    return {
      id: d.id,
      name: typeof raw.name === 'string' ? raw.name : undefined,
      rhMatricula:
        raw.rhMatricula === null || typeof raw.rhMatricula === 'string'
          ? (raw.rhMatricula as string | null)
          : undefined,
      admission: typeof raw.admission === 'string' ? raw.admission : undefined,
      status: typeof raw.status === 'string' ? raw.status : undefined,
      minMonths: typeof raw.minMonths === 'number' ? raw.minMonths : null,
      supervisor: typeof raw.supervisor === 'string' ? raw.supervisor : undefined,
      currentRole: typeof raw.currentRole === 'string' ? raw.currentRole : undefined,
      desiredRole:
        raw.desiredRole === null || typeof raw.desiredRole === 'string' ? (raw.desiredRole as string | null) : undefined,
      sector: typeof raw.sector === 'string' ? raw.sector : undefined,
      team: teamFromRaw,
    }
  })
}

/**
 * Lê `employees` e a contagem de `evaluations` (mesma base do legado pós-`LuminiLoadData`).
 */
export function useCareerDashboardData() {
  const [state, setState] = useState<CareerDashboardState>(initial)

  useEffect(() => {
    const db = tryGetFirestoreDb()
    if (!db) {
      setState({ status: 'no_firebase' })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })

    const run = async () => {
      try {
        const empSnap = await getDocs(collection(db, FirestoreCollections.employees))
        if (cancelled) return
        const employees = mapEmployeeDocs(empSnap.docs)

        let evaluations: CareerEvaluation[] = []
        try {
          const evSnap = await getDocs(collection(db, FirestoreCollections.evaluations))
          if (!cancelled)
            evaluations = evSnap.docs.map((d) => {
              const raw = d.data() as Record<string, unknown>
              return {
                id: d.id,
                employeeId: typeof raw.employeeId === 'string' ? raw.employeeId : undefined,
                result: typeof raw.result === 'string' ? raw.result : undefined,
                date: typeof raw.date === 'string' ? raw.date : undefined,
                fromRole: typeof raw.fromRole === 'string' ? raw.fromRole : undefined,
                toRole: typeof raw.toRole === 'string' ? raw.toRole : undefined,
              }
            })
        } catch {
          /* coleção opcional para KPI de boss / histórico admin */
        }

        if (cancelled) return
        const evaluationsCount = evaluations.length
        setState({ status: 'ready', employees, evaluations, evaluationsCount })
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Falha ao carregar dados.'
        if (!cancelled) setState({ status: 'error', message })
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
