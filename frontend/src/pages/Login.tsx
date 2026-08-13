import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  {
    label: 'Admin',
    email: 'admin@billvolt.com',
    password: 'Admin@12345',
  },
  {
    label: 'Staff',
    email: 'sarah.mitchell@billvolt.com',
    password: 'Staff@12345',
  },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fillDemo = (
    demoEmail: string,
    demoPassword: string,
  ) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError(
        'Enter your email address and password to continue.',
      );
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Unable to sign in. Please check your credentials and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">

      {/* =====================================================
          IMAGE SIDE
          ===================================================== */}

      <section className="login-visual">

        <img
          className="login-visual-image"
          src="https://i0.wp.com/cclinic.eu/wp-content/uploads/2018/05/CONCEPT-CLINIC-web-07.jpg?fit=1030%2C687&ssl=1"
          alt="Modern healthcare workspace"
        />

        <div className="login-visual-overlay" />

        <div className="login-visual-content">

          <div className="login-visual-brand">
            <div className="login-brand-mark">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M13 2 4.5 13h5L10 22l8.5-11h-5L13 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <span>billvolt</span>
          </div>

          <div className="login-visual-copy">

            <div className="login-eyebrow">
              CREDENTIALING & OPERATIONS
            </div>

            <h1>
              Everything your team needs,
              <br />
              in one workspace.
            </h1>

            <p>
              Manage practices, providers, credentialing,
              follow-ups and reporting without jumping
              between systems.
            </p>

          </div>

          <div className="login-visual-footer">
            <span className="login-status-dot" />

            Built for healthcare operations
          </div>

        </div>
      </section>

      {/* =====================================================
          FORM SIDE
          ===================================================== */}

      <main className="login-form-side">

        <div className="login-form-wrap">

          {/* Mobile logo */}

          <div className="login-mobile-brand">
            <div className="login-brand-mark">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M13 2 4.5 13h5L10 22l8.5-11h-5L13 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <span>billvolt</span>
          </div>

          {/* Form */}

          <div className="login-form-header">

            <div className="login-form-kicker">
              ADMIN PORTAL
            </div>

            <h2>Welcome back</h2>

            <p>
              Sign in to access your BillVolt workspace.
            </p>

          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
            noValidate
          >

            {/* Email */}

            <div className="login-field">

              <label htmlFor="login-email">
                Email address
              </label>

              <div className="login-input-wrap">

                <Mail
                  size={17}
                  strokeWidth={1.8}
                  className="login-input-icon"
                />

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="you@company.com"
                  disabled={isSubmitting}
                  required
                  onChange={(e) => {
                    setEmail(e.target.value);

                    if (error) {
                      setError(null);
                    }
                  }}
                />

              </div>
            </div>

            {/* Password */}

            <div className="login-field">

              <div className="login-label-row">

                <label htmlFor="login-password">
                  Password
                </label>

              </div>

              <div className="login-input-wrap">

                <Lock
                  size={17}
                  strokeWidth={1.8}
                  className="login-input-icon"
                />

                <input
                  id="login-password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  required
                  onChange={(e) => {
                    setPassword(e.target.value);

                    if (error) {
                      setError(null);
                    }
                  }}
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  disabled={isSubmitting}
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>
            </div>

            {/* Error */}

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              className="login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    size={17}
                    className="login-spinner"
                  />

                  Signing in…
                </>
              ) : (
                <>
                  Sign in

                  <ArrowRight size={17} />
                </>
              )}
            </button>

          </form>

          {/* Security */}

          <div className="login-security">

            <ShieldCheck size={15} />

            <span>
              Secure administrator access
            </span>

          </div>

          {/* Demo access — deliberately secondary */}

          <details className="login-demo">

            <summary>
              <KeyRound size={14} />

              <span>Demo access</span>
            </summary>

            <div className="login-demo-content">

              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() =>
                    fillDemo(
                      account.email,
                      account.password,
                    )
                  }
                >
                  <span>
                    <strong>{account.label}</strong>

                    {account.email}
                  </span>

                  <ArrowRight size={14} />
                </button>
              ))}

            </div>

          </details>

          <p className="login-help">
            Having trouble signing in? Contact your
            BillVolt administrator.
          </p>

        </div>

      </main>

    </div>
  );
}