import { useParams } from 'react-router-dom'

export default function FacilityDetailPage () {
  const { id } = useParams()
  return <div>Facility Detail: {id}</div>
}
