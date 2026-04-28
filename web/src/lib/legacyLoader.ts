import Chart from 'chart.js/auto'

declare global {
  interface Window {
    Chart?: typeof Chart
    XLSX?: unknown
    // legacy renderers (partial)
    renderAdminDashboard?: () => void
    renderBossDashboard?: () => void
    renderSupervisorHome?: () => void
    renderRHDashboard?: (targetIdParam?: string) => void
    _teamsRenderAdmin?: () => void
    _teamsRenderBoss?: () => void
    _teamsRenderSupervisor?: () => void
    _teamsRenderSup?: () => void
    _teamsRenderManager?: () => void
    _commsRenderPage?: () => void
    _rhRenderDashboard?: () => void
    _rhRenderTurnover?: () => void
    _rhRenderDashboardIn?: (targetId: string, readOnly?: boolean) => void
    _rhRenderTurnoverIn?: (targetId: string, readOnly?: boolean) => void
    _rhRenderEmployeesIn?: (targetId: string, readOnly?: boolean) => void
    _rhRenderPromocoes?: () => void
    _rhRenderHolerites?: (targetId: string) => void

    // misc used by legacy
    _ntTogglePanel?: (ev?: unknown) => void
    _ntClosePanel?: () => void
  }
}

function hasGlobal(name: string): boolean {
  return typeof (window as any)[name] !== 'undefined'
}

async function ensureExternalGlobalScript(opts: { src: string; globalName?: string }): Promise<void> {
  if (opts.globalName && hasGlobal(opts.globalName)) return
  const existing = document.querySelector<HTMLScriptElement>(`script[data-legacy-ext="${opts.src}"]`)
  if (existing?.dataset.loaded === 'true') return

  await new Promise<void>((resolve, reject) => {
    const script = existing ?? document.createElement('script')
    script.src = opts.src
    script.async = false
    script.defer = false
    script.dataset.legacyExt = opts.src
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`Falha ao carregar script externo: ${opts.src}`))
    if (!existing) document.head.appendChild(script)
  })
}

function globalEval(code: string, label: string): void {
  try {
    ;(0, eval)(`${code}\n//# sourceURL=${label}`)
  } catch (e) {
    throw new Error(`Erro executando legado (${label}): ${(e as Error)?.message ?? String(e)}`)
  }
}

// Classic scripts executed via global eval (preserva funções globais no `window`)
import dataJs from '../../../js/data.js?raw'
import permissionsJs from '../../../js/permissions.js?raw'
import notificationsModuleJs from '../../../js/notifications-module.js?raw'
import teamsModuleJs from '../../../js/teams-module.js?raw'
import commsModuleJs from '../../../js/comms-module.js?raw'
import rhDataJs from '../../../js/rh-data.js?raw'
import rhModuleJs from '../../../js/rh-module.js?raw'
import rhHoleritesModuleJs from '../../../js/rh-holerites-module.js?raw'
import dailyAttendanceModuleJs from '../../../js/daily-attendance-module.js?raw'
import appJs from '../../../js/app.js?raw'

let _legacyLoadPromise: Promise<void> | null = null

/**
 * Carrega/execura o legado no runtime React, mantendo escopo global.
 * - Não altera Auth/RBAC/Firebase schema: apenas executa o JS legado.
 * - Mantém ordem estrita conforme solicitado.
 */
export function loadLegacyRuntime(): Promise<void> {
  if (_legacyLoadPromise) return _legacyLoadPromise

  _legacyLoadPromise = (async () => {
    // Chart.js (legado usa `new Chart(...)` global)
    window.Chart = Chart

    // XLSX (legado usa `XLSX` global para planilha local)
    await ensureExternalGlobalScript({
      src: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
      globalName: 'XLSX',
    })

    // 1) data.js
    globalEval(dataJs, 'legacy:data.js')

    // 2) permissions.js
    globalEval(permissionsJs, 'legacy:permissions.js')

    // 3) firebase-config.js (ESM, sem side effects relevantes; mantido pela ordem requerida)
    await import('../../../js/firebase-config.js')

    // 4) firebase-db.js (ESM via CDN imports; expõe cache/persist helpers em `window`)
    await import('../../../js/firebase-db.js')

    // 5) notifications-module.js
    globalEval(notificationsModuleJs, 'legacy:notifications-module.js')

    // 6) teams-module.js
    globalEval(teamsModuleJs, 'legacy:teams-module.js')

    // 7) comms-module.js
    globalEval(commsModuleJs, 'legacy:comms-module.js')

    // 8) rh-data.js
    globalEval(rhDataJs, 'legacy:rh-data.js')

    // 9) rh-module.js
    globalEval(rhModuleJs, 'legacy:rh-module.js')

    // 10) rh-holerites-module.js
    globalEval(rhHoleritesModuleJs, 'legacy:rh-holerites-module.js')

    // 11) daily-attendance-module.js
    globalEval(dailyAttendanceModuleJs, 'legacy:daily-attendance-module.js')

    // 12) app.js
    globalEval(appJs, 'legacy:app.js')
  })()

  return _legacyLoadPromise
}

