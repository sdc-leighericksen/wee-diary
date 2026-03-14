import { useState } from 'react'
import useAuthStore from '../stores/authStore'
import Button from '../components/ui/Button'
import Logo from '../components/ui/Logo'
import './LoginPage.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const login = useAuthStore(s => s.login)
  const error = useAuthStore(s => s.error)
  const loading = useAuthStore(s => s.loading)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(email, password)
    } catch { /* error handled in store */ }
  }

  return (
    <div className="login-page">
      <div className="login-container fade-in">
        <div className="login-header">
          <Logo width={180} />
          <p>Your private bladder diary</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              required
              autoComplete="current-password"
            />
          </div>

          <label className="remember-me">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            <span>Keep me logged in</span>
          </label>

          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
