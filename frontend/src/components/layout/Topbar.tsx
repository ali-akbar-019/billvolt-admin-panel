import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          }}
        >
          {initials}
        </div>
        <div style={{ lineHeight: 1.3 }}>
          <p style={{ fontSize: 14.5, fontWeight: 600, margin: 0 }}>{user?.name}</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>
            {user?.role}
          </p>
        </div>
      </div>
      <button
        onClick={() => logout()}
        aria-label="Log out"
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
