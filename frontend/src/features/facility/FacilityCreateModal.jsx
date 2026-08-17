import Modal from '../../shared/components/Modal.jsx'
import FacilityCreateForm from './FacilityCreateForm.jsx'

export default function FacilityCreateModal ({ onClose, onCreated }) {
  return (
    <Modal titleId="facility-create-modal-title" title="Add Facility" onClose={onClose}>
      <FacilityCreateForm onCreated={onCreated} />
    </Modal>
  )
}
