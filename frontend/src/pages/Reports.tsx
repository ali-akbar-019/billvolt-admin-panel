import { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Building2,
  UsersRound,
  ClipboardCheck,
  TrendingUp,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { STATUS_LABEL, statusColors } from '../constants/credentialing';
import type { CredentialingStatus } from '../types';

interface Summary {
  practices: {
    total: number;
    active: number;
  };
  providers: {
    total: number;
    active: number;
  };
  credentialingByStatus: Partial<Record<CredentialingStatus, number>>;
  topPayers: {
    payerName: string;
    count: number;
  }[];
}

export function Reports() {
  const { showToast } = useToast();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    apiClient
      .get('/reports/summary')
      .then((res) => setSummary(res.data))
      .catch(() => showToast('Could not load reports', 'error'))
      .finally(() => setIsLoading(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportCsv = async () => {
    setIsExporting(true);

    try {
      const res = await apiClient.get('/reports/export', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));

      const a = document.createElement('a');
      a.href = url;
      a.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      showToast('Could not export reports', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <ReportsSkeleton />;
  }

  if (!summary) {
    return (
      <div className="reports-error">
        <div className="reports-error-icon">
          <BarChart3 size={22} />
        </div>

        <h3>Could not load reports</h3>

        <p>
          Something went wrong while loading your reporting data.
        </p>
      </div>
    );
  }

  const statusEntries = Object.entries(
    summary.credentialingByStatus
  ) as [CredentialingStatus, number][];

  const totalPayerRecords = statusEntries.reduce(
    (sum, [, count]) => sum + count,
    0
  );

  const maxStatusCount = Math.max(
    1,
    ...statusEntries.map(([, count]) => count)
  );

  const maxPayerCount = Math.max(
    1,
    ...summary.topPayers.map((payer) => payer.count)
  );

  const providerActivePercentage =
    summary.providers.total > 0
      ? Math.round(
        (summary.providers.active / summary.providers.total) * 100
      )
      : 0;

  const practiceActivePercentage =
    summary.practices.total > 0
      ? Math.round(
        (summary.practices.active / summary.practices.total) * 100
      )
      : 0;

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header">
        <div>
          <div className="reports-title-row">
            <h1>Reports</h1>
            <span className="reports-title-icon">
              <BarChart3 size={18} />
            </span>
          </div>

          <p>
            A snapshot of practices, providers, and credentialing
            performance.
          </p>
        </div>

        <button
          onClick={exportCsv}
          disabled={isExporting}
          className="reports-export-button"
        >
          <Download size={16} />
          {isExporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Overview */}
      <div className="reports-overview">
        <SummaryCard
          label="Practices"
          value={summary.practices.total}
          sub={`${summary.practices.active} active`}
          percentage={practiceActivePercentage}
          icon={Building2}
        />

        <SummaryCard
          label="Providers"
          value={summary.providers.total}
          sub={`${summary.providers.active} active`}
          percentage={providerActivePercentage}
          icon={UsersRound}
        />

        <SummaryCard
          label="Payer records"
          value={totalPayerRecords}
          sub="Across all statuses"
          icon={ClipboardCheck}
        />

        <SummaryCard
          label="Credentialing activity"
          value={summary.topPayers.length}
          sub="Active payer relationships"
          icon={TrendingUp}
        />
      </div>

      {/* Main Reports */}
      <div className="reports-grid">
        {/* Credentialing Status */}
        <section className="reports-card">
          <div className="reports-card-header">
            <div>
              <h2>Credentialing by status</h2>
              <p>Current distribution across all payer records.</p>
            </div>

            <div className="reports-card-icon">
              <ClipboardCheck size={17} />
            </div>
          </div>

          {statusEntries.length === 0 ? (
            <EmptyReportState />
          ) : (
            <div className="reports-bars">
              {statusEntries.map(([status, count]) => {
                const colors = statusColors(status);

                return (
                  <div key={status} className="report-bar-row">
                    <div className="report-bar-meta">
                      <div className="report-bar-label">
                        <span
                          className="report-status-dot"
                          style={{
                            background: colors.color,
                          }}
                        />

                        <span>{STATUS_LABEL[status]}</span>
                      </div>

                      <strong>{count}</strong>
                    </div>

                    <div className="report-bar-track">
                      <div
                        className="report-bar-fill"
                        style={{
                          width: `${(count / maxStatusCount) * 100}%`,
                          background: colors.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Top Payers */}
        <section className="reports-card">
          <div className="reports-card-header">
            <div>
              <h2>Top payers by volume</h2>
              <p>Payers with the highest number of records.</p>
            </div>

            <div className="reports-card-icon">
              <TrendingUp size={17} />
            </div>
          </div>

          {summary.topPayers.length === 0 ? (
            <EmptyReportState />
          ) : (
            <div className="reports-bars">
              {summary.topPayers.map((payer, index) => (
                <div
                  key={payer.payerName}
                  className="report-bar-row"
                >
                  <div className="report-bar-meta">
                    <div className="report-bar-label">
                      <span className="payer-rank">
                        {index + 1}
                      </span>

                      <span className="payer-name">
                        {payer.payerName}
                      </span>
                    </div>

                    <strong>{payer.count}</strong>
                  </div>

                  <div className="report-bar-track">
                    <div
                      className="report-bar-fill report-bar-accent"
                      style={{
                        width: `${(payer.count / maxPayerCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Bottom insight */}
      <section className="reports-insight">
        <div className="reports-insight-icon">
          <BarChart3 size={18} />
        </div>

        <div>
          <strong>Reporting overview</strong>

          <p>
            Your dashboard currently tracks{' '}
            <strong>{summary.practices.total}</strong> practices,{' '}
            <strong>{summary.providers.total}</strong> providers, and{' '}
            <strong>{totalPayerRecords}</strong> payer records.
          </p>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  percentage,
  icon: Icon,
}: {
  label: string;
  value: number;
  sub: string;
  percentage?: number;
  icon: typeof Building2;
}) {
  return (
    <div className="reports-summary-card">
      <div className="reports-summary-top">
        <div className="reports-summary-icon">
          <Icon size={18} />
        </div>

        {percentage !== undefined && (
          <span className="reports-summary-percentage">
            {percentage}%
          </span>
        )}
      </div>

      <div className="reports-summary-label">{label}</div>

      <div className="reports-summary-value">
        {value.toLocaleString()}
      </div>

      <div className="reports-summary-sub">{sub}</div>
    </div>
  );
}

function EmptyReportState() {
  return (
    <div className="reports-empty">
      <div className="reports-empty-icon">
        <BarChart3 size={20} />
      </div>

      <strong>No data yet</strong>

      <span>
        Reporting data will appear here once records are available.
      </span>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="reports-page">
      <div className="reports-skeleton-header">
        <div className="reports-skeleton-title" />
        <div className="reports-skeleton-button" />
      </div>

      <div className="reports-overview">
        {[1, 2, 3, 4].map((item) => (
          <div className="reports-summary-card reports-skeleton-card" key={item}>
            <div className="reports-skeleton-small" />
            <div className="reports-skeleton-large" />
            <div className="reports-skeleton-small" />
          </div>
        ))}
      </div>

      <div className="reports-grid">
        {[1, 2].map((item) => (
          <div className="reports-card reports-skeleton-report" key={item}>
            <div className="reports-skeleton-card-title" />

            {[1, 2, 3, 4].map((row) => (
              <div className="reports-skeleton-bar" key={row}>
                <div />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}