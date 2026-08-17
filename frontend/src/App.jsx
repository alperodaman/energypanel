import { BrowserRouter, Routes, Route } from 'react-router-dom'

import LandingPage from './features/landing/LandingPage.jsx'
import LoginPage from './features/auth/LoginPage.jsx'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import FacilitiesPage from './features/facility/FacilitiesPage.jsx'
import FacilityDetailPage from './features/facility/FacilityDetailPage.jsx'
import ProtectedRoute from './features/auth/ProtectedRoute.jsx'
import PublicOnlyRoute from './features/auth/PublicOnlyRoute.jsx'
import AppLayout from './shared/components/AppLayout.jsx'

export default function App () {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/facilities" element={<ProtectedRoute><AppLayout><FacilitiesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/facilities/:id" element={<ProtectedRoute><AppLayout><FacilityDetailPage /></AppLayout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
