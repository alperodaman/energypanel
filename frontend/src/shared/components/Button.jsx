import './Button.css'

export default function Button ({ variant = 'primary', loading = false, disabled, className = '', children, ...props }) {
  return (
    <button
      className={`btn btn--${variant} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  )
}
