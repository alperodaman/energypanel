import Input from './Input.jsx'
import ErrorText from './ErrorText.jsx'
import './FormField.css'

export default function FormField ({ id, label, error, ...inputProps }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...inputProps}
      />
      {error && (
        <ErrorText id={errorId} variant="field">
          {error}
        </ErrorText>
      )}
    </div>
  )
}
