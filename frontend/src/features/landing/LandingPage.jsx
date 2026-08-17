import { Link } from 'react-router-dom'

import Button from '../../shared/components/Button.jsx'
import PulseStripPreview from './PulseStripPreview.jsx'
import './LandingPage.css'

export default function LandingPage () {
  return (
    <div className="landing-page">
      <nav className="landing-page__nav">
        <span className="landing-page__logo">EnergyPanel</span>
        <div className="landing-page__nav-actions">
          <Link to="/login" className="landing-page__login-link">Log in</Link>
          <Link to="/register">
            <Button type="button" variant="primary">Sign up</Button>
          </Link>
        </div>
      </nav>

      <div className="landing-page__hero">
        <div className="landing-page__copy">
          <h1 className="landing-page__title">Your facility, at a glance.</h1>
          <p className="landing-page__subtitle">
            Real-time energy consumption and comfort monitoring for every device in your building.
          </p>
          <Link to="/register">
            <Button type="button" variant="primary" className="landing-page__cta">Get Started</Button>
          </Link>
        </div>

        <div className="landing-page__preview">
          <PulseStripPreview />
        </div>
      </div>
    </div>
  )
}
