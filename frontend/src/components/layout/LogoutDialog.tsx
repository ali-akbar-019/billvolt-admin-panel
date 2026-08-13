import { useEffect, useState } from 'react';
import { LogOut, Timer, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type LogoutReason = 'manual' | 'timeout';

interface LogoutDialogProps {
  reason: LogoutReason;
  onCancel: () => void;
}

const COUNTDOWN_SECONDS: Record<LogoutReason, number> = {
  manual: 15,
  timeout: 30,
};

export function LogoutDialog({ reason, onCancel }: LogoutDialogProps) {
  const { logout } = useAuth();

  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS[reason]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isTimeout = reason === 'timeout';
  const totalSeconds = COUNTDOWN_SECONDS[reason];
  const progress = Math.max(0, Math.min(100, (seconds / totalSeconds) * 100));

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();
    } catch {
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (seconds === 0) {
      handleLogout();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoggingOut) {
        onCancel();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel, isLoggingOut]);

  return (
    <div
      className="logout-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
    >
      <div
        className="logout-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Icon */}
        <div className={`logout-dialog-icon ${isTimeout ? 'timeout' : 'manual'}`}>
          {isTimeout ? <Timer size={22} strokeWidth={2} /> : <LogOut size={22} strokeWidth={2} />}
        </div>

        {/* Content */}
        <div className="logout-dialog-content">
          <div className="logout-dialog-eyebrow">
            {isTimeout ? 'Security protection' : 'Account action'}
          </div>

          <h2 id="logout-dialog-title">
            {isTimeout ? 'Session idle timeout' : 'Log out?'}
          </h2>

          <p>
            {isTimeout
              ? "You've been inactive for a while. You'll be signed out automatically to keep your account secure."
              : "You'll be signed out of your account. Any unsaved changes will be lost."}
          </p>
        </div>

        {/* Countdown */}
        <div className={`logout-countdown ${isTimeout ? 'timeout' : ''}`}>
          <div className="logout-countdown-top">
            <div className="logout-countdown-label">
              <AlertTriangle size={15} />
              <span>Automatic sign out</span>
            </div>

            <strong className="tabular-nums">
              {seconds}s
            </strong>
          </div>

          <div className="logout-progress">
            <div
              className="logout-progress-value"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="logout-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoggingOut}
            className="logout-button logout-button-secondary"
          >
            {isTimeout ? 'Stay signed in' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="logout-button logout-button-danger"
          >
            <LogOut size={15} />
            {isLoggingOut ? 'Signing out…' : 'Log out now'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = `
  .logout-overlay {
    position: fixed;
    inset: 0;
    z-index: 280;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 20px;

    background: rgba(11, 14, 26, 0.48);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);

    animation: logout-overlay-in 160ms ease-out;
  }

  .logout-dialog {
    width: 100%;
    max-width: 440px;

    padding: 28px;

    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 18px;

    box-shadow:
      0 24px 70px rgba(16, 22, 43, 0.18),
      0 4px 16px rgba(16, 22, 43, 0.08);

    animation: logout-dialog-in 180ms ease-out;
  }

  .logout-dialog-icon {
    width: 48px;
    height: 48px;

    display: flex;
    align-items: center;
    justify-content: center;

    margin-bottom: 18px;

    border-radius: 13px;
  }

  .logout-dialog-icon.manual {
    background: var(--status-denied-tint);
    color: var(--status-denied);
  }

  .logout-dialog-icon.timeout {
    background: var(--status-in-progress-tint);
    color: var(--status-in-progress);
  }

  .logout-dialog-content {
    margin-bottom: 20px;
  }

  .logout-dialog-eyebrow {
    margin-bottom: 5px;

    color: var(--text-muted);

    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .logout-dialog-content h2 {
    margin: 0 0 8px;

    color: var(--text-primary);

    font-family: var(--font-display);
    font-size: var(--fs-section-title);
    font-weight: 650;
    letter-spacing: -0.02em;
  }

  .logout-dialog-content p {
    margin: 0;

    color: var(--text-secondary);

    font-size: var(--fs-body);
    line-height: 1.6;
  }

  .logout-countdown {
    margin-bottom: 22px;
    padding: 13px 14px;

    border: 1px solid var(--border);
    border-radius: 12px;

    background: var(--bg-surface-2);
  }

  .logout-countdown.timeout {
    border-color: rgba(217, 119, 6, 0.22);
    background: var(--status-in-progress-tint);
  }

  .logout-countdown-top {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 12px;
    margin-bottom: 10px;
  }

  .logout-countdown-label {
    display: flex;
    align-items: center;
    gap: 7px;

    color: var(--text-secondary);

    font-size: 12.5px;
    font-weight: 500;
  }

  .logout-countdown-label svg {
    flex-shrink: 0;
    color: var(--text-muted);
  }

  .logout-countdown.timeout .logout-countdown-label svg {
    color: var(--status-in-progress);
  }

  .logout-countdown strong {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 700;
  }

  .logout-progress {
    height: 4px;

    overflow: hidden;

    border-radius: 999px;

    background: rgba(127, 137, 160, 0.16);
  }

  .logout-progress-value {
    height: 100%;

    border-radius: inherit;

    background: var(--accent);

    transition: width 1s linear;
  }

  .logout-countdown.timeout .logout-progress-value {
    background: var(--status-in-progress);
  }

  .logout-actions {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
  }

  .logout-button {
    min-height: 40px;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;

    padding: 0 16px;

    border-radius: var(--radius);

    font-family: var(--font-body);
    font-size: 13.5px;
    font-weight: 650;

    transition:
      background 150ms ease,
      border-color 150ms ease,
      transform 150ms ease,
      opacity 150ms ease;
  }

  .logout-button:not(:disabled):hover {
    transform: translateY(-1px);
  }

  .logout-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .logout-button-secondary {
    color: var(--text-secondary);
    background: var(--bg-surface);
    border: 1px solid var(--border-strong);
    cursor: pointer;
  }

  .logout-button-secondary:not(:disabled):hover {
    background: var(--bg-surface-2);
    border-color: var(--text-muted);
  }

  .logout-button-danger {
    color: #fff;
    background: var(--status-denied);
    border: 1px solid var(--status-denied);
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  }

  .logout-button-danger:not(:disabled):hover {
    filter: brightness(0.94);
  }

  @keyframes logout-overlay-in {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes logout-dialog-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.985);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 520px) {
    .logout-overlay {
      align-items: flex-end;
      padding: 12px;
    }

    .logout-dialog {
      padding: 22px;
      border-radius: 16px;
    }

    .logout-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .logout-button {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .logout-overlay,
    .logout-dialog {
      animation: none;
    }

    .logout-button {
      transition: none;
    }

    .logout-progress-value {
      transition: none;
    }
  }
`;

if (typeof document !== 'undefined') {
  const styleId = 'logout-dialog-inline-styles';

  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');

    style.id = styleId;
    style.textContent = styles;

    document.head.appendChild(style);
  }
}