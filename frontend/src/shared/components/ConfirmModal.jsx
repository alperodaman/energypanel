import Modal from './Modal.jsx'
import Button from './Button.jsx'
import './ConfirmModal.css'

export default function ConfirmModal ({ titleId, title, message, confirmLabel = 'Confirm', loadingLabel = 'Working…', loading = false, onConfirm, onClose }) {
  return (
    <Modal titleId={titleId} title={title} onClose={onClose}>
      <div className="confirm-modal">
        <p className="confirm-modal__message">{message}</p>
        <div className="confirm-modal__actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
