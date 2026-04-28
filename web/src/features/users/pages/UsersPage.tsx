import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { DataTable, TableShell } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import { useToast } from '@/components/ui/toast/toastContext'
import { ALL_MODULES } from '@/lib/permissions'
import { getLegacyUserPermissions } from '@/features/users/managedUserPermissions'
import { PermissionsEditorModal } from '@/features/users/PermissionsEditorModal'
import { UserEditorModal } from '@/features/users/UserEditorModal'
import { useStaffUsers } from '@/features/users/useStaffUsers'
import { USER_ROLES, type ManagedUser } from '@/features/users/usersModel'

export function UsersPage() {
  const { user: currentUser } = useStaffAuth()
  const { pushToast } = useToast()
  const { users, loading, error, persistAll } = useStaffUsers()

  const [search, setSearch] = useState('')
  const [editorId, setEditorId] = useState<string | null>(null)
  const [permTarget, setPermTarget] = useState<ManagedUser | null>(null)

  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!q) return users
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
    )
  }, [users, q])

  const totalModules = ALL_MODULES.length

  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/app/dashboard" replace />
  }

  async function toggleActive(u: ManagedUser) {
    if (u.isDemo && currentUser?.email === u.email) {
      pushToast('Não é possível desativar seu próprio usuário.', 'warning')
      return
    }
    const newState = u.active === false
    const ok = window.confirm(
      `${newState ? 'Ativar' : 'Desativar'} o usuário "${u.name}"?`,
    )
    if (!ok) return
    const next = users.map((x) =>
      x.id === u.id ? { ...x, active: newState } : x,
    )
    await persistAll(next)
    pushToast(`Usuário ${newState ? 'ativado' : 'desativado'}.`, newState ? 'success' : 'info')
  }

  async function handleDelete(u: ManagedUser) {
    if (!u || u.isDemo) return
    const ok = window.confirm(`Excluir "${u.name}"? Ação irreversível.`)
    if (!ok) return
    const next = users.filter((x) => x.id !== u.id)
    await persistAll(next)
    pushToast('Usuário excluído.', 'info')
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>
            <i className="fas fa-user-cog" aria-hidden /> Gestão de Usuários
          </h2>
          <span className="page-sub">Crie, edite e controle as permissões de cada usuário</span>
        </div>
        <Button type="button" onClick={() => setEditorId('')}>
          <i className="fas fa-plus" aria-hidden /> Novo Usuário
        </Button>
      </div>

      <div
        className="cards-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))',
          marginBottom: 20,
        }}
      >
        <Card variant="stat" className="blue">
          <div className="stat-icon">
            <i className="fas fa-users" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{users.length}</span>
            <span className="stat-label">Total de Usuários</span>
          </div>
        </Card>
        <Card variant="stat" className="green">
          <div className="stat-icon">
            <i className="fas fa-check-circle" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{users.filter((u) => u.active !== false).length}</span>
            <span className="stat-label">Ativos</span>
          </div>
        </Card>
        <Card variant="stat" className="orange">
          <div className="stat-icon">
            <i className="fas fa-ban" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{users.filter((u) => u.active === false).length}</span>
            <span className="stat-label">Desativados</span>
          </div>
        </Card>
        <Card variant="stat" className="purple">
          <div className="stat-icon">
            <i className="fas fa-user-plus" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{users.filter((u) => !u.isDemo).length}</span>
            <span className="stat-label">Customizados</span>
          </div>
        </Card>
      </div>

      <div className="rh-filter-bar" style={{ marginBottom: 16 }}>
        <div className="rh-search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <i
            className="fas fa-search"
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
              fontSize: 13,
            }}
            aria-hidden
          />
          <input
            type="text"
            placeholder="Buscar usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36, width: '100%' }}
          />
        </div>
      </div>

      {loading && (
        <p className="page-sub" role="status">
          <i className="fas fa-spinner fa-pulse" aria-hidden /> Carregando usuários…
        </p>
      )}

      {error && !loading && (
        <p style={{ color: '#b45309' }} role="alert">
          {error} — exibindo DEMO + dados locais.
        </p>
      )}

      {!loading && (
        <TableShell>
          <DataTable>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Permissões</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const roleMeta = USER_ROLES.find((r) => r.value === u.role) ?? {
                    label: u.role,
                    icon: '👤',
                  }
                  const perms = getLegacyUserPermissions(u.email, u.role)
                  const activeModules = Object.values(perms).filter(Boolean).length
                  const isActive = u.active !== false
                  const pct =
                    totalModules > 0 ? Math.round((activeModules / totalModules) * 100) : 0

                  return (
                    <tr key={u.id} style={!isActive ? { opacity: 0.55 } : undefined}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg,#002B5B,#1B4F8A)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: 13,
                              flexShrink: 0,
                            }}
                          >
                            {(u.name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name || '—'}</div>
                            {u.isDemo ? (
                              <span
                                style={{
                                  fontSize: 10,
                                  background: '#EEF2FF',
                                  color: '#6366F1',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  fontWeight: 600,
                                }}
                              >
                                DEMO
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <span className={`users-role-badge role-${u.role}`}>
                          {roleMeta.icon} {roleMeta.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              flex: 1,
                              maxWidth: 100,
                              height: 6,
                              background: 'var(--border)',
                              borderRadius: 3,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${pct}%`,
                                background: 'linear-gradient(90deg,#002B5B,#1B4F8A)',
                                borderRadius: 3,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {activeModules}/{totalModules}
                          </span>
                          <Button
                            variant="icon"
                            type="button"
                            title="Editar permissões"
                            style={{ fontSize: 11, padding: '4px 8px', height: 'auto' }}
                            onClick={() => setPermTarget(u)}
                          >
                            <i className="fas fa-lock" aria-hidden />
                          </Button>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`purch-badge ${isActive ? 'badge-success' : 'badge-danger'}`}
                          style={{ cursor: 'pointer' }}
                          title={isActive ? 'Clique para desativar' : 'Clique para ativar'}
                          role="button"
                          tabIndex={0}
                          onClick={() => void toggleActive(u)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') void toggleActive(u)
                          }}
                        >
                          {isActive ? '✅ Ativo' : '⛔ Inativo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Button
                            variant="icon"
                            type="button"
                            title="Editar usuário"
                            onClick={() => setEditorId(u.id)}
                          >
                            <i className="fas fa-edit" aria-hidden />
                          </Button>
                          {!u.isDemo ? (
                            <Button
                              variant="icon"
                              type="button"
                              title="Excluir"
                              style={{ color: '#DC2626' }}
                              onClick={() => void handleDelete(u)}
                            >
                              <i className="fas fa-trash" aria-hidden />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </DataTable>
        </TableShell>
      )}

      <UserEditorModal
        open={editorId !== null}
        editId={editorId === '' ? null : editorId}
        users={users}
        onClose={() => setEditorId(null)}
        persistAll={persistAll}
      />

      <PermissionsEditorModal
        open={permTarget !== null}
        email={permTarget?.email ?? ''}
        role={permTarget?.role ?? 'supervisor'}
        userName={permTarget?.name || permTarget?.email || ''}
        onClose={() => setPermTarget(null)}
      />
    </section>
  )
}
