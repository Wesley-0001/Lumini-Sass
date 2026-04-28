/**
 * useCareers.ts — Hook para trilha de carreira
 * Tenta Firebase (coleção careers), fallback para seed local
 * Espelha getCareers / saveCareers de app.js sem window.*
 */
import { useEffect, useState } from 'react'
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { tryGetFirestoreDb } from '@/services/firebase/app'
import type { Career } from '@/features/hr/types/hrTypes'

const CAREERS_SEED: Career[] = [
  { id: 'c-ajprod',   name: 'Ajudante de Produção',        level: 0, minMonths: 3,  competencies: ['Segurança básica', 'Organização do posto', 'Trabalho em equipe'] },
  { id: 'c-op1',      name: 'Operador de Calandra 1',       level: 1, minMonths: 6,  competencies: ['Operação básica da calandra', 'Conhecimento de materiais', 'Controle de qualidade básico'] },
  { id: 'c-op2',      name: 'Operador de Calandra 2',       level: 2, minMonths: 12, competencies: ['Operação avançada', 'Manutenção preventiva', 'Leitura de ordens de serviço', 'Resolução de problemas'] },
  { id: 'c-op3',      name: 'Operador de Calandra 3',       level: 3, minMonths: 18, competencies: ['Domínio completo da máquina', 'Treinamento de novos', 'Liderança técnica', 'Indicadores de qualidade'] },
  { id: 'c-rev1',     name: 'Revisor 1',                    level: 1, minMonths: 6,  competencies: ['Revisão básica de impressos', 'Identificação de falhas', 'Uso de instrumentos de medida'] },
  { id: 'c-rev2',     name: 'Revisor 2',                    level: 2, minMonths: 12, competencies: ['Revisão avançada', 'Controle de não conformidades', 'Relatórios de qualidade'] },
  { id: 'c-rev3',     name: 'Revisor 3',                    level: 3, minMonths: 18, competencies: ['Auditoria de qualidade', 'Treinamento de equipe', 'Gestão de indicadores'] },
  { id: 'c-imp1',     name: 'Impressor Digital',            level: 1, minMonths: 6,  competencies: ['Operação de impressora digital', 'Calibração básica', 'Controle de insumos'] },
  { id: 'c-imp2',     name: 'Impressor Digital 2',          level: 2, minMonths: 12, competencies: ['Configuração avançada', 'Manutenção de 1º nível', 'Gestão de cor', 'Treinamento de pares'] },
  { id: 'c-lid-prod', name: 'Líder de Produção',            level: 4, minMonths: 24, competencies: ['Liderança de equipe', 'Gestão de produção', 'Indicadores de performance', 'Comunicação efetiva'] },
  { id: 'c-lid-rev',  name: 'Líder de Revisão',             level: 4, minMonths: 24, competencies: ['Liderança', 'Auditoria', 'Gestão de qualidade', 'Treinamento de equipe'] },
  { id: 'c-sup-prod', name: 'Supervisor de Produção',       level: 5, minMonths: 36, competencies: ['Supervisão de múltiplas equipes', 'Planejamento', 'Gestão de conflitos', 'Relatórios executivos'] },
  { id: 'c-des-jr',   name: 'Designer Gráfico Júnior',      level: 1, minMonths: 6,  competencies: ['Pacote Adobe', 'Identidade visual básica', 'Pré-impressão'] },
  { id: 'c-des-pl',   name: 'Designer Gráfico Pleno',       level: 2, minMonths: 12, competencies: ['Direção de arte', 'Gestão de projetos', 'Atendimento ao cliente'] },
  { id: 'c-ajexp',    name: 'Auxiliar de Logística',        level: 1, minMonths: 6,  competencies: ['Separação e conferência', 'Uso de sistema WMS', 'Segurança no manuseio'] },
  { id: 'c-exp-lider',name: 'Líder de Expedição',           level: 3, minMonths: 18, competencies: ['Liderança de equipe', 'Controle de estoque', 'Gestão de transportadoras'] },
]

function uid(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export type CareersState =
  | { status: 'loading' }
  | { status: 'ready'; careers: Career[] }
  | { status: 'error'; message: string; careers: Career[] }

export function useCareers() {
  const [state, setState] = useState<CareersState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const db = tryGetFirestoreDb()
      if (!db) {
        if (!cancelled) setState({ status: 'ready', careers: CAREERS_SEED })
        return
      }
      try {
        const snap = await getDocs(collection(db, 'careers'))
        if (cancelled) return
        if (snap.docs.length > 0) {
          const careers: Career[] = snap.docs.map((d) => {
            const raw = d.data() as Partial<Career>
            return {
              id: d.id,
              name: raw.name ?? '',
              level: raw.level ?? 0,
              minMonths: raw.minMonths ?? 3,
              competencies: Array.isArray(raw.competencies) ? (raw.competencies as string[]) : [],
            }
          })
          setState({ status: 'ready', careers })
        } else {
          setState({ status: 'ready', careers: CAREERS_SEED })
        }
      } catch {
        if (!cancelled)
          setState({ status: 'error', message: 'Erro ao carregar careers.', careers: CAREERS_SEED })
      }
    }
    void run()
    return () => { cancelled = true }
  }, [])

  function getCareers(): Career[] {
    if (state.status === 'ready' || state.status === 'error') return state.careers
    return CAREERS_SEED
  }

  async function upsert(career: Career): Promise<void> {
    const db = tryGetFirestoreDb()
    if (db) {
      try { await setDoc(doc(db, 'careers', career.id), career) } catch { /* ignore */ }
    }
    const list = getCareers()
    const idx = list.findIndex((c) => c.id === career.id)
    if (idx >= 0) {
      const next = [...list]
      next[idx] = career
      setState({ status: 'ready', careers: next })
    } else {
      setState({ status: 'ready', careers: [...list, career] })
    }
  }

  async function remove(id: string): Promise<void> {
    const db = tryGetFirestoreDb()
    if (db) {
      try { await deleteDoc(doc(db, 'careers', id)) } catch { /* ignore */ }
    }
    setState({ status: 'ready', careers: getCareers().filter((c) => c.id !== id) })
  }

  function createNew(): Career {
    return { id: uid(), name: '', level: 0, minMonths: 3, competencies: [] }
  }

  return { state, getCareers, upsert, remove, createNew }
}
