import { io } from 'socket.io-client'

import { useAuthStore } from '../features/auth/authStore.js'

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL

let socket = null

// Bkz. enerjipanel-mimari.md §3 "Realtime Service" — Socket.io client Gateway'i
// değil, doğrudan Realtime Service'i hedefler; JWT, handshake auth objesiyle taşınır.
export function getSocket () {
  if (socket) return socket

  socket = io(REALTIME_URL, {
    autoConnect: false,
    // Fonksiyon olarak verilir: Socket.io her (yeniden) bağlanma denemesinde
    // bunu tekrar çağırır, böylece reconnect sırasında authStore'daki güncel
    // token okunur (ilk bağlantıda donmuş eski token değil).
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
  })

  return socket
}

export function resetSocket () {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
