import { io } from 'socket.io-client'

import { useAuthStore } from '../features/auth/authStore.js'

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL

let socket = null

// Bkz. enerjipanel-mimari.md §3 "Realtime Service" — Socket.io client Gateway'i
// değil, doğrudan Realtime Service'i hedefler; JWT, handshake auth objesiyle taşınır.
export function getSocket () {
  if (socket) return socket

  const { accessToken } = useAuthStore.getState()

  socket = io(REALTIME_URL, {
    autoConnect: false,
    auth: { token: accessToken },
  })

  return socket
}
