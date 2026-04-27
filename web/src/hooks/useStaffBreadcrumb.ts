import { useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ALL_MODULES } from '@/lib/permissions'
import { LEGACY_PAGE_TITLES } from '@/lib/legacyRoutes'

/** Rótulos para breadcrumb no header (sem efeitos colaterais). */
export function useStaffBreadcrumb(): string {
  const { pathname } = useLocation()
  const params = useParams<{ moduleId?: string; pageId?: string }>()

  return useMemo(() => {
    if (params.moduleId) {
      const mod = ALL_MODULES.find((m) => m.key === params.moduleId)
      return mod?.label ?? params.moduleId
    }
    if (params.pageId) {
      return LEGACY_PAGE_TITLES[params.pageId] ?? params.pageId
    }
    if (pathname.includes('/dashboard')) return 'Painel'
    return 'Lumini'
  }, [pathname, params.moduleId, params.pageId])
}
