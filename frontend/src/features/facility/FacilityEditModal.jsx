import Modal from '../../shared/components/Modal.jsx'
import FacilityCreateForm from './FacilityCreateForm.jsx'

export default function FacilityEditModal ({ facility, onClose, onUpdated }) {
  return (
    <Modal titleId="facility-edit-modal-title" title="Edit Facility" onClose={onClose}>
      <FacilityCreateForm facility={facility} onUpdated={onUpdated} />
    </Modal>
  )
}
