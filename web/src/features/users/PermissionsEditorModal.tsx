import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { ALL_MODULES, DEFAULT_ROLE_PERMISSIONS, saveUserPermissions } from '@/lib/permissions'
import { useToast } from '@/components/ui/toast/toastContext'
import {
  EMPLOYEE_ROLE_PERMISSIONS,
  getLegacyUserPermissions,
} from '@/features/users/managedUserPermissions'
import type { PermissionModule } from '@/types/permissions'
import type { StaffRole } from '@/types/user'

export type PermissionsEditorModalProps = {
  open: boolean
  email: string
  role: string
  userName: string
  onClose: () => void
}

export function PermissionsEditorModal({
  open,
  email,
  role,
  userName,
  onClose,
}: PermissionsEditorModalProps) {
  const { pushToast } = useToast()
  const [perms, setPerms] = useState<Record<PermissionModule, boolean>>(() =>
    getLegacyUserPermissions(email, role),
  )

  useEffect(() => {
    if (!open) return
    setPerms(getLegacyUserPermissions(email, role))
  }, [open, email, role])

  function resetToRoleDefaults() {
    const raw =
      role === 'employee'
        ? EMPLOYEE_ROLE_PERMISSIONS
        : DEFAULT_ROLE_PERMISSIONS[role as StaffRole] ?? {}
    const next = {} as Record<PermissionModule, boolean>
    for (const m of ALL_MODULES) {
      next[m.key] = raw[m.key] === true
    }
    setPerms(next)
    pushToast('Permissões resetadas para o padrão do perfil.', 'info')
  }

  function handleSave() {
    saveUserPermissions(email, perms)
    pushToast('✅ Permissões salvas!', 'success')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Permissões — ${userName}`}
      footer={
        <ModalFooter
          style={{
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            borderTop: '1px solid var(--border)',
          }}
        >
          <Button variant="outline" type="button" onClick={resetToRoleDefaults}>
            <i className="fas fa-undo" aria-hidden /> Resetar para padrão
          </Button>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave}>
              <i className="fas fa-save" aria-hidden /> Salvar Permissões
            </Button>
          </div>
        </ModalFooter>
      }
    >
      <div style={{ padding: '24px' }}>
        <div
          style={{
            background: 'var(--bg-surface-2)',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          <i className="fas fa-info-circle" style={{ marginRight: 4 }} aria-hidden />
          Permissões customizadas sobrescrevem o padrão do perfil. Admin sempre tem acesso total.
        </div>

        <div id="perm-list">
          {ALL_MODULES.map((m) => (
            <label
              key={m.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                <i className={`fas ${m.icon}`} style={{ color: '#002B5B', width: 16, textAlign: 'center' }} aria-hidden />
                {m.label}
              </div>
              <input
                type="checkbox"
                checked={perms[m.key]}
                onChange={(e) => setPerms((p) => ({ ...p, [m.key]: e.target.checked }))}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
            </label>
          ))}
        </div>
      </div>
    </Modal>
  )
}
