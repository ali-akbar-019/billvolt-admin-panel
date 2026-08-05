import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X, Clock } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { STATUS_OPTIONS } from '../constants/credentialing';
import type { CredentialingRecord, Provider, CredentialingStatus } from '../types';

interface TimelineEntry {
  _id: string;
  activityType: string;
  notes: string;
  createdAt: string;
  userId?: { _id: string; name: string };
}

interface CredentialingFormModalProps {
  record?: CredentialingRecord | null;
  practiceId?: string; // scopes the provider dropdown when opened from a Practice Workspace
  defaultProviderId?: string;
  onClose: () => void;
  onSaved: (record: CredentialingRecord) => void;
}

export function CredentialingFormModal({ record, practiceId, defaultProviderId, onClose, onSaved }: CredentialingFormModalProps) {
  const isEdit = Boolean(record);
  const { showToast } = useToast();

  const currentProviderId = typeof record?.providerId === 'object' ? record.providerId._id : record?.providerId;

  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState(currentProviderId || defaultProviderId || '');
  const [payerName, setPayerName] = useState(record?.payerName || '');
  const [status, setStatus] = useState<CredentialingStatus>(record?.status || 'not_started');
  const [submittedDate, setSubmittedDate] = useState(record?.submittedDate?.slice(0, 10) || '');
  const [expirationDate, setExpirationDate] = useState(record?.expirationDate?.slice(0, 10) || '');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(record?.nextFollowUpDate?.slice(0, 10) || '');
  const [notes, setNotes] = useState(record?.notes || '');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    if (!isEdit || !record) return;
    apiClient
      .get('/timeline', { params: { credentialingRecordId: record._id } })
      .then((res) => setTimeline(res.data.entries))
      .catch(() => showToast('Could not load the activity timeline', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?._id]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !record) return;
    setIsAddingNote(true);
    try {
      const res = await apiClient.post('/timeline', {
        credentialingRecordId: record._id,
        activityType: 'note',
        notes: newNote.trim(),
      });
      setTimeline((prev) => [res.data.entry, ...prev]);
      setNewNote('');
    } catch {
      showToast('Could not add that note', 'error');
    } finally {
      setIsAddingNote(false);
    }
  };

  useEffect(() => {
    apiClient
      .get('/providers', { params: { practiceId: practiceId || undefined, status: 'active', limit: 100 } })
      .then((res) => setProviders(res.data.providers))
      .catch(() => showToast('Could not load providers for the dropdown', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!providerId) {
      setError('Select a provider for this payer record.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      providerId,
      payerName,
      status,
      submittedDate: submittedDate || undefined,
      expirationDate: expirationDate || undefined,
      // Explicit null clears an existing follow-up task; omitted (undefined) leaves it untouched.
      nextFollowUpDate: nextFollowUpDate || (isEdit && record?.nextFollowUpDate ? null : undefined),
      notes: notes || undefined,
    };

    try {
      const res = isEdit
        ? await apiClient.patch(`/credentialing/${record!._id}`, payload)
        : await apiClient.post('/credentialing', payload);
      onSaved(res.data.record);
      showToast(isEdit ? 'Payer record updated' : `${payerName} record added`);
      onClose();
    } catch (err: any) {
      const details = err?.response?.data?.details;
      setError(details?.[0]?.message || err?.response?.data?.error || 'Could not save the record.');
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
        style={{ width: 480, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 'var(--fs-section-title)', margin: 0 }}>
            {isEdit ? 'Edit payer record' : 'Add payer record'}
          </h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Provider *</label>
            <select required value={providerId} onChange={(e) => setProviderId(e.target.value)} style={inputStyle} disabled={isEdit}>
              <option value="">Select a provider…</option>
              {providers.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            {providers.length === 0 && (
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                No active providers {practiceId ? 'for this practice' : ''} yet — add one first.
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Payer name *</label>
            <input required value={payerName} onChange={(e) => setPayerName(e.target.value)} style={inputStyle} placeholder="Aetna, BCBS, Medicare…" />
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as CredentialingStatus)} style={inputStyle}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Submitted date</label>
              <input type="date" value={submittedDate} onChange={(e) => setSubmittedDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Expiration date</label>
              <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Next follow-up date</label>
            <input type="date" value={nextFollowUpDate} onChange={(e) => setNextFollowUpDate(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 0' }}>
              Setting this creates a task on the Follow-ups page automatically. Clear it to cancel the task.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
          </div>

          {error && <p style={{ fontSize: 13.5, color: 'var(--status-denied)', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={isSubmitting} style={buttonStyle(isSubmitting)}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add record'}
          </button>
        </form>

        {isEdit && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 14px' }}>
              <Clock size={13} /> Activity timeline
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log a call, email, or update…"
                style={{ ...inputStyle, flex: 1 }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNote())}
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={isAddingNote || !newNote.trim()}
                style={{ ...buttonStyle(isAddingNote || !newNote.trim()), width: 'auto', padding: '0 16px', marginTop: 0 }}
              >
                Log
              </button>
            </div>

            {timeline.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>No activity logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 220, overflowY: 'auto' }}>
                {timeline.map((entry) => (
                  <div key={entry._id} style={{ fontSize: 13.5 }}>
                    <p style={{ margin: '0 0 2px', color: 'var(--text-primary)' }}>{entry.notes}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                      {entry.userId?.name || 'Unknown'} · {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
