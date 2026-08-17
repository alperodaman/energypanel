import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import './Modal.css'

export default function Modal ({ titleId, title, onClose, children }) {
  const dialogRef = useRef(null)
  const previouslyFocusedRef = useRef(null)

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement

    const focusable = dialogRef.current?.querySelector(
      'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])'
    )
    focusable?.focus()

    function handleKeyDown (event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [onClose])

  function handleBackdropClick (event) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div className="modal-backdrop" onMouseDown={handleBackdropClick}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal__header">
          <h2 id={titleId} className="modal__title">{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
