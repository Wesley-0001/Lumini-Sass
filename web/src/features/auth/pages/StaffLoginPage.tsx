import { useState } from 'react'
import { useStaffLoginForm } from '@/features/auth/hooks/useStaffLoginForm'
import { LuminiLoginStamps } from '@/components/shared/LuminiLoginStamps'
import pageStyles from '@/features/auth/pages/StaffLoginPage.module.css'

export function StaffLoginPage() {
  const { email, setEmail, password, setPassword, error, submitting, submit } = useStaffLoginForm()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div id="page-login" className="page active">
      <div className="login-bg">
        <LuminiLoginStamps
          id="stamps-container"
          containerClassName={pageStyles.stampLayer}
          aria-hidden
          altForStamp={(code) => `Estampa ${code}`}
        />

        <div className="login-card">
          <div className="login-logo">
            <div className="logo-icon">
              <img src="/images/logo-white.png" alt="Lumini" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
            </div>
            <h1 className="hero-title" translate="no">
              Lumini
            </h1>
            <p className="display-text">Gestão de Carreira &amp; Polivalência</p>
          </div>

          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
            autoComplete="on"
          >
            <div className="form-group">
              <label>
                <i className="fas fa-envelope" /> E-mail
              </label>
              <input
                type="text"
                name="email"
                id="login-email"
                placeholder="Seu e-mail de acesso"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-lock" /> Senha
              </label>
              <div className="input-icon-right">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="login-password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <i
                  className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-pass`}
                  onClick={() => setShowPassword((s) => !s)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setShowPassword((s) => !s)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                />
              </div>
            </div>
            <div id="login-error" className={error ? 'login-error' : 'login-error hidden'} role={error ? 'alert' : undefined}>
              {error}
            </div>
            <button type="submit" className="btn-primary btn-full" disabled={submitting} aria-busy={submitting}>
              <i className="fas fa-sign-in-alt" /> {submitting ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <div className="login-demo">
            <p>
              <i className="fas fa-info-circle" /> Em caso de dúvidas sobre seu acesso, contate o administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
