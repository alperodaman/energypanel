import { apiFetch } from '../../lib/apiClient.js'

export function registerUser ({ email, password, name }) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  })
}

export function loginUser ({ email, password }) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function fetchCurrentUser (accessToken) {
  return apiFetch('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function refreshTokens ({ refreshToken }) {
  return apiFetch('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}
