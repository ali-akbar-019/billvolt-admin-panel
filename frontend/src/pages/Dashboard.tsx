import { useEffect, useState } from 'react';
import { Building2, UserCheck, BellRing } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

interface Summary {
  activePractices: number;
  approvedThisMonth: number;
  pendingCredentialing: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    apiClient
      .get('/dashboard/summary')
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null));
  }, []);

  const statCards = [
    { label: 'Active practices', value: summary?.activePractices, icon: Building2, tint: 'var(--accent-tint)', color: 'var(--accent)' },
    { label: 'Approved this month', value: summary?.approvedThisMonth, icon: UserCheck, tint: 'var(--status-approved-tint)', color: 'var(--status-approved)' },
    { label: 'Pending credentialing', value: summary?.pendingCredentialing, icon: BellRing, tint: 'var(--status-in-progress-tint)', color: 'var(--status-in-progress)' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 'var(--fs-page-title)', margin: '0 0 6px' }}>
        Welcome back, {user?.name?.split(' ')[0]}
      </h1>
      <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: '0 0 28px' }}>
        Here's what's happening across your practices today.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map(({ label, value, icon: Icon, tint, color }) => (
          <div key={label} className="surface-card surface-card--hoverable" style={{ padding: '22px' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: tint,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Icon size={20} color={color} />
            </div>
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: '0 0 6px', fontWeight: 500 }}>
              {label}
            </p>
            <p className="tabular-nums" style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, margin: 0 }}>
              {value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      <div
        className="surface-card"
        style={{
          padding: '40px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 'var(--fs-small)',
        }}
      >
        Reports and trend charts land in Module 3 — the Credentialing Grid already tracks what these numbers roll up from.
      </div>
    </div>
  );
}
