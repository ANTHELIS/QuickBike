import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBack, IoCheckmarkCircle, IoTimeOutline } from 'react-icons/io5';
import { IoDocumentTextOutline, IoCarSportOutline, IoIdCardOutline } from 'react-icons/io5';
import { RiMotorbikeFill } from 'react-icons/ri';
import OnboardingNav from './OnboardingNav';
import toast from 'react-hot-toast';
import './Onboarding.css';

const REVIEW_ITEMS = [
  {
    icon: IoDocumentTextOutline,
    name: "Driver's License",
    detail: 'License # ending in 4921',
    step: 'driving-license',
  },
  {
    icon: RiMotorbikeFill,
    name: 'Vehicle Info',
    detail: 'Honda Super Cub (Black)',
    step: 'vehicle-info',
  },
  {
    icon: IoIdCardOutline,
    name: 'National ID / Passport',
    detail: 'Uploaded 2 files (Front & Back)',
    step: 'id-verification',
  },
];

export default function FinalReview() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulated submission delay
    await new Promise((r) => setTimeout(r, 2000));
    toast.success('Application submitted successfully!');
    setIsSubmitting(false);
    navigate('/captain/home');
  };

  return (
    <div className="onboarding page-enter">
      {/* Header */}
      <div className="onboarding__header">
        <button className="onboarding__back" onClick={() => navigate('/captain/onboarding/vehicle-info')} id="btn-back-review">
          <IoChevronBack size={20} />
        </button>
        <span className="onboarding__brand" style={{ color: 'var(--color-gray-900)', fontWeight: 800 }}>QuickBike Driver</span>
        <div style={{ width: 20 }} /> {/* spacer */}
      </div>

      {/* Full Progress */}
      <div className="onboarding__progress-bar">
        <div className="onboarding__progress-fill" style={{ width: '100%' }} />
      </div>

      {/* Content */}
      <div className="onboarding__content">
        {/* Step Info */}
        <div>
          <div className="onboarding__step-label">STEP 4 OF 4</div>
          <h1 className="onboarding__title" style={{ marginTop: 'var(--space-2)' }}>Review & Submit</h1>
          <p className="onboarding__desc" style={{ marginTop: 'var(--space-2)' }}>
            Please confirm your details before submitting your application for verification.
          </p>
        </div>

        {/* Review Cards */}
        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {REVIEW_ITEMS.map(({ icon: Icon, name, detail, step }) => (
            <div className="review-card" key={name}>
              <div className="review-card__icon">
                <Icon size={22} />
              </div>
              <div className="review-card__body">
                <div className="review-card__name">{name}</div>
                <div className="review-card__detail">{detail}</div>
                <button
                  className="review-card__edit"
                  onClick={() => navigate(`/captain/onboarding/${step}`)}
                >
                  Edit details
                </button>
              </div>
              <div className="review-card__status">
                <IoCheckmarkCircle size={14} /> Completed
              </div>
            </div>
          ))}
        </div>

        {/* Agreement */}
        <button
          className={`agreement ${agreed ? 'agreement--checked' : ''}`}
          onClick={() => setAgreed(!agreed)}
          id="btn-agreement"
        >
          <div className="agreement__checkbox">
            {agreed && <IoCheckmarkCircle size={16} style={{ color: 'var(--color-white)' }} />}
          </div>
          <div>
            <div className="agreement__title">I agree to the QuickBike Partner Agreement</div>
            <div className="agreement__desc">
              I certify that all information provided is accurate and I understand that background checks will be conducted in accordance with local regulations.
            </div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="onboarding__footer" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <button
          className={`btn btn--block btn--lg ${agreed ? 'btn--primary' : ''}`}
          style={!agreed ? { background: '#E5E7EB', color: '#9CA3AF', boxShadow: 'none' } : {}}
          onClick={handleSubmit}
          disabled={!agreed || isSubmitting}
          id="btn-submit-application"
        >
          {isSubmitting ? <span className="spinner spinner--white" /> : 'Submit Application'}
        </button>
        <div className="verification-note">
          <IoTimeOutline size={14} />
          <span>Verification usually takes 24-48 hours.</span>
        </div>
      </div>

      {/* Registration Nav */}
      <OnboardingNav active="registration" />
    </div>
  );
}
