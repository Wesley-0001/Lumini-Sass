/**
 * hrTypes.ts — Tipos TypeScript para os módulos de RH
 * Espelha a estrutura de dados do legado (rh-module.js / rh-data.js)
 * SEM usar window.* ou LegacyBridge
 */

export type HRSituacao = 'ATIVO' | 'DESLIGADO' | 'FÉRIAS'
export type HRJornada = 'CLT' | 'PJ' | 'Temporário' | 'Estágio'
export type HRSetor =
  | 'Produção'
  | 'Expedição'
  | 'Designer'
  | 'Vendas'
  | 'Administrativo'
  | 'Facilities'
  | 'Outros'

export interface HREmployee {
  matricula: string
  nome: string
  situacao: HRSituacao
  jornada: HRJornada
  matriz: string
  setor: HRSetor
  cargo: string
  horario: string
  lider: string
  admissao: string       // YYYY-MM-DD
  diasContrato: number
  demissao: string       // YYYY-MM-DD ou ''
  tipoExame: string
  dataExame: string
  telefone: string
  nascimento: string     // YYYY-MM-DD ou ''
}

export type RHPromoStatus = 'pendente' | 'homologado' | 'arquivado'

export interface RHNotificacao {
  id: string
  employeeId?: string
  employeeName: string
  fromRole: string
  toRole: string
  supervisor: string
  approvedBy: string
  approvedAt: string     // YYYY-MM-DD
  score: number
  stars: number
  justification: string
  strengths?: string
  improvements?: string
  feedback?: string
  status: RHPromoStatus
  obsRH?: string
  homologadoEm?: string  // ISO string
  homologadoPor?: string
  criadoEm: string       // ISO string
}

// ─── Careers ─────────────────────────────────────────────
export interface Career {
  id: string
  name: string
  level: number
  minMonths: number
  competencies: string[]
}

// ─── Matrix de Polivalência ──────────────────────────────
/** 0=Não avaliado, 1=Não Treinado, 2=Em Treinamento, 3=Competente, 4=Referência */
export type SkillLevel = 0 | 1 | 2 | 3 | 4

export interface MatrixEmployee {
  id: string
  name: string
  currentRole: string
  sector: string
  skills: Record<string, SkillLevel>
}

// ─── Reports ─────────────────────────────────────────────
export interface ReportRow {
  id: string
  name: string
  currentRole: string
  desiredRole: string
  tenureLabel: string
  lastEvalDate: string
  lastEvalScore: number | null
  statusLabel: string
  statusClass: string
}

// ─── Ano stats para Turnover ─────────────────────────────
export interface AnoTurnoverStat {
  ano: number
  admissoes: number
  desligamentos: number
  quadroMedio: number
  taxa: string
}
