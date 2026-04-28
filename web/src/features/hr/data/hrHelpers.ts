/**
 * hrHelpers.ts — Funções utilitárias de RH
 * Espelha helpers de rh-module.js sem usar window.*
 */
import type { HREmployee, HRSetor } from '@/features/hr/types/hrTypes'

export const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'] as const

/** Espelha hrCalcTenure de rh-module.js */
export function hrCalcTenure(admStr: string, demStr?: string): number {
  if (!admStr || admStr === '') return 0
  const adm = new Date(admStr)
  if (isNaN(adm.getTime())) return 0
  const end = demStr && demStr !== '' ? new Date(demStr) : new Date()
  if (isNaN(end.getTime())) return 0
  return Math.max(0, Math.round((end.getTime() - adm.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))
}

/** Espelha hrFormatDate de rh-module.js */
export function hrFormatDate(dateStr?: string): string {
  if (!dateStr || dateStr === '') return '—'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return '—'
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

/** Espelha hrCalcAge de rh-module.js */
export function hrCalcAge(birthStr?: string): number | null {
  if (!birthStr) return null
  const now = new Date()
  const b = new Date(birthStr)
  if (isNaN(b.getTime())) return null
  return Math.floor((now.getTime() - b.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

export function hrGetYear(dateStr?: string): number | null {
  if (!dateStr) return null
  return parseInt(dateStr.split('-')[0])
}

export function hrGetMonth(dateStr?: string): number | null {
  if (!dateStr) return null
  return parseInt(dateStr.split('-')[1])
}

export function hrGetYearMonth(dateStr?: string): string | null {
  if (!dateStr) return null
  const p = dateStr.split('-')
  return `${p[0]}-${p[1]}`
}

export function hrMonthLabel(ym: string): string {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  return `${MONTH_NAMES[parseInt(m) - 1]}/${y.slice(2)}`
}

/** Espelha tenureText de app.js */
export function hrTenureText(months: number): string {
  if (months >= 12) {
    const y = Math.floor(months / 12)
    const m = months % 12
    return m > 0 ? `${y}a ${m}m` : `${y}a`
  }
  return `${months}m`
}

/** Espelha _getSetorFromCargo de rh-data.js */
export function getSetorFromCargo(cargo?: string): HRSetor {
  if (!cargo) return 'Outros'
  const c = cargo.toLowerCase()
  if (c.includes('expediç') || c.includes('expedidor') || c.includes('logística') ||
      c.includes('logistica') || c.includes('estoque')) return 'Expedição'
  if (c.includes('produção') || c.includes('producao') || c.includes('operador') ||
      c.includes('impressor') || c.includes('revisor') || c.includes('líder de impressão') ||
      c.includes('lider de impressao') || c.includes('calandra')) return 'Produção'
  if (c.includes('supervisor de designer e vendas')) return 'Vendas'
  if (c.includes('designer') || c.includes('supervisor designer') ||
      c.includes('supervisor de designer')) return 'Designer'
  if (c.includes('vendedor') || c.includes('vendedora') || c.includes('atendente') ||
      c.includes('assistente de vendas') || c.includes('vendas')) return 'Vendas'
  if (c.includes('rh') || c.includes('dp') || c.includes('departamento pessoal') ||
      c.includes('pcp') || c.includes('financeiro') || c.includes('analista') ||
      c.includes('gerente') || c.includes('administrativo') || c.includes('recrutamento') ||
      c.includes('operações') || c.includes('processos') || c.includes('negócio') ||
      c.includes('consultor') || c.includes('freelancer') || c.includes('estagiário') ||
      c.includes('assistente de pcp') || c.includes('assistente de dep')) return 'Administrativo'
  if (c.includes('limpeza') || c.includes('faxineira') || c.includes('manutenção') ||
      c.includes('manutencao') || c.includes('facilities') || c.includes('ajudante geral') ||
      c.includes('1/2 oficial')) return 'Facilities'
  return 'Outros'
}

export function hrAvatarInitials(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function isAtivo(e: HREmployee): boolean {
  return e.situacao === 'ATIVO' || e.situacao === 'FÉRIAS'
}

export function resolveSetor(e: HREmployee): HRSetor {
  return e.setor || getSetorFromCargo(e.cargo)
}

export const SETORES_ORDER: HRSetor[] = [
  'Produção', 'Expedição', 'Designer', 'Vendas', 'Administrativo', 'Facilities',
]

export const SETOR_COLORS: Record<string, string> = {
  Produção:       '#4361ee',
  Expedição:      '#06d6a0',
  Designer:       '#a78bfa',
  Vendas:         '#fbbf24',
  Administrativo: '#9ca3af',
  Facilities:     '#f87171',
  Outros:         '#c9b8ff',
}

export const SETOR_CSS: Record<string, string> = {
  Produção:       'producao',
  Expedição:      'expedicao',
  Designer:       'designer',
  Vendas:         'vendas',
  Administrativo: 'administrativo',
  Facilities:     'facilities',
}
