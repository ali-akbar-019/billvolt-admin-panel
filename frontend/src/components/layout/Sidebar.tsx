import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  UserRound,
  ClipboardCheck,
  Bell,
  BarChart3,
  Sparkles,
  Users,
  Settings,
  ScrollText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/practices', label: 'Practices', icon: Building2 },
  { to: '/providers', label: 'Providers', icon: UserRound },
  { to: '/credentialing', label: 'Credentialing grid', icon: ClipboardCheck },
  { to: '/follow-ups', label: 'Follow-ups', icon: Bell },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/ai-assistant', label: 'AI assistant', icon: Sparkles },
];

const ADMIN_ITEMS = [
  { to: '/users', label: 'User management', icon: Users },
  { to: '/audit-log', label: 'Audit log', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user } = useAuth();

  const linkStyle = (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '11px 14px',
    borderRadius: 'var(--radius)',
    fontSize: 15,
    fontWeight: 500,
    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
    background: isActive ? 'var(--accent-tint)' : 'transparent',
    textDecoration: 'none',
    transition: 'background 0.15s, color 0.15s',
  });

  return (
    <aside
      className={`app-shell-sidebar${isOpen ? ' is-open' : ''}`}
      style={{
        width: 260,
        flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '22px 16px',
        height: '100vh',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 28 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          B
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>
          billvolt
        </span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onClose} style={({ isActive }) => linkStyle(isActive)}>
            <Icon size={19} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {user?.role === 'admin' && (
        <>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '18px 14px 8px',
            }}
          >
            Admin
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ADMIN_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={onClose} style={({ isActive }) => linkStyle(isActive)}>
                <Icon size={19} strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </nav>
        </>
      )}
    </aside>
  );
}
