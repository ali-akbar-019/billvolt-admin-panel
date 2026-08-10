import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  UserRound,
  UserCheck,
  BellRing,
  CalendarClock,
  AlertTriangle,
  Clock,
  ArrowRight,
  ClipboardCheck,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { STATUS_LABEL, statusColors } from '../constants/credentialing';
import type { CredentialingStatus } from '../types';

interface TrendPoint {
  month: string;
  created: number;
  inProgress: number;
  submitted: number;
  approved: number;
  key: string;
}

interface Summary {
  activePractices: number;
  approvedThisMonth: number;
  pendingCredentialing: number;
  providers: { total: number; active: number };
  followUps: { overdue: number; dueToday: number; upcoming: number; completed: number };
  credentialingByStatus: Partial<Record<CredentialingStatus, number>>;
  trendByMonth: TrendPoint[];
  topPayers: { payerName: string; count: number }[];
}

const STATUS_ORDER: CredentialingStatus[] = [
  'not_started',
  'in_progress',
  'submitted',
  'approved',
  'denied',
  'expired',
];

export function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient
      .get('/dashboard/summary')
      .then((res) => setSummary(res.data))
      .catch(() => setError(true));
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (summary === null) {
    return (
      <div>
        <Skeleton title />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <Skeleton block />
          <Skeleton block />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Active practices',
      value: summary.activePractices,
      icon: Building2,
      tint: 'var(--accent-tint)',
      color: 'var(--accent)',
      to: '/practices',
    },
    {
      label: 'Providers',
      value: summary.providers.total,
      sub: `${summary.providers.active} active`,
      icon: UserRound,
      tint: 'var(--status-submitted-tint)',
      color: 'var(--status-submitted)',
      to: '/providers',
    },
    {
      label: 'Approved this month',
      value: summary.approvedThisMonth,
      icon: UserCheck,
      tint: 'var(--status-approved-tint)',
      color: 'var(--status-approved)',
      to: '/credentialing',
    },
    {
      label: 'Pending credentialing',
      value: summary.pendingCredentialing,
      icon: ClipboardCheck,
      tint: 'var(--status-in-progress-tint)',
      color: 'var(--status-in-progress)',
      to: '/credentialing',
    },
    {
      label: 'Open follow-ups',
      value: summary.followUps.dueToday + summary.followUps.overdue + summary.followUps.upcoming,
      icon: BellRing,
      tint: 'var(--status-denied-tint)',
      color: 'var(--status-denied)',
      to: '/follow-ups',
    },
  ];

  const statusEntries = STATUS_ORDER.filter((s) => (summary.credentialingByStatus[s] ?? 0) > 0)
    .map((s) => [s, summary.credentialingByStatus![s] as number] as [CredentialingStatus, number]);

  const maxStatus = Math.max(1, ...statusEntries.map(([, c]) => c));
  const maxPayer = Math.max(1, ...summary.topPayers.map((p) => p.count));
  const maxTrend = Math.max(1, ...summary.trendByMonth.map((t) => Math.max(t.created, t.approved)));

  const followUpBuckets = [
    { key: 'overdue', label: 'Overdue', icon: AlertTriangle, tint: 'var(--status-denied)', count: summary.followUps.overdue },
    { key: 'dueToday', label: 'Due today', icon: CalendarClock, tint: 'var(--status-in-progress)', count: summary.followUps.dueToday },
    { key: 'upcoming', label: 'Upcoming', icon: Clock, tint: 'var(--accent)', count: summary.followUps.upcoming },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-page-title)', margin: 0 }}>
            Welcome back, {user?.name?.split(' ')[0] ?? 'there'}
          </h1>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {today} · Here's what's happening across your practices.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <QuickLink to="/reports" icon={TrendingUp}>View reports</QuickLink>
          <QuickLink to="/ai-assistant" icon={Sparkles}>Ask the AI assistant</QuickLink>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, margin: '26px 0 20px' }}>
        {statCards.map(({ label, value, sub, icon: Icon, tint, color, to }) => (
          <Link key={label} to={to} className="surface-card surface-card--hoverable" style={{ padding: '22px', display: 'block', textDecoration: 'none', color: 'inherit' }}>
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
              {error ? '—' : value ?? '—'}
            </p>
            {sub && <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', margin: '4px 0 0' }}>{sub}</p>}
          </Link>
        ))}
      </div>

      {error ? (
        <div className="surface-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <BellRing size={30} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>Could not load dashboard data</p>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: 0 }}>
            Check that the backend is running, then{' '}
            <a href="/dashboard" style={{ color: 'var(--accent)' }}>refresh</a>.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
          {/* Credentialing pipeline */}
          <div className="surface-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 18px' }}>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Credentialing pipeline</p>
              <Link to="/credentialing" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                Open grid <ArrowRight size={14} />
              </Link>
            </div>
            {statusEntries.length === 0 ? (
              <EmptyNote text="Add a payer record to start the pipeline." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {statusEntries.map(([status, count]) => {
                  const { color } = statusColors(status);
                  return (
                    <div key={status}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{STATUS_LABEL[status]}</span>
                        <span className="tabular-nums" style={{ fontWeight: 700, color }}>{count}</span>
                      </div>
                      <div style={{ height: 9, borderRadius: 5, background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / maxStatus) * 100}%`, background: color, borderRadius: 5, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6-month activity trend */}
          <div className="surface-card" style={{ padding: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px' }}>
              Credentialing activity
            </p>
            {summary.trendByMonth.every((t) => t.created === 0 && t.approved === 0) ? (
              <EmptyNote text="No activity recorded in the last 6 months yet." />
            ) : (
              <div>
                <div style={{ height: 190, display: 'flex', alignItems: 'flex-end', gap: 8, paddingTop: 4 }}>
                  {summary.trendByMonth.map((t) => (
                    <div key={t.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}>
                      <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4 }}>
                        <div
                          title={`${t.month}: ${t.created} created`}
                          style={{ width: 14, maxWidth: '38%', height: `${Math.max(3, (t.created / maxTrend) * 100)}%`, background: 'var(--accent)', borderRadius: '4px 4px 0 0' }}
                        />
                        <div
                          title={`${t.month}: ${t.approved} approved`}
                          style={{ width: 14, maxWidth: '38%', height: t.approved === 0 ? 3 : `${(t.approved / maxTrend) * 100}%`, background: 'var(--status-approved)', borderRadius: '4px 4px 0 0' }}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.month}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 10 }}>
                  <LegendDot color="var(--accent)" label="Created" />
                  <LegendDot color="var(--status-approved)" label="Approved" />
                </div>
              </div>
            )}
          </div>

          {/* Top payers */}
          <div className="surface-card" style={{ padding: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px' }}>Top payers by volume</p>
            {summary.topPayers.length === 0 ? (
              <EmptyNote text="No payer records yet." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {summary.topPayers.map((p) => (
                  <div key={p.payerName}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{p.payerName}</span>
                      <span className="tabular-nums" style={{ fontWeight: 700 }}>{p.count}</span>
                    </div>
                    <div style={{ height: 9, borderRadius: 5, background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(p.count / maxPayer) * 100}%`, background: 'var(--status-submitted)', borderRadius: 5 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up buckets */}
          <div className="surface-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 18px' }}>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Follow-up queue</p>
              <Link to="/follow-ups" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                Open queue <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {followUpBuckets.map(({ key, label, icon: Icon, tint, count }) => (
                <Link
                  key={key}
                  to="/follow-ups"
                  className="surface-card surface-card--hoverable"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', textDecoration: 'none', color: 'inherit', boxShadow: 'none' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: count > 0 ? `${tint}18` : 'var(--bg-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={count > 0 ? tint : 'var(--text-muted)'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14.5, fontWeight: 600, margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      {count === 0 ? 'All clear' : `${count} pending follow-up${count === 1 ? '' : 's'} need attention`}
                    </p>
                  </div>
                  <span className="tabular-nums" style={{ fontSize: 22, fontWeight: 700, color: count > 0 ? tint : 'var(--text-muted)' }}>
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLink({ to, icon: Icon, children }: { to: string; icon: typeof ArrowRight; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px',
        borderRadius: 'var(--radius)', border: '1px solid var(--border-strong)',
        background: 'var(--bg-surface)', color: 'var(--text-secondary)',
        fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
      }}
    >
      <Icon size={15} /> {children}
    </Link>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      {label}
    </span>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-small)' }}>
      {text}
    </div>
  );
}

function Skeleton({ block, title }: { block?: boolean; title?: boolean }) {
  return (
    <div
      className="surface-card"
      style={{
        padding: block ? 40 : 22,
        height: block ? 260 : undefined,
        background: 'var(--bg-surface-2)',
        animation: 'pulse 1.4s ease-in-out infinite',
      }}
    >
      {title && (
        <div style={{ width: '45%', height: 18, borderRadius: 4, background: 'var(--border)' }} />
      )}
    </div>
  );
}