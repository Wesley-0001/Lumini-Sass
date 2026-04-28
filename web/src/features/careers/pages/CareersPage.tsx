/**
 * CareersPage.tsx
 * Espelha renderCareers + saveCareer_modal + getCareers de app.js (linhas 1378-1516)
 * SEM window.* / LegacyBridge
 */
import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, Modal, ModalFooter } from '@/components/ui'
import { useCareers } from '@/features/careers/hooks/useCareers'
import { useCareerDashboardData } from '@/features/dashboard/hooks/useCareerDashboardData'
import { calcTenureMonths, formatTenureLabel } from '@/lib/dashboard/careerKpi'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import type { Career } from '@/features/hr/types/hrTypes'
import styles from './CareersPage.module.css'

// ─── Helpers ──────────────────────────────────────────────────────────────
function sortedCareers(careers: Career[]): Career[] {
  return [...careers].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
}

function levelLabel(level: number): string {
  if (level === 0) return 'Entrada'
  if (level <= 2) return `Nível ${level}`
  if (level <= 3) return `Sênior`
  if (level <= 4) return `Líder`
  return `Gestão`
}

function levelColor(level: number): string {
  const palette = ['#9ca3af', '#4361ee', '#06d6a0', '#f59e0b', '#a78bfa', '#ef4444']
  return palette[Math.min(level, palette.length - 1)]
}

// ─── Modal de edição/criação ──────────────────────────────────────────────
interface CareerModalProps {
  career: Career
  onClose: () => void
  onSave: (c: Career) => Promise<void>
}

function CareerModal({ career, onClose, onSave }: CareerModalProps) {
  const [form, setForm] = useState<Career>({ ...career })
  const [compInput, setCompInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function update<K extends keyof Career>(key: K, val: Career[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  function addComp() {
    const c = compInput.trim()
    if (!c) return
    if (!form.competencies.includes(c)) update('competencies', [...form.competencies, c])
    setCompInput('')
  }

  function removeComp(idx: number) {
    update('competencies', form.competencies.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!form.name.trim()) { setErr('Nome é obrigatório.'); return }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch {
      setErr('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title={career.name ? `Editar: ${career.name}` : 'Novo Cargo na Trilha'}
      onClose={onClose}
      footer={
        <ModalFooter>
          <button className={styles.btnSecondary} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </ModalFooter>
      }
    >
      <div className={styles.formBody}>
        {err && <div className={styles.formErr}>{err}</div>}

        <div className={styles.formRow}>
          <label className={styles.formLabel}>Nome do Cargo *</label>
          <input
            className={styles.formInput}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Ex: Operador de Calandra 1"
          />
        </div>

        <div className={styles.formGrid2}>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Nível</label>
            <select
              className={styles.formInput}
              value={form.level}
              onChange={(e) => update('level', parseInt(e.target.value))}
            >
              {[0, 1, 2, 3, 4, 5].map((l) => (
                <option key={l} value={l}>{l} — {levelLabel(l)}</option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Mínimo de Meses</label>
            <input
              className={styles.formInput}
              type="number"
              min={0}
              value={form.minMonths}
              onChange={(e) => update('minMonths', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <label className={styles.formLabel}>Competências</label>
          <div className={styles.compInput}>
            <input
              className={styles.formInput}
              value={compInput}
              onChange={(e) => setCompInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addComp())}
              placeholder="Digitar competência e pressionar Enter"
            />
            <button className={styles.btnAdd} onClick={addComp}>
              <i className="fas fa-plus" />
            </button>
          </div>
          <div className={styles.compTags}>
            {form.competencies.map((c, i) => (
              <span key={i} className={styles.compTag}>
                {c}
                <button onClick={() => removeComp(i)} className={styles.compRemove}>&times;</button>
              </span>
            ))}
            {form.competencies.length === 0 && (
              <span className={styles.compEmpty}>Nenhuma competência adicionada</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────
export function CareersPage() {
  const { state, getCareers, upsert, remove, createNew } = useCareers()
  const dashState = useCareerDashboardData()
  const { user } = useStaffAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'rh'

  const [search,      setSearch]      = useState('')
  const [filterLevel, setFilterLevel] = useState<number | ''>('')
  const [editCareer,  setEditCareer]  = useState<Career | null>(null)
  const [viewCareer,  setViewCareer]  = useState<Career | null>(null)
  const [delConfirm,  setDelConfirm]  = useState<string | null>(null)

  const careers = getCareers()

  // Funcionários do dashboard para cruzar com a trilha
  const employees = useMemo(
    () => (dashState.status === 'ready' ? dashState.employees : []),
    [dashState],
  )

  const filtered = useMemo(() => {
    let list = sortedCareers(careers)
    if (filterLevel !== '') list = list.filter((c) => c.level === filterLevel)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q))
    }
    return list
  }, [careers, filterLevel, search])

  // Contagem de funcionários por cargo
  const empByRole = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of employees) {
      if (e.currentRole) map[e.currentRole] = (map[e.currentRole] ?? 0) + 1
    }
    return map
  }, [employees])

  // Funcionários elegíveis para um cargo (currentRole === career.name)
  function empEligibleForCareer(career: Career) {
    return employees.filter((e) => {
      const months = e.admission ? calcTenureMonths(e.admission) : 0
      return e.currentRole === career.name && months >= career.minMonths
    })
  }

  async function handleDelete(id: string) {
    await remove(id)
    setDelConfirm(null)
  }

  const levels = useMemo(
    () => [...new Set(careers.map((c) => c.level))].sort((a, b) => a - b),
    [careers],
  )

  if (state.status === 'loading') {
    return (
      <div className={styles.loadWrap}>
        <div className={styles.spinner} />
        <span>Carregando trilha de carreira…</span>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Trilha de Carreira"
        subtitle={`${careers.length} cargo${careers.length !== 1 ? 's' : ''} configurado${careers.length !== 1 ? 's' : ''}`}
        icon="fa-sitemap"
        actions={
          canEdit ? (
            <button className={styles.btnPrimary} onClick={() => setEditCareer(createNew())}>
              <i className="fas fa-plus" /> Novo Cargo
            </button>
          ) : undefined
        }
      />

      {state.status === 'error' && (
        <div className={styles.warnBanner}>
          <i className="fas fa-exclamation-triangle" /> {state.message} (usando dados locais)
        </div>
      )}

      {/* Filtros */}
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Buscar cargo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.select}
          value={String(filterLevel)}
          onChange={(e) => setFilterLevel(e.target.value === '' ? '' : parseInt(e.target.value))}
        >
          <option value="">Todos os níveis</option>
          {levels.map((l) => (
            <option key={l} value={l}>Nível {l} — {levelLabel(l)}</option>
          ))}
        </select>
      </div>

      {/* Grid de cards */}
      {filtered.length === 0 ? (
        <Card className={styles.emptyCard}>
          <i className="fas fa-sitemap" style={{ fontSize: '2rem', color: '#d1d5db' }} />
          <p>Nenhum cargo encontrado.</p>
        </Card>
      ) : (
        <div className={styles.cardsGrid}>
          {filtered.map((career) => {
            const color   = levelColor(career.level)
            const empCount = empByRole[career.name] ?? 0
            const eligible = empEligibleForCareer(career).length

            return (
              <Card key={career.id} className={styles.careerCard}>
                {/* Header */}
                <div className={styles.cardHeader} style={{ borderLeftColor: color }}>
                  <div className={styles.cardLevel} style={{ background: `${color}20`, color }}>
                    {levelLabel(career.level)}
                  </div>
                  <h4 className={styles.cardName}>{career.name}</h4>
                  <div className={styles.cardMeta}>
                    <span><i className="fas fa-clock" /> Mín. {career.minMonths}m</span>
                    {empCount > 0 && (
                      <span><i className="fas fa-users" /> {empCount} colaborador{empCount !== 1 ? 'es' : ''}</span>
                    )}
                    {eligible > 0 && (
                      <span className={styles.eligibleBadge}>
                        <i className="fas fa-star" /> {eligible} elegível{eligible !== 1 ? 'is' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Competências (preview) */}
                {career.competencies.length > 0 && (
                  <div className={styles.compPreview}>
                    {career.competencies.slice(0, 3).map((c, i) => (
                      <span key={i} className={styles.compChip}>{c}</span>
                    ))}
                    {career.competencies.length > 3 && (
                      <span className={styles.compMore}>+{career.competencies.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Ações */}
                <div className={styles.cardActions}>
                  <button className={styles.btnView} onClick={() => setViewCareer(career)}>
                    <i className="fas fa-eye" /> Ver
                  </button>
                  {canEdit && (
                    <>
                      <button className={styles.btnEdit} onClick={() => setEditCareer({ ...career })}>
                        <i className="fas fa-pencil-alt" /> Editar
                      </button>
                      <button className={styles.btnDel} onClick={() => setDelConfirm(career.id)}>
                        <i className="fas fa-trash" />
                      </button>
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal: visualizar */}
      {viewCareer && (
        <Modal open title={viewCareer.name} onClose={() => setViewCareer(null)}>
          <div className={styles.viewBody}>
            <div className={styles.viewMeta}>
              <span
                className={styles.viewLevel}
                style={{ background: `${levelColor(viewCareer.level)}20`, color: levelColor(viewCareer.level) }}
              >
                {levelLabel(viewCareer.level)}
              </span>
              <span className={styles.viewMonths}>
                <i className="fas fa-clock" /> Mínimo: {viewCareer.minMonths} meses
              </span>
            </div>

            <h4 className={styles.viewSection}>Competências Requeridas</h4>
            {viewCareer.competencies.length === 0 ? (
              <p className={styles.viewEmpty}>Nenhuma competência cadastrada.</p>
            ) : (
              <ul className={styles.compList}>
                {viewCareer.competencies.map((c, i) => (
                  <li key={i}><i className="fas fa-check-circle" /> {c}</li>
                ))}
              </ul>
            )}

            {/* Colaboradores neste cargo */}
            {(() => {
              const empList = employees.filter((e) => e.currentRole === viewCareer.name)
              if (!empList.length) return null
              return (
                <>
                  <h4 className={styles.viewSection}>
                    Colaboradores neste Cargo ({empList.length})
                  </h4>
                  <div className={styles.empList}>
                    {empList.map((e) => {
                      const months = e.admission ? calcTenureMonths(e.admission) : 0
                      const eligible = months >= viewCareer.minMonths
                      return (
                        <div key={e.id} className={styles.empRow}>
                          <div className={styles.empAvatar}>
                            {(e.name ?? '?').split(' ').slice(0,2).map((n) => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <div className={styles.empName}>{e.name}</div>
                            <div className={styles.empTenure}>{formatTenureLabel(months)}</div>
                          </div>
                          {eligible && (
                            <span className={styles.eligibleBadge} style={{ marginLeft: 'auto' }}>
                              Elegível
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>
        </Modal>
      )}

      {/* Modal: editar/criar */}
      {editCareer && (
        <CareerModal
          career={editCareer}
          onClose={() => setEditCareer(null)}
          onSave={upsert}
        />
      )}

      {/* Modal: confirmar exclusão */}
      {delConfirm && (
        <Modal
          open
          title="Confirmar Exclusão"
          onClose={() => setDelConfirm(null)}
          footer={
            <ModalFooter>
              <button className={styles.btnSecondary} onClick={() => setDelConfirm(null)}>
                Cancelar
              </button>
              <button className={styles.btnDanger} onClick={() => void handleDelete(delConfirm)}>
                Excluir
              </button>
            </ModalFooter>
          }
        >
          <p style={{ padding: '0.5rem 0' }}>
            Tem certeza que deseja remover este cargo da trilha? Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  )
}
