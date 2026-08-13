import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ScrollText, SlidersHorizontal } from 'lucide-react';
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
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
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

const formatAction = (action: string) =>
  action.replace(/_/g, ' ');

const getActionClass = (action: string) => {
  if (action === 'delete') return 'audit-action audit-action-danger';
  if (action === 'view_sensitive') return 'audit-action audit-action-warning';

  return 'audit-action audit-action-default';
};

export function AuditLogs() {
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);

  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchLogs = (page = 1) => {
    setIsLoading(true);

    const params: Record<string, string> = {
      page: String(page),
      limit: String(pagination.limit),
    };

    if (action) params.action = action;
    if (resourceType) params.resourceType = resourceType;

    if (from) {
      params.from = new Date(`${from}T00:00:00`).toISOString();
    }

    if (to) {
      params.to = new Date(`${to}T23:59:59.999`).toISOString();
    }

    apiClient
      .get('/audit-logs', { params })
      .then((res) => {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      })
      .catch(() => {
        showToast('Could not load audit logs', 'error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anyFilters = Boolean(action || resourceType || from || to);

  const clearFilters = () => {
    setAction('');
    setResourceType('');
    setFrom('');
    setTo('');

    // Use the cleared values immediately rather than waiting for state updates.
    setIsLoading(true);

    apiClient
      .get('/audit-logs', {
        params: {
          page: '1',
          limit: String(pagination.limit),
        },
      })
      .then((res) => {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      })
      .catch(() => {
        showToast('Could not load audit logs', 'error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="audit-page">

      {/* Header */}
      <div className="audit-header">
        <div>
          <div className="audit-eyebrow">
            <span className="audit-eyebrow-dot" />
            Security & compliance
          </div>

          <h1 className="audit-title">
            Audit log
          </h1>

          <p className="audit-description">
            Track sensitive-data access, record changes, and administrative activity across your organization.
          </p>
        </div>

        <div className="audit-header-meta">
          <div className="audit-header-icon">
            <ScrollText size={18} />
          </div>

          <div>
            <span className="audit-header-meta-label">
              Total activity
            </span>

            <strong className="audit-header-meta-value tabular-nums">
              {pagination.total}
            </strong>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="audit-filter-card">
        <div className="audit-filter-heading">
          <div className="audit-filter-icon">
            <SlidersHorizontal size={15} />
          </div>

          <div>
            <p className="audit-filter-title">
              Filter activity
            </p>

            <p className="audit-filter-subtitle">
              Narrow the audit trail by action, resource, or date.
            </p>
          </div>
        </div>

        <div className="audit-filters">

          <div className="audit-field">
            <label>Action</label>

            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="select-control"
            >
              <option value="">All actions</option>

              {ACTION_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {formatAction(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="audit-field">
            <label>Resource</label>

            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="select-control"
            >
              <option value="">All resources</option>

              {RESOURCE_OPTIONS.map((resource) => (
                <option key={resource} value={resource}>
                  {resource}
                </option>
              ))}
            </select>
          </div>

          <div className="audit-field">
            <label>From</label>

            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input-control"
            />
          </div>

          <div className="audit-field">
            <label>To</label>

            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input-control"
            />
          </div>

          <div className="audit-filter-actions">
            <button
              type="button"
              onClick={() => fetchLogs(1)}
              className="audit-filter-button"
            >
              Filter
            </button>

            {anyFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="audit-clear-button"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="surface-card audit-table-card">
        {isLoading ? (
          <div className="audit-loading">
            <div className="audit-loading-spinner" />

            <span>
              Loading audit activity…
            </span>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state audit-empty">
            <div className="empty-state-icon audit-empty-icon">
              <ScrollText size={26} strokeWidth={1.75} />
            </div>

            <p className="audit-empty-title">
              No audit entries
            </p>

            <p className="audit-empty-description">
              Records will appear here as changes and sensitive-data
              access occur.
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Details</th>
                  <th>IP address</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>

                    <td className="audit-time tabular-nums">
                      {formatWhen(log.createdAt)}
                    </td>

                    <td>
                      <div className="audit-user">
                        <div className="audit-user-avatar">
                          {(log.userId?.name || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="audit-user-info">
                          <span className="audit-user-name">
                            {log.userId?.name || 'Unknown'}
                          </span>

                          {log.userId?.email && (
                            <span className="audit-user-email">
                              {log.userId.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={getActionClass(log.action)}>
                        <span className="audit-action-dot" />
                        {formatAction(log.action)}
                      </span>
                    </td>

                    <td>
                      <span className="audit-resource">
                        {log.resourceType}
                      </span>
                    </td>

                    <td>
                      <MetaPreview metadata={log.metadata} />
                    </td>

                    <td>
                      <span className="audit-ip">
                        {log.ipAddress || '—'}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="audit-pagination">

          <p className="audit-pagination-info">
            <strong>{pagination.total}</strong>{' '}
            {pagination.total === 1 ? 'entry' : 'entries'}
            <span className="audit-pagination-separator">·</span>
            Page {pagination.page} of {pagination.pages}
          </p>

          <div className="audit-pagination-actions">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="audit-page-button"
            >
              <ChevronLeft size={15} />
              Previous
            </button>

            <button
              type="button"
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="audit-page-button"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

function MetaPreview({
  metadata,
}: {
  metadata?: Record<string, unknown>;
}) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="audit-meta-empty">—</span>;
  }

  const text = Object.entries(metadata)
    .map(([key, value]) => {
      const formattedValue =
        typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);

      return `${key}: ${formattedValue}`;
    })
    .join(', ');

  return (
    <span
      className="audit-meta"
      title={text}
    >
      {text}
    </span>
  );
}