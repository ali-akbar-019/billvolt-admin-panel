import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';

interface TopbarProps {
  onMenuClick?: () => void;
  onLogoutClick?: () => void;
}

export function Topbar({ onMenuClick, onLogoutClick }: TopbarProps) {
  const { user } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className="topbar"
      style={{
        height: 68,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        gap: 14,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <button
        className="hamburger-btn"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
        <NotificationBell />
        <div className="topbar-user" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--accent-tint)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div className="topbar-user-text" style={{ lineHeight: 1.3 }}>
            <p style={{ fontSize: 14.5, fontWeight: 600, margin: 0 }}>{user?.name}</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={onLogoutClick}
          aria-label="Log out"
          title="Log out"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'transparent',
            padding: '7px 9px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
