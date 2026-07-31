import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { Provider, Practice } from '../types';

interface ProviderFormModalProps {
  provider?: Provider | null;
  defaultPracticeId?: string;
  onClose: () => void;
  onSaved: (provider: Provider) => void;
}

const PROVIDER_TYPES = ['MD', 'DO', 'NP', 'PA', 'DPM', 'DDS', 'Other'];

export function ProviderFormModal({ provider, defaultPracticeId, onClose, onSaved }: ProviderFormModalProps) {
  const isEdit = Boolean(provider);
  const { showToast } = useToast();

  const [practices, setPractices] = useState<Practice[]>([]);
  const currentPracticeId = typeof provider?.practiceId === 'object' ? provider.practiceId._id : provider?.practiceId;

  const [name, setName] = useState(provider?.name || '');
  const [providerType, setProviderType] = useState(provider?.providerType || '');
  const [npi, setNpi] = useState(provider?.npi || '');
  const [specialty, setSpecialty] = useState(provider?.specialty || '');
  const [practiceId, setPracticeId] = useState(currentPracticeId || defaultPracticeId || '');
  const [phone, setPhone] = useState(provider?.contact?.phone || '');
  const [email, setEmail] = useState(provider?.contact?.email || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(provider?.status || 'active');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    apiClient
      .get('/practices', { params: { status: 'active', limit: 100 } })
      .then((res) => setPractices(res.data.practices))
      .catch(() => showToast('Could not load practices for the dropdown', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!practiceId) {
      setError('Select a practice for this provider.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name,
      providerType: providerType || undefined,
      npi: npi || undefined,
      specialty: specialty || undefined,
      practiceId,
      contact: { phone: phone || undefined, email: email || undefined },
      ...(isEdit ? { status } : {}),
    };

    try {
      const res = isEdit
        ? await apiClient.patch(`/providers/${provider!._id}`, payload)
        : await apiClient.post('/providers', payload);
      onSaved(res.data.provider);
      showToast(isEdit ? 'Provider updated' : `${name} was added`);
      onClose();
    } catch (err: any) {
      const details = err?.response?.data?.details;
      setError(details?.[0]?.message || err?.response?.data?.error || 'Could not save the provider.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(11,14,26,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="surface-card"
        style={{ width: 520, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 'var(--fs-section-title)', margin: 0 }}>
            {isEdit ? 'Edit provider' : 'Add provider'}
          </h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Full name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Dr. Sarah Khan" />
          </div>

          <div>
            <label style={labelStyle}>Practice *</label>
            <select required value={practiceId} onChange={(e) => setPracticeId(e.target.value)} style={inputStyle}>
              <option value="">Select a practice…</option>
              {practices.map((p) => (
                <option key={p._id} value={p._id}>{p.groupName}</option>
              ))}
            </select>
            {practices.length === 0 && (
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                No active practices yet — add one first from the Practices page.
              </p>
            )}
          </div>

          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Provider type</label>
              <select value={providerType} onChange={(e) => setProviderType(e.target.value)} style={inputStyle}>
                <option value="">Select…</option>
                {PROVIDER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Individual NPI</label>
              <input value={npi} onChange={(e) => setNpi(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Specialty</label>
            <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={inputStyle} placeholder="Internal Medicine" />
          </div>

          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {isEdit && (
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')} style={inputStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
            Licenses, DEA registrations, SSN, and CAQH credentials are added from the provider's own page once it's built.
          </p>

          {error && <p style={{ fontSize: 13.5, color: 'var(--status-denied)', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={isSubmitting} style={buttonStyle(isSubmitting)}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add provider'}
          </button>
        </form>
      </div>
    </div>
  );
}

const rowStyle: React.CSSProperties = { display: 'flex', gap: 12 };

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: 14.5,
  border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)',
  outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
};

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '12px', fontSize: 14.5, fontWeight: 600, color: '#fff',
  background: disabled ? 'var(--text-muted)' : 'var(--accent)', border: 'none',
  borderRadius: 'var(--radius)', cursor: disabled ? 'not-allowed' : 'pointer', marginTop: 4,
});
