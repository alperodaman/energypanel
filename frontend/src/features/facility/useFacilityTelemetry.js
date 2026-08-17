import { useEffect, useRef, useState } from 'react'

import { getSocket } from '../../lib/socket.js'
import { useAuthStore } from '../auth/authStore.js'
import { refreshTokens } from '../auth/authApi.js'
import { fetchLatestTelemetry } from './facilitiesApi.js'

// Facility odasına abone olup canlı telemetry event'lerini dinler.
// Socket.io'nun kendi reconnection/backoff mantığına dokunmaz; sadece
// "unauthorized" connect_error'da accessToken'ı tazeleyip bir sonraki
// deneme için authStore'u günceller (bkz. lib/socket.js'deki auth fonksiyonu).
export function useFacilityTelemetry (facilityId) {
  const [connected, setConnected] = useState(true)
  const [telemetryByDevice, setTelemetryByDevice] = useState({})
  const refreshingRef = useRef(false)

  // Socket.io sadece ileriye dönük event'leri iletir; mount anında son bilinen
  // değerleri REST'ten çekip dolduruyoruz ki kartlar sonraki cron tick'i
  // gelene kadar "No data" flash'ı göstermesin.
  useEffect(() => {
    if (!facilityId) return undefined

    let cancelled = false

    fetchLatestTelemetry(facilityId).then((readings) => {
      if (cancelled) return
      setTelemetryByDevice((prev) => {
        const merged = { ...prev }
        for (const reading of readings) {
          if (merged[reading.deviceId]) continue
          merged[reading.deviceId] = {
            deviceType: reading.deviceType,
            value: reading.value,
            unit: reading.unit,
            timestamp: reading.occurredAt,
          }
        }
        return merged
      })
    }).catch(() => {
      // Snapshot çekilemezse Socket.io canlı akışı normal şekilde doldurmaya devam eder.
    })

    return () => {
      cancelled = true
    }
  }, [facilityId])

  useEffect(() => {
    if (!facilityId) return undefined

    const socket = getSocket()

    function handleConnect () {
      setConnected(true)
      socket.emit('subscribe:facility', { facilityId })
    }

    function handleDisconnect () {
      setConnected(false)
    }

    async function handleConnectError (err) {
      if (err?.message !== 'unauthorized' || refreshingRef.current) return

      const { refreshToken } = useAuthStore.getState()
      if (!refreshToken) return

      refreshingRef.current = true
      try {
        const tokens = await refreshTokens({ refreshToken })
        useAuthStore.getState().setTokens(tokens)
      } catch {
        // Refresh başarısız oldu; Socket.io kendi backoff'uyla denemeye devam eder.
      } finally {
        refreshingRef.current = false
      }
    }

    function handleTelemetryUpdate (payload) {
      if (payload.facilityId !== facilityId) return
      setTelemetryByDevice((prev) => ({
        ...prev,
        [payload.deviceId]: {
          deviceType: payload.deviceType,
          value: payload.value,
          unit: payload.unit,
          timestamp: payload.timestamp,
        },
      }))
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('telemetry:update', handleTelemetryUpdate)

    if (socket.connected) {
      handleConnect()
    } else {
      socket.connect()
    }

    return () => {
      socket.emit('unsubscribe:facility', { facilityId })
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('telemetry:update', handleTelemetryUpdate)
      socket.disconnect()
    }
  }, [facilityId])

  return { connected, telemetryByDevice }
}
