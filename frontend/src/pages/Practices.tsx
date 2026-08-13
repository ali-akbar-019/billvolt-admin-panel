import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
  Pencil,
  ArrowUpRight,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { PracticeFormModal } from '../components/PracticeFormModal';
import type { Practice } from '../types';

const statusBadge = (status: string): React.CSSProperties => ({
  background:
    status === 'active'
      ? 'var(--status-approved-tint)'
      : 'var(--status-not-started-tint)',
  color:
    status === 'active'
      ? 'var(--status-approved)'
      : 'var(--text-secondary)',
});

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12.5,
  fontWeight: 600,
  padding: '5px 10px',
  borderRadius: 7,
  textTransform: 'capitalize',
};

export function Practices() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [practices, setPractices] = useState<Practice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modalPractice, setModalPractice] =
    useState<Practice | null | 'new'>(null);

  const fetchPractices = () => {
    setIsLoading(true);

    apiClient
      .get('/practices', {
        params: {
          q: search || undefined,
          status: status || undefined,
          page,
          limit: 12,
        },
      })
      .then((res) => {
        setPractices(res.data.practices);
        setPages(res.data.pagination.pages || 1);
        setTotal(res.data.pagination.total || 0);
      })
      .catch(() => showToast('Could not load practices', 'error'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPractices();
  }, [page, status]);

  useEffect(() => {
    setPage(1);

    const timeout = setTimeout(() => {
      fetchPractices();
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  const handleSaved = (practice: Practice) => {
    setPractices((prev) => {
      const exists = prev.some((p) => p._id === practice._id);

      return exists
        ? prev.map((p) => (p._id === practice._id ? practice : p))
        : [practice, ...prev];
    });
  };

  const primaryLocation = (p: Practice) => {
    const loc =
      p.serviceLocations?.find((l) => l.isPrimary) ||
      p.serviceLocations?.[0];

    if (!loc || (!loc.city && !loc.state)) return '—';

    return [loc.city, loc.state].filter(Boolean).join(', ');
  };

  return (
    <div className="practices-page">
      {/* Header */}
      <div className="practices-header">
        <div>
          <div className="page-eyebrow">Organization</div>

          <h1 className="practices-title">Practices</h1>

          <p className="practices-subtitle">
            Manage your organizations, locations, and practice information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalPractice('new')}
          className="practices-add-button"
        >
          <Plus size={17} />
          Add practice
        </button>
      </div>

      {/* Toolbar */}
      <div className="practices-toolbar">
        <div className="practices-search">
          <Search size={17} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search practices, DBA, NPI, or tax ID"
            aria-label="Search practices"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="search-clear"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="practices-status-select"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Main table */}
      <section className="practices-table-card">
        <div className="practices-table-top">
          <div>
            <h2>All practices</h2>
            <p>
              {total} practice{total === 1 ? '' : 's'} on file
            </p>
          </div>

          {search || status ? (
            <span className="practices-filter-result">
              Filtered results
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <div className="practices-loading">
            <div className="loading-spinner" />
            <span>Loading practices…</span>
          </div>
        ) : practices.length === 0 ? (
          <div className="practices-empty">
            <div className="empty-icon">
              <Building2 size={24} />
            </div>

            <h3>No practices found</h3>

            <p>
              {search || status
                ? 'Try changing your search or status filter.'
                : 'Add your first practice to get started.'}
            </p>

            {!search && !status && (
              <button
                type="button"
                onClick={() => setModalPractice('new')}
                className="empty-add-button"
              >
                <Plus size={16} />
                Add practice
              </button>
            )}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="practices-table">
              <thead>
                <tr>
                  <th>Practice</th>
                  <th>DBA</th>
                  <th>NPI</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {practices.map((p) => (
                  <tr
                    key={p._id}
                    onClick={() => navigate(`/practices/${p._id}`)}
                  >
                    <td>
                      <div className="practice-name-cell">
                        <div className="practice-avatar">
                          <Building2 size={17} />
                        </div>

                        <div className="practice-name-content">
                          <span className="practice-name">
                            {p.groupName}
                          </span>

                          {p.dbaName && (
                            <span className="practice-mobile-dba">
                              {p.dbaName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="secondary-cell">
                      {p.dbaName || '—'}
                    </td>

                    <td className="secondary-cell">
                      {p.groupNpi || '—'}
                    </td>

                    <td className="secondary-cell">
                      {primaryLocation(p)}
                    </td>

                    <td>
                      <span
                        style={{
                          ...badgeStyle,
                          ...statusBadge(p.status),
                        }}
                      >
                        <span
                          className="status-dot"
                          style={{
                            background:
                              p.status === 'active'
                                ? 'var(--status-approved)'
                                : 'var(--text-muted)',
                          }}
                        />
                        {p.status}
                      </span>
                    </td>

                    <td className="updated-cell">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </td>

                    <td className="practice-actions">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalPractice(p);
                        }}
                        aria-label={`Edit ${p.groupName}`}
                        className="table-action"
                      >
                        <Pencil size={15} />
                      </button>

                      <ArrowUpRight
                        size={16}
                        className="row-arrow"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pagination */}
      {pages > 1 && (
        <div className="practices-pagination">
          <span>
            Showing page <strong>{page}</strong> of{' '}
            <strong>{pages}</strong>
          </span>

          <div className="pagination-buttons">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="pagination-button"
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>

            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="pagination-button"
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      )}

      {modalPractice && (
        <PracticeFormModal
          practice={modalPractice === 'new' ? null : modalPractice}
          onClose={() => setModalPractice(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}