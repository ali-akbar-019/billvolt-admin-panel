import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, Building2, Pencil } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { PracticeFormModal } from '../components/PracticeFormModal';
import type { Practice } from '../types';

const statusBadge = (status: string) => ({
  background: status === 'active' ? 'var(--status-approved-tint)' : 'var(--status-not-started-tint)',
  color: status === 'active' ? 'var(--status-approved)' : 'var(--text-secondary)',
});

const badgeStyle: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 600, padding: '4px 12px', borderRadius: 20, textTransform: 'capitalize', display: 'inline-block',
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

  const [modalPractice, setModalPractice] = useState<Practice | null | 'new'>(null);

  const fetchPractices = () => {
    setIsLoading(true);
    apiClient
      .get('/practices', { params: { q: search || undefined, status: status || undefined, page, limit: 12 } })
      .then((res) => {
        setPractices(res.data.practices);
        setPages(res.data.pagination.pages || 1);
        setTotal(res.data.pagination.total || 0);
      })
      .catch(() => showToast('Could not load practices', 'error'))
      .finally(() => setIsLoading(false));
  };

  useEffect(fetchPractices, [page, status]);

  // Debounce free-text search
  useEffect(() => {
    setPage(1);
    const timeout = setTimeout(fetchPractices, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSaved = (practice: Practice) => {
    setPractices((prev) => {
      const exists = prev.some((p) => p._id === practice._id);
      return exists ? prev.map((p) => (p._id === practice._id ? practice : p)) : [practice, ...prev];
    });
  };

  const primaryLocation = (p: Practice) => {
    const loc = p.serviceLocations?.find((l) => l.isPrimary) || p.serviceLocations?.[0];
    if (!loc || (!loc.city && !loc.state)) return '—';
    return [loc.city, loc.state].filter(Boolean).join(', ');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-page-title)', margin: '0 0 6px' }}>Practices</h1>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: 0 }}>
            {total} practice{total === 1 ? '' : 's'} on file.
          </p>
        </div>
        <button onClick={() => setModalPractice('new')} style={primaryButtonStyle}>
          <Plus size={16} /> Add practice
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, DBA, NPI, or tax ID…"
            style={{ ...searchInputStyle, paddingLeft: 36 }}
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="surface-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-small)' }}>
            Loading practices…
          </div>
        ) : practices.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <Building2 size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>No practices yet</p>
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: 0 }}>
              {search || status ? 'Try a different search or filter.' : 'Add your first practice to get started.'}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5, minWidth: 720 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Group name', 'DBA', 'NPI', 'Location', 'Status', 'Updated', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {practices.map((p) => (
                  <tr
                    key={p._id}
                    onClick={() => navigate(`/practices/${p._id}`)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 600 }}>{p.groupName}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{p.dbaName || '—'}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{p.groupNpi || '—'}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{primaryLocation(p)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ ...badgeStyle, ...statusBadge(p.status) }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setModalPractice(p); }}
                        aria-label={`Quick edit ${p.groupName}`}
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
