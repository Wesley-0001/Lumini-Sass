import type { HTMLAttributes } from 'react'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** `stat` usa `.stat-card` — combine com modificadores (`blue`, `orange`, …) via `className`. */
  variant?: 'panel' | 'stat'
}

/** Painel tipo `.recent-card` ou KPI `.stat-card` do legado. */
export function Card({ variant = 'panel', className = '', children, ...rest }: CardProps) {
  const cls = variant === 'stat' ? 'stat-card' : 'recent-card'
  return (
    <div className={[cls, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  )
}
