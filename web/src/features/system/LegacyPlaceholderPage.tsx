import { Navigate, useParams } from 'react-router-dom'
import { usePermissions } from '@/app/providers/permissionsContext'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import { KNOWN_LEGACY_PAGE_IDS, LEGACY_PAGE_TITLES } from '@/lib/legacyRoutes'

/** Placeholder para telas legadas endereçadas por `data-page` (rota `/app/p/:pageId`). */
export function LegacyPlaceholderPage() {
  const { user } = useStaffAuth()
  const { canSeePage } = usePermissions()
  const { pageId } = useParams()

  if (!pageId || !KNOWN_LEGACY_PAGE_IDS.has(pageId)) {
    return <Navigate to="/app/dashboard" replace />
  }

  if (!user || !canSeePage(pageId)) {
    return <Navigate to="/app/dashboard" replace />
  }

  const title = LEGACY_PAGE_TITLES[pageId] ?? pageId

  return (
    <div>
      <div className="page-header">
        <h2>
          <i className="fas fa-layer-group" aria-hidden />
          {title}
        </h2>
        <span className="page-sub">Conteúdo em migração — mesma área funcional do legado (`{pageId}`)</span>
      </div>
      <p style={{ color: 'var(--text-muted, #9CA3AF)', fontSize: 14, lineHeight: 1.6, maxWidth: 560 }}>
        Esta rota preserva o nome e o fluxo da tela correspondente em <code>index.html</code>. A lógica de dados
        permanece no sistema legado até a migração incremental deste módulo.
      </p>
    </div>
  )
}
