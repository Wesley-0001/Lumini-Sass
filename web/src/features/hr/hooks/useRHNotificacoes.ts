/**
 * useRHNotificacoes.ts — Hook para promoções homologadas
 * Estado local (sem Firebase para notificações RH por ora)
 * Espelha window._rhNotificacoes de rh-module.js
 */
import { useState } from 'react'
import type { RHNotificacao } from '@/features/hr/types/hrTypes'

const DEMO_PROMOS: RHNotificacao[] = [
  {
    id: 'rhn-demo-001',
    employeeId: 'demo-emp-001',
    employeeName: 'Renato Silva Domingues',
    fromRole: 'Operador de Calandra 2',
    toRole: 'Operador de Calandra 3',
    supervisor: 'Renato Domingues',
    approvedBy: 'Carlos',
    approvedAt: '2026-02-15',
    score: 87,
    stars: 4,
    justification: 'Colaborador demonstrou domínio completo das operações de nível 2 e está plenamente apto para assumir responsabilidades de nível 3.',
    strengths: 'Excelente postura operacional, referência técnica para a equipe, pontualidade e comprometimento exemplares.',
    improvements: 'Desenvolver habilidades de liderança para eventual progressão à supervisão.',
    feedback: 'Aprovação recomendada. Renato demonstra maturidade técnica e comportamental para a promoção. Histórico consistente de 907 dias na empresa.',
    status: 'pendente',
    criadoEm: '2026-02-15T10:30:00.000Z',
  },
  {
    id: 'rhn-demo-002',
    employeeId: 'demo-emp-002',
    employeeName: 'Higor dos Santos Palmeira Brandão',
    fromRole: 'Impressor Digital 1',
    toRole: 'Impressor Digital 2',
    supervisor: 'Rogério de Andrade Quadros',
    approvedBy: 'Carlos',
    approvedAt: '2026-01-20',
    score: 92,
    stars: 5,
    justification: 'Excelente desempenho em todas as categorias de avaliação. Colaborador superou as expectativas do período de avaliação.',
    strengths: 'Domínio técnico excepcional, qualidade de impressão acima do padrão, proatividade na resolução de problemas.',
    improvements: 'Continuar desenvolvimento em manutenção preventiva de equipamentos.',
    feedback: 'Promoção aprovada com distinção. Colaborador é referência no setor e merece reconhecimento imediato.',
    status: 'homologado',
    obsRH: 'Carta aditiva emitida em 22/01/2026. Novo salário a partir de 01/02/2026.',
    homologadoEm: '2026-01-22T14:20:00.000Z',
    homologadoPor: 'RH',
    criadoEm: '2026-01-20T09:00:00.000Z',
  },
  {
    id: 'rhn-demo-003',
    employeeId: 'demo-emp-003',
    employeeName: 'Felipe Siqueira de Lima',
    fromRole: 'Revisor 1',
    toRole: 'Revisor 2',
    supervisor: 'Renato Domingues',
    approvedBy: 'Carlos',
    approvedAt: '2025-12-10',
    score: 78,
    stars: 4,
    justification: 'Colaborador atingiu tempo mínimo no cargo e apresentou desempenho satisfatório nas competências avaliadas.',
    strengths: 'Comprometimento, atenção à qualidade, boa relação com equipe.',
    improvements: 'Aprimorar velocidade de revisão e domínio de equipamentos específicos.',
    feedback: 'Aprovado. Bom colaborador com potencial de crescimento.',
    status: 'homologado',
    obsRH: 'Promoção formalizada em 12/12/2025. Documentação arquivada no prontuário.',
    homologadoEm: '2025-12-12T11:00:00.000Z',
    homologadoPor: 'RH',
    criadoEm: '2025-12-10T08:30:00.000Z',
  },
]

export function useRHNotificacoes() {
  const [notificacoes, setNotificacoes] = useState<RHNotificacao[]>(DEMO_PROMOS)

  function homologar(id: string, obsRH: string) {
    setNotificacoes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              status: 'homologado' as const,
              obsRH: obsRH || 'Homologado pelo RH.',
              homologadoEm: new Date().toISOString(),
              homologadoPor: 'RH',
            }
          : n
      )
    )
  }

  function arquivar(id: string) {
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'arquivado' as const } : n))
    )
  }

  const pendentes   = notificacoes.filter((n) => n.status === 'pendente')
  const homologados = notificacoes.filter((n) => n.status === 'homologado')
  const arquivados  = notificacoes.filter((n) => n.status === 'arquivado')

  return { notificacoes, pendentes, homologados, arquivados, homologar, arquivar }
}
