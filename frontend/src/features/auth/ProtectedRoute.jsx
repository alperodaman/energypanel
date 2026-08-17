import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { fetchCurrentUser, refreshTokens } from './authApi.js'
import { useAuthStore } from './authStore.js'

// Korumalı sayfaya girişte tek seferlik oturum doğrulaması: localStorage'daki
// accessToken süresi dolmuş olabilir, bu yüzden /auth/me ile doğrulanır;
// 401 dönerse refreshToken ile bir kez yenileme denenir.
export default function ProtectedRoute ({ children }) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const accessToken = useAuthStore((state) => state.accessToken)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const [status, setStatus] = useState('checking')

  useEffect(() => {
    if (!hasHydrated) return

    if (!accessToken) {
      setStatus('invalid')
      return
    }

    let cancelled = false

    async function verify () {
      try {
        const user = await fetchCurrentUser(accessToken)
        if (cancelled) return
        setAuth({ accessToken, refreshToken, user })
        setStatus('valid')
      } catch (err) {
        if (err.status !== 401 || !refreshToken) {
          if (!cancelled) {
            clearAuth()
            setStatus('invalid')
          }
          return
        }

        try {
          const tokens = await refreshTokens({ refreshToken })
          const user = await fetchCurrentUser(tokens.accessToken)
          if (cancelled) return
          setAuth({ ...tokens, user })
          setStatus('valid')
        } catch {
          if (!cancelled) {
            clearAuth()
            setStatus('invalid')
          }
        }
      }
    }

    verify()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated])

  if (!hasHydrated || status === 'checking') return null
  if (status === 'invalid') return <Navigate to="/login" replace />
  return children
}
