import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Building2, Cpu } from 'lucide-react'

import Card from '../../shared/components/Card.jsx'
import Button from '../../shared/components/Button.jsx'
import { fetchFacilities, fetchDeviceTypeSummary } from '../facility/facilitiesApi.js'
import DeviceTypeDonut from './DeviceTypeDonut.jsx'
import './DashboardPage.css'

const TYPE_LABELS = {
  home: 'Home',
  business: 'Business',
}

export default function DashboardPage () {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [facilities, setFacilities] = useState([])
  const [deviceTypeCounts, setDeviceTypeCounts] = useState([])

  useEffect(() => {
    let cancelled = false

    async function load () {
      const [facilitiesData, summaryData] = await Promise.all([
        fetchFacilities(),
        fetchDeviceTypeSummary(),
      ])
      if (!cancelled) {
        setFacilities(facilitiesData)
        setDeviceTypeCounts(summaryData)
      }
    }

    setLoading(true)
    load().finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <div className="dashboard-page" />
  }

  if (facilities.length === 0) {
    return (
      <div className="dashboard-page">
        <Card className="dashboard-page__onboarding">
          <Home size={48} className="dashboard-page__onboarding-icon" />
          <h2>Add your first facility</h2>
          <p>Create a facility to start tracking its energy consumption and devices.</p>
          <Button onClick={() => navigate('/facilities')}>+ Add Facility</Button>
        </Card>
      </div>
    )
  }

  const totalDevices = facilities.reduce((sum, facility) => sum + facility.deviceCount, 0)

  return (
    <div className="dashboard-page">
      <Card className="dashboard-page__summary">
        <div className="dashboard-page__summary-metrics">
          <div className="dashboard-page__summary-metric">
            <span className="dashboard-page__summary-icon-badge dashboard-page__summary-icon-badge--teal">
              <Building2 size={20} aria-hidden="true" />
            </span>
            <span className="dashboard-page__summary-value">{facilities.length}</span>
            <span className="dashboard-page__summary-label">{facilities.length === 1 ? 'Facility' : 'Facilities'}</span>
          </div>
          <div className="dashboard-page__summary-divider" />
          <div className="dashboard-page__summary-metric">
            <span className="dashboard-page__summary-icon-badge dashboard-page__summary-icon-badge--ember">
              <Cpu size={20} aria-hidden="true" />
            </span>
            <span className="dashboard-page__summary-value">{totalDevices}</span>
            <span className="dashboard-page__summary-label">{totalDevices === 1 ? 'Device' : 'Devices'}</span>
          </div>
        </div>
        {totalDevices > 0 && (
          <>
            <div className="dashboard-page__summary-divider" />
            <DeviceTypeDonut counts={deviceTypeCounts} />
          </>
        )}
      </Card>

      <div className="dashboard-page__facility-grid">
        {facilities.map((facility) => (
          <Card
            key={facility.id}
            className="dashboard-page__facility-card"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/facilities/${facility.id}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                navigate(`/facilities/${facility.id}`)
              }
            }}
          >
            <span className="dashboard-page__facility-icon-badge">
              <Building2 size={20} className="dashboard-page__facility-icon" aria-hidden="true" />
            </span>
            <div className="dashboard-page__facility-body">
              <span className="dashboard-page__facility-name">{facility.name}</span>
              <span className="dashboard-page__facility-meta">
                {TYPE_LABELS[facility.type] || facility.type} · {facility.deviceCount} {facility.deviceCount === 1 ? 'device' : 'devices'}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
