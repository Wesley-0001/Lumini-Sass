import type { StaffRole } from '@/types/user'

export function staffRoleLabel(role: StaffRole): string {
  switch (role) {
    case 'admin':
      return 'Administrador'
    case 'manager':
      return 'Gerente de Produção'
    case 'boss':
      return 'Diretor Geral'
    case 'rh':
      return 'Recursos Humanos'
    case 'supervisor':
      return 'Supervisor'
    default:
      return role
  }
}
