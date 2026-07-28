import { useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { Practice } from '../types';

interface PracticeFormModalProps {
  practice?: Practice | null;
  onClose: () => void;
  onSaved: (practice: Practice) => void;
}

const ORG_TYPES = ['Group Practice', 'Solo Practice', 'Hospital', 'Billing Entity', 'Other'];

export function PracticeFormModal({ practice, onClose, onSaved }: PracticeFormModalProps) {
  const isEdit = Boolean(practice);
  const { showToast } = useToast();

  const primaryLoc = practice?.serviceLocations?.find((l) => l.isPrimary) || practice?.serviceLocations?.[0];

  const [groupName, setGroupName] = useState(practice?.groupName || '');
  const [dbaName, setDbaName] = useState(practice?.dbaName || '');
  const [groupNpi, setGroupNpi] = useState(practice?.groupNpi || '');
  const [taxId, setTaxId] = useState(practice?.taxId || '');
  const [orgType, setOrgType] = useState(practice?.orgType || '');
  const [phone, setPhone] = useState(practice?.contact?.phone || '');
  const [email, setEmail] = useState(practice?.contact?.email || '');
  const [street, setStreet] = useState(primaryLoc?.street || '');
  const [city, setCity] = useState(primaryLoc?.city || '');
  const [state, setState] = useState(primaryLoc?.state || '');
  const [zip, setZip] = useState(primaryLoc?.zip || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(practice?.status || 'active');
  const [notes, setNotes] = useState(practice?.notes || '');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      groupName,
      dbaName: dbaName || undefined,
      groupNpi: groupNpi || undefined,
      taxId: taxId || undefined,
      orgType: orgType || undefined,
      contact: { phone: phone || undefined, email: email || undefined },
      serviceLocations:
        street || city || state || zip
          ? [{ label: 'Primary', street, city, state, zip, isPrimary: true, active: true }]
          : undefined,
      notes: notes || undefined,
      ...(isEdit ? { status } : {}),
    };

    try {
      const res = isEdit
        ? await apiClient.patch(`/practices/${practice!._id}`, payload)
        : await apiClient.post('/practices', payload);
      onSaved(res.data.practice);
      showToast(isEdit ? 'Practice updated' : `${groupName} was added`);
      onClose();
    } catch (err: any) {
      const details = err?.response?.data?.details;
      setError(details?.[0]?.message || err?.response?.data?.error || 'Could not save the practice.');
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
        style={{ width: 560, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 'var(--fs-section-title)', margin: 0 }}>
            {isEdit ? 'Edit practice' : 'Add practice'}
          </h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Group name *</label>
            <input required value={groupName} onChange={(e) => setGroupName(e.target.value)} style={inputStyle} placeholder="Acme Medical Group" />
          </div>

          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>DBA name</label>
              <input value={dbaName} onChange={(e) => setDbaName(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Org type</label>
              <select value={orgType} onChange={(e) => setOrgType(e.target.value)} style={inputStyle}>
                <option value="">Select…</option>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Group NPI</label>
              <input value={groupNpi} onChange={(e) => setGroupNpi(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Tax ID / EIN</label>
              <input value={taxId} onChange={(e) => setTaxId(e.target.value)} style={inputStyle} />
            </div>
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

          <div>
            <label style={labelStyle}>Primary location — street</label>
            <input value={street} onChange={(e) => setStreet(e.target.value)} style={inputStyle} />
          </div>
          <div style={rowStyle}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>State</label>
              <input value={state} onChange={(e) => setState(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>ZIP</label>
              <input value={zip} onChange={(e) => setZip(e.target.value)} style={inputStyle} />
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

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
          </div>

          {error && <p style={{ fontSize: 13.5, color: 'var(--status-denied)', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={isSubmitting} style={buttonStyle(isSubmitting)}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add practice'}
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
