import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoMailOutline, IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import './Auth.css';

export default function UserLogin() {
  const navigate = useNavigate();
  const { loginUser, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/home');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__header">
        <div className="auth-page__brand animate-bounceIn">
          <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" stroke="#E87A20" strokeWidth="3" fill="none" opacity="0.2"/>
            <path d="M16 32C16 32 18 28 24 28C30 28 32 32 32 32" stroke="#E87A20" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="16" cy="32" r="6" stroke="#E87A20" strokeWidth="2.5" fill="none"/>
            <circle cx="32" cy="32" r="6" stroke="#E87A20" strokeWidth="2.5" fill="none"/>
            <path d="M20 20L24 12L28 20" stroke="#E87A20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="auth-page__title">QuickBike</h1>
        </div>
        <p className="auth-page__subtitle">The fastest ride in the city</p>
      </div>

      <form className="auth-form animate-slideUp" onSubmit={handleSubmit} id="login-form">
        <h2 className="auth-form__heading">Welcome back</h2>
        <p className="auth-form__desc">Sign in to continue your journey</p>

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
            id="input-email"
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
            id="input-password"
          />
          <button
            type="button"
            className="auth-pw-toggle"
            onClick={() => setShowPw(!showPw)}
            tabIndex={-1}
          >
            {showPw ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
          </button>
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--block btn--lg"
          disabled={isLoading}
          id="btn-login"
        >
          {isLoading ? <span className="spinner spinner--white" /> : 'Sign In'}
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <Link to="/captain/login" className="btn btn--outline btn--block" id="btn-captain-login">
          Sign in as a Rider (Captain)
        </Link>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signup" className="auth-link" id="link-signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
