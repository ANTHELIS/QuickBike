import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBack, IoCameraOutline, IoCloudUploadOutline, IoCheckmarkCircle } from 'react-icons/io5';
import { HiOutlineLightBulb } from 'react-icons/hi2';
import OnboardingNav from './OnboardingNav';
import './Onboarding.css';

export default function DrivingLicense() {
  const navigate = useNavigate();
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);

  const handleUpload = (side) => {
    // In production, this would open a file picker
    if (side === 'front') setFrontUploaded(true);
    else setBackUploaded(true);
  };

  const canContinue = frontUploaded && backUploaded;

  return (
    <div className="onboarding page-enter">
      {/* Header */}
      <div className="onboarding__header">
        <button className="onboarding__back" onClick={() => navigate('/captain/register')} id="btn-back-dl">
          <IoChevronBack size={20} />
        </button>
        <span className="onboarding__brand" style={{ color: 'var(--color-gray-900)', fontWeight: 800 }}>QuickBike Driver</span>
        <div className="onboarding__avatar">UB</div>
      </div>

      {/* Content */}
      <div className="onboarding__content">
        {/* Step Info */}
        <div>
          <div className="onboarding__step-label">STEP 1 OF 4</div>
          <div className="onboarding__title-row">
            <h1 className="onboarding__title">Upload Driving<br/>License</h1>
            <div className="onboarding__dots">
              <div className="onboarding__dot onboarding__dot--active" />
              <div className="onboarding__dot" />
              <div className="onboarding__dot" />
              <div className="onboarding__dot" />
            </div>
          </div>
          <p className="onboarding__desc" style={{ marginTop: 'var(--space-2)' }}>
            Please upload a clear photo of your valid DL (Front & Back)
          </p>
        </div>

        {/* Front Upload */}
        <button
          className={`upload-card ${frontUploaded ? 'upload-card--uploaded' : ''}`}
          onClick={() => handleUpload('front')}
          id="upload-dl-front"
        >
          <div className="upload-card__icon">
            {frontUploaded ? <IoCheckmarkCircle size={24} /> : <IoCameraOutline size={24} />}
          </div>
          <div className="upload-card__title">Front Side</div>
          <div className="upload-card__desc">Ensure the photo is readable and not blurred</div>
          <div className="upload-card__cta">
            <IoCloudUploadOutline size={16} />
            {frontUploaded ? 'UPLOADED ✓' : 'TAP TO UPLOAD'}
          </div>
        </button>

        {/* Back Upload */}
        <button
          className={`upload-card ${backUploaded ? 'upload-card--uploaded' : ''}`}
          onClick={() => handleUpload('back')}
          id="upload-dl-back"
        >
          <div className="upload-card__icon">
            {backUploaded ? <IoCheckmarkCircle size={24} /> : <IoCameraOutline size={24} />}
          </div>
          <div className="upload-card__title">Back Side</div>
          <div className="upload-card__desc">Make sure the expiry date is clearly visible</div>
          <div className="upload-card__cta">
            <IoCloudUploadOutline size={16} />
            {backUploaded ? 'UPLOADED ✓' : 'TAP TO UPLOAD'}
          </div>
        </button>

        {/* Guidelines */}
        <div className="tips-card animate-slideUp" style={{ animationDelay: '200ms' }}>
          <div className="tips-card__icon">
            <HiOutlineLightBulb size={18} />
          </div>
          <div>
            <div className="tips-card__title">Quick Guidelines</div>
            <div className="tips-card__list">
              <div className="tips-card__item">
                <div className="tips-card__bullet" />
                <span>Avoid glares from camera flash</span>
              </div>
              <div className="tips-card__item">
                <div className="tips-card__bullet" />
                <span>Place ID on a flat, neutral surface</span>
              </div>
              <div className="tips-card__item">
                <div className="tips-card__bullet" />
                <span>Capture all four corners of the document</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="onboarding__footer">
        <button
          className={`btn btn--block btn--lg ${canContinue ? 'btn--primary' : 'btn--disabled'}`}
          style={!canContinue ? { background: '#E5E7EB', color: '#9CA3AF', boxShadow: 'none' } : {}}
          onClick={() => canContinue && navigate('/captain/onboarding/id-verification')}
          disabled={!canContinue}
          id="btn-dl-continue"
        >
          Continue &gt;
        </button>
      </div>
    </div>
  );
}
