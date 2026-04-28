import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ALL_MODULES } from '@/lib/permissions'
import {
  getLegacyUserPermissions,
  getRoleOnlyPermissionPreview,
} from '@/features/users/managedUserPermissions'
import { newUserId, USER_ROLES, type ManagedUser } from '@/features/users/usersModel'
import { useToast } from '@/components/ui/toast/toastContext'

export type UserEditorModalProps = {
  open: boolean
  editId: string | null
  users: ManagedUser[]
  onClose: () => void
  persistAll: (next: ManagedUser[]) => Promise<void>
}

export function UserEditorModal({ open, editId, users, onClose, persistAll }: UserEditorModalProps) {
  const { pushToast } = useToast()
  const existing = editId ? users.find((u) => u.id === editId) : undefined

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('supervisor')
  const [employeeId, setEmployeeId] = useState('')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (!open) return
    setPassword('')
    setShowPass(false)
    if (existing) {
      setName(existing.name ?? '')
      setEmail(existing.email ?? '')
      setRole(existing.role || 'supervisor')
      setEmployeeId(existing.employeeId != null ? String(existing.employeeId) : '')
    } else {
      setName('')
      setEmail('')
      setRole('supervisor')
      setEmployeeId('')
    }
  }, [open, existing])

  /** Preview espelha `_renderPermsPreview`: com usuário existente usa e-mail + perfil; novo usuário só o perfil. */
  const previewPerms =
    editId && existing?.email
      ? getLegacyUserPermissions(existing.email, role)
      : getRoleOnlyPermissionPreview(role)

  async function handleSave() {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedPass = password.trim()
    const trimmedEmployeeId = employeeId.trim()

    if (!trimmedName) {
      pushToast('Informe o nome do usuário.', 'warning')
      return
    }
    if (!trimmedEmail) {
      pushToast('Informe o e-mail/login.', 'warning')
      return
    }
    if (!editId && !trimmedPass) {
      pushToast('Informe a senha.', 'warning')
      return
    }
    if (role === 'employee' && !trimmedEmployeeId) {
      pushToast('Para Colaborador (Portal), informe o ID do documento em employees.', 'warning')
      return
    }

    const next = [...users]

    if (editId) {
      const idx = next.findIndex((u) => u.id === editId)
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          name: trimmedName,
          role,
          ...(trimmedPass ? { password: trimmedPass } : {}),
          ...(role === 'employee' ? { employeeId: trimmedEmployeeId } : { employeeId: '' }),
          updatedAt: Date.now(),
        }
        pushToast('✅ Usuário atualizado!', 'success')
      }
    } else {
      if (next.find((u) => u.email === trimmedEmail)) {
        pushToast('Este e-mail já está em uso.', 'warning')
        return
      }
      next.push({
        id: newUserId(),
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPass,
        role,
        active: true,
        createdAt: Date.now(),
        ...(role === 'employee' ? { employeeId: trimmedEmployeeId } : {}),
      })
      pushToast('✅ Usuário criado com sucesso!', 'success')
    }

    await persistAll(next)
    onClose()
  }

  const employeeVisible = role === 'employee'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${editId ? 'Editar' : 'Novo'} Usuário`}
      footer={
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            borderTop: '1px solid var(--border)',
          }}
        >
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSave()}>
            <i className="fas fa-save" aria-hidden /> {editId ? 'Salvar' : 'Criar Usuário'}
          </Button>
        </div>
      }
    >
      <div style={{ padding: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div className="form-group" style={{ margin: 0 }}>
            <label>
              Nome completo <span className="required">*</span>
            </label>
            <input
              type="text"
              placeholder="Nome do usuário"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>
              E-mail / Login <span className="required">*</span>
            </label>
            <input
              type="text"
              placeholder="email@empresa"
              value={email}
              disabled={!!existing?.isDemo}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div className="form-group" style={{ margin: 0 }}>
            <label>
              {editId ? 'Nova senha (deixe em branco para manter)' : 'Senha'}{' '}
              {!editId ? (
                <>
                  <span className="required">*</span>
                </>
              ) : null}
            </label>
            <div className="input-icon-right" style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 36 }}
              />
              <button
                type="button"
                className="toggle-pass"
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPass((s) => !s)}
                style={{
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  fontSize: 13,
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                }}
              >
                <i className="fas fa-eye" aria-hidden />
              </button>
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>
              Perfil <span className="required">*</span>
            </label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {USER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.icon} {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="form-group"
          id="usr-employee-row"
          style={{ marginBottom: 12, display: employeeVisible ? 'block' : 'none' }}
        >
          <label>
            ID do colaborador (coleção employees) <span className="required">*</span>
          </label>
          <input
            type="text"
            placeholder="ID do documento no Firestore"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Use o ID do documento em employees (não a matrícula). Portal do Colaborador.
          </p>
        </div>

        <div style={{ background: 'var(--bg-surface-2)', borderRadius: 12, padding: 14 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '.5px',
              marginBottom: 10,
            }}
          >
            <i className="fas fa-lock" style={{ marginRight: 4 }} aria-hidden />
            Permissões padrão do perfil
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALL_MODULES.map((m) => {
              const on = previewPerms[m.key]
              return (
                <span
                  key={m.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: on ? '#DCFCE7' : 'var(--bg-surface-3)',
                    color: on ? '#15803D' : 'var(--text-muted)',
                    border: `1px solid ${on ? '#BBF7D0' : 'var(--border)'}`,
                  }}
                >
                  <i className={`fas ${on ? 'fa-check' : 'fa-times'}`} style={{ fontSize: 9 }} aria-hidden />
                  {m.label}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}
