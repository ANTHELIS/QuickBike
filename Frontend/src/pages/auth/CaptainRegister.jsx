import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoTimeOutline, IoWalletOutline, IoShieldCheckmarkOutline, IoArrowForward, IoTrendingUp, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { RiMotorbikeFill } from 'react-icons/ri';
import { IoCarSportOutline } from 'react-icons/io5';
import { TbSteeringWheel } from 'react-icons/tb';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import './Auth.css';

const FEATURES = [
  { icon: IoTimeOutline, title: 'Flexible Hours', desc: 'Be your own boss and ride whenever you want.' },
  { icon: IoWalletOutline, title: 'Quick Payouts', desc: 'Get your earnings deposited daily into your wallet.' },
  { icon: IoShieldCheckmarkOutline, title: 'Insured Rides', desc: 'Safety first. All trips are fully insured by us.' },
];

const VEHICLE_TYPES = [
  { value: 'motorcycle', label: 'Motorcycle', icon: RiMotorbikeFill },
  { value: 'auto', label: 'Auto', icon: TbSteeringWheel },
  { value: 'car', label: 'Car', icon: IoCarSportOutline },
];

export default function CaptainRegister() {
  const navigate = useNavigate();
  const { registerCaptain, isLoading } = useAuthStore();
  const [step, setStep] = useState('intro'); // 'intro' | 'form'
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    color: '',
    plate: '',
    capacity: '1',
    vehicleType: 'motorcycle',
  });
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerCaptain({
        fullname: { firstname: form.firstname, lastname: form.lastname },
        email: form.email,
        password: form.password,
        vehicle: {
          color: form.color,
          plate: form.plate,
          capacity: parseInt(form.capacity),
          vehicleType: form.vehicleType,
        },
      });
      toast.success('Account created! Let\'s complete your profile.');
      navigate('/captain/onboarding/driving-license');
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ── Intro Screen (matches "Rider: Get Started" design) ── */
  if (step === 'intro') {
    return (
      <div className="page page-enter" style={{ background: 'var(--color-white)' }}>
        {/* Hero */}
        <div className="captain-hero">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <Link to="/captain/login" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary-light)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
              ← QuickBike Driver
            </Link>
            <Link to="/login" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--font-size-sm)' }}>Help</Link>
          </div>
          <div className="captain-hero__badge animate-fadeIn">
            <span style={{ fontSize: 14 }}>✨</span> OPEN FOR REGISTRATION
          </div>
          <h1 className="captain-hero__title animate-slideUp">
            Become a<br /><span>QuickBike</span><br />Rider
          </h1>
          <p className="captain-hero__desc animate-slideUp" style={{ animationDelay: '100ms' }}>
            Earn on your own schedule. Start by completing your registration. Join the fastest-growing fleet in the city.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="captain-features stagger-children">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div className="captain-feature" key={title}>
              <div className="captain-feature__icon">
                <Icon />
              </div>
              <div>
                <div className="captain-feature__title">{title}</div>
                <div className="captain-feature__desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="captain-cta">
          <button
            className="btn btn--primary btn--block btn--lg"
            onClick={() => setStep('form')}
            id="btn-start-registration"
          >
            Start Registration <IoArrowForward />
          </button>
          <p style={{ textAlign: 'center', marginTop: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
            Join 5,000+ active riders
          </p>
        </div>

        {/* Earning Card */}
        <div className="captain-earning animate-slideUp">
          <div className="captain-earning__label">EARNING POTENTIAL</div>
          <div className="captain-earning__row">
            <div className="captain-earning__amount">
              $25.50<span className="captain-earning__suffix">/hr avg.</span>
            </div>
            <div className="captain-earning__peak">
              <IoTrendingUp /> Peak Demand
            </div>
          </div>
          <p className="captain-earning__info">
            Riders in your area are currently earning 15% more due to high demand in the central business district.
          </p>
        </div>
      </div>
    );
  }

  /* ── Registration Form ── */
  return (
    <div className="auth-page page-enter">
      <div style={{ padding: 'var(--space-2) 0' }}>
        <button className="btn btn--ghost" onClick={() => setStep('intro')} style={{ fontSize: 'var(--font-size-sm)' }}>
          ← Back
        </button>
      </div>

      <form className="auth-form animate-slideUp" onSubmit={handleSubmit} id="captain-register-form">
        <h2 className="auth-form__heading">Register as Captain</h2>
        <p className="auth-form__desc">Fill in your details to get started</p>

        {/* Name */}
        <div className="auth-name-row">
          <input className="input-field" type="text" name="firstname" placeholder="First name" value={form.firstname} onChange={handleChange} required minLength={3} id="input-cap-firstname" />
          <input className="input-field" type="text" name="lastname" placeholder="Last name" value={form.lastname} onChange={handleChange} id="input-cap-lastname" />
        </div>

        <input className="input-field" type="email" name="email" placeholder="Email address" value={form.email} onChange={handleChange} required autoComplete="email" id="input-cap-email" />

        <div className="auth-input-wrapper">
          <input
            className="input-field"
            type={showPw ? 'text' : 'password'}
            name="password"
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            autoComplete="new-password"
            id="input-cap-password"
            style={{ paddingRight: '2.75rem' }}
          />
          <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
            {showPw ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
          </button>
        </div>

        {/* Vehicle */}
        <div className="auth-section-label">Vehicle Details</div>

        <div className="auth-vehicle-types">
          {VEHICLE_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              className={`auth-vehicle-chip ${form.vehicleType === value ? 'auth-vehicle-chip--active' : ''}`}
              onClick={() => setForm({ ...form, vehicleType: value })}
            >
              <Icon className="auth-vehicle-chip__icon" />
              {label}
            </button>
          ))}
        </div>

        <div className="auth-name-row">
          <input className="input-field" type="text" name="color" placeholder="Vehicle color" value={form.color} onChange={handleChange} required minLength={3} id="input-cap-color" />
          <input className="input-field" type="text" name="plate" placeholder="Plate number" value={form.plate} onChange={handleChange} required minLength={3} id="input-cap-plate" />
        </div>

        <input className="input-field" type="number" name="capacity" placeholder="Passenger capacity" value={form.capacity} onChange={handleChange} required min={1} id="input-cap-capacity" />

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={isLoading} id="btn-captain-register">
          {isLoading ? <span className="spinner spinner--white" /> : 'Complete Registration'}
        </button>

        <p className="auth-footer">
          Already registered?{' '}
          <Link to="/captain/login" className="auth-link">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
