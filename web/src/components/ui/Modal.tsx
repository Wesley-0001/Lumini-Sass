import type { HTMLAttributes, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

export type ModalProps = {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** id para `aria-labelledby` */
  titleId?: string
}

/** Estrutura `.modal-overlay` + `.modal` do legado (somente casca). */
export function Modal({ title, open, onClose, children, footer, titleId = 'lumini-modal-title' }: ModalProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id={titleId}>{title}</h3>
          <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>
            <i className="fas fa-times" aria-hidden />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer !== undefined ? (
          footer
        ) : (
          <div className="modal-footer">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export type ModalFooterProps = HTMLAttributes<HTMLDivElement>

export function ModalFooter({ className = '', ...rest }: ModalFooterProps) {
  return <div className={['modal-footer', className].filter(Boolean).join(' ')} {...rest} />
}
