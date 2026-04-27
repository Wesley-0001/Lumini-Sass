import type { HTMLAttributes } from 'react'

export type StatusKind =
  | 'registered'
  | 'period'
  | 'ready'
  | 'approved'
  | 'promoted'
  | 'pending-carlos'
  | 'pending-samuel'
  | 'pending-samuel-return'

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  /** Menu lateral: contador compacto (`.menu-badge`). */
  kind?: 'menu' | 'status'
  status?: StatusKind
}

/** Badge de menu ou status do legado (`.menu-badge`, `.status-*`). */
export function Badge({ kind = 'status', status = 'registered', className = '', children, ...rest }: BadgeProps) {
  if (kind === 'menu') {
    return (
      <span className={['menu-badge', className].filter(Boolean).join(' ')} {...rest}>
        {children}
      </span>
    )
  }
  return (
    <span className={['status-badge', `status-${status}`, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  )
}
