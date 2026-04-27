import type { ButtonHTMLAttributes } from 'react'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'icon'
}

/** Botão alinhado às classes `.btn-primary`, `.btn-outline`, `.btn-icon` do legado (`style.css`). */
export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: ButtonProps) {
  const v =
    variant === 'primary' ? 'btn-primary' : variant === 'outline' ? 'btn-outline' : 'btn-icon'
  return <button type={type} className={[v, className].filter(Boolean).join(' ')} {...rest} />
}
