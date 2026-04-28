/** Documento da coleção `evaluations` — mesmos campos usados por `renderPromoHistory` no legado. */
export interface CareerEvaluation {
  id: string
  employeeId?: string
  result?: string
  date?: string
  fromRole?: string
  toRole?: string
}
