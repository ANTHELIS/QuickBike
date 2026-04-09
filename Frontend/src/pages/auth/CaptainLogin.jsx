import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoMailOutline, IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import './Auth.css';

export default function CaptainLogin() {
  const navigate = useNavigate();
  const { loginCaptain, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginCaptain(form.email, form.password);
      toast.success('Welcome back, Captain!');
      navigate('/captain/home');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__header">
        <div className="auth-page__brand animate-bounceIn">
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, #E87A20 0%, #C66A15 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15 8H9L12 2Z" fill="white"/>
              <circle cx="8" cy="18" r="4" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="16" cy="18" r="4" stroke="white" strokeWidth="2" fill="none"/>
              <path d="M8 14C8 14 10 12 12 12C14 12 16 14 16 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="auth-page__title">QuickBike Driver</h1>
        </div>
        <p className="auth-page__subtitle">Drive, earn, and grow with us</p>
      </div>

      <form className="auth-form animate-slideUp" onSubmit={handleSubmit} id="captain-login-form">
        <h2 className="auth-form__heading">Captain sign in</h2>
        <p className="auth-form__desc">Access your driver dashboard</p>

        <div className="auth-input-wrapper">
          <IoMailOutline className="auth-input-icon" />
          <input
            className="input-field auth-input"
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            id="input-captain-email"
          />
        </div>

        <div className="auth-input-wrapper">
          <IoLockClosedOutline className="auth-input-icon" />
          <input
            className="input-field auth-input"
            type={showPw ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            autoComplete="current-password"
            id="input-captain-password"
          />
          <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
            {showPw ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
          </button>
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--block btn--lg"
          disabled={isLoading}
          id="btn-captain-login"
        >
          {isLoading ? <span className="spinner spinner--white" /> : 'Sign In as Captain'}
        </button>

        <div className="auth-divider"><span>or</span></div>

        <Link to="/login" className="btn btn--outline btn--block" id="btn-user-login">
          Sign in as a Passenger
        </Link>

        <p className="auth-footer">
          New captain?{' '}
          <Link to="/captain/register" className="auth-link" id="link-captain-register">Start registration</Link>
        </p>
      </form>
    </div>
  );
}
