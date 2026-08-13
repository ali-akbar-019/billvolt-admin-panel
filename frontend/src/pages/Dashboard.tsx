import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BellRing,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { apiClient } from '../api/client';
import { STATUS_LABEL } from '../constants/credentialing';
import { useAuth } from '../context/AuthContext';
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
  providers: {
    total: number;
    active: number;
  };
  followUps: {
    overdue: number;
    dueToday: number;
    upcoming: number;
    completed: number;
  };
  credentialingByStatus: Partial<Record<CredentialingStatus, number>>;
  trendByMonth: TrendPoint[];
  topPayers: {
    payerName: string;
    count: number;
  }[];
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
  not_started: '#8B93A7',
  in_progress: '#D97706',
  submitted: '#7357E8',
  approved: '#159570',
  denied: '#D94A4A',
  expired: '#9A6A25',
};

const CHART_ACCENT = '#2954E0';
const CHART_APPROVED = '#159570';
const CHART_GRID = 'rgba(11, 14, 26, 0.07)';
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
    return <DashboardSkeleton />;
  }

  const openFollowUps =
    summary.followUps.overdue +
    summary.followUps.dueToday +
    summary.followUps.upcoming;

  const statusEntries = STATUS_ORDER
    .filter((status) => (summary.credentialingByStatus[status] ?? 0) > 0)
    .map(
      (status) =>
        [
          status,
          summary.credentialingByStatus[status] as number,
        ] as [CredentialingStatus, number]
    );

  const statusData = statusEntries.map(([status, count]) => ({
    label: STATUS_LABEL[status],
    count,
    color: STATUS_HEX[status],
  }));

  const payerData = summary.topPayers.slice(0, 5);

  const followUpBuckets = [
    {
      key: 'overdue',
      label: 'Overdue',
      description: 'Requires immediate attention',
      icon: AlertTriangle,
      color: 'var(--status-denied)',
      count: summary.followUps.overdue,
    },
    {
      key: 'dueToday',
      label: 'Due today',
      description: 'Needs attention today',
      icon: CalendarClock,
      color: 'var(--status-in-progress)',
      count: summary.followUps.dueToday,
    },
    {
      key: 'upcoming',
      label: 'Upcoming',
      description: 'Scheduled follow-ups',
      icon: Clock,
      color: 'var(--accent)',
      count: summary.followUps.upcoming,
    },
  ];

  return (
    <div className="dashboard-page">
      {/* Header */}

      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">
            {today}
          </p>

          <h1 className="dashboard-title">
            Welcome back, {user?.name?.split(' ')[0] ?? 'there'}.
          </h1>

          <p className="dashboard-subtitle">
            Here's what's happening across your credentialing operation.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link to="/reports" className="dashboard-action">
            <TrendingUp size={16} />
            Reports
          </Link>

          <Link to="/ai-assistant" className="dashboard-action dashboard-action-primary">
            <Sparkles size={16} />
            Ask AI
          </Link>
        </div>
      </header>

      {/* Main statistics */}

      <section className="dashboard-stat-grid">
        <StatCard
          label="Active practices"
          value={summary.activePractices}
          icon={Building2}
          color="#2954E0"
          to="/practices"
        />

        <StatCard
          label="Providers"
          value={summary.providers.total}
          secondary={`${summary.providers.active} active`}
          icon={UserRound}
          color="#7357E8"
          to="/providers"
        />

        <StatCard
          label="Approved this month"
          value={summary.approvedThisMonth}
          icon={UserCheck}
          color="#159570"
          to="/credentialing"
        />

        <StatCard
          label="Pending credentialing"
          value={summary.pendingCredentialing}
          icon={ClipboardCheck}
          color="#D97706"
          to="/credentialing"
        />

        <StatCard
          label="Open follow-ups"
          value={openFollowUps}
          secondary={
            summary.followUps.overdue > 0
              ? `${summary.followUps.overdue} overdue`
              : 'Nothing overdue'
          }
          icon={BellRing}
          color={
            summary.followUps.overdue > 0
              ? '#D94A4A'
              : '#2954E0'
          }
          to="/follow-ups"
          emphasis={summary.followUps.overdue > 0}
        />
      </section>

      {error ? (
        <div className="dashboard-error">
          <BellRing size={28} />

          <div>
            <strong>Unable to load dashboard data</strong>
            <p>
              Check that the backend is running, then{' '}
              <a href="/dashboard">refresh the page</a>.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Main analytics */}

          <section className="dashboard-main-grid">
            {/* Activity */}

            <div className="dashboard-panel dashboard-panel-large">
              <PanelHeader
                title="Credentialing activity"
                description="Records created and approved over the last six months."
                icon={<Activity size={17} />}
              />

              {summary.trendByMonth.every(
                (item) =>
                  item.created === 0 &&
                  item.approved === 0
              ) ? (
                <EmptyNote text="No activity recorded in the last six months yet." />
              ) : (
                <div className="activity-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={summary.trendByMonth}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="dashboardCreated"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={CHART_ACCENT}
                            stopOpacity={0.18}
                          />
                          <stop
                            offset="100%"
                            stopColor={CHART_ACCENT}
                            stopOpacity={0}
                          />
                        </linearGradient>

                        <linearGradient
                          id="dashboardApproved"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={CHART_APPROVED}
                            stopOpacity={0.18}
                          />
                          <stop
                            offset="100%"
                            stopColor={CHART_APPROVED}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="4 5"
                        stroke={CHART_GRID}
                        vertical={false}
                      />

                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 12,
                          fill: CHART_TICK,
                        }}
                      />

                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 12,
                          fill: CHART_TICK,
                        }}
                        width={38}
                      />

                      <Tooltip content={<ChartTooltip />} />

                      <Area
                        type="monotone"
                        dataKey="created"
                        name="Created"
                        stroke={CHART_ACCENT}
                        strokeWidth={2.5}
                        fill="url(#dashboardCreated)"
                        dot={{
                          r: 3,
                          strokeWidth: 2,
                          fill: '#fff',
                        }}
                        activeDot={{ r: 5 }}
                      />

                      <Area
                        type="monotone"
                        dataKey="approved"
                        name="Approved"
                        stroke={CHART_APPROVED}
                        strokeWidth={2.5}
                        fill="url(#dashboardApproved)"
                        dot={{
                          r: 3,
                          strokeWidth: 2,
                          fill: '#fff',
                        }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Pipeline */}

            <div className="dashboard-panel">
              <PanelHeader
                title="Credentialing pipeline"
                description="Current status across payer records."
                action={
                  <Link to="/credentialing" className="panel-link">
                    View all
                    <ArrowRight size={14} />
                  </Link>
                }
              />

              {statusData.length === 0 ? (
                <EmptyNote text="Add a payer record to start the pipeline." />
              ) : (
                <div className="pipeline-list">
                  {statusData.map((item) => {
                    const total = statusData.reduce(
                      (sum, current) => sum + current.count,
                      0
                    );

                    const percentage =
                      total > 0
                        ? Math.round((item.count / total) * 100)
                        : 0;

                    return (
                      <div
                        key={item.label}
                        className="pipeline-item"
                      >
                        <div className="pipeline-top">
                          <div className="pipeline-name">
                            <span
                              className="pipeline-dot"
                              style={{
                                background: item.color,
                              }}
                            />

                            {item.label}
                          </div>

                          <strong>{item.count}</strong>
                        </div>

                        <div className="pipeline-track">
                          <div
                            className="pipeline-fill"
                            style={{
                              width: `${percentage}%`,
                              background: item.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Lower section */}

          <section className="dashboard-bottom-grid">
            {/* Top payers */}

            <div className="dashboard-panel">
              <PanelHeader
                title="Top payers"
                description="Highest volume of credentialing records."
                action={
                  <Link to="/credentialing" className="panel-link">
                    Credentialing
                    <ArrowRight size={14} />
                  </Link>
                }
              />

              {payerData.length === 0 ? (
                <EmptyNote text="No payer records yet." />
              ) : (
                <div className="payer-list">
                  {payerData.map((payer, index) => {
                    const maxCount = payerData[0]?.count || 1;
                    const percentage =
                      (payer.count / maxCount) * 100;

                    return (
                      <div
                        key={payer.payerName}
                        className="payer-row"
                      >
                        <div className="payer-rank">
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        <div className="payer-main">
                          <div className="payer-heading">
                            <span className="payer-name">
                              {payer.payerName}
                            </span>

                            <strong className="payer-count">
                              {payer.count}
                            </strong>
                          </div>

                          <div className="payer-track">
                            <div
                              className="payer-progress"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Follow ups */}

            <div className="dashboard-panel">
              <PanelHeader
                title="Follow-up queue"
                description="Tasks that need attention."
                action={
                  <Link to="/follow-ups" className="panel-link">
                    Open queue
                    <ArrowRight size={14} />
                  </Link>
                }
              />

              <div className="followup-list">
                {followUpBuckets.map(
                  ({
                    key,
                    label,
                    description,
                    icon: Icon,
                    color,
                    count,
                  }) => (
                    <Link
                      key={key}
                      to="/follow-ups"
                      className="followup-row"
                    >
                      <div
                        className="followup-icon"
                        style={{
                          color,
                          background: `${color}12`,
                        }}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="followup-content">
                        <strong>{label}</strong>

                        <span>
                          {count === 0
                            ? 'All clear'
                            : description}
                        </span>
                      </div>

                      <span
                        className="followup-count"
                        style={{
                          color:
                            count > 0
                              ? color
                              : 'var(--text-muted)',
                        }}
                      >
                        {count}
                      </span>
                    </Link>
                  )
                )}
              </div>

              <div className="completed-row">
                <CheckCircle2 size={16} />

                <span>
                  {summary.followUps.completed} follow-ups
                  completed
                </span>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  secondary,
  icon: Icon,
  color,
  to,
  emphasis,
}: {
  label: string;
  value: number;
  secondary?: string;
  icon: typeof Building2;
  color: string;
  to: string;
  emphasis?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`dashboard-stat ${emphasis ? 'dashboard-stat-alert' : ''}`}
    >
      <div className="stat-icon" style={{ color, background: `${color}12` }}>
        <Icon size={19} />
      </div>

      <div className="stat-content">
        <span className="stat-label">{label}</span>

        <strong className="stat-value tabular-nums">
          {value}
        </strong>

        {secondary && (
          <span className="stat-secondary">
            {secondary}
          </span>
        )}
      </div>

      <ArrowRight className="stat-arrow" size={17} />
    </Link>
  );
}

function PanelHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel-header">
      <div className="panel-title-wrap">
        {icon && (
          <div className="panel-title-icon">
            {icon}
          </div>
        )}

        <div>
          <h2>{title}</h2>

          {description && (
            <p>{description}</p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  stroke?: string;
  fill?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="dashboard-tooltip">
      <strong>{label}</strong>

      {payload.map((entry) => (
        <div key={entry.name}>
          <span
            className="tooltip-dot"
            style={{
              background:
                entry.color ||
                entry.stroke ||
                entry.fill,
            }}
          />

          <span>{entry.name}</span>

          <b>{entry.value}</b>
        </div>
      ))}
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="dashboard-empty">
      {text}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-page dashboard-loading">
      <div className="skeleton-header">
        <div className="skeleton-line skeleton-small" />
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-description" />
      </div>

      <div className="dashboard-stat-grid">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="dashboard-stat skeleton-card"
          />
        ))}
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-panel skeleton-card large" />
        <div className="dashboard-panel skeleton-card" />
      </div>
    </div>
  );
}