import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '../../shared/components/Button.jsx'
import FormField from '../../shared/components/FormField.jsx'
import ErrorText from '../../shared/components/ErrorText.jsx'
import { loginUser, registerUser, fetchCurrentUser } from './authApi.js'
import { useAuthStore } from './authStore.js'
import './LoginPage.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function mapDetailsToFieldErrors (details) {
  const fieldErrors = {}
  for (const issue of details ?? []) {
    const field = issue.path?.[0]
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }
  return fieldErrors
}

function validate (mode, { name, email, password }) {
  const fieldErrors = {}
  if (mode === 'register' && !name.trim()) {
    fieldErrors.name = 'Name is required.'
  }
  if (!email.trim()) {
    fieldErrors.email = 'Email is required.'
  } else if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = 'Enter a valid email address.'
  }
  if (!password) {
    fieldErrors.password = 'Password is required.'
  } else if (mode === 'register' && password.length < 8) {
    fieldErrors.password = 'Password must be at least 8 characters.'
  }
  return fieldErrors
}

export default function LoginPage () {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode (nextMode) {
    setMode(nextMode)
    setFieldErrors({})
    setFormError('')
  }

  async function handleSubmit (event) {
    event.preventDefault()

    const validationErrors = validate(mode, { name, email, password })
    setFieldErrors(validationErrors)
    setFormError('')
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        await registerUser({ email, password, name })
      }

      const tokens = await loginUser({ email, password })
      const user = await fetchCurrentUser(tokens.accessToken)

      setAuth({ ...tokens, user })
      navigate('/dashboard')
    } catch (err) {
      if (err.status === 400 && err.details) {
        setFieldErrors(mapDetailsToFieldErrors(err.details))
      } else if (err.status === 409 && err.message === 'email_already_registered') {
        setFieldErrors({ email: 'An account with this email already exists.' })
      } else if (err.status === 401 && err.message === 'invalid_credentials') {
        setFormError('Incorrect email or password.')
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__stripe" aria-hidden="true" />

      <div className="login-page__panel">
        <h1 className="login-page__logo">EnerjiPanel</h1>

        <form className="login-page__form" onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <FormField
              id="name"
              label="Name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={fieldErrors.name}
            />
          )}

          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
          />

          <FormField
            id="password"
            label="Password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
          />

          {formError && (
            <ErrorText variant="form" role="alert" as="div">
              {formError}
            </ErrorText>
          )}

          <Button type="submit" variant="primary" className="login-page__submit" loading={loading}>
            {loading
              ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        <p className="login-page__toggle">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <Button type="button" variant="secondary" onClick={() => switchMode('register')}>
                Sign up
              </Button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Button type="button" variant="secondary" onClick={() => switchMode('login')}>
                Sign in
              </Button>
            </>
          )}
        </p>
      </div>

      <div className="login-page__stripe" aria-hidden="true" />
    </div>
  )
}
