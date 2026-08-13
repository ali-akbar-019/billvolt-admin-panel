import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  UserRound,
  Pencil,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { ProviderFormModal } from '../components/ProviderFormModal';
import type { Provider } from '../types';

export function Providers() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modalProvider, setModalProvider] =
    useState<Provider | null | 'new'>(null);

  const fetchProviders = () => {
    setIsLoading(true);

    apiClient
      .get('/providers', {
        params: {
          q: search || undefined,
          status: status || undefined,
          page,
          limit: 12,
        },
      })
      .then((res) => {
        setProviders(res.data.providers);
        setPages(res.data.pagination.pages || 1);
        setTotal(res.data.pagination.total || 0);
      })
      .catch(() => showToast('Could not load providers', 'error'))
      .finally(() => setIsLoading(false));
  };

  useEffect(fetchProviders, [page, status]);

  useEffect(() => {
    setPage(1);

    const timeout = setTimeout(fetchProviders, 350);

    return () => clearTimeout(timeout);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSaved = (provider: Provider) => {
    setProviders((prev) => {
      const exists = prev.some((p) => p._id === provider._id);

      return exists
        ? prev.map((p) => (p._id === provider._id ? provider : p))
        : [provider, ...prev];
    });
  };

  const practiceName = (p: Provider) =>
    typeof p.practiceId === 'object'
      ? p.practiceId.groupName
      : 'No practice assigned';

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const activeCount = providers.filter((p) => p.status === 'active').length;

  return (
    <div className="providers-page">
      {/* Header */}
      <div className="providers-header">
        <div>
          <div className="providers-title-row">
            <h1>Providers</h1>
            <span className="providers-count">{total}</span>
          </div>

          <p>
            Manage your providers, specialties, and practice assignments.
          </p>
        </div>

        <button
          onClick={() => setModalProvider('new')}
          className="providers-add-button"
        >
          <Plus size={17} />
          Add provider
        </button>
      </div>

      {/* Toolbar */}
      <div className="providers-toolbar">
        <div className="providers-search">
          <Search size={17} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search providers, NPI, or specialty..."
          />

          {search && (
            <button
              type="button"
              className="providers-search-clear"
              onClick={() => setSearch('')}
            >
              Clear
            </button>
          )}
        </div>

        <div className="providers-filter">
          <SlidersHorizontal size={16} />

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All providers</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        <div className="providers-toolbar-meta">
          <span>{total} total</span>
          <span className="toolbar-divider" />
          <span>{activeCount} active on this page</span>
        </div>
      </div>

      {/* Content */}
      <div className="providers-content">
        {isLoading ? (
          <ProviderSkeleton />
        ) : providers.length === 0 ? (
          <div className="providers-empty">
            <div className="providers-empty-icon">
              <UserRound size={24} />
            </div>

            <h3>No providers found</h3>

            <p>
              {search || status
                ? 'Try adjusting your search or filters.'
                : 'Add your first provider to start managing credentialing.'}
            </p>

            {!search && !status && (
              <button
                onClick={() => setModalProvider('new')}
                className="providers-empty-button"
              >
                <Plus size={16} />
                Add provider
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="providers-desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>NPI</th>
                    <th>Specialty</th>
                    <th>Practice</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {providers.map((provider) => (
                    <tr
                      key={provider._id}
                      onClick={() =>
                        navigate(`/providers/${provider._id}`)
                      }
                    >
                      <td>
                        <div className="provider-person">
                          <div className="provider-avatar">
                            {getInitials(provider.name)}
                          </div>

                          <div className="provider-person-info">
                            <Link
                              to={`/providers/${provider._id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {provider.name}
                              <ArrowUpRight size={14} />
                            </Link>

                            <span>
                              {provider.specialty || 'Provider'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="provider-npi">
                          {provider.npi || '—'}
                        </span>
                      </td>

                      <td>
                        <span className="provider-secondary">
                          {provider.specialty || '—'}
                        </span>
                      </td>

                      <td>
                        <span className="provider-practice">
                          {practiceName(provider)}
                        </span>
                      </td>

                      <td>
                        <Status status={provider.status} />
                      </td>

                      <td>
                        <span className="provider-date">
                          {new Date(
                            provider.updatedAt
                          ).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      <td>
                        <button
                          className="provider-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalProvider(provider);
                          }}
                          aria-label={`Edit ${provider.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="providers-mobile-list">
              {providers.map((provider) => (
                <div
                  key={provider._id}
                  className="provider-mobile-card"
                  onClick={() =>
                    navigate(`/providers/${provider._id}`)
                  }
                >
                  <div className="provider-mobile-top">
                    <div className="provider-person">
                      <div className="provider-avatar">
                        {getInitials(provider.name)}
                      </div>

                      <div className="provider-person-info">
                        <strong>{provider.name}</strong>
                        <span>
                          {provider.specialty || 'Provider'}
                        </span>
                      </div>
                    </div>

                    <Status status={provider.status} />
                  </div>

                  <div className="provider-mobile-details">
                    <div>
                      <span>NPI</span>
                      <strong>{provider.npi || '—'}</strong>
                    </div>

                    <div>
                      <span>Practice</span>
                      <strong>{practiceName(provider)}</strong>
                    </div>
                  </div>

                  <div className="provider-mobile-footer">
                    <span>
                      Updated{' '}
                      {new Date(
                        provider.updatedAt
                      ).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalProvider(provider);
                      }}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="providers-pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={17} />
          </button>

          <span>
            Page <strong>{page}</strong> of {pages}
          </span>

          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      )}

      {modalProvider && (
        <ProviderFormModal
          provider={
            modalProvider === 'new'
              ? null
              : modalProvider
          }
          onClose={() => setModalProvider(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function Status({ status }: { status: string }) {
  const active = status === 'active';

  return (
    <span className={`provider-status ${active ? 'active' : 'inactive'}`}>
      <span className="provider-status-dot" />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function ProviderSkeleton() {
  return (
    <div className="provider-skeleton">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="provider-skeleton-row">
          <div className="skeleton-avatar" />

          <div className="skeleton-lines">
            <div />
            <div />
          </div>

          <div className="skeleton-line short" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}