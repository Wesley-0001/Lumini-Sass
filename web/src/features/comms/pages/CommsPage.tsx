import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, Card, FormField, FormRow, Modal, ModalFooter } from '@/components/ui'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import { loadLegacyRuntime } from '@/lib/legacyLoader'
import { useToast } from '@/components/ui/toast/toastContext'
import { doc, setDoc } from 'firebase/firestore'
import { tryGetFirestoreDb } from '@/services/firebase/app'
import { FirestoreCollections } from '@/types/firestore'
import { batchAddInAppNotifications } from '@/features/notifications/notificationsApi'

type PriorityKey = 'alta' | 'media' | 'baixa'
type DestinationType = 'all' | 'role' | 'team' | 'user'

type CommsRecipients =
  | { all: true }
  | { roles: string[] }
  | { teams: string[] }
  | { users: string[] }

export type InternalComm = {
  id: string
  title: string
  message: string
  priority: PriorityKey
  date: string // yyyy-mm-dd
  createdAt: number
  authorEmail: string
  authorName: string
  authorRole: string
  destinationType: DestinationType
  recipients: CommsRecipients
  readBy: Record<string, number>
}

const STORAGE_KEY = 'nt_comms_v2'
const LEGACY_KEY = 'nt_comms_v1'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  supervisor: 'Supervisor',
  boss: 'Diretor',
  rh: 'RH',
  employee: 'Colaborador',
}

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

function normEmail(v: unknown): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
}

function getActiveUsersCompat(): Array<{ email: string; name?: string; role?: string; active?: boolean }> {
  const arr = (window as any)?._cache?.users
  const users = Array.isArray(arr) ? arr : []
  return users.filter((u: any) => u?.active !== false)
}

function resolveAuthorNameByEmail(email: string): string {
  const em = normEmail(email)
  if (!em) return 'Autor'
  const u = getActiveUsersCompat().find((x) => normEmail(x.email) === em)
  return u?.name ? String(u.name) : em
}

function commDestinationLabelCompat(item: InternalComm): string {
  const dest = item.destinationType || 'all'
  const r = item.recipients || ({} as any)
  const roleLabels: Record<string, string> = {
    admin: 'Administradores',
    boss: 'Diretores',
    manager: 'Gerentes',
    supervisor: 'Supervisores',
    rh: 'RH',
    employee: 'Colaboradores',
  }
  if (dest === 'all') return 'Todos os colaboradores'
  if (dest === 'role') {
    const roles = Array.isArray((r as any).roles) ? (r as any).roles : []
    if (!roles.length) return 'Equipe selecionada'
    return roles.map((x: any) => roleLabels[String(x)] || String(x)).join(', ')
  }
  if (dest === 'user') {
    const users = Array.isArray((r as any).users) ? (r as any).users : []
    const n = users.length
    return n === 1 ? '1 pessoa selecionada' : `${n} pessoas selecionadas`
  }
  if (dest === 'team') {
    const teamIds = Array.isArray((r as any).teams) ? (r as any).teams : []
    const teamsArr = (window as any)?._cache?.teams
    const teams = Array.isArray(teamsArr) ? teamsArr : []
    const names = teamIds
      .map((tid: any) => teams.find((t: any) => String(t?.id) === String(tid))?.name || teams.find((t: any) => String(t?.id) === String(tid))?.nome)
      .filter(Boolean)
      .map(String)
    return names.length ? names.join(', ') : 'Equipes selecionadas'
  }
  return 'Destinatários'
}

function expandCommsRecipientEmailsCompat(item: InternalComm): string[] {
  const author = normEmail(item.authorEmail)
  const out = new Set<string>()
  const users = getActiveUsersCompat()
  const dest = item.destinationType || 'all'
  const r = item.recipients || ({} as any)

  if (dest === 'all') {
    users.forEach((u) => {
      const em = normEmail(u.email)
      if (em && em !== author) out.add(em)
    })
  } else if (dest === 'role') {
    const roles = Array.isArray((r as any).roles) ? (r as any).roles : []
    users
      .filter((u) => roles.includes(String(u.role)))
      .forEach((u) => {
        const em = normEmail(u.email)
        if (em && em !== author) out.add(em)
      })
  } else if (dest === 'user') {
    const arr = Array.isArray((r as any).users) ? (r as any).users : []
    arr.forEach((em: any) => {
      const ne = normEmail(em)
      if (ne && ne !== author) out.add(ne)
    })
  } else if (dest === 'team') {
    const teamIds = Array.isArray((r as any).teams) ? (r as any).teams : []
    const teamsArr = (window as any)?._cache?.teams
    const teams = Array.isArray(teamsArr) ? teamsArr : []
    teamIds.forEach((tid: any) => {
      const tm = teams.find((t: any) => String(t?.id) === String(tid))
      const membros = (tm as any)?.membros
      if (!Array.isArray(membros)) return
      membros.forEach((m: any) => {
        const em = normEmail(m?.email)
        if (em && em !== author) out.add(em)
      })
    })
  }

  return [...out].filter(Boolean)
}

function nowISODate(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatBrDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = String(iso).split('-')
  if (!y || !m || !d) return String(iso)
  return `${d}/${m}/${y}`
}

function formatBrDateTime(ts: number): string {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(ts)
  }
}

function buildId(prefix = 'comm'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function mergeReadBy(a: Record<string, number> | undefined, b: Record<string, number> | undefined): Record<string, number> {
  const out: Record<string, number> = { ...(a || {}), ...(b || {}) }
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})])
  for (const k of keys) {
    const va = a && a[k]
    const vb = b && b[k]
    if (va != null && vb != null) out[k] = Math.max(Number(va), Number(vb))
    else out[k] = va != null ? Number(va) : Number(vb)
  }
  return out
}

function mergeCommRecords(local: InternalComm, cloud: InternalComm): InternalComm {
  return {
    ...local,
    ...cloud,
    readBy: mergeReadBy(local.readBy, cloud.readBy),
  }
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function migrateLegacyItem(c: any): InternalComm | null {
  if (!c || typeof c !== 'object') return null
  return {
    id: c.id || buildId('comm'),
    title: String(c.title || ''),
    message: String(c.message || ''),
    priority: (String(c.priority || 'media') as PriorityKey) || 'media',
    date: String(c.date || nowISODate()),
    createdAt: Number(c.createdAt || Date.now()),
    authorEmail: String(c.authorEmail || ''),
    authorName: String(c.authorName || ''),
    authorRole: String(c.authorRole || ''),
    destinationType: 'all',
    recipients: { all: true },
    readBy: {},
  }
}

function loadFromLocalStorageOnly(): InternalComm[] {
  const list = safeJsonParse<unknown>(localStorage.getItem(STORAGE_KEY))
  if (Array.isArray(list)) return list as InternalComm[]

  const legacy = safeJsonParse<unknown>(localStorage.getItem(LEGACY_KEY))
  if (Array.isArray(legacy) && legacy.length) {
    const migrated = (legacy as any[]).map(migrateLegacyItem).filter(Boolean) as InternalComm[]
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    } catch {
      // ignore
    }
    return migrated
  }

  return []
}

function getCacheInternalComms(): InternalComm[] {
  const w = window as any
  const arr = w?._cache?.internalComms
  return Array.isArray(arr) ? (arr as InternalComm[]) : []
}

function loadAllMerged(): InternalComm[] {
  const fromLocal = loadFromLocalStorageOnly()
  const fromCloud = getCacheInternalComms()
  if (!fromCloud.length) return fromLocal

  const byId = new Map<string, InternalComm>()
  for (const c of fromLocal) {
    if (c && c.id) byId.set(c.id, c)
  }
  for (const c of fromCloud) {
    if (!c || !c.id) continue
    const ex = byId.get(c.id)
    byId.set(c.id, ex ? mergeCommRecords(ex, c) : c)
  }
  return [...byId.values()]
}

function saveAllToLocal(list: InternalComm[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function isAdminView(role: string): boolean {
  return role === 'admin'
}

function canCreate(role: string): boolean {
  return role === 'admin' || role === 'boss' || role === 'manager' || role === 'rh'
}

function isVisibleToCurrentUser(c: InternalComm, me: { email: string; role: string; name?: string }): boolean {
  if (!c) return false
  if (isAdminView(me.role)) return true
  if (!me.email) return false

  const t = c.destinationType || 'all'
  const r: any = c.recipients || {}

  if (t === 'all') return true
  if (t === 'role') {
    const roles = Array.isArray(r.roles) ? r.roles : []
    return roles.includes(me.role)
  }
  if (t === 'user') {
    const users = Array.isArray(r.users) ? r.users : []
    return users.includes(me.email)
  }
  if (t === 'team') {
    const teams = Array.isArray(r.teams) ? r.teams : []
    if (!teams.length) return false
    const allTeams = (window as any)?._cache?.teams
    const arr = Array.isArray(allTeams) ? allTeams : []
    const meEmail = normalize(me.email)
    const meName = normalize(me.name || '')
    const team = arr.find((t2: any) =>
      (t2?.membros || []).some((m: any) => {
        const em = normalize(String(m?.email || ''))
        if (em && em === meEmail) return true
        const nm = normalize(String(m?.nome || ''))
        return meName && nm && nm === meName
      }),
    )
    if (!team) return false
    return teams.includes(team.id)
  }
  return false
}

function recipientLabel(c: InternalComm): string {
  const t = c?.destinationType || 'all'
  const r: any = c?.recipients || {}
  if (t === 'all') return 'Todos'
  if (t === 'role') {
    const roles = Array.isArray(r.roles) ? r.roles : []
    if (!roles.length) return 'Perfis (não definido)'
    return roles.map((ro: string) => ROLE_LABELS[ro] || ro).join(', ')
  }
  if (t === 'team') {
    const teams = Array.isArray(r.teams) ? r.teams : []
    if (!teams.length) return 'Equipes (não definido)'
    const allTeams = (window as any)?._cache?.teams
    const arr = Array.isArray(allTeams) ? allTeams : []
    const names = teams.map((id: string) => arr.find((t2: any) => t2.id === id)?.nome || arr.find((t2: any) => t2.id === id)?.lider || id)
    return names.join(', ')
  }
  if (t === 'user') {
    const users = Array.isArray(r.users) ? r.users : []
    if (!users.length) return 'Usuários (não definido)'
    const allUsers = (window as any)?._cache?.users
    const arr = Array.isArray(allUsers) ? allUsers : []
    const names = users.map((email: string) => arr.find((u: any) => u.email === email)?.name || email)
    return names.join(', ')
  }
  return '—'
}

type FilterChip = 'all' | 'unread' | 'high' | 'mine'

export function CommsPage() {
  const { user } = useStaffAuth()
  const { pushToast } = useToast()

  const me = useMemo(() => {
    const w = window as any
    const fallback = w?.currentUser
    return {
      email: String(user?.email ?? fallback?.email ?? ''),
      role: String(user?.role ?? fallback?.role ?? 'supervisor'),
      name: String(user?.name ?? fallback?.name ?? ''),
    }
  }, [user])

  const [ready, setReady] = useState(false)
  const [items, setItems] = useState<InternalComm[]>([])
  const [search, setSearch] = useState('')
  const [chip, setChip] = useState<FilterChip>('all')

  const [viewId, setViewId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const [draftTitle, setDraftTitle] = useState('')
  const [draftMessage, setDraftMessage] = useState('')
  const [draftPriority, setDraftPriority] = useState<PriorityKey>('media')
  const [draftDate, setDraftDate] = useState(nowISODate())
  const [draftSendType, setDraftSendType] = useState<DestinationType>('all')
  const [draftRoles, setDraftRoles] = useState<Record<string, boolean>>({})
  const [draftTeams, setDraftTeams] = useState<Record<string, boolean>>({})
  const [draftUsers, setDraftUsers] = useState<Record<string, boolean>>({})
  const [userQ, setUserQ] = useState('')

  const sortedVisible = useMemo(() => {
    const base = loadAllMerged()
    const visible = isAdminView(me.role) ? base : base.filter((c) => isVisibleToCurrentUser(c, me))
    return visible.slice().sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
  }, [me.email, me.role, me.name, ready])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await loadLegacyRuntime()
      if (cancelled) return
      setReady(true)
      setItems(loadAllMerged())
    })()

    const onRefresh = () => setItems(loadAllMerged())
    window.addEventListener('nt:comms:refresh', onRefresh as EventListener)
    window.addEventListener('storage', onRefresh)

    const onOpen = (ev: Event) => {
      const ce = ev as CustomEvent<{ commId?: string }>
      const id = ce?.detail?.commId
      if (id) setViewId(String(id))
    }
    window.addEventListener('nt:comms:open', onOpen as EventListener)

    return () => {
      cancelled = true
      window.removeEventListener('nt:comms:refresh', onRefresh as EventListener)
      window.removeEventListener('storage', onRefresh)
      window.removeEventListener('nt:comms:open', onOpen as EventListener)
    }
  }, [])

  useEffect(() => {
    setItems(sortedVisible)
  }, [sortedVisible])

  const q = normalize(search)
  const filtered = useMemo(() => {
    let out = items
    if (q) {
      out = out.filter((c) => normalize(`${c.title || ''} ${c.message || ''} ${c.priority || ''} ${c.date || ''} ${c.authorName || ''} ${c.authorEmail || ''}`).includes(q))
    }
    if (chip === 'unread') out = out.filter((c) => !(c.readBy && c.readBy[me.email]) && !isAdminView(me.role))
    if (chip === 'high') out = out.filter((c) => c.priority === 'alta')
    if (chip === 'mine') out = out.filter((c) => (c.authorEmail || '') === me.email)
    return out
  }, [items, q, chip, me.email, me.role])

  const kpis = useMemo(() => {
    const today = nowISODate()
    const total = items.length
    const unread = isAdminView(me.role) ? 0 : items.filter((c) => !c.readBy?.[me.email]).length
    const high = items.filter((c) => c.priority === 'alta').length
    const todayCount = items.filter((c) => (c.date || '') === today).length
    return { total, unread, high, todayCount }
  }, [items, me.email, me.role])

  const viewed = useMemo(() => {
    if (!viewId) return null
    return loadAllMerged().find((x) => x.id === viewId) ?? null
  }, [viewId, items])

  async function markAsRead(id: string) {
    if (!id) return
    if (isAdminView(me.role)) return
    if (!me.email) return

    const all = loadAllMerged()
    const idx = all.findIndex((x) => x.id === id)
    if (idx < 0) return
    const c = all[idx]
    const readBy = { ...(c.readBy || {}) }
    if (readBy[me.email]) return
    readBy[me.email] = Date.now()
    const next = { ...c, readBy }
    all[idx] = next
    saveAllToLocal(all)
    setItems(all)

    const db = tryGetFirestoreDb()
    if (db && next?.id) {
      try {
        const clean = JSON.parse(JSON.stringify(next))
        await setDoc(doc(db, FirestoreCollections.internalComms, String(next.id)), clean, { merge: true })
      } catch {
        // ignore
      }
    }
  }

  function openCreate() {
    setDraftTitle('')
    setDraftMessage('')
    setDraftPriority('media')
    setDraftDate(nowISODate())
    setDraftSendType('all')
    setDraftRoles({})
    setDraftTeams({})
    setDraftUsers({})
    setUserQ('')
    setCreateOpen(true)
  }

  function buildRecipients(): { destinationType: DestinationType; recipients: CommsRecipients } | { error: string } {
    if (draftSendType === 'all') return { destinationType: 'all', recipients: { all: true } }
    if (draftSendType === 'role') {
      const roles = Object.entries(draftRoles)
        .filter(([, v]) => v)
        .map(([k]) => k)
      if (!roles.length) return { error: 'Selecione pelo menos um perfil.' }
      return { destinationType: 'role', recipients: { roles } }
    }
    if (draftSendType === 'team') {
      const teams = Object.entries(draftTeams)
        .filter(([, v]) => v)
        .map(([k]) => k)
      if (!teams.length) return { error: 'Selecione pelo menos uma equipe.' }
      return { destinationType: 'team', recipients: { teams } }
    }
    if (draftSendType === 'user') {
      const users = Object.entries(draftUsers)
        .filter(([, v]) => v)
        .map(([k]) => k)
      if (!users.length) return { error: 'Selecione pelo menos um usuário.' }
      return { destinationType: 'user', recipients: { users } }
    }
    return { error: 'Tipo de envio inválido.' }
  }

  async function submitNew() {
    if (!canCreate(me.role)) return
    const title = draftTitle.trim()
    const message = draftMessage.trim()
    if (!title || !message) {
      pushToast('Informe título e mensagem.', 'warning')
      return
    }

    const rec = buildRecipients()
    if ('error' in rec) {
      pushToast(rec.error, 'warning')
      return
    }

    const item: InternalComm = {
      id: buildId('comm'),
      title,
      message,
      priority: draftPriority,
      date: draftDate || nowISODate(),
      createdAt: Date.now(),
      authorEmail: me.email || '',
      authorName: me.name || '',
      authorRole: me.role || '',
      destinationType: rec.destinationType,
      recipients: rec.recipients,
      readBy: {},
    }

    const all = loadAllMerged()
    all.push(item)
    saveAllToLocal(all)
    setItems(all)
    setCreateOpen(false)
    pushToast('Comunicado enviado.', 'success')

    const db = tryGetFirestoreDb()
    if (db) {
      try {
        const clean = JSON.parse(JSON.stringify(item))
        await setDoc(doc(db, FirestoreCollections.internalComms, String(item.id)), clean, { merge: true })
      } catch {
        // ignore
      }
      try {
        const emails = expandCommsRecipientEmailsCompat(item)
        if (emails.length) {
          const who = resolveAuthorNameByEmail(item.authorEmail)
          const dest = commDestinationLabelCompat(item)
          const subj = String(item.title || 'Comunicado interno').slice(0, 160)
          const message = `Enviado por: ${who}. Enviado para: ${dest}. “${subj}”`
          await batchAddInAppNotifications({
            db,
            notifications: emails.map((userEmail) => ({
              userEmail,
              userId: null,
              type: 'comms',
              title: 'Novo comunicado recebido',
              message,
              link: 'comms',
              read: false,
              createdAt: Date.now(),
              meta: { commId: item.id },
            })),
          })
        }
      } catch {
        // ignore
      }
    }
  }

  const teamOptions = useMemo(() => {
    const arr = (window as any)?._cache?.teams
    const teams = Array.isArray(arr) ? arr : []
    return teams
      .slice()
      .sort((a: any, b: any) => String(a?.nome || '').localeCompare(String(b?.nome || '')))
      .map((t: any) => ({ id: String(t.id), label: String(t.nome || 'Equipe'), hint: String(t.lider || ''), count: (t?.membros || []).length }))
  }, [ready])

  const userOptions = useMemo(() => {
    const arr = (window as any)?._cache?.users
    const users = Array.isArray(arr) ? arr : []
    const qq = normalize(userQ)
    return users
      .filter((u: any) => u?.active !== false)
      .filter((u: any) => {
        if (!qq) return true
        return normalize(String(u?.name || '')).includes(qq) || normalize(String(u?.email || '')).includes(qq)
      })
      .slice(0, 12)
      .map((u: any) => ({ email: String(u.email), name: String(u.name || u.email), role: String(u.role || '') }))
  }, [ready, userQ])

  return (
    <section>
      <PageHeader
        icon="fa-bullhorn"
        title="Comunicados"
        subtitle="Central formal de comunicados internos (migração do legado)"
        actions={
          canCreate(me.role) ? (
            <Button onClick={openCreate} disabled={!ready}>
              <i className="fas fa-plus" aria-hidden /> Novo comunicado
            </Button>
          ) : null
        }
      />

      <div
        className="cards-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))',
          marginBottom: 20,
        }}
      >
        <Card variant="stat" className="blue">
          <div className="stat-icon">
            <i className="fas fa-inbox" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.total}</span>
            <span className="stat-label">Total</span>
          </div>
        </Card>
        <Card variant="stat" className="orange">
          <div className="stat-icon">
            <i className="fas fa-envelope-open-text" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.unread}</span>
            <span className="stat-label">Não lidos</span>
          </div>
        </Card>
        <Card variant="stat" className="red" style={{ background: 'linear-gradient(135deg,#DC2626,#B91C1C)' }}>
          <div className="stat-icon">
            <i className="fas fa-exclamation-triangle" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.high}</span>
            <span className="stat-label">Alta prioridade</span>
          </div>
        </Card>
        <Card variant="stat" className="green">
          <div className="stat-icon">
            <i className="fas fa-calendar-day" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.todayCount}</span>
            <span className="stat-label">Enviados hoje</span>
          </div>
        </Card>
      </div>

      <Card>
        <FormRow>
          <FormField label="Buscar" icon="fa-search">
            <input
              className="rh-input"
              placeholder="Buscar por título, mensagem, autor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </FormField>
          <FormField label="Filtro" icon="fa-filter">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(
                [
                  { key: 'all', label: 'Todos' },
                  { key: 'unread', label: 'Não lidos' },
                  { key: 'high', label: 'Alta prioridade' },
                  { key: 'mine', label: 'Meus envios' },
                ] as const
              ).map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`comms-filter-chip ${chip === c.key ? 'active' : ''}`}
                  onClick={() => setChip(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </FormField>
        </FormRow>

        {!ready ? (
          <div style={{ padding: 12, color: 'var(--text-muted, #9CA3AF)', fontSize: 14 }}>Carregando…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 12, color: 'var(--text-muted, #9CA3AF)', fontSize: 14 }}>Nenhum comunicado encontrado.</div>
        ) : (
          <div className="table-wrapper" style={{ marginTop: 8 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Remetente</th>
                  <th>Data</th>
                  <th>Prioridade</th>
                  <th>Destinatário</th>
                  <th>Status</th>
                  <th style={{ width: 80 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isUnread = !isAdminView(me.role) && !c.readBy?.[me.email]
                  const pr =
                    c.priority === 'alta'
                      ? { label: 'Alta', cls: 'badge-danger', icon: 'fa-exclamation-circle' }
                      : c.priority === 'baixa'
                        ? { label: 'Baixa', cls: 'badge-info', icon: 'fa-info-circle' }
                        : { label: 'Média', cls: 'badge-warning', icon: 'fa-flag' }
                  const status = isAdminView(me.role)
                    ? 'Admin · visível'
                    : isUnread
                      ? 'Não lido'
                      : 'Lido'
                  const statusCls = isAdminView(me.role) ? 'badge-primary' : isUnread ? 'badge-warning' : 'badge-success'
                  return (
                    <tr key={c.id} className={isUnread ? 'comms-row-unread' : ''}>
                      <td>
                        <div className="comms-title-cell">
                          <div className="comms-title">{c.title || '(sem título)'}</div>
                          <div className="comms-sub">
                            {String(c.message || '').slice(0, 96)}
                            {(c.message || '').length > 96 ? '…' : ''}
                          </div>
                        </div>
                      </td>
                      <td>{c.authorName || 'Sistema'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatBrDate(c.date || nowISODate())}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`purch-badge ${pr.cls}`}>
                          <i className={`fas ${pr.icon}`} style={{ marginRight: 6 }} aria-hidden /> {pr.label}
                        </span>
                      </td>
                      <td className="comms-recipient-cell" title={recipientLabel(c)}>
                        {recipientLabel(c)}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`purch-badge ${statusCls}`}>{status}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <Button
                          variant="icon"
                          type="button"
                          title="Abrir"
                          onClick={() => {
                            setViewId(c.id)
                            void markAsRead(c.id)
                          }}
                        >
                          <i className="fas fa-eye" aria-hidden />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Novo comunicado"
        footer={
          <ModalFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void submitNew()} disabled={!ready}>
              <i className="fas fa-paper-plane" aria-hidden /> Enviar comunicado
            </Button>
          </ModalFooter>
        }
      >
        <div className="info-box" style={{ marginBottom: 16 }}>
          <i className="fas fa-shield-alt" aria-hidden />
          <div>
            <div style={{ fontWeight: 700 }}>Formato formal (sem chat)</div>
            <div style={{ opacity: 0.9 }}>Use comunicados para orientações, políticas, procedimentos e atualizações internas.</div>
          </div>
        </div>

        <FormField label="Título" icon="fa-heading">
          <input className="rh-input" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
        </FormField>

        <FormField label="Mensagem" icon="fa-align-left">
          <textarea className="rh-textarea" rows={6} value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} />
        </FormField>

        <FormRow>
          <FormField label="Prioridade" icon="fa-flag">
            <select className="rh-select" value={draftPriority} onChange={(e) => setDraftPriority(e.target.value as PriorityKey)}>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </FormField>
          <FormField label="Data" icon="fa-calendar">
            <input className="rh-input" type="date" value={draftDate} onChange={(e) => setDraftDate(e.target.value)} />
          </FormField>
        </FormRow>

        <FormField label="Tipo de envio" icon="fa-paper-plane">
          <select className="rh-select" value={draftSendType} onChange={(e) => setDraftSendType(e.target.value as DestinationType)}>
            <option value="all">Todos</option>
            <option value="role">Por perfil</option>
            <option value="team">Por equipe</option>
            <option value="user">Por usuário</option>
          </select>
        </FormField>

        {draftSendType === 'all' ? (
          <div className="info-box" style={{ marginTop: 8 }}>
            <i className="fas fa-users" aria-hidden />
            <div>
              <div style={{ fontWeight: 700 }}>Envio para todos</div>
              <div style={{ opacity: 0.9 }}>O comunicado ficará disponível para todos os usuários com acesso ao módulo.</div>
            </div>
          </div>
        ) : null}

        {draftSendType === 'role' ? (
          <div style={{ marginTop: 10 }}>
            <div className="comms-checkgrid">
              {['admin', 'manager', 'supervisor', 'boss', 'rh', 'employee'].map((r) => (
                <label key={r} className="comms-check">
                  <input
                    type="checkbox"
                    checked={!!draftRoles[r]}
                    onChange={(e) => setDraftRoles((cur) => ({ ...cur, [r]: e.currentTarget.checked }))}
                  />
                  <span>
                    <strong>{ROLE_LABELS[r] || r}</strong>
                    <small>{r}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {draftSendType === 'team' ? (
          <div style={{ marginTop: 10 }}>
            {teamOptions.length === 0 ? (
              <div className="info-box" style={{ margin: 0, background: '#FEF3C7', borderColor: '#FDE68A', color: '#92400E' }}>
                <i className="fas fa-exclamation-triangle" aria-hidden />
                <div>
                  <div style={{ fontWeight: 700 }}>Nenhuma equipe cadastrada</div>
                  <div style={{ opacity: 0.9 }}>Cadastre equipes em “Equipes de Produção” para enviar por equipe.</div>
                </div>
              </div>
            ) : (
              <div className="comms-checklist">
                {teamOptions.map((t) => (
                  <label key={t.id} className="comms-checkrow">
                    <input
                      type="checkbox"
                      checked={!!draftTeams[t.id]}
                      onChange={(e) => setDraftTeams((cur) => ({ ...cur, [t.id]: e.currentTarget.checked }))}
                    />
                    <span className="comms-checkrow-main">
                      <strong>{t.label}</strong>
                      <small>{t.hint ? `Líder: ${t.hint}` : ''}</small>
                    </span>
                    <span className="purch-badge badge-primary">{t.count} membros</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {draftSendType === 'user' ? (
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            <div className="search-bar" style={{ margin: 0 }}>
              <i className="fas fa-search" aria-hidden />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={userQ}
                onChange={(e) => setUserQ(e.target.value)}
              />
            </div>

            <div className="comms-user-results">
              {userOptions.length === 0 ? (
                <div className="comms-empty-mini">Nenhum usuário encontrado.</div>
              ) : (
                userOptions.map((u) => (
                  <label key={u.email} className="comms-user-row">
                    <input
                      type="checkbox"
                      checked={!!draftUsers[u.email]}
                      onChange={(e) => setDraftUsers((cur) => ({ ...cur, [u.email]: e.currentTarget.checked }))}
                    />
                    <span className="comms-user-meta">
                      <strong>{u.name}</strong>
                      <small>
                        {u.email} · {ROLE_LABELS[u.role] || u.role}
                      </small>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={viewId !== null}
        onClose={() => setViewId(null)}
        title="Comunicado"
        footer={
          <ModalFooter>
            <Button
              onClick={() => {
                setViewId(null)
              }}
            >
              Fechar
            </Button>
          </ModalFooter>
        }
      >
        {viewed ? (
          <div>
            <div className="comms-view-head">
              <div>
                <div className="comms-view-title">{viewed.title || '(sem título)'}</div>
                <div className="comms-view-meta">
                  <span>
                    <i className="fas fa-user" aria-hidden /> {viewed.authorName || 'Sistema'}
                    {viewed.authorRole ? ` (${ROLE_LABELS[viewed.authorRole] || viewed.authorRole})` : ''}
                  </span>
                  <span>•</span>
                  <span>
                    <i className="fas fa-clock" aria-hidden /> {formatBrDateTime(viewed.createdAt)}
                  </span>
                </div>
              </div>
              <div className="comms-view-badges">
                <span
                  className={`purch-badge ${
                    viewed.priority === 'alta' ? 'badge-danger' : viewed.priority === 'baixa' ? 'badge-info' : 'badge-warning'
                  }`}
                >
                  {viewed.priority === 'alta' ? (
                    <>
                      <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }} aria-hidden /> Alta
                    </>
                  ) : viewed.priority === 'baixa' ? (
                    <>
                      <i className="fas fa-info-circle" style={{ marginRight: 6 }} aria-hidden /> Baixa
                    </>
                  ) : (
                    <>
                      <i className="fas fa-flag" style={{ marginRight: 6 }} aria-hidden /> Média
                    </>
                  )}
                </span>
                <span className="purch-badge badge-primary" title={recipientLabel(viewed)}>
                  <i className="fas fa-users" style={{ marginRight: 6 }} aria-hidden /> {recipientLabel(viewed)}
                </span>
              </div>
            </div>

            <div className="comms-view-body" style={{ whiteSpace: 'pre-wrap' }}>
              {viewed.message || ''}
            </div>

            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
              {isAdminView(me.role) ? 'Admin: você visualiza todos os comunicados.' : 'Ao abrir, este comunicado foi marcado como lido.'}
            </div>
          </div>
        ) : (
          <div style={{ padding: 12, color: 'var(--text-muted, #9CA3AF)', fontSize: 14 }}>Comunicado não encontrado.</div>
        )}
      </Modal>
    </section>
  )
}

