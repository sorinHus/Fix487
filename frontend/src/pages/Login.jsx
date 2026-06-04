import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import styles from './Login.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.detail
        || 'Login failed. Check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Logo size={40} />
          <span className={styles.logoText}>Fix487</span>
        </div>

        <h1 className={styles.heading}>Sign in</h1>
        <p className={styles.subheading}>Enter your credentials to access the platform.</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoFocus
              className={styles.input}
              placeholder="your.username"
              value={form.username}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={styles.input}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
