import { useState } from 'react'

import Button from '../../shared/components/Button.jsx'
import FormField from '../../shared/components/FormField.jsx'
import ErrorText from '../../shared/components/ErrorText.jsx'
import TemperatureSlider from '../../shared/components/TemperatureSlider.jsx'
import { createDevice } from './facilitiesApi.js'
import './DeviceCreateForm.css'

const DEVICE_TYPES = [
  { value: 'energy_meter', label: 'Energy Meter' },
  { value: 'thermostat', label: 'Thermostat' },
  { value: 'boiler', label: 'Boiler' },
]

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

export default function DeviceCreateForm ({ facilityId, onCreated, onCancel }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('energy_meter')
  const [targetTemperature, setTargetTemperature] = useState(21)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const needsTargetTemperature = type === 'thermostat' || type === 'boiler'

  async function handleSubmit (event) {
    event.preventDefault()

    if (!name.trim()) {
      setFieldErrors({ name: 'Device name is required.' })
      return
    }
    setFieldErrors({})
    setFormError('')

    setLoading(true)
    try {
      const device = await createDevice(facilityId, {
        name,
        type,
        targetTemperature: needsTargetTemperature ? targetTemperature : undefined,
      })
      onCreated(device)
    } catch (err) {
      if (err.status === 400 && err.details) {
        setFieldErrors(mapDetailsToFieldErrors(err.details))
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="device-create-form" onSubmit={handleSubmit} noValidate>
      <FormField
        id="device-name"
        label="Device name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={fieldErrors.name}
      />

      <div className="field">
        <label htmlFor="device-type">Device type</label>
        <select
          id="device-type"
          className="input"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          {DEVICE_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {needsTargetTemperature && (
        <TemperatureSlider
          id="device-target-temperature"
          label="Target temperature"
          value={targetTemperature}
          onChange={setTargetTemperature}
        />
      )}

      {formError && (
        <ErrorText variant="form" role="alert" as="div">
          {formError}
        </ErrorText>
      )}

      <div className="device-create-form__actions">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {loading ? 'Adding…' : '+ Add Device'}
        </Button>
      </div>
    </form>
  )
}
