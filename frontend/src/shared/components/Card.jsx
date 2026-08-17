import './Card.css'

export default function Card ({ className = '', children, as: Tag = 'div', ...props }) {
  return (
    <Tag className={`card ${className}`.trim()} {...props}>
      {children}
    </Tag>
  )
}
