import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Building2, UserRound, ClipboardCheck, FileText, Clock } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { PracticeFormModal } from '../components/PracticeFormModal';
import { ProviderFormModal } from '../components/ProviderFormModal';
import { CredentialingFormModal } from '../components/CredentialingFormModal';
import { STATUS_OPTIONS, statusColors } from '../constants/credentialing';
import type { Practice, Provider, CredentialingRecord, CredentialingStatus } from '../types';

type Tab = 'info' | 'providers' | 'payers' | 'documents';

const TABS: { id: Tab; label: string; icon: typeof ClipboardCheck }[] = [
  { id: 'info', label: 'Practice info', icon: Building2 },
  { id: 'providers', label: 'Providers', icon: UserRound },
  { id: 'payers', label: 'Payer grid', icon: ClipboardCheck },
  { id: 'documents', label: 'Documents', icon: FileText },
];

const statusBadge = (status: string) => ({
  background: status === 'active' ? 'var(--status-approved-tint)' : 'var(--status-not-started-tint)',
  color: status === 'active' ? 'var(--status-approved)' : 'var(--text-secondary)',
});

export function PracticeWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [practice, setPractice] = useState<Practice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('info');
  const [showEdit, setShowEdit] = useState(false);

  const [records, setRecords] = useState<CredentialingRecord[]>([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [modalRecord, setModalRecord] = useState<CredentialingRecord | null | 'new'>(null);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [modalProvider, setModalProvider] = useState<Provider | null | 'new'>(null);

  const fetchPractice = () => {
    if (!id) return;
    setIsLoading(true);
    apiClient
      .get(`/practices/${id}`)
      .then((res) => setPractice(res.data.practice))
      .catch(() => {
        showToast('Could not load that practice', 'error');
        navigate('/practices');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(fetchPractice, [id]);

  useEffect(() => {
    if (tab !== 'payers' || recordsLoaded || !id) return;
    apiClient
      .get('/credentialing', { params: { practiceId: id, limit: 100 } })
      .then((res) => setRecords(res.data.records))
      .catch(() => showToast('Could not load the payer grid', 'error'))
      .finally(() => setRecordsLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, id]);

  useEffect(() => {
    if (tab !== 'providers' || providersLoaded || !id) return;
    apiClient
      .get('/providers', { params: { practiceId: id, limit: 100 } })
      .then((res) => setProviders(res.data.providers))
      .catch(() => showToast('Could not load providers for this practice', 'error'))
      .finally(() => setProvidersLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, id]);

  const handleProviderSaved = (provider: Provider) => {
    setProviders((prev) => {
      const exists = prev.some((p) => p._id === provider._id);
      return exists ? prev.map((p) => (p._id === provider._id ? provider : p)) : [provider, ...prev];
    });
  };

  const handleRecordSaved = (record: CredentialingRecord) => {
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
      handleRecordSaved(res.data.record);
    } catch {
      setRecords(prevRecords);
      showToast('Could not update status', 'error');
    }
  };

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-small)' }}>Loading practice…</div>;
  }

  if (!practice) return null;

  const primaryLoc = practice.serviceLocations?.find((l) => l.isPrimary) || practice.serviceLocations?.[0];

  return (
    <div>
      <Link
        to="/practices"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 16 }}
      >
        <ArrowLeft size={15} /> All practices
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'var(--fs-page-title)', margin: 0 }}>{practice.groupName}</h1>
            <span style={{ ...badgeStyle, ...statusBadge(practice.status) }}>{practice.status}</span>
          </div>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: 0 }}>
            {[practice.dbaName && `DBA ${practice.dbaName}`, practice.groupNpi && `NPI ${practice.groupNpi}`]
              .filter(Boolean)
              .join(' · ') || 'No additional identifiers on file'}
          </p>
        </div>
        <button onClick={() => setShowEdit(true)} style={editButtonStyle}>
          <Pencil size={15} /> Edit
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 14.5, fontWeight: 600,
              color: tab === tabId ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: tab === tabId ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <InfoCard title="Identifiers">
            <InfoRow label="Group name" value={practice.groupName} />
            <InfoRow label="DBA name" value={practice.dbaName} />
            <InfoRow label="Group NPI" value={practice.groupNpi} />
            <InfoRow label="Tax ID / EIN" value={practice.taxId} />
            <InfoRow label="Org type" value={practice.orgType} />
            <InfoRow label="Taxonomy" value={practice.taxonomy} />
          </InfoCard>

          <InfoCard title="Payer identifiers">
            <InfoRow label="CLIA #" value={practice.cliaNumber} />
            <InfoRow label="Medicare PTAN" value={practice.medicarePtan} />
            <InfoRow label="Medicaid provider #" value={practice.medicaidProviderNumber} />
          </InfoCard>

          <InfoCard title="Contact">
            <InfoRow label="Phone" value={practice.contact?.phone} />
            <InfoRow label="Fax" value={practice.contact?.fax} />
            <InfoRow label="Email" value={practice.contact?.email} />
            <InfoRow label="Website" value={practice.contact?.website} />
          </InfoCard>

          <InfoCard title="Primary location">
            <InfoRow label="Street" value={primaryLoc?.street} />
            <InfoRow label="City" value={primaryLoc?.city} />
            <InfoRow label="State" value={primaryLoc?.state} />
            <InfoRow label="ZIP" value={primaryLoc?.zip} />
          </InfoCard>

          {practice.notes && (
            <div className="surface-card" style={{ padding: 20, gridColumn: '1 / -1' }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 10px' }}>
                Notes
              </p>
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                {practice.notes}
              </p>
            </div>
          )}

          <div className="surface-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>
            <Clock size={14} />
            Last updated {new Date(practice.updatedAt).toLocaleString()}
          </div>
        </div>
      )}

      {tab === 'providers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button onClick={() => setModalProvider('new')} style={addButtonStyle}>
              <Plus size={15} /> Add provider
            </button>
          </div>

          {!providersLoaded ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-small)' }}>
              Loading providers…
            </div>
          ) : providers.length === 0 ? (
            <EmptyTab
              icon={UserRound}
              title="No providers yet"
              description="Add the physicians and clinicians who work at this practice."
            />
          ) : (
            <div className="surface-card" style={{ overflow: 'hidden' }}>
              <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5, minWidth: 560 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Name', 'NPI', 'Specialty', 'Status', ''].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map((p) => (
                      <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{p.npi || '—'}</td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{p.specialty || '—'}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ ...payerBadgeStyle, ...statusBadge(p.status) }}>{p.status}</span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => setModalProvider(p)}
                            aria-label={`Edit ${p.name}`}
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
            </div>
          )}
        </div>
      )}

      {tab === 'payers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button onClick={() => setModalRecord('new')} style={addButtonStyle}>
              <Plus size={15} /> Add payer record
            </button>
          </div>

          {!recordsLoaded ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-small)' }}>
              Loading payer grid…
            </div>
          ) : records.length === 0 ? (
            <EmptyTab
              icon={ClipboardCheck}
              title="No payer records yet"
              description="Add a payer record for one of this practice's providers to start tracking credentialing status."
            />
          ) : (
            <div className="surface-card" style={{ overflow: 'hidden' }}>
              <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5, minWidth: 640 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Payer', 'Provider', 'Status', 'Expiration', 'Updated', ''].map((h) => (
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
                        <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                          {typeof r.providerId === 'object' ? r.providerId.name : '—'}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <select
                            value={r.status}
                            onChange={(e) => handleInlineStatusChange(r, e.target.value as CredentialingStatus)}
                            className="status-select"
                            style={{ ...payerBadgeStyle, ...statusColors(r.status), border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
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
            </div>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <EmptyTab
          icon={FileText}
          title="Document repository"
          description="Upload and version W-9s, licenses, and payer contracts here once document storage is scoped."
        />
      )}

      {showEdit && (
        <PracticeFormModal
          practice={practice}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setPractice(updated)}
        />
      )}

      {modalProvider && (
        <ProviderFormModal
          provider={modalProvider === 'new' ? null : modalProvider}
          defaultPracticeId={practice._id}
          onClose={() => setModalProvider(null)}
          onSaved={handleProviderSaved}
        />
      )}

      {modalRecord && (
        <CredentialingFormModal
          record={modalRecord === 'new' ? null : modalRecord}
          practiceId={practice._id}
          onClose={() => setModalRecord(null)}
          onSaved={handleRecordSaved}
        />
      )}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface-card" style={{ padding: 20 }}>
      <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 14px' }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 'var(--fs-small)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

function EmptyTab({ icon: Icon, title, description }: { icon: typeof ClipboardCheck; title: string; description: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={26} strokeWidth={1.75} />
      </div>
      <p style={{ fontSize: 17, fontWeight: 600, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>{title}</p>
      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: 0, maxWidth: 360, marginInline: 'auto' }}>
        {description}
      </p>
    </div>
  );
}

const badgeStyle: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 600, padding: '4px 12px', borderRadius: 20, textTransform: 'capitalize',
};

const editButtonStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', color: 'var(--text-secondary)',
  border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '10px 16px',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

const addButtonStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent)', color: '#fff',
  border: 'none', borderRadius: 'var(--radius)', padding: '9px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

const payerBadgeStyle: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
};
