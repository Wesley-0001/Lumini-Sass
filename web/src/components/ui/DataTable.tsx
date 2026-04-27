import type { HTMLAttributes, TableHTMLAttributes } from 'react'

export type TableShellProps = HTMLAttributes<HTMLDivElement>

/** Wrapper `.table-wrapper` + tabela `.data-table` do legado. */
export function TableShell({ className = '', children, ...rest }: TableShellProps) {
  return (
    <div className={['table-wrapper', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  )
}

export type DataTableProps = TableHTMLAttributes<HTMLTableElement>

export function DataTable({ className = '', children, ...rest }: DataTableProps) {
  return (
    <table className={['data-table', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </table>
  )
}
