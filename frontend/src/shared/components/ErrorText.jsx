import { AlertCircle } from 'lucide-react'

import './ErrorText.css'

export default function ErrorText ({ id, as: Tag = 'p', variant = 'field', role, children }) {
  return (
    <Tag id={id} className={`error-text error-text--${variant}`} role={role}>
      <AlertCircle size={variant === 'form' ? 16 : 14} aria-hidden="true" />
      {children}
    </Tag>
  )
}
