import { useEffect, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { STATUS_LABEL, statusColors } from '../constants/credentialing';
import type { CredentialingStatus } from '../types';

interface Summary {
  practices: { total: number; active: number };
  providers: { total: number; active: number };
  credentialingByStatus: Partial<Record<CredentialingStatus, number>>;
  topPayers: { payerName: string; count: number }[];
}

export function Reports() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    apiClient
      .get('/reports/summary')
      .then((res) => setSummary(res.data))
      .catch(() => showToast('Could not load reports', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await apiClient.get('/reports/export', { responseType: 'blob' });
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

  if (!summary) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-small)' }}>Loading reports…</div>;
  }

  const statusEntries = Object.entries(summary.credentialingByStatus) as [CredentialingStatus, number][];
  const maxStatusCount = Math.max(1, ...statusEntries.map(([, count]) => count));
  const maxPayerCount = Math.max(1, ...summary.topPayers.map((p) => p.count));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-page-title)', margin: '0 0 6px' }}>Reports</h1>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: 0 }}>
            A snapshot of practices, providers, and credentialing status.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={isExporting}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius)', padding: '11px 18px', fontSize: 14.5,
            fontWeight: 600, cursor: isExporting ? 'not-allowed' : 'pointer', opacity: isExporting ? 0.6 : 1,
          }}
        >
          <Download size={15} /> {isExporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <SummaryCard label="Practices" value={summary.practices.total} sub={`${summary.practices.active} active`} />
        <SummaryCard label="Providers" value={summary.providers.total} sub={`${summary.providers.active} active`} />
        <SummaryCard label="Payer records" value={statusEntries.reduce((sum, [, c]) => sum + c, 0)} sub="across all statuses" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div className="surface-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px' }}>Credentialing by status</p>
          {statusEntries.length === 0 ? (
            <EmptyNote />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {statusEntries.map(([status, count]) => (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{STATUS_LABEL[status]}</span>
                    <span className="tabular-nums" style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / maxStatusCount) * 100}%`, background: statusColors(status).color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="surface-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px' }}>Top payers by volume</p>
          {summary.topPayers.length === 0 ? (
            <EmptyNote />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {summary.topPayers.map((p) => (
                <div key={p.payerName}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{p.payerName}</span>
                    <span className="tabular-nums" style={{ fontWeight: 600 }}>{p.count}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(p.count / maxPayerCount) * 100}%`, background: 'var(--accent)', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="surface-card" style={{ padding: 20 }}>
      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
      <p className="tabular-nums" style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, margin: '0 0 4px' }}>{value}</p>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>{sub}</p>
    </div>
  );
}

function EmptyNote() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
      <BarChart3 size={16} /> No data yet.
    </div>
  );
}
