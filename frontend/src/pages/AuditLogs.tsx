import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

interface AuditLog {
  _id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  userId?: { _id: string; name: string; email: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const ACTION_OPTIONS = [
  'create',
  'update',
  'delete',
  'view_sensitive',
  'notify',
];

const RESOURCE_OPTIONS = [
  'User',
  'Practice',
  'Provider',
  'CredentialingRecord',
  'FollowUp',
  'TimelineEntry',
  'OrgSettings',
];

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export function AuditLogs() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchLogs = (page = 1) => {
    setIsLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(pagination.limit) };
    if (action) params.action = action;
    if (resourceType) params.resourceType = resourceType;
    if (from) params.from = new Date(from).toISOString();
    if (to) params.to = new Date(to).toISOString();

    apiClient
      .get('/audit-logs', { params })
      .then((res) => {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      })
      .catch(() => showToast('Could not load audit logs', 'error'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anyFilters = action || resourceType || from || to;

  const clearFilters = () => {
    setAction('');
    setResourceType('');
    setFrom('');
    setTo('');
    fetchLogs(1);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-page-title)', margin: '0 0 6px' }}>Audit log</h1>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: 0 }}>
            Every sensitive-data reveal and record change, who did it and when.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 180px', maxWidth: '100%' }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Action</label>
          <select value={action} onChange={(e) => setAction(e.target.value)} className="select-control">
            <option value="">All actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 180px', maxWidth: '100%' }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Resource</label>
          <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} className="select-control">
            <option value="">All resources</option>
            {RESOURCE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 160px', maxWidth: '100%' }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-control" />
        </div>

        <div style={{ flex: '1 1 160px', maxWidth: '100%' }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-control" />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => fetchLogs(1)}
            style={{
              background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)',
              padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Filter
          </button>
          {anyFilters && (
            <button
              onClick={clearFilters}
              style={{
                background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="surface-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Loading audit log…</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ScrollText size={26} strokeWidth={1.75} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>No audit entries</p>
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: 0 }}>
              Records appear here as changes and sensitive-data reveals happen.
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5, minWidth: 760 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['When', 'User', 'Action', 'Resource', 'Details', 'IP'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }} className="tabular-nums">
                      {formatWhen(log.createdAt)}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 500 }}>{log.userId?.name || 'Unknown'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          fontSize: 12.5, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                          background: log.action === 'delete' ? 'var(--status-denied-tint)' : log.action === 'view_sensitive' ? 'var(--status-in-progress-tint)' : 'var(--accent-tint)',
                          color: log.action === 'delete' ? 'var(--status-denied)' : log.action === 'view_sensitive' ? 'var(--status-in-progress)' : 'var(--accent)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{log.resourceType}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
                      <MetaPreview metadata={log.metadata} />
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 13 }}>{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            {pagination.total} entr{pagination.total === 1 ? 'y' : 'ies'} · page {pagination.page} of {pagination.pages}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', fontSize: 13.5, fontWeight: 600,
                border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'var(--bg-surface)',
                color: pagination.page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronLeft size={15} /> Prev
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchLogs(pagination.page + 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', fontSize: 13.5, fontWeight: 600,
                border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'var(--bg-surface)',
                color: pagination.page >= pagination.pages ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
              }}
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaPreview({ metadata }: { metadata?: Record<string, unknown> }) {
  if (!metadata || Object.keys(metadata).length === 0) return <span>—</span>;

  const text = Object.entries(metadata)
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join(', ');

  return <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320, display: 'block' }}>{text}</span>;
}