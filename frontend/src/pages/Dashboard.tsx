import { Building2, UserCheck, BellRing } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STAT_CARDS = [
  { label: 'Active practices', value: '—', icon: Building2, tint: 'var(--accent-tint)', color: 'var(--accent)' },
  { label: 'Approved this month', value: '—', icon: UserCheck, tint: 'var(--status-approved-tint)', color: 'var(--status-approved)' },
  { label: 'Pending follow-ups', value: '—', icon: BellRing, tint: 'var(--status-in-progress-tint)', color: 'var(--status-in-progress)' },
];

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={{ fontSize: 24, margin: '0 0 4px' }}>
        Welcome back, {user?.name?.split(' ')[0]}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px' }}>
        Here's what's happening across your practices today.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {STAT_CARDS.map(({ label, value, icon: Icon, tint, color }) => (
          <div
            key={label}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
              padding: '18px',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: tint,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Icon size={18} color={color} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>{label}</p>
            <p className="tabular-nums" style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 14,
        }}
      >
        Charts and live data connect once the Practices and Credentialing modules are built.
      </div>
    </div>
  );
}
