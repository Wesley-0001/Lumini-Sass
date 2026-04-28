import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, Card, FormField, FormRow, Modal, ModalFooter } from '@/components/ui'
import { useStaffAuth } from '@/app/providers/staffAuthContext'
import { useToast } from '@/components/ui/toast/toastContext'
import { tryGetFirestoreDb } from '@/services/firebase/app'
import { addInAppNotification, batchAddInAppNotifications } from '@/features/notifications/notificationsApi'
import { deletePurchase, loadProducts, loadPurchases, loadSuppliers, type Product, type Supplier, upsertPurchase } from '@/features/purchases/purchasesFirestore'
import { loadUsersFromFirestore } from '@/features/users/persistUsers'

type PurchaseStatus = 'pending' | 'approved' | 'purchased' | 'delivered' | 'cancelled'

type PurchaseItem = {
  productId?: string
  name?: string
  qty?: number
  unit?: string
  price?: number
}

export type PurchaseRequest = {
  id: string
  title?: string
  supplierId?: string
  notes?: string
  items?: PurchaseItem[]
  total?: number
  status?: PurchaseStatus
  requester?: string
  requesterEmail?: string
  createdAt?: number
  updatedAt?: number

  cancelRequestStatus?: 'pending' | 'approved' | 'rejected'
  cancelRequestedAt?: number
  cancelledResolvedAt?: number
  cancelRejectedAt?: number

  approvedBy?: string
  approvedAt?: number
  purchasedBy?: string
  purchasedAt?: number
  deliveredBy?: string
  deliveredAt?: number
}

const STATUS_META: Record<PurchaseStatus, { label: string; cls: string; icon: string }> = {
  pending: { label: 'Pendente', cls: 'badge-warning', icon: '⏳' },
  approved: { label: 'Aprovada', cls: 'badge-info', icon: '✅' },
  purchased: { label: 'Comprado', cls: 'badge-primary', icon: '🛒' },
  delivered: { label: 'Entregue', cls: 'badge-success', icon: '📦' },
  cancelled: { label: 'Cancelada', cls: 'badge-danger', icon: '❌' },
}

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

function normEmail(v: unknown): string {
  return String(v ?? '')
    .trim()
    .toLowerCase()
}

function fmtCurrency(v: unknown): string {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(ts: unknown): string {
  const n = Number(ts || 0)
  if (!n) return '—'
  try {
    return new Date(n).toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

function buildId(): string {
  return `pur-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function getCurrentUser(userFromAuth: any): { name: string; email: string; role: string } {
  return {
    name: String(userFromAuth?.name ?? 'Sistema'),
    email: String(userFromAuth?.email ?? ''),
    role: String(userFromAuth?.role ?? 'supervisor'),
  }
}

function isPurchaseRequester(p: PurchaseRequest, me: { name: string; email: string }): boolean {
  if (!p) return false
  const pe = normalize(String(p.requesterEmail || ''))
  const meE = normalize(String(me.email || ''))
  if (pe && meE && pe === meE) return true
  const pr = normalize(String(p.requester || ''))
  const meN = normalize(String(me.name || ''))
  if (pr && meN && pr === meN) return true
  return false
}

function canRequestCancel(p: PurchaseRequest, me: { name: string; email: string }): boolean {
  const st = (p.status || 'pending') as PurchaseStatus
  if (st === 'cancelled' || st === 'delivered') return false
  if (p.cancelRequestStatus === 'pending') return false
  if (!isPurchaseRequester(p, me)) return false
  return st === 'pending' || st === 'approved' || st === 'purchased'
}

function calcTotal(items: PurchaseItem[]): number {
  return items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0)
}

export function PurchasesPage() {
  const { user } = useStaffAuth()
  const { pushToast } = useToast()
  const db = useMemo(() => tryGetFirestoreDb(), [])

  const me = useMemo(() => getCurrentUser(user), [user])

  const [ready, setReady] = useState(false)
  const [items, setItems] = useState<PurchaseRequest[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | PurchaseStatus>('')
  const [supplier, setSupplier] = useState('')

  const [editorOpen, setEditorOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)

  const [draftTitle, setDraftTitle] = useState('')
  const [draftSupplierId, setDraftSupplierId] = useState('')
  const [draftNotes, setDraftNotes] = useState('')
  const [draftItems, setDraftItems] = useState<PurchaseItem[]>([{ productId: '', name: '', qty: 1, unit: 'un', price: 0 }])

  const canApprove = me.role === 'admin' || me.role === 'manager' || me.role === 'boss'
  const canCreate = me.role !== 'boss'

  async function resolveRequesterEmailCompat(p: PurchaseRequest): Promise<string> {
    const direct = normEmail(p.requesterEmail)
    if (direct) return direct
    const requesterName = String(p.requester || '').trim().toLowerCase()
    if (!requesterName) return ''
    try {
      const users = await loadUsersFromFirestore()
      const hit = users
        .filter((u) => u?.active !== false)
        .find((u) => String(u?.name ?? '').trim().toLowerCase() === requesterName)
      return hit?.email ? normEmail(hit.email) : ''
    } catch {
      return ''
    }
  }

  useEffect(() => {
    if (!db) {
      setReady(true)
      setItems([])
      setSuppliers([])
      setProducts([])
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const [purs, sups, prods] = await Promise.all([loadPurchases(db), loadSuppliers(db), loadProducts(db)])
        if (cancelled) return
        setItems(purs)
        setSuppliers(sups)
        setProducts(prods)
        setReady(true)
      } catch {
        if (!cancelled) {
          setReady(true)
          setItems([])
          setSuppliers([])
          setProducts([])
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    let out = items.slice()
    const q = normalize(search)
    if (q) {
      out = out.filter((p) => normalize(`${p.title || ''} ${p.requester || ''}`).includes(q))
    }
    if (status) out = out.filter((p) => (p.status || 'pending') === status)
    if (supplier) out = out.filter((p) => String(p.supplierId || '') === supplier)
    out.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    return out
  }, [items, search, status, supplier])

  const kpis = useMemo(() => {
    const total = items.length
    const pending = items.filter((p) => (p.status || 'pending') === 'pending').length
    const approved = items.filter((p) => (p.status || 'pending') === 'approved').length
    const delivered = items.filter((p) => (p.status || 'pending') === 'delivered').length
    const totalValue = items.reduce((s, p) => s + Number(p.total || 0), 0)
    return { total, pending, approved, delivered, totalValue }
  }, [items])

  function resetDraft() {
    setEditingId(null)
    setDraftTitle('')
    setDraftSupplierId('')
    setDraftNotes('')
    setDraftItems([{ productId: '', name: '', qty: 1, unit: 'un', price: 0 }])
  }

  function openCreate() {
    if (!canCreate) return
    resetDraft()
    setEditorOpen(true)
  }

  function openEdit(id: string) {
    const p = items.find((x) => x.id === id)
    if (!p) return
    const cancelPending = p.cancelRequestStatus === 'pending'
    const canEdit = (p.status || 'pending') === 'pending' && me.role !== 'boss' && !cancelPending
    if (!canEdit) return

    setEditingId(id)
    setDraftTitle(String(p.title || ''))
    setDraftSupplierId(String(p.supplierId || ''))
    setDraftNotes(String(p.notes || ''))
    const cloned = (p.items || []).map((it) => ({ ...it }))
    setDraftItems(cloned.length ? cloned : [{ productId: '', name: '', qty: 1, unit: 'un', price: 0 }])
    setEditorOpen(true)
  }

  function openView(id: string) {
    setViewingId(id)
    setViewOpen(true)
  }

  function upsertDraftItem(idx: number, patch: Partial<PurchaseItem>) {
    setDraftItems((cur) => {
      const next = cur.slice()
      const base = next[idx] ?? { productId: '', name: '', qty: 1, unit: 'un', price: 0 }
      let merged = { ...base, ...patch }

      if ('productId' in patch) {
        const pid = String(patch.productId || '')
        if (pid && pid !== '__custom__') {
          const prod = products.find((p) => p.id === pid)
          if (prod) {
            merged = {
              ...merged,
              name: String(prod.name || merged.name || ''),
              unit: String(prod.unit || merged.unit || 'un'),
              price: Number(prod.price || merged.price || 0),
            }
          }
        }
      }

      next[idx] = merged
      return next
    })
  }

  function addDraftItem() {
    setDraftItems((cur) => [...cur, { productId: '', name: '', qty: 1, unit: 'un', price: 0 }])
  }

  function removeDraftItem(idx: number) {
    setDraftItems((cur) => (cur.length <= 1 ? cur : cur.filter((_, i) => i !== idx)))
  }

  async function saveDraft() {
    if (!canCreate) return
    if (!db) {
      pushToast('Firebase não configurado. Configure VITE_FIREBASE_* para salvar.', 'warning')
      return
    }
    const title = draftTitle.trim()
    if (!title) {
      pushToast('Informe o título da requisição.', 'warning')
      return
    }

    const normalizedItems = draftItems
      .map((it) => ({
        productId: String(it.productId || ''),
        name: String(it.name || '').trim(),
        qty: Number(it.qty || 0) || 1,
        unit: String(it.unit || 'un').trim() || 'un',
        price: Number(it.price || 0) || 0,
      }))
      .filter((it) => it.name || it.productId)

    if (!normalizedItems.length) {
      pushToast('Adicione pelo menos um item.', 'warning')
      return
    }

    const total = calcTotal(normalizedItems)
    const now = Date.now()

    const next: PurchaseRequest[] = editingId
      ? items.map((p) =>
          p.id === editingId
            ? {
                ...p,
                title,
                supplierId: draftSupplierId || '',
                notes: draftNotes.trim(),
                items: normalizedItems,
                total,
                updatedAt: now,
              }
            : p,
        )
      : [
          ...items,
          {
            id: buildId(),
            title,
            supplierId: draftSupplierId || '',
            notes: draftNotes.trim(),
            items: normalizedItems,
            total,
            status: 'pending',
            requester: me.name || 'Sistema',
            requesterEmail: me.email || '',
            createdAt: now,
            updatedAt: now,
          },
        ]

    setItems(next)
    const saved = next.find((x) => x.id === (editingId || next[next.length - 1]?.id))
    if (saved) await upsertPurchase(db, saved)
    setEditorOpen(false)
    pushToast(editingId ? 'Requisição atualizada.' : 'Requisição criada.', 'success')
  }

  async function removePurchase(id: string) {
    const p = items.find((x) => x.id === id)
    if (!p) return
    if (!db) {
      pushToast('Firebase não configurado. Não foi possível excluir.', 'warning')
      return
    }
    const cancelPending = p.cancelRequestStatus === 'pending'
    const canEdit = (p.status || 'pending') === 'pending' && me.role !== 'boss' && !cancelPending
    if (!canEdit) return
    const ok = window.confirm(`Excluir "${p.title || 'requisição'}"? Ação irreversível.`)
    if (!ok) return
    const next = items.filter((x) => x.id !== id)
    setItems(next)
    await deletePurchase(db, id)
    pushToast('Requisição excluída.', 'info')
  }

  async function advanceStatus(id: string, nextStatus: PurchaseStatus) {
    if (!canApprove) return
    const p = items.find((x) => x.id === id)
    if (!p) return
    if (!db) {
      pushToast('Firebase não configurado. Não foi possível atualizar status.', 'warning')
      return
    }
    if (p.cancelRequestStatus === 'pending') return

    const labels: Partial<Record<PurchaseStatus, string>> = {
      approved: 'aprovar',
      purchased: 'marcar como Comprado',
      delivered: 'marcar como Entregue',
    }
    const ok = window.confirm(`Deseja ${labels[nextStatus] || 'atualizar'} esta requisição?`)
    if (!ok) return

    const now = Date.now()
    const updated = items.map((x) => {
      if (x.id !== id) return x
      const base: PurchaseRequest = { ...x, status: nextStatus, updatedAt: now }
      const who = me.name || 'Sistema'
      if (nextStatus === 'approved') return { ...base, approvedBy: who, approvedAt: now }
      if (nextStatus === 'purchased') return { ...base, purchasedBy: who, purchasedAt: now }
      if (nextStatus === 'delivered') return { ...base, deliveredBy: who, deliveredAt: now }
      return base
    })

    setItems(updated)
    const justUpdated = updated.find((x) => x.id === id)
    if (justUpdated) await upsertPurchase(db, justUpdated)

    if (nextStatus === 'approved') {
      if (justUpdated) {
        try {
          const em = await resolveRequesterEmailCompat(justUpdated)
          if (em) {
            await addInAppNotification({
              db,
              notification: {
                userEmail: em,
                userId: null,
                type: 'purchase_approved',
                title: 'Sua solicitação de compra foi aprovada',
                message: `Item: “${String(justUpdated.title || '—').slice(0, 80)}”.`,
                link: 'purchases',
                read: false,
                createdAt: Date.now(),
                meta: { purchaseId: justUpdated.id },
              },
            })
          }
        } catch {
          // ignore
        }
      }
    }

    pushToast(`Status atualizado para: ${STATUS_META[nextStatus]?.label || nextStatus}`, 'success')
  }

  async function requestCancel(id: string) {
    const p = items.find((x) => x.id === id)
    if (!p) return
    if (!canRequestCancel(p, me)) return
    if (!db) {
      pushToast('Firebase não configurado. Não foi possível solicitar cancelamento.', 'warning')
      return
    }

    const ok = window.confirm(
      'Deseja solicitar o cancelamento desta requisição? Administradores, diretores e gerentes serão notificados.',
    )
    if (!ok) return

    const now = Date.now()
    const next = items.map((x) =>
      x.id === id
        ? { ...x, cancelRequestStatus: 'pending' as const, cancelRequestedAt: now, updatedAt: now }
        : x,
    )
    setItems(next)
    const updated = next.find((x) => x.id === id)
    if (updated) await upsertPurchase(db, updated)

    if (db && updated) {
      try {
        const users = await loadUsersFromFirestore()
        const targets = users.filter((u) => u?.active !== false).filter((u) => ['admin', 'manager', 'boss'].includes(String(u.role)))
        if (targets.length) {
          await batchAddInAppNotifications({
            db,
            notifications: targets.map((u) => ({
              userEmail: normEmail(u.email),
              userId: null,
              type: 'purchase_cancel_request',
              title: 'Nova solicitação de cancelamento',
              message: `${updated.requester || 'Solicitante'} pediu cancelamento da compra “${String(updated.title || '').slice(0, 72)}”. Confira em Compras.`,
              link: 'purchases',
              read: false,
              createdAt: Date.now(),
              meta: { purchaseId: updated.id },
            })),
          })
        }
      } catch {
        // ignore
      }
    }
    pushToast('Solicitação de cancelamento enviada.', 'success')
  }

  async function resolveCancel(id: string, approved: boolean) {
    if (!canApprove) return
    const p = items.find((x) => x.id === id)
    if (!p || p.cancelRequestStatus !== 'pending') return
    if (!db) {
      pushToast('Firebase não configurado. Não foi possível resolver cancelamento.', 'warning')
      return
    }

    const ok = window.confirm(
      approved
        ? 'Confirma o cancelamento desta requisição de compra?'
        : 'Confirma recusar o pedido de cancelamento? O status da requisição permanece o mesmo.',
    )
    if (!ok) return

    const now = Date.now()
    const next = items.map((x) => {
      if (x.id !== id) return x
      if (approved) {
        return {
          ...x,
          status: 'cancelled' as const,
          cancelRequestStatus: 'approved' as const,
          cancelledResolvedAt: now,
          updatedAt: now,
        }
      }
      return {
        ...x,
        cancelRequestStatus: 'rejected' as const,
        cancelRejectedAt: now,
        updatedAt: now,
      }
    })
    setItems(next)
    const updated = next.find((x) => x.id === id)
    if (updated) await upsertPurchase(db, updated)

    if (db && updated) {
      try {
        const em = await resolveRequesterEmailCompat(updated)
        if (em) {
          await addInAppNotification({
            db,
            notification: {
              userEmail: em,
              userId: null,
              type: approved ? 'purchase_cancel_ok' : 'purchase_cancel_denied',
              title: approved ? 'Sua solicitação de cancelamento foi aprovada' : 'Sua solicitação de cancelamento foi recusada',
              message: approved
                ? `A compra “${String(updated.title || '').slice(0, 80)}” foi cancelada.`
                : `A compra “${String(updated.title || '').slice(0, 80)}” permanece ativa.`,
              link: 'purchases',
              read: false,
              createdAt: Date.now(),
              meta: { purchaseId: updated.id },
            },
          })
        }
      } catch {
        // ignore
      }
    }

    pushToast(approved ? 'Cancelamento aprovado.' : 'Pedido de cancelamento recusado.', approved ? 'success' : 'info')
  }

  const viewing = useMemo(() => {
    if (!viewingId) return null
    return items.find((x) => x.id === viewingId) ?? null
  }, [viewingId, items])

  const draftTotal = useMemo(() => calcTotal(draftItems), [draftItems])

  return (
    <section>
      <PageHeader
        icon="fa-shopping-cart"
        title="Compras"
        subtitle="Requisições de compra"
        actions={
          canCreate ? (
            <Button onClick={openCreate} disabled={!ready}>
              <i className="fas fa-plus" aria-hidden /> Nova Requisição
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
            <i className="fas fa-file-alt" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.total}</span>
            <span className="stat-label">Total de Requisições</span>
          </div>
        </Card>
        <Card variant="stat" className="orange">
          <div className="stat-icon">
            <i className="fas fa-clock" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.pending}</span>
            <span className="stat-label">Pendentes</span>
          </div>
        </Card>
        <Card variant="stat" className="teal">
          <div className="stat-icon">
            <i className="fas fa-check-circle" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.approved}</span>
            <span className="stat-label">Aprovadas</span>
          </div>
        </Card>
        <Card variant="stat" className="green">
          <div className="stat-icon">
            <i className="fas fa-truck" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.delivered}</span>
            <span className="stat-label">Entregues</span>
          </div>
        </Card>
        <Card variant="stat" className="purple">
          <div className="stat-icon">
            <i className="fas fa-dollar-sign" aria-hidden />
          </div>
          <div className="stat-info">
            <span className="stat-value" style={{ fontSize: 18 }}>
              {fmtCurrency(kpis.totalValue)}
            </span>
            <span className="stat-label">Valor Total</span>
          </div>
        </Card>
      </div>

      <Card>
        <FormRow>
          <FormField label="Buscar" icon="fa-search">
            <input className="rh-input" placeholder="Buscar requisição..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </FormField>
          <FormField label="Status" icon="fa-filter">
            <select className="rh-select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="">Todos</option>
              {(Object.keys(STATUS_META) as PurchaseStatus[]).map((k) => (
                <option key={k} value={k}>
                  {STATUS_META[k].icon} {STATUS_META[k].label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Fornecedor" icon="fa-truck">
            <select className="rh-select" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              <option value="">Todos</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
          </FormField>
        </FormRow>

        {!ready ? (
          <div style={{ padding: 12, color: 'var(--text-muted, #9CA3AF)', fontSize: 14 }}>Carregando…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
            Nenhuma requisição encontrada
          </div>
        ) : (
          <div className="table-wrapper" style={{ marginTop: 8 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Título</th>
                  <th>Fornecedor</th>
                  <th>Itens</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Solicitante</th>
                  <th style={{ width: 220 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const st = STATUS_META[(p.status || 'pending') as PurchaseStatus]
                  const sup = suppliers.find((s) => s.id === p.supplierId)
                  const cancelPending = p.cancelRequestStatus === 'pending'
                  const canEdit = (p.status || 'pending') === 'pending' && me.role !== 'boss' && !cancelPending
                  const showReqCancel = canRequestCancel(p, me)
                  const canResolve = canApprove && cancelPending

                  return (
                    <tr key={p.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{String(i + 1).padStart(3, '0')}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.title || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(p.items || []).length} item(s)</div>
                      </td>
                      <td>{sup ? <span style={{ fontWeight: 500 }}>{sup.name}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td style={{ textAlign: 'center' }}>{(p.items || []).length}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fmtCurrency(p.total)}</td>
                      <td>
                        <span className={`purch-badge ${st.cls}`}>
                          {st.icon} {st.label}
                        </span>
                        {cancelPending ? (
                          <div style={{ marginTop: 4 }}>
                            <span className="purch-badge badge-warning" title="Cancelamento pendente de análise">
                              <i className="fas fa-hourglass-half" aria-hidden /> Cancel. pendente
                            </span>
                          </div>
                        ) : null}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(p.createdAt)}</td>
                      <td style={{ fontSize: 12 }}>{p.requester || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Button variant="icon" type="button" title="Ver detalhes" onClick={() => openView(p.id)}>
                            <i className="fas fa-eye" aria-hidden />
                          </Button>

                          {canEdit ? (
                            <Button variant="icon" type="button" title="Editar" onClick={() => openEdit(p.id)}>
                              <i className="fas fa-edit" aria-hidden />
                            </Button>
                          ) : null}

                          {canApprove && (p.status || 'pending') === 'pending' && !cancelPending ? (
                            <Button variant="icon" type="button" title="Aprovar" style={{ color: '#16A34A' }} onClick={() => void advanceStatus(p.id, 'approved')}>
                              <i className="fas fa-check" aria-hidden />
                            </Button>
                          ) : null}

                          {canApprove && (p.status || 'pending') === 'approved' && !cancelPending ? (
                            <Button variant="icon" type="button" title="Marcar como Comprado" style={{ color: '#2563EB' }} onClick={() => void advanceStatus(p.id, 'purchased')}>
                              <i className="fas fa-shopping-bag" aria-hidden />
                            </Button>
                          ) : null}

                          {canApprove && (p.status || 'pending') === 'purchased' && !cancelPending ? (
                            <Button variant="icon" type="button" title="Marcar como Entregue" style={{ color: '#0D9488' }} onClick={() => void advanceStatus(p.id, 'delivered')}>
                              <i className="fas fa-truck" aria-hidden />
                            </Button>
                          ) : null}

                          {canEdit ? (
                            <Button variant="icon" type="button" title="Excluir" style={{ color: '#DC2626' }} onClick={() => void removePurchase(p.id)}>
                              <i className="fas fa-trash" aria-hidden />
                            </Button>
                          ) : null}

                          {showReqCancel ? (
                            <Button variant="icon" type="button" title="Solicitar cancelamento" style={{ color: '#B45309' }} onClick={() => void requestCancel(p.id)}>
                              <i className="fas fa-ban" aria-hidden />
                            </Button>
                          ) : null}

                          {canResolve ? (
                            <>
                              <Button variant="icon" type="button" title="Aprovar cancelamento" style={{ color: '#16A34A' }} onClick={() => void resolveCancel(p.id, true)}>
                                <i className="fas fa-check-double" aria-hidden />
                              </Button>
                              <Button variant="icon" type="button" title="Recusar cancelamento" style={{ color: '#DC2626' }} onClick={() => void resolveCancel(p.id, false)}>
                                <i className="fas fa-times-circle" aria-hidden />
                              </Button>
                            </>
                          ) : null}
                        </div>
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
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Editar requisição' : 'Nova requisição de compra'}
        footer={
          <ModalFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void saveDraft()} disabled={!ready || !canCreate}>
              <i className="fas fa-save" aria-hidden /> {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </ModalFooter>
        }
      >
        <FormRow>
          <FormField label="Título" icon="fa-heading">
            <input className="rh-input" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
          </FormField>
          <FormField label="Fornecedor" icon="fa-truck">
            <select className="rh-select" value={draftSupplierId} onChange={(e) => setDraftSupplierId(e.target.value)}>
              <option value="">Selecionar fornecedor…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
          </FormField>
        </FormRow>

        <FormField label="Observações" icon="fa-align-left">
          <textarea className="rh-textarea" rows={2} value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} />
        </FormField>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
            <strong>
              <i className="fas fa-list" style={{ color: '#002B5B', marginRight: 6 }} aria-hidden /> Itens
            </strong>
            <Button variant="outline" type="button" onClick={addDraftItem} style={{ padding: '6px 12px', fontSize: 12, height: 'auto' }}>
              <i className="fas fa-plus" aria-hidden /> Adicionar item
            </Button>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {draftItems.map((it, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 80px 80px 110px 44px',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <select className="rh-select" value={String(it.productId || '')} onChange={(e) => upsertDraftItem(idx, { productId: e.target.value })}>
                  <option value="">Produto / insumo…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.id}
                    </option>
                  ))}
                  <option value="__custom__">✏️ Digitar manualmente</option>
                </select>
                <input
                  className="rh-input"
                  type="number"
                  min={1}
                  value={Number(it.qty || 1)}
                  onChange={(e) => upsertDraftItem(idx, { qty: Number(e.target.value || 1) })}
                  style={{ textAlign: 'center' }}
                />
                <input className="rh-input" value={String(it.unit || 'un')} onChange={(e) => upsertDraftItem(idx, { unit: e.target.value })} style={{ textAlign: 'center' }} />
                <input
                  className="rh-input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={Number(it.price || 0)}
                  onChange={(e) => upsertDraftItem(idx, { price: Number(e.target.value || 0) })}
                  style={{ textAlign: 'right' }}
                />
                <Button variant="icon" type="button" title="Remover" style={{ color: '#DC2626' }} onClick={() => removeDraftItem(idx)}>
                  <i className="fas fa-times" aria-hidden />
                </Button>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '2px solid var(--border)', marginTop: 12, paddingTop: 12, textAlign: 'right' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total: </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{fmtCurrency(draftTotal)}</span>
          </div>
        </div>
      </Modal>

      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Detalhes da requisição"
        footer={
          <ModalFooter>
            <Button onClick={() => setViewOpen(false)}>Fechar</Button>
          </ModalFooter>
        }
      >
        {viewing ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{viewing.title || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Criado por {viewing.requester || '—'} em {fmtDate(viewing.createdAt)}
                </div>
              </div>
              <span className={`purch-badge ${STATUS_META[(viewing.status || 'pending') as PurchaseStatus].cls}`} style={{ fontSize: 13, padding: '6px 14px' }}>
                {STATUS_META[(viewing.status || 'pending') as PurchaseStatus].icon} {STATUS_META[(viewing.status || 'pending') as PurchaseStatus].label}
              </span>
            </div>

            {(() => {
              const sup = suppliers.find((s) => s.id === viewing.supplierId)
              if (!sup) return null
              return (
                <div style={{ background: 'var(--bg-surface-2)', borderRadius: 10, padding: 12, marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <i className="fas fa-truck" style={{ color: '#002B5B', fontSize: 16 }} aria-hidden />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Fornecedor</div>
                    <div style={{ fontWeight: 600 }}>{sup.name || sup.id}</div>
                    {sup.contact ? <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sup.contact}</div> : null}
                  </div>
                </div>
              )
            })()}

            {viewing.notes ? (
              <div style={{ background: 'var(--bg-surface-2)', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {viewing.notes}
              </div>
            ) : null}

            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>
              <i className="fas fa-list" style={{ color: '#002B5B', marginRight: 6 }} aria-hidden /> Itens
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--table-header-bg)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>
                    Produto
                  </th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>
                    Qtd
                  </th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>
                    Unit.
                  </th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {(viewing.items || []).map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 500 }}>{it.name || it.productId || '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {Number(it.qty || 0)} {it.unit || 'un'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtCurrency(it.price)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{fmtCurrency(Number(it.qty || 0) * Number(it.price || 0))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                    Total
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{fmtCurrency(viewing.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div style={{ padding: 12, color: 'var(--text-muted, #9CA3AF)', fontSize: 14 }}>Requisição não encontrada.</div>
        )}
      </Modal>
    </section>
  )
}

