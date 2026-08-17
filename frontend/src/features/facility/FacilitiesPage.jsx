import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Trash2 } from 'lucide-react'

import Button from '../../shared/components/Button.jsx'
import ErrorText from '../../shared/components/ErrorText.jsx'
import ConfirmModal from '../../shared/components/ConfirmModal.jsx'
import { fetchFacilities, deleteFacility } from './facilitiesApi.js'
import FacilityCreateModal from './FacilityCreateModal.jsx'
import FacilityEditModal from './FacilityEditModal.jsx'
import './FacilitiesPage.css'

const TYPE_LABELS = {
  home: 'Home',
  business: 'Business',
}

export default function FacilitiesPage () {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [facilities, setFacilities] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [facilityToEdit, setFacilityToEdit] = useState(null)
  const [facilityToDelete, setFacilityToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load () {
      const data = await fetchFacilities()
      if (!cancelled) setFacilities(data)
    }

    setLoading(true)
    load().finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  async function refreshFacilities () {
    const data = await fetchFacilities()
    setFacilities(data)
    setShowCreateModal(false)
  }

  async function handleFacilityUpdated () {
    const data = await fetchFacilities()
    setFacilities(data)
    setFacilityToEdit(null)
  }

  async function handleConfirmDelete () {
    setDeleting(true)
    try {
      await deleteFacility(facilityToDelete.id)
      setFacilities((prev) => prev.filter((facility) => facility.id !== facilityToDelete.id))
      setFacilityToDelete(null)
      setDeleteError('')
    } catch (err) {
      setFacilityToDelete(null)
      if (err.status === 409) {
        setDeleteError('This facility still has devices. Remove all devices before deleting the facility.')
      } else {
        setDeleteError('Something went wrong. Please try again.')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="facilities-page">
      <header className="facilities-page__header">
        <h1>Facilities</h1>
        <Button onClick={() => setShowCreateModal(true)}>+ Add Facility</Button>
      </header>

      {deleteError && (
        <ErrorText variant="form" role="alert" as="div">
          {deleteError}
        </ErrorText>
      )}

      {!loading && facilities.length === 0 ? (
        <section className="facilities-page__empty">
          <p>You haven't added any facilities yet.</p>
          <Button onClick={() => setShowCreateModal(true)}>+ Add Facility</Button>
        </section>
      ) : (
        <table className="facilities-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Type</th>
              <th>Devices</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((facility) => (
              <tr key={facility.id}>
                <td data-label="Name">{facility.name}</td>
                <td data-label="Address">{facility.address || '—'}</td>
                <td data-label="Type">{TYPE_LABELS[facility.type] || facility.type}</td>
                <td data-label="Devices">{facility.deviceCount}</td>
                <td className="facilities-table__actions" data-label="Actions">
                  <button
                    type="button"
                    className="facilities-table__view"
                    aria-label={`View ${facility.name}`}
                    onClick={() => navigate(`/facilities/${facility.id}`)}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    type="button"
                    className="facilities-table__edit"
                    aria-label={`Edit ${facility.name}`}
                    onClick={() => setFacilityToEdit(facility)}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    className="facilities-table__delete"
                    aria-label={`Delete ${facility.name}`}
                    onClick={() => setFacilityToDelete(facility)}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreateModal && (
        <FacilityCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={refreshFacilities}
        />
      )}

      {facilityToEdit && (
        <FacilityEditModal
          facility={facilityToEdit}
          onClose={() => setFacilityToEdit(null)}
          onUpdated={handleFacilityUpdated}
        />
      )}

      {facilityToDelete && (
        <ConfirmModal
          titleId="delete-facility-modal-title"
          title="Delete Facility"
          message={`Are you sure you want to delete ${facilityToDelete.name}?`}
          confirmLabel="Delete"
          loadingLabel="Deleting…"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setFacilityToDelete(null)}
        />
      )}
    </div>
  )
}
