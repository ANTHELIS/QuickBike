import React from 'react'
import { Link } from 'react-router'

const Start = () => {
  return (
    <div className="screen brand-gradient" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top section with branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 32px', paddingTop: '80px' }}>
        {/* Logo */}
        <div style={{ marginBottom: '16px' }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <rect width="72" height="72" rx="20" fill="#E67E00" />
            <path d="M22 48V24L36 16L50 24V48L36 40L22 48Z" fill="white" fillOpacity="0.95" />
            <circle cx="36" cy="32" r="6" fill="#E67E00" />
          </svg>
        </div>

        <h1 className="display-lg" style={{ textAlign: 'center', marginBottom: '16px' }}>
          Quick<span style={{ color: 'var(--primary-container)' }}>Bike</span>
        </h1>

        <p className="body-lg" style={{ textAlign: 'center', color: 'var(--on-surface-variant)', maxWidth: '280px', lineHeight: '1.6' }}>
          The fastest way to move in your city. Rides in under 3 minutes.
        </p>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: '32px', marginTop: '48px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="headline-md" style={{ color: 'var(--primary-container)' }}>3M+</div>
            <div className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Rides</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="headline-md" style={{ color: 'var(--primary-container)' }}>50K+</div>
            <div className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Captains</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="headline-md" style={{ color: 'var(--primary-container)' }}>4.8</div>
            <div className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Rating</div>
          </div>
        </div>
      </div>

      {/* Bottom CTA section */}
      <div style={{ padding: '32px 24px', paddingBottom: '48px' }}>
        <Link to="/login" className="btn btn-primary btn-lg" style={{ marginBottom: '12px', textDecoration: 'none' }}>
          Get Started
        </Link>

        <Link to="/captain-login" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }}>
          <i className="ri-steering-2-fill" style={{ fontSize: '1.2rem' }}></i>
          Drive with QuickBike
        </Link>

        <p className="body-sm" style={{ textAlign: 'center', marginTop: '20px', color: 'var(--outline)' }}>
          By continuing, you agree to our <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Terms</span> & <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}

export default Start