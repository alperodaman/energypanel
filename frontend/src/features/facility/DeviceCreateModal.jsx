import Modal from '../../shared/components/Modal.jsx'
import DeviceCreateForm from './DeviceCreateForm.jsx'

export default function DeviceCreateModal ({ facilityId, onClose, onCreated }) {
  return (
    <Modal titleId="device-create-modal-title" title="Add Device" onClose={onClose}>
      <DeviceCreateForm facilityId={facilityId} onCreated={onCreated} onCancel={onClose} />
    </Modal>
  )
}
