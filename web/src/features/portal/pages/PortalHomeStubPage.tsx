import { useMemo } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { PORTAL_SESSION_STORAGE_KEY } from '@/features/portal/constants'
import '../../../../../css/portal.css'

function readPortalSession(): boolean {
  try {
    const raw = sessionStorage.getItem(PORTAL_SESSION_STORAGE_KEY)
    if (!raw) return false
    const s = JSON.parse(raw) as { userId?: string; email?: string; employeeId?: string }
    return Boolean(s?.userId && s?.email && s?.employeeId)
  } catch {
    return false
  }
}

export function PortalHomeStubPage() {
  const ok = useMemo(() => readPortalSession(), [])
  const navigate = useNavigate()

  if (!ok) {
    return <Navigate to="/portal/login" replace />
  }

  const logout = () => {
    try {
      sessionStorage.removeItem(PORTAL_SESSION_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    navigate('/portal/login', { replace: true })
  }

  return (
    <div id="portal-app-root">
      <div id="portal-home">
        <div className="portal-home-ambient" aria-hidden="true">
          <div className="portal-orb portal-orb--tl" />
          <div className="portal-orb portal-orb--tr" />
          <div className="portal-orb portal-orb--bl" />
          <div className="portal-orb portal-orb--br" />
        </div>
        <div className="portal-shell">
          <div className="portal-topbar">
            <div>
              <h1>
                <i className="fas fa-id-card-alt portal-topbar-icon" /> Portal do Colaborador
              </h1>
              <div className="portal-sub">Lumini — informações do seu vínculo</div>
            </div>
            <button type="button" className="btn-outline" id="portal-btn-logout" onClick={logout}>
              <i className="fas fa-sign-out-alt" /> Sair
            </button>
          </div>

          <div className="portal-welcome" id="portal-welcome-block">
            <h2 id="portal-welcome-title">Olá!</h2>
            <p id="portal-welcome-text">Bem-vindo ao portal do colaborador.</p>
          </div>

          <div className="portal-card-grid" id="portal-cards">
            <div className="portal-info-card">
              <div className="label">
                <i className="fas fa-user" style={{ marginRight: 6 }} />
                Nome
              </div>
              <div className="value" id="portal-val-name">
                —
              </div>
            </div>
            <div className="portal-info-card">
              <div className="label">
                <i className="fas fa-briefcase" style={{ marginRight: 6 }} />
                Cargo
              </div>
              <div className="value" id="portal-val-role">
                —
              </div>
            </div>
            <div className="portal-info-card">
              <div className="label">
                <i className="fas fa-users" style={{ marginRight: 6 }} />
                Equipe
              </div>
              <div className="value" id="portal-val-team">
                —
              </div>
            </div>
          </div>

          <section className="portal-section portal-evaluations" aria-labelledby="portal-eval-heading">
            <h2 id="portal-eval-heading" className="portal-section-title">
              <i className="fas fa-clipboard-check" aria-hidden="true" /> Minhas Avaliações
            </h2>
            <p className="portal-section-lead" id="portal-eval-lead">
              Acompanhe o andamento do processo e o histórico de avaliações de desempenho vinculadas ao seu cadastro.
            </p>
            <div id="portal-eval-empty" className="portal-eval-empty" role="status">
              <div className="portal-eval-empty-icon">
                <i className="fas fa-clipboard-list" />
              </div>
              <h3 className="portal-eval-empty-title">Nenhuma avaliação ainda</h3>
              <p className="portal-eval-empty-text">Quando houver avaliações vinculadas ao seu cadastro, elas aparecerão nesta
                seção.</p>
            </div>
          </section>

          <section className="portal-section portal-holerites" aria-labelledby="portal-hol-heading">
            <h2 id="portal-hol-heading" className="portal-section-title">
              <i className="fas fa-file-invoice-dollar" aria-hidden="true" /> Meus Holerites
            </h2>
            <p className="portal-section-lead" id="portal-hol-lead">
              Documentos de pagamento publicados pelo RH e vinculados ao seu cadastro (somente leitura).
            </p>
            <div id="portal-hol-empty" className="portal-hol-empty" role="status">
              <div className="portal-hol-empty-icon">
                <i className="fas fa-file-invoice-dollar" />
              </div>
              <h3 className="portal-hol-empty-title">Nenhum holerite</h3>
              <p className="portal-hol-empty-text">Documentos publicados pelo RH serão exibidos aqui.</p>
            </div>
          </section>

          <section className="portal-section portal-frequencia" aria-labelledby="portal-freq-heading">
            <h2 id="portal-freq-heading" className="portal-section-title">
              <i className="fas fa-calendar-check" aria-hidden="true" /> Minha Frequência
            </h2>
            <p className="portal-section-lead" id="portal-freq-lead">
              Calendário mensal com a frequência registrada pela supervisão (coleção diária), vinculada ao seu cadastro
              (somente leitura).
            </p>
            <div id="portal-freq-wrap" className="portal-freq-wrap">
              <div id="portal-freq-empty" className="portal-freq-empty" role="status">
                <div className="portal-freq-empty-icon">
                  <i className="fas fa-calendar-alt" />
                </div>
                <h3 className="portal-freq-empty-title">Calendário</h3>
                <p className="portal-freq-empty-text">Os dias com frequência registrada serão exibidos aqui.</p>
              </div>
            </div>
          </section>

          <Link className="portal-link-main" to="/app/login">
            <i className="fas fa-arrow-left" /> Voltar ao sistema principal
          </Link>
        </div>
      </div>
    </div>
  )
}
