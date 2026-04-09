import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBack, IoCameraOutline, IoCheckmarkCircle, IoArrowForward } from 'react-icons/io5';
import { HiOutlineLightBulb } from 'react-icons/hi2';
import OnboardingNav from './OnboardingNav';
import './Onboarding.css';

export default function IdVerification() {
  const navigate = useNavigate();
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);

  const handleUpload = (side) => {
    if (side === 'front') setFrontUploaded(true);
    else setBackUploaded(true);
  };

  const canContinue = frontUploaded && backUploaded;

  return (
    <div className="onboarding page-enter">
      {/* Header */}
      <div className="onboarding__header">
        <button className="onboarding__back" onClick={() => navigate('/captain/onboarding/driving-license')} id="btn-back-id">
          <IoChevronBack size={20} />
          <span>Identity Verification</span>
        </button>
        <span className="onboarding__brand">QuickBike Driver</span>
      </div>

      {/* Progress Bar */}
      <div className="onboarding__progress-bar">
        <div className="onboarding__progress-fill" style={{ width: '50%' }} />
      </div>

      {/* Content */}
      <div className="onboarding__content">
        {/* Step Info */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="onboarding__step-label">STEP 2 OF 4</div>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-500)' }}>50% Complete</span>
          </div>
          <h1 className="onboarding__title" style={{ marginTop: 'var(--space-3)' }}>Upload your ID card</h1>
          <p className="onboarding__desc" style={{ marginTop: 'var(--space-2)' }}>
            To verify your identity, please upload a clear photo of your Aadhaar or Voter ID card.
          </p>
        </div>

        {/* Front Upload */}
        <button
          className={`upload-card ${frontUploaded ? 'upload-card--uploaded' : ''}`}
          onClick={() => handleUpload('front')}
          id="upload-id-front"
        >
          <div className="upload-card__icon">
            {frontUploaded ? <IoCheckmarkCircle size={24} /> : <IoCameraOutline size={24} />}
          </div>
          <div className="upload-card__title">ID Front</div>
          <div className="upload-card__desc">Ensure all text is readable and the photo is clear</div>
        </button>

        {/* Back Upload */}
        <button
          className={`upload-card ${backUploaded ? 'upload-card--uploaded' : ''}`}
          onClick={() => handleUpload('back')}
          id="upload-id-back"
        >
          <div className="upload-card__icon">
            {backUploaded ? <IoCheckmarkCircle size={24} /> : <IoCameraOutline size={24} />}
          </div>
          <div className="upload-card__title">ID Back</div>
          <div className="upload-card__desc">Capture the address and barcode clearly</div>
        </button>

        {/* Quick Tips */}
        <div className="tips-card animate-slideUp" style={{ animationDelay: '200ms' }}>
          <div className="tips-card__icon">
            <HiOutlineLightBulb size={18} />
          </div>
          <div>
            <div className="tips-card__title">Quick Tips for Approval</div>
            <div className="tips-card__list">
              <div className="tips-card__item">
                <div className="tips-card__bullet" />
                <span>Use a flat surface and natural lighting.</span>
              </div>
              <div className="tips-card__item">
                <div className="tips-card__bullet" />
                <span>Avoid camera flash or overhead glare.</span>
              </div>
              <div className="tips-card__item">
                <div className="tips-card__bullet" />
                <span>Place the card within the frame guide.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="onboarding__footer">
        <button
          className={`btn btn--block btn--lg ${canContinue ? 'btn--primary' : ''}`}
          style={!canContinue ? { background: '#E5E7EB', color: '#9CA3AF', boxShadow: 'none' } : {}}
          onClick={() => canContinue && navigate('/captain/onboarding/vehicle-info')}
          disabled={!canContinue}
          id="btn-id-continue"
        >
          Continue <IoArrowForward />
        </button>
      </div>

      {/* Registration Nav */}
      <OnboardingNav active="registration" />
    </div>
  );
}
