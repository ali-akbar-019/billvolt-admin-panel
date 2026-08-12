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
      setSeconds((s) => Math.max(0, s - 1));
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const isTimeout = reason === 'timeout';

  return (
    <div
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Log out"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,14,26,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: 16,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="surface-card"
        style={{ width: 420, maxWidth: '100%', padding: 28 }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: isTimeout ? 'var(--status-in-progress-tint)' : 'var(--status-denied-tint)',
            color: isTimeout ? 'var(--status-in-progress)' : 'var(--status-denied)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          {isTimeout ? <Timer size={22} /> : <LogOut size={22} />}
        </div>

        <h2 style={{ fontSize: 'var(--fs-section-title)', margin: '0 0 8px' }}>
          {isTimeout ? 'Session idle timeout' : 'Log out?'}
        </h2>

        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: '0 0 18px', lineHeight: 1.55 }}>
          {isTimeout
            ? 'You\'ve been inactive for a while. You\'ll be signed out automatically to keep your account secure.'
            : 'You\'ll be signed out of your account. Any unsaved changes will be lost.'}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: isTimeout ? 'var(--status-in-progress-tint)' : 'var(--bg-surface-2)',
            border: `1px solid ${isTimeout ? 'rgba(217,119,6,0.25)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            marginBottom: 22,
          }}
        >
          <AlertTriangle size={16} style={{ color: isTimeout ? 'var(--status-in-progress)' : 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Signing out automatically in <strong className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{seconds}</strong>s
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={isLoggingOut}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius)',
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
            }}
          >
            {isTimeout ? 'Stay signed in' : 'Cancel'}
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: isLoggingOut ? 'var(--text-muted)' : 'var(--status-denied)',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
            }}
          >
            <LogOut size={15} /> {isLoggingOut ? 'Signing out…' : 'Log out now'}
          </button>
        </div>
      </div>
    </div>
  );
}
