import { useState } from 'react'

import Button from '../../shared/components/Button.jsx'
import FormField from '../../shared/components/FormField.jsx'
import ErrorText from '../../shared/components/ErrorText.jsx'
import { createFacility, updateFacility } from './facilitiesApi.js'
import './FacilityCreateForm.css'

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

export default function FacilityCreateForm ({ facility, onCreated, onUpdated }) {
  const isEdit = Boolean(facility)
  const [name, setName] = useState(facility?.name ?? '')
  const [address, setAddress] = useState(facility?.address ?? '')
  const [type, setType] = useState(facility?.type ?? 'home')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit (event) {
    event.preventDefault()

    if (!name.trim()) {
      setFieldErrors({ name: 'Facility name is required.' })
      return
    }
    setFieldErrors({})
    setFormError('')

    setLoading(true)
    try {
      if (isEdit) {
        const updated = await updateFacility(facility.id, { name, address: address.trim() || undefined, type })
        onUpdated(updated)
      } else {
        const created = await createFacility({ name, address: address.trim() || undefined, type })
        onCreated(created)
      }
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
    <form className="facility-create-form" onSubmit={handleSubmit} noValidate>
      <FormField
        id="facility-name"
        label="Facility name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={fieldErrors.name}
      />

      <FormField
        id="facility-address"
        label="Address (optional)"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        error={fieldErrors.address}
      />

      <div className="field">
        <label htmlFor="facility-type">Facility type</label>
        <select
          id="facility-type"
          className="input"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="home">Home</option>
          <option value="business">Business</option>
        </select>
      </div>

      {formError && (
        <ErrorText variant="form" role="alert" as="div">
          {formError}
        </ErrorText>
      )}

      <Button type="submit" loading={loading}>
        {loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Facility')}
      </Button>
    </form>
  )
}
