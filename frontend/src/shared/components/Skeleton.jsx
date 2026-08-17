import './Skeleton.css'

export default function Skeleton ({ className = '', style, ...props }) {
  return <div className={`skeleton ${className}`.trim()} style={style} {...props} />
}
