import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, Card, FormField, FormRow, Modal, ModalFooter } from '@/components/ui'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import { loadLegacyRuntime } from '@/lib/legacyLoader'

type HrEmployee = {
  matricula: string
  nome: string
  situacao?: string
  setor?: string
  cargo?: string
  lider?: string
}

export type ProductionTeam = {
  id: string
  nome?: string
  lider?: string
  descricao?: string
  membros?: HrEmployee[]
  atualizadoEm?: number
  criadoEm?: number
}

function getTeamsCompat(): ProductionTeam[] {
  const w = window as any
  if (typeof w.getTeams === 'function') return w.getTeams() ?? []
  if (w._cache?.teams) return w._cache.teams
  return []
}

async function persistTeamsCompat(next: ProductionTeam[]): Promise<void> {
  const w = window as any
  if (typeof w.persistTeams === 'function') {
    await w.persistTeams(next)
    return
  }
  if (typeof w.saveTeams === 'function') {
    await w.saveTeams(next)
    return
  }
  if (!w._cache) w._cache = {}
  w._cache.teams = next
}

function getHREmployeesCompat(): HrEmployee[] {
  const w = window as any
  if (typeof w.getHREmployees === 'function') return w.getHREmployees() ?? []
  if (w._cache?.hrEmployees) return w._cache.hrEmployees
  if (w.HR_EMPLOYEES_SEED) return w.HR_EMPLOYEES_SEED
  return []
}

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

function buildId(): string {
  return `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function TeamsPage() {
  const { user } = useStaffAuth()
  const role = user?.role ?? 'supervisor'
  const readOnly = role === 'boss'

  const [ready, setReady] = useState(false)
  const [teams, setTeams] = useState<ProductionTeam[]>([])

  const [q, setQ] = useState('')
  const [lider, setLider] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftNome, setDraftNome] = useState('')
  const [draftLider, setDraftLider] = useState('')
  const [draftDescricao, setDraftDescricao] = useState('')
  const [draftSelected, setDraftSelected] = useState<Record<string, boolean>>({})
  const [membersQ, setMembersQ] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await loadLegacyRuntime()
      if (cancelled) return
      setTeams(getTeamsCompat())
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const leaders = useMemo(() => {
    const prod = getHREmployeesCompat().filter((e) => e.setor === 'Produção')
    return [...new Set(prod.map((e) => e.lider).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)))
  }, [ready])

  const filtered = useMemo(() => {
    const qq = normalize(q)
    const lf = lider
    return teams
      .filter((t) => {
        const matchQ =
          !qq ||
          normalize(t.nome ?? '').includes(qq) ||
          normalize(t.lider ?? '').includes(qq) ||
          normalize(t.descricao ?? '').includes(qq)
        const matchLider = !lf || t.lider === lf
        return matchQ && matchLider
      })
      .sort((a, b) => normalize(a.lider ?? '').localeCompare(normalize(b.lider ?? '')))
  }, [teams, q, lider])

  const productionActiveEmployees = useMemo(() => {
    const all = getHREmployeesCompat()
    return all
      .filter((e) => e.setor === 'Produção')
      .filter((e) => e.situacao === 'ATIVO' || e.situacao === 'FÉRIAS' || !e.situacao)
      .sort((a, b) => normalize(a.nome).localeCompare(normalize(b.nome)))
  }, [ready])

  const memberOptions = useMemo(() => {
    const qq = normalize(membersQ)
    const filterByLeader = draftLider ? true : false
    return productionActiveEmployees.filter((e) => {
      if (filterByLeader && e.lider && draftLider && e.lider !== draftLider) return false
      if (!qq) return true
      return normalize(e.nome).includes(qq) || normalize(e.matricula).includes(qq)
    })
  }, [productionActiveEmployees, membersQ, draftLider])

  function openCreate() {
    setEditingId(null)
    setDraftNome('')
    setDraftLider('')
    setDraftDescricao('')
    setDraftSelected({})
    setMembersQ('')
    setModalOpen(true)
  }

  function openEdit(id: string) {
    const t = teams.find((x) => x.id === id)
    if (!t) return
    setEditingId(id)
    setDraftNome(t.nome ?? '')
    setDraftLider(t.lider ?? '')
    setDraftDescricao(t.descricao ?? '')
    const selected: Record<string, boolean> = {}
    ;(t.membros ?? []).forEach((m) => {
      if (m?.matricula) selected[m.matricula] = true
    })
    setDraftSelected(selected)
    setMembersQ('')
    setModalOpen(true)
  }

  async function saveDraft() {
    const nome = draftNome.trim()
    const ldr = draftLider.trim()
    const desc = draftDescricao.trim()
    const selectedMatriculas = Object.entries(draftSelected)
      .filter(([, v]) => v)
      .map(([k]) => k)

    const membersByMat = new Map(productionActiveEmployees.map((e) => [e.matricula, e]))
    const membros = selectedMatriculas.map((mat) => membersByMat.get(mat)).filter(Boolean) as HrEmployee[]

    const now = Date.now()
    const next: ProductionTeam[] = editingId
      ? teams.map((t) => (t.id === editingId ? { ...t, nome, lider: ldr, descricao: desc, membros, atualizadoEm: now } : t))
      : [
          ...teams,
          {
            id: buildId(),
            nome,
            lider: ldr,
            descricao: desc,
            membros,
            criadoEm: now,
            atualizadoEm: now,
          },
        ]

    setTeams(next)
    await persistTeamsCompat(next)
    setModalOpen(false)
  }

  async function removeTeam(id: string) {
    const next = teams.filter((t) => t.id !== id)
    setTeams(next)
    await persistTeamsCompat(next)
  }

  return (
    <section>
      <PageHeader
        icon="fa-layer-group"
        title="Equipes de Produção"
        subtitle="Listar, buscar e manter equipes (migração do legado)"
        actions={
          !readOnly ? (
            <Button onClick={openCreate} disabled={!ready}>
              <i className="fas fa-plus" aria-hidden /> Nova equipe
            </Button>
          ) : null
        }
      />

      <Card>
        <FormRow>
          <FormField label="Buscar" icon="fa-search">
            <input
              className="rh-input"
              placeholder="Nome, líder ou descrição…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </FormField>
          <FormField label="Líder" icon="fa-user-tie">
            <select className="rh-select" value={lider} onChange={(e) => setLider(e.target.value)}>
              <option value="">Todos</option>
              {leaders.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </FormField>
        </FormRow>

        {!ready ? (
          <div style={{ padding: 12, color: 'var(--text-muted, #9CA3AF)', fontSize: 14 }}>Carregando…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 12, color: 'var(--text-muted, #9CA3AF)', fontSize: 14 }}>Nenhuma equipe encontrada.</div>
        ) : (
          <div className="table-wrapper" style={{ marginTop: 8 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Líder</th>
                  <th>Membros</th>
                  <th style={{ width: 220 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>{t.nome || '—'}</td>
                    <td>{t.lider || '—'}</td>
                    <td>{t.membros?.length ?? 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {!readOnly ? (
                          <Button variant="outline" onClick={() => openEdit(t.id)}>
                            <i className="fas fa-edit" aria-hidden /> Editar
                          </Button>
                        ) : null}
                        {!readOnly ? (
                          <Button
                            variant="outline"
                            className="red"
                            onClick={() => {
                              if (confirm('Excluir esta equipe?')) void removeTeam(t.id)
                            }}
                          >
                            <i className="fas fa-trash" aria-hidden /> Excluir
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar equipe' : 'Nova equipe'}
        footer={
          <ModalFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void saveDraft()} disabled={readOnly || !ready}>
              Salvar
            </Button>
          </ModalFooter>
        }
      >
        <FormRow>
          <FormField label="Nome" icon="fa-layer-group">
            <input className="rh-input" value={draftNome} onChange={(e) => setDraftNome(e.target.value)} />
          </FormField>
          <FormField label="Líder" icon="fa-user-tie">
            <select className="rh-select" value={draftLider} onChange={(e) => setDraftLider(e.target.value)}>
              <option value="">Selecione…</option>
              {leaders.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </FormField>
        </FormRow>

        <FormField label="Descrição" icon="fa-align-left">
          <textarea
            className="rh-textarea"
            rows={3}
            value={draftDescricao}
            onChange={(e) => setDraftDescricao(e.target.value)}
          />
        </FormField>

        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <strong>Membros (Produção)</strong>
            <span style={{ fontSize: 13, color: 'var(--text-muted, #9CA3AF)' }}>
              Selecionados: {Object.values(draftSelected).filter(Boolean).length}
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <input
              className="rh-input"
              placeholder={draftLider ? 'Filtrando pelo líder selecionado… (buscar por nome ou matrícula)' : 'Buscar por nome ou matrícula…'}
              value={membersQ}
              onChange={(e) => setMembersQ(e.target.value)}
            />
          </div>

          <div
            className="team-members-checklist"
            style={{ marginTop: 8, maxHeight: 320, overflow: 'auto', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {memberOptions.map((e) => (
              <label key={e.matricula} className="team-member-check">
                <input
                  type="checkbox"
                  checked={!!draftSelected[e.matricula]}
                  onChange={(ev) => {
                    const checked = ev.currentTarget.checked
                    setDraftSelected((cur) => ({ ...cur, [e.matricula]: checked }))
                  }}
                />
                <span>
                  <strong>{e.nome}</strong> <span style={{ opacity: 0.75 }}>({e.matricula})</span>
                  {e.lider ? <span style={{ opacity: 0.65 }}> — Líder: {e.lider}</span> : null}
                </span>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </section>
  )
}

