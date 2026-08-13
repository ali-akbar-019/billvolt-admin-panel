import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Pencil,
  SlidersHorizontal,
  ArrowUpRight,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { CredentialingFormModal } from '../components/CredentialingFormModal';
import {
  STATUS_OPTIONS,
  statusColors,
} from '../constants/credentialing';
import type {
  CredentialingRecord,
  CredentialingStatus,
} from '../types';

export function CredentialingGrid() {
  const { showToast } = useToast();

  const [records, setRecords] = useState<CredentialingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modalRecord, setModalRecord] =
    useState<CredentialingRecord | null | 'new'>(null);

  const fetchRecords = () => {
    setIsLoading(true);

    apiClient
      .get('/credentialing', {
        params: {
          payerName: search || undefined,
          status: status || undefined,
          page,
          limit: 12,
        },
      })
      .then((res) => {
        setRecords(res.data.records);
        setPages(res.data.pagination.pages || 1);
        setTotal(res.data.pagination.total || 0);
      })
      .catch(() =>
        showToast(
          'Could not load the credentialing grid',
          'error'
        )
      )
      .finally(() => setIsLoading(false));
  };

  useEffect(fetchRecords, [page, status]);

  useEffect(() => {
    setPage(1);

    const timeout = setTimeout(fetchRecords, 350);

    return () => clearTimeout(timeout);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSaved = (record: CredentialingRecord) => {
    setRecords((prev) => {
      const exists = prev.some((r) => r._id === record._id);

      return exists
        ? prev.map((r) =>
          r._id === record._id ? record : r
        )
        : [record, ...prev];
    });
  };

  const handleInlineStatusChange = async (
    record: CredentialingRecord,
    newStatus: CredentialingStatus
  ) => {
    const previousRecords = records;

    setRecords((prev) =>
      prev.map((r) =>
        r._id === record._id
          ? { ...r, status: newStatus }
          : r
      )
    );

    try {
      const res = await apiClient.patch(
        `/credentialing/${record._id}`,
        {
          status: newStatus,
        }
      );

      handleSaved(res.data.record);
    } catch {
      setRecords(previousRecords);
      showToast('Could not update status', 'error');
    }
  };

  const providerName = (record: CredentialingRecord) =>
    typeof record.providerId === 'object'
      ? record.providerId.name
      : '—';

  const practiceName = (record: CredentialingRecord) =>
    typeof record.providerId === 'object'
      ? record.providerId.practiceId?.groupName || '—'
      : '—';

  const formatDate = (date?: string) => {
    if (!date) return '—';

    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusLabel = (value: string) => {
    return (
      STATUS_OPTIONS.find((option) => option.value === value)
        ?.label || value
    );
  };

  const activeCount = records.filter(
    (record) =>
      record.status === 'active' ||
      record.status === 'approved'
  ).length;

  return (
    <div className="credentialing-page">
      {/* Header */}
      <div className="credentialing-header">
        <div>
          <div className="credentialing-title-row">
            <h1>Credentialing</h1>

            <span className="credentialing-count">
              {total}
            </span>
          </div>

          <p>
            Manage payer enrollment, credentialing status, and
            expiration dates across your providers.
          </p>
        </div>

        <button
          onClick={() => setModalRecord('new')}
          className="credentialing-add-button"
        >
          <Plus size={17} />
          Add payer record
        </button>
      </div>

      {/* Toolbar */}
      <div className="credentialing-toolbar">
        <div className="credentialing-search">
          <Search size={17} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payer names..."
          />

          {search && (
            <button
              type="button"
              className="credentialing-search-clear"
              onClick={() => setSearch('')}
            >
              Clear
            </button>
          )}
        </div>

        <div className="credentialing-filter">
          <SlidersHorizontal size={16} />

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>

            {STATUS_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="credentialing-toolbar-meta">
          <span>{total} total</span>

          <span className="credentialing-toolbar-divider" />

          <span>
            {activeCount} active on this page
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="credentialing-content">
        {isLoading ? (
          <CredentialingSkeleton />
        ) : records.length === 0 ? (
          <div className="credentialing-empty">
            <div className="credentialing-empty-icon">
              <ClipboardCheck size={24} />
            </div>

            <h3>No credentialing records found</h3>

            <p>
              {search || status
                ? 'Try adjusting your search or filters.'
                : 'Add your first payer record to start managing credentialing.'}
            </p>

            {!search && !status && (
              <button
                onClick={() => setModalRecord('new')}
                className="credentialing-empty-button"
              >
                <Plus size={16} />
                Add payer record
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="credentialing-desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>Payer</th>
                    <th>Provider</th>
                    <th>Practice</th>
                    <th>Status</th>
                    <th>Expiration</th>
                    <th>Updated</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => (
                    <tr key={record._id}>
                      <td>
                        <div className="credentialing-payer">
                          <div className="credentialing-payer-icon">
                            <ClipboardCheck size={17} />
                          </div>

                          <div className="credentialing-payer-info">
                            <strong>
                              {record.payerName}
                            </strong>

                            <span>
                              Payer credentialing
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="credentialing-provider">
                          {providerName(record)}
                        </span>
                      </td>

                      <td>
                        <span className="credentialing-practice">
                          {practiceName(record)}
                        </span>
                      </td>

                      <td>
                        <Status
                          status={record.status}
                          value={record.status}
                          label={getStatusLabel(record.status)}
                          onChange={(newStatus) =>
                            handleInlineStatusChange(
                              record,
                              newStatus
                            )
                          }
                        />
                      </td>

                      <td>
                        <span className="credentialing-date">
                          {formatDate(record.expirationDate)}
                        </span>
                      </td>

                      <td>
                        <span className="credentialing-date">
                          {formatDate(record.updatedAt)}
                        </span>
                      </td>

                      <td>
                        <button
                          className="credentialing-edit"
                          onClick={() =>
                            setModalRecord(record)
                          }
                          aria-label={`Edit ${record.payerName} record`}
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
            <div className="credentialing-mobile-list">
              {records.map((record) => (
                <div
                  key={record._id}
                  className="credentialing-mobile-card"
                >
                  <div className="credentialing-mobile-top">
                    <div className="credentialing-payer">
                      <div className="credentialing-payer-icon">
                        <ClipboardCheck size={17} />
                      </div>

                      <div className="credentialing-payer-info">
                        <strong>
                          {record.payerName}
                        </strong>

                        <span>
                          Payer credentialing
                        </span>
                      </div>
                    </div>

                    <Status
                      status={record.status}
                      value={record.status}
                      label={getStatusLabel(record.status)}
                      onChange={(newStatus) =>
                        handleInlineStatusChange(
                          record,
                          newStatus
                        )
                      }
                    />
                  </div>

                  <div className="credentialing-mobile-details">
                    <div>
                      <span>Provider</span>

                      <strong>
                        {providerName(record)}
                      </strong>
                    </div>

                    <div>
                      <span>Practice</span>

                      <strong>
                        {practiceName(record)}
                      </strong>
                    </div>

                    <div>
                      <span>Expiration</span>

                      <strong>
                        {formatDate(record.expirationDate)}
                      </strong>
                    </div>

                    <div>
                      <span>Updated</span>

                      <strong>
                        {formatDate(record.updatedAt)}
                      </strong>
                    </div>
                  </div>

                  <div className="credentialing-mobile-footer">
                    <span>
                      Credentialing record
                    </span>

                    <button
                      onClick={() =>
                        setModalRecord(record)
                      }
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
        <div className="credentialing-pagination">
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

      {modalRecord && (
        <CredentialingFormModal
          record={
            modalRecord === 'new'
              ? null
              : modalRecord
          }
          onClose={() => setModalRecord(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function Status({
  status,
  value,
  label,
  onChange,
}: {
  status: string;
  value: string;
  label: string;
  onChange: (status: CredentialingStatus) => void;
}) {
  const colors = statusColors(status);

  return (
    <select
      value={value}
      onChange={(e) =>
        onChange(
          e.target.value as CredentialingStatus
        )
      }
      className="credentialing-status"
      style={{
        '--status-color': colors.color,
        '--status-background': colors.background,
      } as React.CSSProperties}
      aria-label="Credentialing status"
    >
      {STATUS_OPTIONS.map((option) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

function CredentialingSkeleton() {
  return (
    <div className="credentialing-skeleton">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="credentialing-skeleton-row"
        >
          <div className="credentialing-skeleton-payer">
            <div className="credentialing-skeleton-icon" />

            <div className="credentialing-skeleton-lines">
              <div />
              <div />
            </div>
          </div>

          <div className="credentialing-skeleton-line medium" />
          <div className="credentialing-skeleton-line large" />
          <div className="credentialing-skeleton-line short" />
          <div className="credentialing-skeleton-line short" />
          <div className="credentialing-skeleton-line medium" />
        </div>
      ))}
    </div>
  );
}