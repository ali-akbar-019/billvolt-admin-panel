import { useState } from 'react';
import type { FormEvent } from 'react';
import { X, Building2, MapPin, Phone, FileText } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { Practice } from '../types';

interface PracticeFormModalProps {
  practice?: Practice | null;
  onClose: () => void;
  onSaved: (practice: Practice) => void;
}

const ORG_TYPES = [
  'Group Practice',
  'Solo Practice',
  'Hospital',
  'Billing Entity',
  'Other',
];

export function PracticeFormModal({
  practice,
  onClose,
  onSaved,
}: PracticeFormModalProps) {
  const isEdit = Boolean(practice);
  const { showToast } = useToast();

  const primaryLoc =
    practice?.serviceLocations?.find((l) => l.isPrimary) ||
    practice?.serviceLocations?.[0];

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

  const [status, setStatus] = useState<'active' | 'inactive'>(
    practice?.status || 'active',
  );

  const [notes, setNotes] = useState(practice?.notes || '');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!groupName.trim()) {
      setError('Practice group name is required.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      groupName: groupName.trim(),
      dbaName: dbaName.trim() || undefined,
      groupNpi: groupNpi.trim() || undefined,
      taxId: taxId.trim() || undefined,
      orgType: orgType || undefined,

      contact: {
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      },

      serviceLocations:
        street.trim() ||
          city.trim() ||
          state.trim() ||
          zip.trim()
          ? [
            {
              label: 'Primary',
              street: street.trim(),
              city: city.trim(),
              state: state.trim(),
              zip: zip.trim(),
              isPrimary: true,
              active: true,
            },
          ]
          : undefined,

      notes: notes.trim() || undefined,

      ...(isEdit ? { status } : {}),
    };

    try {
      const res = isEdit
        ? await apiClient.patch(`/practices/${practice!._id}`, payload)
        : await apiClient.post('/practices', payload);

      onSaved(res.data.practice);

      showToast(
        isEdit
          ? 'Practice updated successfully'
          : `${groupName.trim()} was added`,
      );

      onClose();
    } catch (err: any) {
      const details = err?.response?.data?.details;

      setError(
        details?.[0]?.message ||
        err?.response?.data?.error ||
        'Could not save the practice.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>
        {`
          .practice-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 100;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 20px;

            background: rgba(11, 14, 26, 0.46);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
          }

          .practice-modal {
            width: 600px;
            max-width: 100%;
            max-height: min(820px, calc(100dvh - 40px));

            display: flex;
            flex-direction: column;

            overflow: hidden;

            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: 14px;

            box-shadow:
              0 24px 70px rgba(11, 14, 26, 0.18),
              0 4px 14px rgba(11, 14, 26, 0.06);
          }

          .practice-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;

            padding: 20px 24px;

            border-bottom: 1px solid var(--border);

            flex-shrink: 0;
          }

          .practice-modal-heading {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .practice-modal-icon {
            width: 38px;
            height: 38px;

            display: flex;
            align-items: center;
            justify-content: center;

            flex-shrink: 0;

            border-radius: 9px;

            background: var(--accent-tint);
            color: var(--accent);
          }

          .practice-modal-title {
            margin: 0;

            font-family: var(--font-display);
            font-size: 18px;
            line-height: 1.25;
            font-weight: 650;

            letter-spacing: -0.02em;
            color: var(--text-primary);
          }

          .practice-modal-subtitle {
            margin: 3px 0 0;

            font-size: 12px;
            color: var(--text-muted);
          }

          .practice-modal-close {
            width: 32px;
            height: 32px;

            display: flex;
            align-items: center;
            justify-content: center;

            flex-shrink: 0;

            border: 1px solid transparent;
            border-radius: 7px;

            background: transparent;
            color: var(--text-muted);

            cursor: pointer;

            transition:
              background 0.15s ease,
              color 0.15s ease,
              border-color 0.15s ease;
          }

          .practice-modal-close:hover {
            background: var(--bg-subtle);
            border-color: var(--border);
            color: var(--text-primary);
          }

          .practice-modal-body {
            overflow-y: auto;
            padding: 24px;

            scrollbar-width: thin;
            scrollbar-color: var(--border) transparent;
          }

          .practice-modal-body::-webkit-scrollbar {
            width: 5px;
          }

          .practice-modal-body::-webkit-scrollbar-track {
            background: transparent;
          }

          .practice-modal-body::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 10px;
          }

          .practice-section {
            margin-bottom: 24px;
          }

          .practice-section:last-child {
            margin-bottom: 0;
          }

          .practice-section-heading {
            display: flex;
            align-items: center;
            gap: 7px;

            margin-bottom: 13px;

            font-size: 11px;
            font-weight: 700;

            color: var(--text-muted);

            text-transform: uppercase;
            letter-spacing: 0.075em;
          }

          .practice-section-heading svg {
            color: var(--accent);
          }

          .practice-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .practice-field-full {
            grid-column: 1 / -1;
          }

          .practice-field label {
            display: block;

            margin-bottom: 6px;

            font-size: 12.5px;
            font-weight: 550;

            color: var(--text-secondary);
          }

          .practice-field input,
          .practice-field select,
          .practice-field textarea {
            width: 100%;
            box-sizing: border-box;
          }

          .practice-field textarea {
            min-height: 82px;
            resize: vertical;
          }

          .practice-modal-error {
            margin: 0 0 16px;
            padding: 10px 12px;

            border: 1px solid color-mix(
              in srgb,
              var(--status-denied) 25%,
              transparent
            );
            border-radius: 7px;

            background: color-mix(
              in srgb,
              var(--status-denied) 7%,
              transparent
            );

            color: var(--status-denied);

            font-size: 13px;
            line-height: 1.45;
          }

          .practice-modal-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;

            padding: 15px 24px;

            border-top: 1px solid var(--border);

            background: var(--bg-surface);

            flex-shrink: 0;
          }

          .practice-cancel-button,
          .practice-submit-button {
            min-height: 38px;

            padding: 0 16px;

            border-radius: var(--radius);

            font-size: 13.5px;
            font-weight: 600;

            cursor: pointer;
          }

          .practice-cancel-button {
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text-secondary);
          }

          .practice-cancel-button:hover {
            background: var(--bg-subtle);
            color: var(--text-primary);
          }

          .practice-submit-button {
            min-width: 125px;

            border: 1px solid var(--accent);
            background: var(--accent);
            color: #fff;
          }

          .practice-submit-button:hover:not(:disabled) {
            filter: brightness(0.96);
          }

          .practice-submit-button:disabled {
            cursor: not-allowed;
            opacity: 0.55;
          }

          @media (max-width: 640px) {
            .practice-modal-overlay {
              align-items: flex-end;
              padding: 0;
            }

            .practice-modal {
              width: 100%;
              max-width: 100%;
              max-height: 94dvh;

              border-radius: 16px 16px 0 0;
              border-bottom: none;
            }

            .practice-modal-header {
              padding: 17px 18px;
            }

            .practice-modal-body {
              padding: 20px 18px;
            }

            .practice-grid {
              grid-template-columns: 1fr;
              gap: 13px;
            }

            .practice-field-full {
              grid-column: auto;
            }

            .practice-modal-footer {
              padding: 13px 18px;
            }

            .practice-cancel-button,
            .practice-submit-button {
              flex: 1;
            }
          }
        `}
      </style>

      <div
        className="practice-modal-overlay"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="practice-modal"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="practice-modal-title"
        >
          {/* Header */}
          <div className="practice-modal-header">
            <div className="practice-modal-heading">
              <div className="practice-modal-icon">
                <Building2 size={19} strokeWidth={1.9} />
              </div>

              <div>
                <h2
                  id="practice-modal-title"
                  className="practice-modal-title"
                >
                  {isEdit ? 'Edit practice' : 'Add practice'}
                </h2>

                <p className="practice-modal-subtitle">
                  {isEdit
                    ? 'Update practice and organization details'
                    : 'Create a new practice for your organization'}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="practice-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className="practice-modal-body">
              {/* Organization */}
              <section className="practice-section">
                <div className="practice-section-heading">
                  <Building2 size={13} strokeWidth={2} />
                  Organization
                </div>

                <div className="practice-grid">
                  <div className="practice-field practice-field-full">
                    <label htmlFor="group-name">
                      Group name <span aria-hidden="true">*</span>
                    </label>

                    <input
                      id="group-name"
                      required
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="input-control"
                      placeholder="Acme Medical Group"
                    />
                  </div>

                  <div className="practice-field">
                    <label htmlFor="dba-name">DBA name</label>

                    <input
                      id="dba-name"
                      value={dbaName}
                      onChange={(e) => setDbaName(e.target.value)}
                      className="input-control"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="practice-field">
                    <label htmlFor="org-type">Organization type</label>

                    <select
                      id="org-type"
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value)}
                      className="select-control"
                    >
                      <option value="">Select type…</option>

                      {ORG_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="practice-field">
                    <label htmlFor="group-npi">Group NPI</label>

                    <input
                      id="group-npi"
                      value={groupNpi}
                      onChange={(e) => setGroupNpi(e.target.value)}
                      className="input-control"
                      placeholder="10-digit NPI"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="practice-field">
                    <label htmlFor="tax-id">Tax ID / EIN</label>

                    <input
                      id="tax-id"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="input-control"
                      placeholder="XX-XXXXXXX"
                    />
                  </div>
                </div>
              </section>

              {/* Contact */}
              <section className="practice-section">
                <div className="practice-section-heading">
                  <Phone size={13} strokeWidth={2} />
                  Contact
                </div>

                <div className="practice-grid">
                  <div className="practice-field">
                    <label htmlFor="phone">Phone</label>

                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-control"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="practice-field">
                    <label htmlFor="email">Email</label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-control"
                      placeholder="office@example.com"
                    />
                  </div>
                </div>
              </section>

              {/* Location */}
              <section className="practice-section">
                <div className="practice-section-heading">
                  <MapPin size={13} strokeWidth={2} />
                  Primary location
                </div>

                <div className="practice-grid">
                  <div className="practice-field practice-field-full">
                    <label htmlFor="street">Street address</label>

                    <input
                      id="street"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="input-control"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="practice-field">
                    <label htmlFor="city">City</label>

                    <input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="input-control"
                      placeholder="Austin"
                    />
                  </div>

                  <div className="practice-field">
                    <label htmlFor="state">State</label>

                    <input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="input-control"
                      placeholder="TX"
                    />
                  </div>

                  <div className="practice-field">
                    <label htmlFor="zip">ZIP code</label>

                    <input
                      id="zip"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="input-control"
                      placeholder="78701"
                    />
                  </div>

                  {isEdit && (
                    <div className="practice-field">
                      <label htmlFor="status">Status</label>

                      <select
                        id="status"
                        value={status}
                        onChange={(e) =>
                          setStatus(
                            e.target.value as 'active' | 'inactive',
                          )
                        }
                        className="select-control"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>
              </section>

              {/* Notes */}
              <section className="practice-section">
                <div className="practice-section-heading">
                  <FileText size={13} strokeWidth={2} />
                  Additional information
                </div>

                <div className="practice-field">
                  <label htmlFor="notes">Notes</label>

                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-control"
                    placeholder="Add any internal notes about this practice…"
                  />
                </div>
              </section>

              {error && (
                <p className="practice-modal-error" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="practice-modal-footer">
              <button
                type="button"
                className="practice-cancel-button"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="practice-submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Saving…'
                  : isEdit
                    ? 'Save changes'
                    : 'Add practice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}