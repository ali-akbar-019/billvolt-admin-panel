import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Plus,
  ClipboardCheck,
  ShieldAlert,
  Eye,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ProviderFormModal } from '../components/ProviderFormModal';
import { CredentialingFormModal } from '../components/CredentialingFormModal';
import { STATUS_OPTIONS, statusColors } from '../constants/credentialing';
import type { Provider, CredentialingRecord, CredentialingStatus } from '../types';

type Tab = 'overview' | 'payers' | 'sensitive';

const TABS: { id: Tab; label: string; adminOnly?: boolean }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'payers', label: 'Payer records' },
  { id: 'sensitive', label: 'Sensitive data', adminOnly: true },
];

const statusBadge = (status: string) => ({
  background: status === 'active' ? 'var(--status-approved-tint)' : 'var(--status-not-started-tint)',
  color: status === 'active' ? 'var(--status-approved)' : 'var(--text-secondary)',
});

export function ProviderWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [showEdit, setShowEdit] = useState(false);

  const [records, setRecords] = useState<CredentialingRecord[]>([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [modalRecord, setModalRecord] = useState<CredentialingRecord | null | 'new'>(null);

  const [sensitive, setSensitive] = useState<{ ssn?: string | null; caqh?: { username?: string | null; password?: string | null } } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [isLoadingSensitive, setIsLoadingSensitive] = useState(false);

  const fetchProvider = () => {
    if (!id) return;
    setIsLoading(true);
    apiClient
      .get(`/providers/${id}`)
      .then((res) => setProvider(res.data.provider))
      .catch(() => {
        showToast('Could not load that provider', 'error');
        navigate('/providers');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(fetchProvider, [id]);

  useEffect(() => {
    if (tab !== 'payers' || recordsLoaded || !id) return;
    apiClient
      .get('/credentialing', { params: { providerId: id, limit: 100 } })
      .then((res) => setRecords(res.data.records))
      .catch(() => showToast('Could not load payer records', 'error'))
      .finally(() => setRecordsLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, id]);

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

  const loadSensitive = async () => {
    if (!id || isLoadingSensitive) return;
    setIsLoadingSensitive(true);
    try {
      const res = await apiClient.get(`/providers/${id}/sensitive`);
      setSensitive(res.data);
      setRevealed(true);
      showToast('Sensitive data loaded — access was audit logged');
    } catch {
      showToast('Could not load sensitive data', 'error');
    } finally {
      setIsLoadingSensitive(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-small)' }}>Loading provider…</div>;
  }

  if (!provider) return null;

  const practiceName = typeof provider.practiceId === 'object' ? provider.practiceId.groupName : '—';

  return (
    <div>
      <Link
        to="/providers"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 16 }}
      >
        <ArrowLeft size={15} /> All providers
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'var(--fs-page-title)', margin: 0 }}>{provider.name}</h1>
            <span style={{ ...badgeStyle, ...statusBadge(provider.status) }}>{provider.status}</span>
          </div>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: 0 }}>
            {[provider.providerType && `Type ${provider.providerType}`, provider.npi && `NPI ${provider.npi}`,
              provider.specialty && provider.specialty, practiceName !== '—' && `at ${practiceName}`]
              .filter(Boolean)
              .join(' · ') || 'No identifiers on file'}
          </p>
        </div>
        <button onClick={() => setShowEdit(true)} style={editButtonStyle}>
          <Pencil size={15} /> Edit
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.filter((t) => !t.adminOnly || isAdmin).map(({ id: tabId, label }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 14.5, fontWeight: 600,
              color: tab === tabId ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: tab === tabId ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <InfoCard title="Identity">
            <InfoRow label="Full name" value={provider.name} />
            <InfoRow label="Provider type" value={provider.providerType} />
            <InfoRow label="Individual NPI" value={provider.npi} />
            <InfoRow label="Specialty" value={provider.specialty} />
            <InfoRow label="Secondary specialty" value={provider.secondarySpecialty} />
            <InfoRow label="Taxonomy" value={provider.taxonomy} />
          </InfoCard>

          <InfoCard title="Practice & contact">
            <InfoRow label="Practice" value={practiceName} />
            <InfoRow label="Phone" value={provider.contact?.phone} />
            <InfoRow label="Email" value={provider.contact?.email} />
            <InfoRow label="Home address" value={[provider.homeAddress?.city, provider.homeAddress?.state].filter(Boolean).join(', ')} />
          </InfoCard>

          <InfoCard title="CAQH profile">
            <InfoRow label="CAQH ID" value={provider.caqh?.caqhId} />
            <InfoRow label="Attestation status" value={provider.caqh?.status?.replace(/_/g, ' ')} />
            <InfoRow label="Last attested" value={provider.caqh?.lastAttestedDate ? new Date(provider.caqh.lastAttestedDate).toLocaleDateString() : undefined} />
            <InfoRow label="Next attestation due" value={provider.caqh?.nextAttestationDue ? new Date(provider.caqh.nextAttestationDue).toLocaleDateString() : undefined} />
          </InfoCard>

          <InfoCard title="Licenses">
            {provider.licenses && provider.licenses.length > 0 ? (
              provider.licenses.map((l, i) => (
                <LicenseRow key={i} type={l.type} number={l.number} state={l.state} expirationDate={l.expirationDate} status={l.status} />
              ))
            ) : (
              <InfoRow label="Licenses" value="None on file" />
            )}
          </InfoCard>

          <InfoCard title="DEA registrations">
            {provider.deaRegistrations && provider.deaRegistrations.length > 0 ? (
              provider.deaRegistrations.map((d, i) => (
                <InfoRow key={i} label={`DEA · ${d.state || '—'}`} value={`${d.number || '—'}${d.expirationDate ? ` · exp ${new Date(d.expirationDate).toLocaleDateString()}` : ''}`} />
              ))
            ) : (
              <InfoRow label="DEA registrations" value="None on file" />
            )}
          </InfoCard>

          <div className="surface-card" style={{ padding: 20 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 14px' }}>
              Record meta
            </p>
            <InfoRow label="Created" value={new Date(provider.createdAt).toLocaleDateString()} />
            <InfoRow label="Last updated" value={new Date(provider.updatedAt).toLocaleString()} />
          </div>
        </div>
      )}

      {tab === 'payers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', margin: 0 }}>
              {recordsLoaded ? `${records.length} payer record${records.length === 1 ? '' : 's'}` : 'Loading…'} for {provider.name}
            </p>
            <button onClick={() => setModalRecord('new')} style={addButtonStyle}>
              <Plus size={15} /> Add payer record
            </button>
          </div>

          {!recordsLoaded ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-small)' }}>
              Loading payer records…
            </div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <ClipboardCheck size={26} strokeWidth={1.75} />
              </div>
              <p style={{ fontSize: 17, fontWeight: 600, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>No payer records yet</p>
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: 0 }}>
                Add a payer record to start tracking {provider.name.split(' ')[0]}'s credentialing status.
              </p>
            </div>
          ) : (
            <div className="surface-card" style={{ overflow: 'hidden' }}>
              <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5, minWidth: 560 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Payer', 'Status', 'Submitted', 'Expiration', 'Updated', ''].map((h) => (
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
                        <td style={{ padding: '14px 20px' }}>
                          <select
                            value={r.status}
                            onChange={(e) => handleInlineStatusChange(r, e.target.value as CredentialingStatus)}
                            className="status-select"
                            style={{ ...badgeStyle, ...statusColors(r.status), border: 'none' }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                          {r.submittedDate ? new Date(r.submittedDate).toLocaleDateString() : '—'}
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
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}
                          >
                            Edit
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

      {tab === 'sensitive' && isAdmin && (
        <div className="surface-card" style={{ padding: 24, maxWidth: 560 }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>
            <ShieldAlert size={17} style={{ color: 'var(--status-denied)' }} /> Sensitive fields
          </p>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.6 }}>
            SSN and CAQH credentials are encrypted at rest. Each reveal is written to the audit log.
          </p>

          {!revealed ? (
            <button onClick={loadSensitive} disabled={isLoadingSensitive} style={{ ...addButtonStyle, marginTop: 4 }}>
              <Eye size={15} /> {isLoadingSensitive ? 'Loading…' : 'Reveal sensitive data'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 6px' }}>
                  SSN
                </p>
                <p style={{ fontSize: 15, margin: 0, fontFamily: 'var(--font-body)' }}>{sensitive?.ssn || 'Not on file'}</p>
              </div>
              <div>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 6px' }}>
                  CAQH username
                </p>
                <p style={{ fontSize: 15, margin: 0 }}>{sensitive?.caqh?.username || 'Not on file'}</p>
              </div>
              <div>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 6px' }}>
                  CAQH password
                </p>
                <p style={{ fontSize: 15, margin: 0 }}>{sensitive?.caqh?.password || 'Not on file'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {showEdit && (
        <ProviderFormModal
          provider={provider}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setProvider(updated)}
        />
      )}

      {modalRecord && (
        <CredentialingFormModal
          record={modalRecord === 'new' ? null : modalRecord}
          defaultProviderId={provider._id}
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
      <span style={{ color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right', textTransform: 'capitalize' }}>{value || '—'}</span>
    </div>
  );
}

function LicenseRow({ type, number, state, expirationDate, status }: {
  type?: string; number?: string; state?: string; expirationDate?: string; status?: string;
}) {
  const color = status === 'active' ? 'var(--status-approved)' : status === 'expired' ? 'var(--status-denied)' : 'var(--status-in-progress)';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 'var(--fs-small)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
        {type || 'License'} {state ? `· ${state}` : ''}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>
        {number || '—'}
        {status && (
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        )}
        {expirationDate && <span style={{ color: 'var(--text-muted)' }}>exp {new Date(expirationDate).toLocaleDateString()}</span>}
      </span>
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