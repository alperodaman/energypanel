import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, LogOut, Menu, X } from 'lucide-react'

import { useAuthStore } from '../../features/auth/authStore.js'
import { resetSocket } from '../../lib/socket.js'
import './Sidebar.css'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/facilities', label: 'Facilities', icon: Building2 }
]

export default function Sidebar () {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isOpen, setIsOpen] = useState(false)
  const hamburgerRef = useRef(null)
  const navRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const firstLink = navRef.current?.querySelector('a, button')
    firstLink?.focus()

    const hamburgerNode = hamburgerRef.current

    function handleKeyDown (event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      hamburgerNode?.focus?.()
    }
  }, [isOpen])

  function handleLogout () {
    setIsOpen(false)
    resetSocket()
    clearAuth()
    navigate('/')
  }

  return (
    <>
      <div className="mobile-topbar">
        <span className="mobile-topbar__brand">EnergyPanel</span>
        <button
          ref={hamburgerRef}
          type="button"
          className="mobile-topbar__toggle"
          aria-label="Open menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
        >
          <Menu size={22} />
        </button>
      </div>

      {isOpen && <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand">EnergyPanel</div>
          <button
            type="button"
            className="sidebar__close"
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav" ref={navRef}>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="sidebar__logout" onClick={handleLogout}>
          <LogOut size={18} />
          Log out
        </button>
      </aside>
    </>
  )
}
