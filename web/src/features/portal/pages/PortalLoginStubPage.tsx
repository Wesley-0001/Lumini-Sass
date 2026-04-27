import { type FormEvent } from 'react'
import { LuminiLoginStamps } from '@/components/shared/LuminiLoginStamps'
import '../../../../../css/portal.css'

export function PortalLoginStubPage() {
  return (
    <div id="portal-app-root">
      <div id="portal-login" className="page active">
        <div className="login-bg">
          <LuminiLoginStamps aria-hidden />
          <div className="login-card portal-login-card">
            <div className="login-logo">
              <div className="logo-icon">
                <img src="/images/logo-white.png" alt="Lumini" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
              </div>
              <h1 className="hero-title">Portal do Colaborador</h1>
              <p className="display-text">Acesso exclusivo para colaboradores cadastrados</p>
            </div>
            <div id="portal-login-error" className="login-error hidden" />
            <form
              className="login-form"
              id="portal-login-form"
              autoComplete="on"
              onSubmit={(e: FormEvent) => e.preventDefault()}
            >
              <div className="form-group">
                <label htmlFor="portal-email">
                  <i className="fas fa-envelope" /> E-mail corporativo
                </label>
                <input
                  type="email"
                  id="portal-email"
                  name="email"
                  placeholder="seu.email@empresa.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="portal-password">
                  <i className="fas fa-lock" /> Senha
                </label>
                <input
                  type="password"
                  id="portal-password"
                  name="password"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" className="btn-primary btn-full" id="portal-btn-submit">
                <i className="fas fa-sign-in-alt" /> Entrar
              </button>
            </form>
            <p className="portal-login-footnote">Problemas com acesso? Fale com o RH ou administrador do sistema.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
