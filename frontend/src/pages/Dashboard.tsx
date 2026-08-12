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
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { STATUS_LABEL } from '../constants/credentialing';
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

const STATUS_HEX: Record<CredentialingStatus, string> = {
  not_started: '#7B8296',
  in_progress: '#D97706',
  submitted: '#7C5CFC',
  approved: '#1D9E75',
  denied: '#E24B4A',
  expired: '#92621B',
};

const CHART_ACCENT = '#2954E0';
const CHART_APPROVED = '#1D9E75';
const CHART_SUBMITTED = '#7C5CFC';
const CHART_GRID = 'rgba(11, 14, 26, 0.08)';
const CHART_TICK = '#7B8296';

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

  const statusData = statusEntries.map(([status, count]) => ({
    label: STATUS_LABEL[status],
    count,
    color: STATUS_HEX[status],
  }));

  const payerData = summary.topPayers.map((p) => ({ payerName: p.payerName, count: p.count }));

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
            {statusData.length === 0 ? (
              <EmptyNote text="Add a payer record to start the pipeline." />
            ) : (
              <div style={{ height: Math.max(170, statusData.length * 42) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: CHART_TICK }} />
                    <YAxis type="category" dataKey="label" width={96} axisLine={false} tickLine={false} tick={{ fontSize: 12.5, fill: CHART_TICK }} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(11, 14, 26, 0.04)' }} />
                    <Bar dataKey="count" name="Records" radius={[0, 5, 5, 0]} barSize={16}>
                      {statusData.map((entry) => <Cell key={entry.label} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
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
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.trendByMonth} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
                    <defs>
                      <linearGradient id="trendCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_ACCENT} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={CHART_ACCENT} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="trendApproved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_APPROVED} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={CHART_APPROVED} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: CHART_TICK }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: CHART_TICK }} width={34} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12.5 }} iconType="square" iconSize={9} />
                    <Area type="monotone" dataKey="created" name="Created" stroke={CHART_ACCENT} strokeWidth={2.5} fill="url(#trendCreated)" dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="approved" name="Approved" stroke={CHART_APPROVED} strokeWidth={2.5} fill="url(#trendApproved)" dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top payers */}
          <div className="surface-card" style={{ padding: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px' }}>Top payers by volume</p>
            {payerData.length === 0 ? (
              <EmptyNote text="No payer records yet." />
            ) : (
              <div style={{ height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payerData} margin={{ top: 6, right: 8, bottom: 0, left: -14 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                    <XAxis
                      dataKey="payerName"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={{ fontSize: 11, fill: CHART_TICK }}
                      tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 11)}…` : v)}
                    />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: CHART_TICK }} width={32} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(11, 14, 26, 0.04)' }} />
                    <Bar dataKey="count" name="Records" fill={CHART_SUBMITTED} radius={[5, 5, 0, 0]} barSize={26} maxBarSize={34} />
                  </BarChart>
                </ResponsiveContainer>
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

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  stroke?: string;
  fill?: string;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 10,
        boxShadow: 'var(--shadow-card)',
        padding: '10px 14px',
        fontSize: 13,
        minWidth: 120,
      }}
    >
      <p style={{ fontWeight: 600, margin: '0 0 6px' }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ margin: '2px 0', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: entry.color || entry.stroke || entry.fill, marginRight: 7 }} />
          {entry.name}: <strong className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{entry.value}</strong>
        </p>
      ))}
    </div>
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
