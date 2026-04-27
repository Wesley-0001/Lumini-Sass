import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, DataTable, TableShell } from '@/components/ui'
import { useCareerDashboardData } from '@/features/dashboard/hooks/useCareerDashboardData'
import { calcTenureMonths, formatTenureLabel, type CareerEmployee } from '@/lib/dashboard/careerKpi'
import styles from '@/features/rh/pages/RhEmployeesPage.module.css'

const STATUS_FILTER_ALL = '__ALL__'
const STATUS_FILTER_EMPTY = '__EMPTY__'

function initials(name: string | undefined): string {
  if (!name?.trim()) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function formatSectorEquipe(e: CareerEmployee): string {
  const parts = [e.sector?.trim(), e.team?.trim()].filter(Boolean) as string[]
  return parts.length ? parts.join(' · ') : '—'
}

function statusClassFor(status: string | undefined): string {
  const s = (status || '').trim()
  const map: Record<string, string> = {
    ready: 'ready',
    pending_carlos: 'pending-carlos',
    pending_samuel: 'pending-samuel',
    pending_samuel_return: 'pending-samuel-return',
    promoted: 'promoted',
    approved: 'approved',
  }
  return map[s] || 'registered'
}

function matchSearch(e: CareerEmployee, q: string): boolean {
  if (!q) return true
  const n = (e.name || '').toLowerCase()
  const mat = String(e.rhMatricula ?? '')
    .toLowerCase()
    .trim()
  const role = (e.currentRole || '').toLowerCase()
  const setor = (e.sector || '').toLowerCase()
  return n.includes(q) || mat.includes(q) || role.includes(q) || setor.includes(q)
}

function matchStatus(e: CareerEmployee, filter: string): boolean {
  if (filter === STATUS_FILTER_ALL) return true
  const s = (e.status || '').trim()
  if (filter === STATUS_FILTER_EMPTY) return !s
  return s === filter
}

export function RhEmployeesPage() {
  const data = useCareerDashboardData()
  const [search, setSearch] = useState('')
  const [statusKey, setStatusKey] = useState<string>(STATUS_FILTER_ALL)

  const employees = data.status === 'ready' ? data.employees : []

  const statusOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const e of employees) {
      const s = (e.status || '').trim()
      const key = s || STATUS_FILTER_EMPTY
      seen.set(key, s || '(sem status)')
    }
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
  }, [employees])

  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => {
    return employees.filter((e) => matchSearch(e, q) && matchStatus(e, statusKey))
  }, [employees, q, statusKey])

  return (
    <section>
      <PageHeader
        icon="fa-id-card"
        title="Colaboradores (RH)"
        subtitle="Listagem somente leitura da coleção employees no Firestore, alinhada ao cadastro de carreira."
      />

      <p className={styles.lead}>
        Busca e filtro reutilizam os mesmos campos usados no dashboard; tempo de casa segue a regra de meses a partir da
        admissão.
      </p>

      {data.status === 'loading' && (
        <p className={styles.muted} role="status">
          <i className="fas fa-spinner fa-pulse" aria-hidden /> Carregando colaboradores…
        </p>
      )}

      {data.status === 'no_firebase' && (
        <div className="empty-state" role="status">
          <i className="fas fa-cloud" aria-hidden />
          <p>Configure o Firebase em <code>web/.env.local</code> para carregar a coleção employees.</p>
        </div>
      )}

      {data.status === 'error' && (
        <Card>
          <p className={styles.errorText}>
            <i className="fas fa-exclamation-triangle" aria-hidden /> {data.message}
          </p>
        </Card>
      )}

      {data.status === 'ready' && employees.length === 0 && (
        <div className="empty-state" role="status">
          <i className="fas fa-users" aria-hidden />
          <p>Nenhum documento em employees. Quando houver registros, eles aparecerão aqui.</p>
        </div>
      )}

      {data.status === 'ready' && employees.length > 0 && (
        <>
          <div className={styles.filterBar}>
            <div className="search-bar">
              <i className="fas fa-search" aria-hidden />
              <input
                type="search"
                autoComplete="off"
                placeholder="Buscar por nome, matrícula, cargo ou setor…"
                value={search}
                onChange={(ev) => setSearch(ev.target.value)}
                aria-label="Buscar colaboradores"
              />
            </div>
            <select
              className={styles.select}
              value={statusKey}
              onChange={(ev) => setStatusKey(ev.target.value)}
              aria-label="Filtrar por status"
            >
              <option value={STATUS_FILTER_ALL}>Todos os status</option>
              {statusOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <p className={styles.rowHint} role="status">
            {filtered.length === employees.length
              ? `${employees.length} colaborador${employees.length === 1 ? '' : 'es'}.`
              : `${filtered.length} de ${employees.length} (filtros ativos).`}
          </p>

          {filtered.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-filter" aria-hidden />
              <p>Nenhum colaborador corresponde à busca ou ao filtro de status.</p>
            </div>
          )}

          {filtered.length > 0 && (
            <>
              <div className={styles.tableOnly}>
                <TableShell>
                  <DataTable>
                    <thead>
                      <tr>
                        <th>Matrícula</th>
                        <th>Nome</th>
                        <th>Cargo atual</th>
                        <th>Cargo desejado</th>
                        <th>Setor / equipe</th>
                        <th>Supervisor</th>
                        <th>Status</th>
                        <th>Tempo de casa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((e) => {
                        const months = calcTenureMonths(e.admission)
                        const tenure = formatTenureLabel(months)
                        const statusLabel = (e.status && e.status.trim()) || '—'
                        return (
                          <tr key={e.id}>
                            <td>{e.rhMatricula != null && e.rhMatricula !== '' ? e.rhMatricula : '—'}</td>
                            <td>
                              <div className={styles.nameCell}>
                                <span className={styles.avatar} aria-hidden>
                                  {initials(e.name)}
                                </span>
                                <span className={styles.nameText}>{e.name?.trim() || '—'}</span>
                              </div>
                            </td>
                            <td>{e.currentRole?.trim() || '—'}</td>
                            <td>{e.desiredRole == null || e.desiredRole === '' ? '—' : e.desiredRole}</td>
                            <td>{formatSectorEquipe(e)}</td>
                            <td>{e.supervisor?.trim() || '—'}</td>
                            <td>
                              <span className={`status-badge status-${statusClassFor(e.status)}`}>{statusLabel}</span>
                            </td>
                            <td>{e.admission ? tenure : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </DataTable>
                </TableShell>
              </div>

              <div className={styles.cardOnly}>
                {filtered.map((e) => {
                  const months = calcTenureMonths(e.admission)
                  const tenure = formatTenureLabel(months)
                  const statusLabel = (e.status && e.status.trim()) || '—'
                  return (
                    <article key={e.id} className={styles.empCard}>
                      <div className={styles.empCardTitle}>{e.name?.trim() || '—'}</div>
                      <div className={styles.empGrid}>
                        <span className={styles.empLabel}>Matrícula</span>
                        <span>{e.rhMatricula != null && e.rhMatricula !== '' ? e.rhMatricula : '—'}</span>
                        <span className={styles.empLabel}>Cargo atual</span>
                        <span>{e.currentRole?.trim() || '—'}</span>
                        <span className={styles.empLabel}>Cargo desejado</span>
                        <span>{e.desiredRole == null || e.desiredRole === '' ? '—' : e.desiredRole}</span>
                        <span className={styles.empLabel}>Setor / equipe</span>
                        <span>{formatSectorEquipe(e)}</span>
                        <span className={styles.empLabel}>Supervisor</span>
                        <span>{e.supervisor?.trim() || '—'}</span>
                        <span className={styles.empLabel}>Status</span>
                        <span>
                          <span className={`status-badge status-${statusClassFor(e.status)}`}>{statusLabel}</span>
                        </span>
                        <span className={styles.empLabel}>Tempo de casa</span>
                        <span>{e.admission ? tenure : '—'}</span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
