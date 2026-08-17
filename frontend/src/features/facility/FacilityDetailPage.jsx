import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import Button from '../../shared/components/Button.jsx'
import ConfirmModal from '../../shared/components/ConfirmModal.jsx'
import { fetchFacility, fetchDevices, deleteDevice } from './facilitiesApi.js'
import { useFacilityTelemetry } from './useFacilityTelemetry.js'
import PulseStrip from './PulseStrip.jsx'
import DeviceCard from './DeviceCard.jsx'
import DeviceCreateModal from './DeviceCreateModal.jsx'
import './FacilityDetailPage.css'

const TYPE_LABELS = {
  home: 'Home',
  business: 'Business',
}

export default function FacilityDetailPage () {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [facility, setFacility] = useState(null)
  const [devices, setDevices] = useState([])
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [deviceToRemove, setDeviceToRemove] = useState(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load () {
      const [facilityData, facilityDevices] = await Promise.all([
        fetchFacility(id),
        fetchDevices(id),
      ])
      if (cancelled) return
      setFacility(facilityData)
      setDevices(facilityDevices)
    }

    setLoading(true)
    load().finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [id])

  const { connected, telemetryByDevice } = useFacilityTelemetry(facility?.id)

  async function refreshDevices () {
    const facilityDevices = await fetchDevices(id)
    setDevices(facilityDevices)
    setShowDeviceModal(false)
  }

  async function handleConfirmRemove () {
    setRemoving(true)
    try {
      await deleteDevice(deviceToRemove.id)
      setDevices((prev) => prev.filter((device) => device.id !== deviceToRemove.id))
      setDeviceToRemove(null)
    } finally {
      setRemoving(false)
    }
  }

  const consumptionDevice = devices.find((device) => device.type === 'energy_meter')
  const thermostatDevice = devices.find((device) => device.type === 'thermostat')
  const boilerDevice = devices.find((device) => device.type === 'boiler')

  return (
    <div className="facility-detail-page">
      <Link to="/facilities" className="facility-detail-page__back">
        <ArrowLeft size={16} />
        Facilities
      </Link>

      {facility && (
        <header className="facility-detail-page__header">
          <h1>{facility.name}</h1>
          <span className="facility-detail-page__meta">
            {TYPE_LABELS[facility.type] || facility.type}
            {facility.address ? ` · ${facility.address}` : ''}
          </span>
        </header>
      )}

      {!loading && facility && !connected && (
        <div className="facility-detail-page__banner" role="status">
          Live connection lost, reconnecting…
        </div>
      )}

      {loading ? (
        <PulseStrip loading />
      ) : (
        <>
          <PulseStrip
            consumption={consumptionDevice ? telemetryByDevice[consumptionDevice.id] : null}
            roomTemperature={thermostatDevice ? telemetryByDevice[thermostatDevice.id] : null}
            boiler={boilerDevice ? telemetryByDevice[boilerDevice.id] : null}
          />

          {devices.length === 0 ? (
            <section className="facility-detail-page__empty">
              <p>No devices have been added to this facility yet.</p>
              <Button onClick={() => setShowDeviceModal(true)}>+ Add Device</Button>
            </section>
          ) : (
            <section className="facility-detail-page__devices">
              <div className="facility-detail-page__devices-header">
                <h2>Devices</h2>
                <Button onClick={() => setShowDeviceModal(true)}>+ Add Device</Button>
              </div>
              <div className="facility-detail-page__device-grid">
                {devices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    reading={telemetryByDevice[device.id]}
                    onRemove={setDeviceToRemove}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {showDeviceModal && (
        <DeviceCreateModal
          facilityId={id}
          onClose={() => setShowDeviceModal(false)}
          onCreated={refreshDevices}
        />
      )}

      {deviceToRemove && (
        <ConfirmModal
          titleId="remove-device-modal-title"
          title="Remove Device"
          message={`Are you sure you want to remove ${deviceToRemove.name}?`}
          confirmLabel="Remove"
          loadingLabel="Removing…"
          loading={removing}
          onConfirm={handleConfirmRemove}
          onClose={() => setDeviceToRemove(null)}
        />
      )}
    </div>
  )
}
