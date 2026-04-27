import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStaffAuth } from '@/app/providers/staffAuthContext'

export function useStaffLoginForm() {
  const { login } = useStaffAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = useCallback(async () => {
    setError(null)
    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    navigate('/app/dashboard', { replace: true })
  }, [email, password, login, navigate])

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    submitting,
    submit,
  }
}
