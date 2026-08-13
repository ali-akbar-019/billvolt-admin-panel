import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X, Clock, Plus, CalendarDays, UserRound, ShieldCheck } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { STATUS_OPTIONS } from '../constants/credentialing';
import type {
  CredentialingRecord,
  Provider,
  CredentialingStatus,
} from '../types';

interface TimelineEntry {
  _id: string;
  activityType: string;
  notes: string;
  createdAt: string;
  userId?: {
    _id: string;
    name: string;
  };
}

interface CredentialingFormModalProps {
  record?: CredentialingRecord | null;
  practiceId?: string;
  defaultProviderId?: string;
  onClose: () => void;
  onSaved: (record: CredentialingRecord) => void;
}

export function CredentialingFormModal({
  record,
  practiceId,
  defaultProviderId,
  onClose,
  onSaved,
}: CredentialingFormModalProps) {
  const isEdit = Boolean(record);
  const { showToast } = useToast();

  const currentProviderId =
    typeof record?.providerId === 'object'
      ? record.providerId._id
      : record?.providerId;

  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState(
    currentProviderId || defaultProviderId || ''
  );

  const [payerName, setPayerName] = useState(record?.payerName || '');

  const [status, setStatus] = useState<CredentialingStatus>(
    record?.status || 'not_started'
  );

  const [submittedDate, setSubmittedDate] = useState(
    record?.submittedDate?.slice(0, 10) || ''
  );

  const [expirationDate, setExpirationDate] = useState(
    record?.expirationDate?.slice(0, 10) || ''
  );

  const [nextFollowUpDate, setNextFollowUpDate] = useState(
    record?.nextFollowUpDate?.slice(0, 10) || ''
  );

  const [notes, setNotes] = useState(record?.notes || '');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    if (!isEdit || !record) return;

    apiClient
      .get('/timeline', {
        params: {
          credentialingRecordId: record._id,
        },
      })
      .then((res) => setTimeline(res.data.entries))
      .catch(() =>
        showToast('Could not load the activity timeline', 'error')
      );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?._id]);

  useEffect(() => {
    apiClient
      .get('/providers', {
        params: {
          practiceId: practiceId || undefined,
          status: 'active',
          limit: 100,
        },
      })
      .then((res) => setProviders(res.data.providers))
      .catch(() =>
        showToast('Could not load providers for the dropdown', 'error')
      );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceId]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!providerId) {
      setError('Select a provider for this payer record.');
      return;
    }

    if (!payerName.trim()) {
      setError('Enter a payer name.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      providerId,
      payerName: payerName.trim(),
      status,
      submittedDate: submittedDate || undefined,
      expirationDate: expirationDate || undefined,

      // Explicit null clears an existing follow-up task.
      nextFollowUpDate:
        nextFollowUpDate ||
        (isEdit && record?.nextFollowUpDate ? null : undefined),

      notes: notes.trim() || undefined,
    };

    try {
      const res = isEdit
        ? await apiClient.patch(
          `/credentialing/${record!._id}`,
          payload
        )
        : await apiClient.post('/credentialing', payload);

      onSaved(res.data.record);

      showToast(
        isEdit
          ? 'Payer record updated'
          : `${payerName.trim()} record added`
      );

      onClose();
    } catch (err: any) {
      const details = err?.response?.data?.details;

      setError(
        details?.[0]?.message ||
        err?.response?.data?.error ||
        'Could not save the record.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>
        {`
          .credential-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 120;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(11, 14, 26, 0.46);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            animation: credentialModalFade 160ms ease-out;
          }

          .credential-modal {
            width: 520px;
            max-width: 100%;
            max-height: min(760px, calc(100dvh - 40px));
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: 14px;
            box-shadow:
              0 24px 70px rgba(16, 22, 43, 0.18),
              0 4px 18px rgba(16, 22, 43, 0.08);
            animation: credentialModalSlide 180ms ease-out;
          }

          .credential-modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            padding: 20px 22px 18px;
            border-bottom: 1px solid var(--border);
            flex-shrink: 0;
          }

          .credential-modal-title-wrap {
            min-width: 0;
          }

          .credential-modal-eyebrow {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 5px;
            color: var(--accent);
            font-size: 10px;
            line-height: 1;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .credential-modal-title {
            margin: 0;
            color: var(--text-primary);
            font-size: 19px;
            line-height: 1.25;
            font-weight: 650;
            letter-spacing: -0.02em;
          }

          .credential-modal-subtitle {
            margin: 5px 0 0;
            color: var(--text-muted);
            font-size: 12.5px;
            line-height: 1.45;
          }

          .credential-modal-close {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border: 1px solid var(--border);
            border-radius: 8px;
            background: var(--bg-surface);
            color: var(--text-muted);
            cursor: pointer;
            transition:
              background 0.15s ease,
              color 0.15s ease,
              border-color 0.15s ease;
          }

          .credential-modal-close:hover {
            background: var(--bg-subtle);
            border-color: var(--border-strong);
            color: var(--text-primary);
          }

          .credential-modal-body {
            overflow-y: auto;
            padding: 22px;
            scrollbar-width: thin;
            scrollbar-color: var(--border-strong) transparent;
          }

          .credential-modal-body::-webkit-scrollbar {
            width: 5px;
          }

          .credential-modal-body::-webkit-scrollbar-track {
            background: transparent;
          }

          .credential-modal-body::-webkit-scrollbar-thumb {
            background: var(--border-strong);
            border-radius: 10px;
          }

          .credential-form {
            display: flex;
            flex-direction: column;
            gap: 17px;
          }

          .credential-field {
            min-width: 0;
          }

          .credential-label {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-bottom: 7px;
            color: var(--text-secondary);
            font-size: 12.5px;
            line-height: 1.2;
            font-weight: 600;
          }

          .credential-required {
            color: var(--status-denied);
          }

          .credential-hint {
            margin: 6px 0 0;
            color: var(--text-muted);
            font-size: 11.5px;
            line-height: 1.45;
          }

          .credential-date-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .credential-section {
            padding-top: 20px;
            margin-top: 2px;
            border-top: 1px solid var(--border);
          }

          .credential-section-title {
            display: flex;
            align-items: center;
            gap: 7px;
            margin: 0 0 13px;
            color: var(--text-secondary);
            font-size: 11.5px;
            line-height: 1;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.055em;
          }

          .credential-note-row {
            display: flex;
            gap: 8px;
          }

          .credential-note-row .input-control {
            flex: 1;
            min-width: 0;
          }

          .credential-log-button {
            min-width: 72px;
            border: 0;
            border-radius: var(--radius);
            background: var(--accent);
            color: #fff;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.15s ease;
          }

          .credential-log-button:hover:not(:disabled) {
            opacity: 0.9;
          }

          .credential-log-button:disabled {
            background: var(--text-muted);
            cursor: not-allowed;
          }

          .credential-timeline {
            display: flex;
            flex-direction: column;
            gap: 0;
            max-height: 230px;
            overflow-y: auto;
            margin-top: 14px;
            padding-right: 3px;
          }

          .credential-timeline::-webkit-scrollbar {
            width: 4px;
          }

          .credential-timeline::-webkit-scrollbar-thumb {
            background: var(--border-strong);
            border-radius: 10px;
          }

          .credential-timeline-entry {
            position: relative;
            padding: 0 0 17px 18px;
          }

          .credential-timeline-entry::before {
            content: '';
            position: absolute;
            left: 4px;
            top: 4px;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--accent);
            box-shadow: 0 0 0 3px var(--accent-tint);
          }

          .credential-timeline-entry::after {
            content: '';
            position: absolute;
            left: 7px;
            top: 14px;
            bottom: 0;
            width: 1px;
            background: var(--border);
          }

          .credential-timeline-entry:last-child {
            padding-bottom: 0;
          }

          .credential-timeline-entry:last-child::after {
            display: none;
          }

          .credential-timeline-note {
            margin: 0 0 4px;
            color: var(--text-primary);
            font-size: 13px;
            line-height: 1.5;
          }

          .credential-timeline-meta {
            margin: 0;
            color: var(--text-muted);
            font-size: 11px;
            line-height: 1.4;
          }

          .credential-empty {
            padding: 12px;
            border: 1px dashed var(--border);
            border-radius: 8px;
            color: var(--text-muted);
            font-size: 12px;
            text-align: center;
          }

          .credential-error {
            padding: 10px 12px;
            border: 1px solid rgba(220, 38, 38, 0.18);
            border-radius: 8px;
            background: var(--status-denied-tint);
            color: var(--status-denied);
            font-size: 12.5px;
            line-height: 1.45;
          }

          .credential-submit {
            width: 100%;
            min-height: 42px;
            margin-top: 2px;
            border: 0;
            border-radius: var(--radius);
            background: var(--accent);
            color: #fff;
            font-size: 13.5px;
            font-weight: 650;
            cursor: pointer;
            transition:
              opacity 0.15s ease,
              transform 0.15s ease;
          }

          .credential-submit:hover:not(:disabled) {
            opacity: 0.92;
          }

          .credential-submit:active:not(:disabled) {
            transform: translateY(1px);
          }

          .credential-submit:disabled {
            background: var(--text-muted);
            cursor: not-allowed;
          }

          @keyframes credentialModalFade {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes credentialModalSlide {
            from {
              opacity: 0;
              transform: translateY(8px) scale(0.985);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @media (max-width: 560px) {
            .credential-modal-overlay {
              align-items: flex-end;
              padding: 0;
            }

            .credential-modal {
              width: 100%;
              max-width: 100%;
              max-height: 94dvh;
              border-radius: 16px 16px 0 0;
              border-bottom: 0;
            }

            .credential-modal-header {
              padding: 17px 17px 15px;
            }

            .credential-modal-body {
              padding: 18px 17px 22px;
            }

            .credential-date-grid {
              grid-template-columns: 1fr;
            }

            .credential-note-row {
              align-items: stretch;
            }

            .credential-log-button {
              min-width: 64px;
            }
          }

          @media (max-width: 380px) {
            .credential-modal-title {
              font-size: 17px;
            }

            .credential-modal-subtitle {
              font-size: 11.5px;
            }

            .credential-modal-body {
              padding: 16px 14px 20px;
            }
          }
        `}
      </style>

      <div
        className="credential-modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="credentialing-modal-title"
      >
        <div
          className="credential-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="credential-modal-header">
            <div className="credential-modal-title-wrap">
              <div className="credential-modal-eyebrow">
                <ShieldCheck size={12} />
                Credentialing
              </div>

              <h2
                id="credentialing-modal-title"
                className="credential-modal-title"
              >
                {isEdit ? 'Edit payer record' : 'Add payer record'}
              </h2>

              <p className="credential-modal-subtitle">
                {isEdit
                  ? 'Update payer details, dates, status, or activity.'
                  : 'Create a credentialing record for a provider and payer.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="credential-modal-close"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="credential-modal-body">
            <form
              onSubmit={handleSubmit}
              className="credential-form"
            >
              {/* Provider */}
              <div className="credential-field">
                <label className="credential-label">
                  <UserRound size={13} />
                  Provider
                  <span className="credential-required">*</span>
                </label>

                <select
                  required
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="select-control"
                  disabled={isEdit}
                >
                  <option value="">Select a provider…</option>

                  {providers.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                {providers.length === 0 && (
                  <p className="credential-hint">
                    No active providers
                    {practiceId ? ' for this practice' : ''} yet — add one
                    first.
                  </p>
                )}
              </div>

              {/* Payer */}
              <div className="credential-field">
                <label className="credential-label">
                  Payer name
                  <span className="credential-required">*</span>
                </label>

                <input
                  required
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="input-control"
                  placeholder="Aetna, BCBS, Medicare…"
                />
              </div>

              {/* Status */}
              <div className="credential-field">
                <label className="credential-label">
                  Credentialing status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as CredentialingStatus
                    )
                  }
                  className="select-control"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="credential-field">
                <div className="credential-date-grid">
                  <div>
                    <label className="credential-label">
                      <CalendarDays size={13} />
                      Submitted date
                    </label>

                    <input
                      type="date"
                      value={submittedDate}
                      onChange={(e) =>
                        setSubmittedDate(e.target.value)
                      }
                      className="input-control"
                    />
                  </div>

                  <div>
                    <label className="credential-label">
                      <CalendarDays size={13} />
                      Expiration date
                    </label>

                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) =>
                        setExpirationDate(e.target.value)
                      }
                      className="input-control"
                    />
                  </div>
                </div>
              </div>

              {/* Follow-up */}
              <div className="credential-field">
                <label className="credential-label">
                  <Clock size={13} />
                  Next follow-up date
                </label>

                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) =>
                    setNextFollowUpDate(e.target.value)
                  }
                  className="input-control"
                />

                <p className="credential-hint">
                  Setting this creates a task on the Follow-ups page
                  automatically. Clear it to cancel the task.
                </p>
              </div>

              {/* Notes */}
              <div className="credential-field">
                <label className="credential-label">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-control"
                  placeholder="Add any relevant credentialing notes…"
                  style={{
                    minHeight: 78,
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="credential-error">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="credential-submit"
              >
                {isSubmitting
                  ? 'Saving…'
                  : isEdit
                    ? 'Save changes'
                    : 'Add payer record'}
              </button>
            </form>

            {/* Timeline */}
            {isEdit && (
              <div className="credential-section">
                <p className="credential-section-title">
                  <Clock size={13} />
                  Activity timeline
                </p>

                <div className="credential-note-row">
                  <input
                    value={newNote}
                    onChange={(e) =>
                      setNewNote(e.target.value)
                    }
                    placeholder="Log a call, email, or update…"
                    className="input-control"
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        !e.shiftKey
                      ) {
                        e.preventDefault();
                        handleAddNote();
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={
                      isAddingNote || !newNote.trim()
                    }
                    className="credential-log-button"
                  >
                    <Plus
                      size={14}
                      style={{
                        verticalAlign: 'middle',
                        marginRight: 3,
                      }}
                    />
                    Log
                  </button>
                </div>

                {timeline.length === 0 ? (
                  <div
                    className="credential-empty"
                    style={{ marginTop: 14 }}
                  >
                    No activity logged yet.
                  </div>
                ) : (
                  <div className="credential-timeline">
                    {timeline.map((entry) => (
                      <div
                        key={entry._id}
                        className="credential-timeline-entry"
                      >
                        <p className="credential-timeline-note">
                          {entry.notes}
                        </p>

                        <p className="credential-timeline-meta">
                          {entry.userId?.name || 'Unknown'} ·{' '}
                          {new Date(
                            entry.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}