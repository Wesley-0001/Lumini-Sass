import type { HTMLAttributes } from 'react'

export type ToastProps = HTMLAttributes<HTMLDivElement> & {
  /** Controla animação `.toast-notification.show`. */
  visible?: boolean
}

/** Toast inferior do legado (`.toast-notification`). */
export function Toast({ visible = false, className = '', children, ...rest }: ToastProps) {
  return (
    <div
      className={['toast-notification', visible ? 'show' : '', className].filter(Boolean).join(' ')}
      role="status"
      {...rest}
    >
      {children}
    </div>
  )
}
