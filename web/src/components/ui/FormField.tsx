import type { HTMLAttributes, ReactNode } from 'react'

export type FormFieldProps = {
  id?: string
  label: ReactNode
  htmlFor?: string
  children: ReactNode
  /** ícone Font Awesome opcional antes do texto do label (`fa-envelope`). */
  icon?: string
}

/** Agrupa `.form-group` + label no padrão legado. */
export function FormField({ id, label, htmlFor, icon, children }: FormFieldProps) {
  const fid = htmlFor ?? id
  return (
    <div className="form-group" id={id}>
      <label htmlFor={fid}>
        {icon ? (
          <>
            <i className={`fas ${icon}`} aria-hidden />{' '}
          </>
        ) : null}
        {label}
      </label>
      {children}
    </div>
  )
}

export type FormRowProps = HTMLAttributes<HTMLDivElement>

export function FormRow({ className = '', ...rest }: FormRowProps) {
  return <div className={['form-row', className].filter(Boolean).join(' ')} {...rest} />
}
