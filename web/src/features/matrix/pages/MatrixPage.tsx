/**
 * MatrixPage.tsx
 * Espelha renderMatrix / cycleSkill de app.js
 * SEM window.* / LegacyBridge
 */
import { useState, useMemo } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui'
import { useCareerDashboardData } from '@/features/dashboard/hooks/useCareerDashboardData'
import { tryGetFirestoreDb } from '@/services/firebase/app'
import { FirestoreCollections } from '@/types/firestore'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import styles from './MatrixPage.module.css'
import type { SkillLevel } from '@/features/hr/types/hrTypes'

// ─── Habilidades padrão da planta (espelha DEMO_MATRIX_SKILLS do legado) ──
const DEFAULT_SKILLS = [
  'Calandra',
  'Impressão Digital',
  'Revisão',
  'Expedição',
  'Corte & Vinco',
  'Dobra Manual',
  'Silk Screen',
  'Plastificação',
]

const SKILL_ICONS: Record<SkillLevel, string> = { 0: '—', 1: '✕', 2: '◐', 3: '✓', 4: '★' }
const SKILL_LABELS: Record<SkillLevel, string> = {
  0: 'Não avaliado',
  1: 'Não Treinado',
  2: 'Em Treinamento',
  3: 'Competente',
  4: 'Referência',
}
const SKILL_DOT_CLASS: Record<SkillLevel, string> = {
  0: styles.dotNone,
  1: styles.dotRed,
  2: styles.dotYellow,
  3: styles.dotGreen,
  4: styles.dotStar,
}

// ─── Componente ──────────────────────────────────────────────────────────
export function MatrixPage() {
  const state   = useCareerDashboardData()
  const { user } = useStaffAuth()
  const isReadOnly = user?.role === 'boss'

  const [sectorFilter, setSectorFilter] = useState('')
  const [search,       setSearch]       = useState('')
  // skills override por employee: { [empId]: { [skill]: SkillLevel } }
  const [skillsLocal, setSkillsLocal] = useState<Record<string, Record<string, SkillLevel>>>({})

  const { employees } = useMemo(() => {
    if (state.status !== 'ready') return { employees: [] }
    return { employees: state.employees }
  }, [state])

  const sectors = useMemo(
    () => [...new Set(employees.map((e) => e.sector ?? 'Produção'))].sort(),
    [employees],
  )

  const filtered = useMemo(() => {
    let list = employees
    if (sectorFilter) list = list.filter((e) => (e.sector ?? 'Produção') === sectorFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          (e.name ?? '').toLowerCase().includes(q) ||
          (e.currentRole ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [employees, sectorFilter, search])

  function getSkill(empId: string, skill: string): SkillLevel {
    return (skillsLocal[empId]?.[skill] ?? 0) as SkillLevel
  }

  async function cycleSkill(empId: string, skill: string, current: SkillLevel) {
    if (isReadOnly) return
    const next = ((current + 1) % 5) as SkillLevel
    const updated = {
      ...skillsLocal,
      [empId]: { ...(skillsLocal[empId] ?? {}), [skill]: next },
    }
    setSkillsLocal(updated)

    // Persist no Firestore (campo skills no documento do employee)
    const db = tryGetFirestoreDb()
    if (db) {
      try {
        await setDoc(
          doc(db, FirestoreCollections.employees, empId),
          { skills: updated[empId] },
          { merge: true },
        )
      } catch { /* ignore */ }
    }
  }

  // ── Legenda ──
  const legend: { level: SkillLevel; label: string }[] = [
    { level: 0, label: 'Não avaliado' },
    { level: 1, label: 'Não Treinado' },
    { level: 2, label: 'Em Treinamento' },
    { level: 3, label: 'Competente' },
    { level: 4, label: 'Referência' },
  ]

  if (state.status === 'loading') {
    return (
      <div className={styles.loadWrap}>
        <div className={styles.spinner} />
        <span>Carregando matriz…</span>
      </div>
    )
  }

  if (state.status === 'no_firebase' || state.status === 'error') {
    return (
      <div className={styles.page}>
        <PageHeader title="Matriz de Polivalência" subtitle="Mapeamento de habilidades por colaborador" icon="fa-th" />
        <Card className={styles.emptyCard}>
          <i className="fas fa-th" style={{ fontSize: '2rem', color: '#d1d5db' }} />
          <p>
            {state.status === 'no_firebase'
              ? 'Firebase não configurado. Configure o .env para carregar a matriz.'
              : `Erro: ${state.message}`}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Matriz de Polivalência"
        subtitle={`${filtered.length} colaborador${filtered.length !== 1 ? 'es' : ''} · ${DEFAULT_SKILLS.length} habilidades`}
        icon="fa-th"
      />

      {/* Legenda */}
      <Card className={styles.legendCard}>
        <div className={styles.legendRow}>
          {legend.map(({ level, label }) => (
            <div key={level} className={styles.legendItem}>
              <span className={`${styles.dot} ${SKILL_DOT_CLASS[level]}`}>
                {SKILL_ICONS[level]}
              </span>
              <span className={styles.legendLabel}>{label}</span>
            </div>
          ))}
          {!isReadOnly && (
            <span className={styles.editHint}>
              <i className="fas fa-hand-pointer" /> Clique nas células para alterar o nível
            </span>
          )}
        </div>
      </Card>

      {/* Filtros */}
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Buscar colaborador ou cargo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.select}
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
        >
          <option value="">Todos os setores</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Matriz */}
      {filtered.length === 0 ? (
        <Card className={styles.emptyCard}>
          <i className="fas fa-th" style={{ fontSize: '2rem', color: '#d1d5db' }} />
          <p>Nenhum colaborador encontrado.</p>
        </Card>
      ) : (
        <Card className={styles.matrixCard}>
          <div className={styles.tableWrap}>
            <table className={styles.matrix}>
              <thead>
                <tr>
                  <th className={styles.nameCol}>Colaborador</th>
                  {DEFAULT_SKILLS.map((skill) => (
                    <th key={skill} className={styles.skillCol}>
                      <span className={styles.skillHeader}>{skill}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id}>
                    <td className={styles.empCell}>
                      <div className={styles.empName}>{emp.name ?? '—'}</div>
                      <div className={styles.empRole}>{emp.currentRole ?? ''}</div>
                    </td>
                    {DEFAULT_SKILLS.map((skill) => {
                      const lvl = getSkill(emp.id, skill)
                      return (
                        <td
                          key={skill}
                          className={`${styles.skillCell} ${!isReadOnly ? styles.clickable : ''}`}
                          title={SKILL_LABELS[lvl]}
                          onClick={() => void cycleSkill(emp.id, skill, lvl)}
                        >
                          <span className={`${styles.dot} ${SKILL_DOT_CLASS[lvl]}`}>
                            {SKILL_ICONS[lvl]}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
