import { useEffect, useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, ClipboardCheck, Pencil } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { CredentialingFormModal } from '../components/CredentialingFormModal';
import { STATUS_OPTIONS, statusColors } from '../constants/credentialing';
import type { CredentialingRecord, CredentialingStatus } from '../types';

const badgeStyle: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 600, padding: '4px 12px', borderRadius: 20, display: 'inline-block',
};

export function CredentialingGrid() {
  const { showToast } = useToast();
  const [records, setRecords] = useState<CredentialingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modalRecord, setModalRecord] = useState<CredentialingRecord | null | 'new'>(null);

  const fetchRecords = () => {
    setIsLoading(true);
    apiClient
      .get('/credentialing', { params: { payerName: search || undefined, status: status || undefined, page, limit: 15 } })
      .then((res) => {
        setRecords(res.data.records);
        setPages(res.data.pagination.pages || 1);
        setTotal(res.data.pagination.total || 0);
      })
      .catch(() => showToast('Could not load the credentialing grid', 'error'))
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
      return exists ? prev.map((r) => (r._id === record._id ? record : r)) : [record, ...prev];
    });
  };

  const handleInlineStatusChange = async (record: CredentialingRecord, newStatus: CredentialingStatus) => {
    const prevRecords = records;
    setRecords((prev) => prev.map((r) => (r._id === record._id ? { ...r, status: newStatus } : r)));
    try {
      const res = await apiClient.patch(`/credentialing/${record._id}`, { status: newStatus });
      handleSaved(res.data.record);
    } catch {
      setRecords(prevRecords);
      showToast('Could not update status', 'error');
    }
  };

  const providerName = (r: CredentialingRecord) => (typeof r.providerId === 'object' ? r.providerId.name : '—');
  const practiceName = (r: CredentialingRecord) =>
    typeof r.providerId === 'object' ? r.providerId.practiceId?.groupName || '—' : '—';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-page-title)', margin: '0 0 6px' }}>Credentialing grid</h1>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: 0 }}>
            {total} payer record{total === 1 ? '' : 's'} across all providers.
          </p>
        </div>
        <button onClick={() => setModalRecord('new')} style={primaryButtonStyle}>
          <Plus size={16} /> Add payer record
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by payer name…"
            style={{ ...searchInputStyle, paddingLeft: 36 }}
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="surface-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-small)' }}>
            Loading credentialing records…
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <ClipboardCheck size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>No payer records yet</p>
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: 0 }}>
              {search || status ? 'Try a different search or filter.' : 'Add a payer record for a provider to get started.'}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5, minWidth: 820 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Payer', 'Provider', 'Practice', 'Status', 'Expiration', 'Updated', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600 }}>{r.payerName}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{providerName(r)}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{practiceName(r)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <select
                        value={r.status}
                        onChange={(e) => handleInlineStatusChange(r, e.target.value as CredentialingStatus)}
                        style={{ ...badgeStyle, ...statusColors(r.status), border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                      {r.expirationDate ? new Date(r.expirationDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                      {new Date(r.updatedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => setModalRecord(r)}
                        aria-label={`Edit ${r.payerName} record`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex' }}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 18 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={pagerButtonStyle(page <= 1)}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} style={pagerButtonStyle(page >= pages)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {modalRecord && (
        <CredentialingFormModal
          record={modalRecord === 'new' ? null : modalRecord}
          onClose={() => setModalRecord(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent)', color: '#fff',
  border: 'none', borderRadius: 'var(--radius)', padding: '11px 18px', fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
};

const searchInputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: 14.5,
  border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)',
  outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 14.5,
  border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)',
  outline: 'none', fontFamily: 'var(--font-body)', background: 'var(--bg-surface)', cursor: 'pointer',
};

const pagerButtonStyle = (disabled: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32,
  border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', background: 'var(--bg-surface)',
  color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
});
