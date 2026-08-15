import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import LoginPage from './features/auth/LoginPage.jsx'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import FacilityDetailPage from './features/facility/FacilityDetailPage.jsx'

export default function App () {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/facilities/:id" element={<FacilityDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}
