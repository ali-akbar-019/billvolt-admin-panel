import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ClipboardCheck, BellRing, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: ClipboardCheck, title: 'Credentialing at a glance', text: 'Track payer records and statuses across every practice and provider.' },
  { icon: BellRing, title: 'Never miss a follow-up', text: 'Overdue and upcoming tasks surface automatically from credentialing dates.' },
  { icon: ShieldCheck, title: 'Secure by default', text: 'Encrypted sensitive data, role-based access, and a full audit trail.' },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Brand panel */}
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div className="auth-logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M13 2 4.5 13h5L10 22l8.5-11h-5L13 2Z" fill="currentColor" />
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: '#fff', letterSpacing: '-0.01em' }}>
              billvolt
            </span>
          </div>

          <h1 className="auth-brand-title">
            Run your credentialing office from one place.
          </h1>
          <p className="auth-brand-sub">
            A single admin portal for practices, providers, payer credentialing, follow-ups, and reporting.
          </p>

          <div className="auth-features">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="auth-feature">
                <div className="auth-feature-icon">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="auth-feature-title">{title}</p>
                  <p className="auth-feature-text">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sign-in panel */}
      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <div className="auth-mobile-logo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M13 2 4.5 13h5L10 22l8.5-11h-5L13 2Z" fill="currentColor" />
              </svg>
            </div>
            <span>billvolt</span>
          </div>

          <div className="surface-card auth-card">
            <h2 style={{ fontSize: 26, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>Sign in</h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 28px' }}>
              Admin portal access for BillVolt staff.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>
              <div>
                <label htmlFor="email" style={labelStyle}>
                  Email address
                </label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    id="email"
                    className="auth-input"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@billvolt.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" style={labelStyle}>
                  Password
                </label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    id="password"
                    className="auth-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="auth-password-toggle"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  style={{
                    fontSize: 13, color: 'var(--status-denied)', background: 'var(--status-denied-tint)',
                    borderRadius: 'var(--radius)', padding: '10px 12px', margin: 0,
                  }}
                >
                  {error}
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="auth-submit">
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="auth-spin" /> Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '22px 0 0', textAlign: 'center', lineHeight: 1.6 }}>
              Having trouble? Ask an administrator to reset your access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 7,
};