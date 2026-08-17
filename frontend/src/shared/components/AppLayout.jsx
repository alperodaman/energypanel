import Sidebar from './Sidebar.jsx'
import './AppLayout.css'

export default function AppLayout ({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-layout__content">{children}</main>
    </div>
  )
}
