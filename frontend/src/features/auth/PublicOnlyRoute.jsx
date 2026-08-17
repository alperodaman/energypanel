import { Navigate } from 'react-router-dom'

import { useAuthStore } from './authStore.js'

// Landing/login/register gibi sadece login OLMAYAN kullanıcılara açık sayfalar için:
// authStore'da token varsa dashboard'a yönlendirir.
export default function PublicOnlyRoute ({ children }) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const accessToken = useAuthStore((state) => state.accessToken)

  if (!hasHydrated) return null
  if (accessToken) return <Navigate to="/dashboard" replace />
  return children
}
