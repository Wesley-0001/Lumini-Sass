/**
 * Espelho de `window.LUMINI_LEGACY_EMAIL_MAP` em `js/data.js`.
 * Usado no login e na hidratação da sessão para manter o mesmo comportamento.
 */
export const LUMINI_LEGACY_EMAIL_MAP: Readonly<Record<string, string>> = {
  'renato@lumini': 'sup1@lumini',
  'heleno@lumini': 'sup2@lumini',
  'toni@lumini': 'sup3@lumini',
  'helcio@lumini': 'sup4@lumini',
  'andre@lumini': 'gerente@lumini',
  'carlos@lumini': 'diretor@lumini',
}

export function canonStaffEmail(email: string): string {
  const key = email.trim().toLowerCase()
  return LUMINI_LEGACY_EMAIL_MAP[key] ?? email
}
