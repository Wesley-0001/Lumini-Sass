import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, DataTable, TableShell } from '@/components/ui'
import { useCareerDashboardData } from '@/features/dashboard/hooks/useCareerDashboardData'
import { DEMO_STAFF_USERS } from '@/data/demoStaffUsers'
import styles from '@/features/rh/pages/RhEmployeesPage.module.css'
import {
  buildEmployeesTableModel,
  EMP_ROLE_ALL,
  EMP_STATUS_ALL,
  EMP_SUPERVISOR_ALL,
  employeeAvatarInitials,
  type EmployeesFilterState,
} from '@/features/employees/employeeService'

export function RhEmployeesPage() {
  const data = useCareerDashboardData()
  const [filter, setFilter] = useState<EmployeesFilterState>({
    search: '',
    status: EMP_STATUS_ALL,
    role: EMP_ROLE_ALL,
    supervisor: EMP_SUPERVISOR_ALL,
  })

  const employees = data.status === 'ready' ? data.employees : []

  const model = useMemo(() => {
    if (data.status !== 'ready') return null
    return buildEmployeesTableModel({
      employees,
      staffUsers: DEMO_STAFF_USERS.map((u) => ({ email: u.email, name: u.name })),
      filter,
    })
  }, [data.status, employees, filter])

  return (
    <section>
      <PageHeader
        icon="fa-id-card"
        title="Funcionários"
        subtitle="Tabela espelhada do legado (lista, filtros e progresso), usando a coleção employees."
      />

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

      {model && employees.length > 0 && (
        <>
          {model.noRhLinkCount > 0 && (
            <div className={styles.warningBox} role="status">
              <i className="fas fa-exclamation-triangle" aria-hidden />
              <span>
                <strong>{model.noRhLinkCount} funcionário(s)</strong> foram cadastrados sem vínculo com o RH (sem matrícula).
              </span>
            </div>
          )}

          <div className={styles.filterBar} aria-label="Filtros de funcionários">
            <div className="search-bar">
              <i className="fas fa-search" aria-hidden />
              <input
                type="search"
                autoComplete="off"
                placeholder="Buscar por nome, matrícula, cargo ou setor…"
                value={filter.search}
                onChange={(ev) => setFilter((p) => ({ ...p, search: ev.target.value }))}
                aria-label="Buscar colaboradores"
              />
            </div>
            <select
              className={styles.select}
              value={filter.status}
              onChange={(ev) => setFilter((p) => ({ ...p, status: ev.target.value }))}
              aria-label="Filtrar por status"
            >
              <option value={EMP_STATUS_ALL}>Todos os status</option>
              {model.statusOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              className={styles.select}
              value={filter.role}
              onChange={(ev) => setFilter((p) => ({ ...p, role: ev.target.value }))}
              aria-label="Filtrar por cargo"
            >
              <option value={EMP_ROLE_ALL}>Todos os cargos</option>
              {model.roleOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              className={styles.select}
              value={filter.supervisor}
              onChange={(ev) => setFilter((p) => ({ ...p, supervisor: ev.target.value }))}
              aria-label="Filtrar por supervisor"
            >
              <option value={EMP_SUPERVISOR_ALL}>Todos os supervisores</option>
              {model.supervisorOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <p className={styles.rowHint} role="status">
            {model.filteredEmployees === model.totalEmployees
              ? `${model.totalEmployees} funcionário${model.totalEmployees === 1 ? '' : 's'}.`
              : `${model.filteredEmployees} de ${model.totalEmployees} (filtros ativos).`}
          </p>

          {model.rows.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-filter" aria-hidden />
              <p>Nenhum colaborador corresponde à busca ou ao filtro de status.</p>
            </div>
          )}

          {model.rows.length > 0 && (
            <>
              <div className={styles.tableOnly}>
                <TableShell>
                  <DataTable>
                    <thead>
                      <tr>
                        <th>Funcionário</th>
                        <th>Cargo</th>
                        <th>Tempo</th>
                        <th>Progresso</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.rows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <div className="emp-name-cell">
                              <div className="emp-avatar-sm" aria-hidden>
                                {employeeAvatarInitials(row.name)}
                              </div>
                              <div>
                                <div className="emp-name">
                                  {row.name}
                                  {row.rhMatricula ? (
                                    <span className={styles.matriculaHint}>Mat.{row.rhMatricula}</span>
                                  ) : null}
                                </div>
                                <div className="emp-meta">
                                  {row.supervisorLabel} · {row.sectorLabel}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="role-cell">
                              <span className="role-current">{row.currentRoleLabel}</span>
                              {row.desiredRoleLabel ? (
                                <>
                                  <span className="role-arrow">→</span>
                                  <span className="role-desired">{row.desiredRoleLabel}</span>
                                </>
                              ) : null}
                            </div>
                          </td>
                          <td>{row.tenureLabel}</td>
                          <td>
                            <div className="progress-wrap">
                              <div className="progress-bar-bg" aria-hidden>
                                <div
                                  className={['progress-bar-fill', row.progressColor].join(' ')}
                                  style={{ width: `${row.progressPct}%` }}
                                />
                              </div>
                              <span className="progress-pct">{row.progressPct}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={['status-badge', row.statusClass].join(' ')}>{row.statusLabel}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </DataTable>
                </TableShell>
              </div>

              <div className={styles.cardOnly}>
                {model.rows.map((row) => (
                  <article key={row.id} className={styles.empCard}>
                    <div className={styles.empCardTitle}>{row.name}</div>
                    <div className={styles.empGrid}>
                      <span className={styles.empLabel}>Matrícula</span>
                      <span>{row.rhMatricula || '—'}</span>
                      <span className={styles.empLabel}>Cargo</span>
                      <span>
                        {row.currentRoleLabel}
                        {row.desiredRoleLabel ? ` → ${row.desiredRoleLabel}` : ''}
                      </span>
                      <span className={styles.empLabel}>Supervisor</span>
                      <span>{row.supervisorLabel}</span>
                      <span className={styles.empLabel}>Setor</span>
                      <span>{row.sectorLabel}</span>
                      <span className={styles.empLabel}>Tempo</span>
                      <span>{row.tenureLabel}</span>
                      <span className={styles.empLabel}>Progresso</span>
                      <span>
                        <span className={styles.progressInline}>{row.progressPct}%</span>
                      </span>
                      <span className={styles.empLabel}>Status</span>
                      <span>
                        <span className={['status-badge', row.statusClass].join(' ')}>{row.statusLabel}</span>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
