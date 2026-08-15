import { useAuthStore } from '../features/auth/authStore.js'

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL

export async function apiFetch (path, options = {}) {
  const { accessToken } = useAuthStore.getState()

  const response = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const error = new Error(body?.error || `Request failed: ${response.status}`)
    error.status = response.status
    error.details = body?.details
    throw error
  }

  return response.json()
}
