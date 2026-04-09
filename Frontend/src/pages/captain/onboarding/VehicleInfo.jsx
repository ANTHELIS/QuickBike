import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBack, IoCloudUploadOutline, IoInformationCircleOutline, IoChevronDown, IoLinkOutline } from 'react-icons/io5';
import { MdOutlineGpsFixed } from 'react-icons/md';
import './Onboarding.css';

const YEARS = Array.from({ length: 30 }, (_, i) => 2024 - i);

export default function VehicleInfo() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    vehicleNumber: '',
    model: '',
    year: '2024',
    rcUploaded: false,
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const canContinue = form.vehicleNumber.length >= 4 && form.model.length >= 2;

  return (
    <div className="onboarding page-enter">
      {/* Header */}
      <div className="onboarding__header">
        <button className="onboarding__back" onClick={() => navigate('/captain/onboarding/id-verification')} id="btn-back-vehicle">
          <IoChevronBack size={20} />
          <span>Registration</span>
        </button>
        <span className="onboarding__brand">QuickBike Driver</span>
      </div>

      {/* Progress Bar */}
      <div className="onboarding__progress-bar">
        <div className="onboarding__progress-fill" style={{ width: '75%' }} />
      </div>

      {/* Content */}
      <div className="onboarding__content">
        {/* Step Info */}
        <div>
          <div className="onboarding__step-label">STEP 3 OF 4</div>
          <div className="onboarding__title-row" style={{ marginTop: 'var(--space-2)' }}>
            <h1 className="onboarding__title">Vehicle Information</h1>
            <span className="onboarding__percent">75%</span>
          </div>
        </div>

        {/* Vehicle Banner */}
        <div className="vehicle-banner animate-scaleIn">
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 60%, #1e3a5f 100%)',
          }} />
          {/* Decorative vehicle silhouette */}
          <svg style={{ position: 'absolute', right: 10, bottom: 15, opacity: 0.15, zIndex: 1 }}
            width="140" height="80" viewBox="0 0 140 80" fill="white">
            <rect x="10" y="20" width="120" height="40" rx="8"/>
            <circle cx="35" cy="65" r="12"/>
            <circle cx="105" cy="65" r="12"/>
            <rect x="20" y="10" width="60" height="25" rx="4"/>
          </svg>
          <span className="vehicle-banner__text" style={{ position: 'relative', zIndex: 2 }}>
            Tell us about your ride
          </span>
        </div>

        {/* Vehicle Number */}
        <div className="onboarding-field">
          <label className="onboarding-field__label">Vehicle Number</label>
          <div className="onboarding-field__input-wrapper">
            <input
              className="onboarding-field__input"
              type="text"
              name="vehicleNumber"
              placeholder="e.g. KA 01 AB 1234"
              value={form.vehicleNumber}
              onChange={handleChange}
              id="input-vehicle-number"
            />
            <IoLinkOutline className="onboarding-field__suffix-icon" />
          </div>
        </div>

        {/* Model */}
        <div className="onboarding-field">
          <label className="onboarding-field__label">Model</label>
          <div className="onboarding-field__input-wrapper">
            <input
              className="onboarding-field__input"
              type="text"
              name="model"
              placeholder="e.g. Honda Activa"
              value={form.model}
              onChange={handleChange}
              id="input-vehicle-model"
            />
            <MdOutlineGpsFixed className="onboarding-field__suffix-icon" />
          </div>
        </div>

        {/* Year */}
        <div className="onboarding-field">
          <label className="onboarding-field__label">Year</label>
          <div className="onboarding-field__input-wrapper">
            <select
              className="onboarding-field__select"
              name="year"
              value={form.year}
              onChange={handleChange}
              id="select-vehicle-year"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <IoChevronDown className="onboarding-field__suffix-icon" />
          </div>
        </div>

        {/* RC Upload */}
        <div className="onboarding-field">
          <label className="onboarding-field__label">RC (Registration Certificate)</label>
          <button
            className={`rc-upload-zone ${form.rcUploaded ? 'upload-card--uploaded' : ''}`}
            onClick={() => setForm({ ...form, rcUploaded: true })}
            id="upload-rc"
          >
            <IoCloudUploadOutline className="rc-upload-zone__icon" />
            <span className="rc-upload-zone__text">
              {form.rcUploaded ? 'RC Uploaded ✓' : 'Upload Image or PDF'}
            </span>
            <span className="rc-upload-zone__hint">Max size 5MB (JPG, PNG, PDF)</span>
          </button>
        </div>

        {/* Info Note */}
        <div className="info-note">
          <IoInformationCircleOutline size={20} className="info-note__icon" />
          <p className="info-note__text">
            Ensure the vehicle number and owner name are clearly visible in the RC document. This speeds up our verification process.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="onboarding__footer">
        <button
          className={`btn btn--block btn--lg ${canContinue ? 'btn--primary' : ''}`}
          style={!canContinue ? { background: '#E5E7EB', color: '#9CA3AF', boxShadow: 'none' } : {}}
          onClick={() => canContinue && navigate('/captain/onboarding/review')}
          disabled={!canContinue}
          id="btn-vehicle-continue"
        >
          Continue to Final Step
        </button>
      </div>
    </div>
  );
}
