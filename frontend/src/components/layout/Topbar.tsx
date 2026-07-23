import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Topbar() {
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
        height: 60,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
        gap: 14,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--accent-tint)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {initials}
        </div>
        <div style={{ lineHeight: 1.3 }}>
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{user?.name}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>
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
    </header>
  );
}
