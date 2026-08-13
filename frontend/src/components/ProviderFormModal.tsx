import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X, UserRound, Building2, Stethoscope, Phone, ShieldCheck } from 'lucide-react';
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

export function ProviderFormModal({
  provider,
  defaultPracticeId,
  onClose,
  onSaved,
}: ProviderFormModalProps) {
  const isEdit = Boolean(provider);
  const { showToast } = useToast();

  const currentPracticeId =
    typeof provider?.practiceId === 'object'
      ? provider.practiceId?._id
      : provider?.practiceId;

  const [practices, setPractices] = useState<Practice[]>([]);

  const [name, setName] = useState(provider?.name || '');
  const [providerType, setProviderType] = useState(
    provider?.providerType || '',
  );
  const [npi, setNpi] = useState(provider?.npi || '');
  const [specialty, setSpecialty] = useState(provider?.specialty || '');
  const [practiceId, setPracticeId] = useState(
    currentPracticeId || defaultPracticeId || '',
  );
  const [phone, setPhone] = useState(provider?.contact?.phone || '');
  const [email, setEmail] = useState(provider?.contact?.email || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(
    provider?.status || 'active',
  );

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * Lock background scrolling while the modal is open.
   * This prevents the page behind the modal from scrolling on mobile.
   */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  /*
   * Load active practices.
   */
  useEffect(() => {
    let cancelled = false;

    apiClient
      .get('/practices', {
        params: {
          status: 'active',
          limit: 100,
        },
      })
      .then((res) => {
        if (!cancelled) {
          setPractices(res.data.practices || []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          showToast(
            'Could not load practices for the dropdown',
            'error',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);

    const trimmedName = name.trim();
    const trimmedNpi = npi.trim();
    const trimmedSpecialty = specialty.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Enter the provider name.');
      return;
    }

    if (!practiceId) {
      setError('Select a practice for this provider.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: trimmedName,
      providerType: providerType || undefined,
      npi: trimmedNpi || undefined,
      specialty: trimmedSpecialty || undefined,
      practiceId,
      contact: {
        phone: trimmedPhone || undefined,
        email: trimmedEmail || undefined,
      },
      ...(isEdit ? { status } : {}),
    };

    try {
      const res = isEdit
        ? await apiClient.patch(
          `/providers/${provider!._id}`,
          payload,
        )
        : await apiClient.post('/providers', payload);

      onSaved(res.data.provider);

      showToast(
        isEdit
          ? 'Provider updated'
          : `${trimmedName} was added`,
      );

      onClose();
    } catch (err: any) {
      const details = err?.response?.data?.details;

      setError(
        details?.[0]?.message ||
        err?.response?.data?.error ||
        'Could not save the provider.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>
        {`
          .provider-modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 1000;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 20px;

            background: rgba(11, 14, 26, 0.48);

            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);

            overflow-y: auto;
            overscroll-behavior: contain;

            animation: providerModalFadeIn 0.16s ease-out;
          }

          .provider-modal {
            width: min(520px, 100%);
            max-height: calc(100dvh - 40px);

            display: flex;
            flex-direction: column;

            overflow: hidden;

            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: 14px;

            box-shadow:
              0 24px 70px rgba(11, 14, 26, 0.18),
              0 4px 18px rgba(11, 14, 26, 0.08);

            animation: providerModalSlideIn 0.18s ease-out;
          }

          .provider-modal *,
          .provider-modal *::before,
          .provider-modal *::after {
            box-sizing: border-box;
          }

          .provider-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 16px;

            flex-shrink: 0;

            padding: 20px 24px;

            border-bottom: 1px solid var(--border);
          }

          .provider-modal-title-wrap {
            min-width: 0;

            display: flex;
            align-items: center;
            gap: 12px;
          }

          .provider-modal-title-icon {
            width: 36px;
            height: 36px;

            display: flex;
            align-items: center;
            justify-content: center;

            flex-shrink: 0;

            color: var(--accent);
            background: var(--bg-subtle);

            border-radius: 9px;
          }

          .provider-modal-title {
            min-width: 0;

            margin: 0;

            color: var(--text-primary);

            font-family: var(--font-display);
            font-size: var(--fs-section-title, 18px);
            line-height: 1.2;
            font-weight: 650;

            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .provider-modal-subtitle {
            margin: 4px 0 0;

            color: var(--text-muted);

            font-size: 12px;
            line-height: 1.35;
          }

          .provider-modal-close {
            width: 34px;
            height: 34px;

            display: flex;
            align-items: center;
            justify-content: center;

            flex-shrink: 0;

            padding: 0;

            border: 1px solid transparent;
            border-radius: 8px;

            background: transparent;
            color: var(--text-muted);

            cursor: pointer;

            transition:
              background 0.15s ease,
              color 0.15s ease,
              border-color 0.15s ease;
          }

          .provider-modal-close:hover {
            background: var(--bg-subtle);
            color: var(--text-primary);
            border-color: var(--border);
          }

          .provider-modal-close:focus-visible {
            outline: 2px solid var(--accent);
            outline-offset: 2px;
          }

          .provider-modal-body {
            min-height: 0;

            overflow-y: auto;
            overflow-x: hidden;

            padding: 24px;

            scrollbar-width: thin;
          }

          .provider-modal-form {
            display: flex;
            flex-direction: column;
            gap: 17px;
          }

          .provider-field {
            min-width: 0;
          }

          .provider-field-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 14px;
          }

          .provider-field-label {
            display: flex;
            align-items: center;
            gap: 5px;

            margin: 0 0 7px;

            color: var(--text-secondary);

            font-size: 12.5px;
            line-height: 1.25;
            font-weight: 600;
          }

          .provider-required {
            color: var(--accent);
          }

          .provider-input,
          .provider-select {
            width: 100%;
            min-width: 0;
            height: 42px;

            padding: 0 12px;

            border: 1px solid var(--border);
            border-radius: var(--radius, 8px);

            background: var(--bg-surface);
            color: var(--text-primary);

            font-family: inherit;
            font-size: 13.5px;

            outline: none;

            transition:
              border-color 0.15s ease,
              box-shadow 0.15s ease,
              background 0.15s ease;
          }

          .provider-input::placeholder {
            color: var(--text-muted);
            opacity: 0.75;
          }

          .provider-input:hover,
          .provider-select:hover {
            border-color: var(--text-muted);
          }

          .provider-input:focus,
          .provider-select:focus {
            border-color: var(--accent);

            box-shadow:
              0 0 0 3px color-mix(
                in srgb,
                var(--accent) 12%,
                transparent
              );
          }

          .provider-input:disabled,
          .provider-select:disabled {
            cursor: not-allowed;
            opacity: 0.65;
            background: var(--bg-subtle);
          }

          .provider-select {
            cursor: pointer;
          }

          .provider-help {
            margin: 7px 0 0;

            color: var(--text-muted);

            font-size: 12px;
            line-height: 1.45;
          }

          .provider-empty {
            display: flex;
            align-items: flex-start;
            gap: 9px;

            margin-top: 8px;
            padding: 10px 11px;

            border: 1px solid var(--border);
            border-radius: 8px;

            background: var(--bg-subtle);

            color: var(--text-muted);

            font-size: 12px;
            line-height: 1.45;
          }

          .provider-empty svg {
            flex-shrink: 0;
            margin-top: 1px;
          }

          .provider-security-note {
            display: flex;
            align-items: flex-start;
            gap: 9px;

            margin-top: -1px;
            padding: 11px 12px;

            border: 1px solid var(--border);
            border-radius: 8px;

            background: var(--bg-subtle);
          }

          .provider-security-note svg {
            flex-shrink: 0;
            margin-top: 1px;
            color: var(--accent);
          }

          .provider-security-note p {
            margin: 0;

            color: var(--text-muted);

            font-size: 11.5px;
            line-height: 1.5;
          }

          .provider-error {
            margin: -2px 0 0;
            padding: 10px 12px;

            border: 1px solid color-mix(
              in srgb,
              var(--status-denied) 22%,
              var(--border)
            );

            border-radius: 8px;

            background: color-mix(
              in srgb,
              var(--status-denied) 5%,
              var(--bg-surface)
            );

            color: var(--status-denied);

            font-size: 13px;
            line-height: 1.45;
          }

          .provider-modal-footer {
            display: flex;
            gap: 10px;

            padding-top: 3px;
          }

          .provider-button {
            width: 100%;
            min-height: 44px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            padding: 10px 14px;

            border: 0;
            border-radius: var(--radius, 8px);

            font-family: inherit;
            font-size: 13.5px;
            font-weight: 650;

            cursor: pointer;

            transition:
              opacity 0.15s ease,
              transform 0.15s ease,
              background 0.15s ease;
          }

          .provider-button-primary {
            color: #fff;
            background: var(--accent);
          }

          .provider-button-primary:hover:not(:disabled) {
            filter: brightness(0.96);
          }

          .provider-button:active:not(:disabled) {
            transform: translateY(1px);
          }

          .provider-button:disabled {
            cursor: not-allowed;
            opacity: 0.55;
          }

          @keyframes providerModalFadeIn {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          @keyframes providerModalSlideIn {
            from {
              opacity: 0;
              transform: translateY(8px) scale(0.99);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @media (max-width: 600px) {
            .provider-modal-backdrop {
              align-items: flex-start;

              padding: 12px;
            }

            .provider-modal {
              width: 100%;
              max-height: calc(100dvh - 24px);

              border-radius: 12px;
            }

            .provider-modal-header {
              padding: 16px;
            }

            .provider-modal-body {
              padding: 18px 16px 20px;
            }

            .provider-field-grid {
              grid-template-columns: minmax(0, 1fr);
              gap: 16px;
            }
          }

          @media (max-width: 400px) {
            .provider-modal-backdrop {
              padding: 8px;
            }

            .provider-modal {
              max-height: calc(100dvh - 16px);
              border-radius: 10px;
            }

            .provider-modal-header {
              padding: 14px;
            }

            .provider-modal-title-icon {
              width: 32px;
              height: 32px;
            }

            .provider-modal-body {
              padding: 16px 14px 18px;
            }

            .provider-modal-form {
              gap: 15px;
            }

            .provider-modal-footer {
              padding-top: 2px;
            }
          }

          @media (max-width: 340px) {
            .provider-modal-title-icon {
              display: none;
            }

            .provider-modal-header {
              gap: 8px;
            }

            .provider-modal-title {
              font-size: 16px;
            }

            .provider-modal-subtitle {
              font-size: 11px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .provider-modal-backdrop,
            .provider-modal {
              animation: none;
            }

            .provider-input,
            .provider-select,
            .provider-button,
            .provider-modal-close {
              transition: none;
            }
          }
        `}
      </style>

      <div
        className="provider-modal-backdrop"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <section
          className="provider-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="provider-modal-title"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="provider-modal-header">
            <div className="provider-modal-title-wrap">
              <div className="provider-modal-title-icon">
                {isEdit ? (
                  <UserRound size={18} strokeWidth={1.9} />
                ) : (
                  <Stethoscope size={18} strokeWidth={1.9} />
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <h2
                  id="provider-modal-title"
                  className="provider-modal-title"
                >
                  {isEdit ? 'Edit provider' : 'Add provider'}
                </h2>

                <p className="provider-modal-subtitle">
                  {isEdit
                    ? 'Update provider information and assignment.'
                    : 'Add a provider to your credentialing workspace.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="provider-modal-close"
              aria-label="Close"
            >
              <X size={19} strokeWidth={1.9} />
            </button>
          </header>

          {/* Scrollable content */}
          <div className="provider-modal-body">
            <form
              id="provider-form"
              onSubmit={handleSubmit}
              className="provider-modal-form"
            >
              {/* Name */}
              <div className="provider-field">
                <label
                  htmlFor="provider-name"
                  className="provider-field-label"
                >
                  Full name
                  <span className="provider-required">*</span>
                </label>

                <input
                  id="provider-name"
                  required
                  autoFocus
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="provider-input"
                  placeholder="Dr. Sarah Khan"
                  disabled={isSubmitting}
                />
              </div>

              {/* Practice */}
              <div className="provider-field">
                <label
                  htmlFor="provider-practice"
                  className="provider-field-label"
                >
                  <Building2 size={13} />
                  Practice
                  <span className="provider-required">*</span>
                </label>

                <select
                  id="provider-practice"
                  required
                  value={practiceId}
                  onChange={(e) => setPracticeId(e.target.value)}
                  className="provider-select"
                  disabled={isSubmitting}
                >
                  <option value="">Select a practice…</option>

                  {practices.map((practice) => (
                    <option
                      key={practice._id}
                      value={practice._id}
                    >
                      {practice.groupName}
                    </option>
                  ))}
                </select>

                {practices.length === 0 && (
                  <div className="provider-empty">
                    <Building2 size={14} />

                    <span>
                      No active practices yet — add one first from
                      the Practices page.
                    </span>
                  </div>
                )}
              </div>

              {/* Provider type + NPI */}
              <div className="provider-field-grid">
                <div className="provider-field">
                  <label
                    htmlFor="provider-type"
                    className="provider-field-label"
                  >
                    Provider type
                  </label>

                  <select
                    id="provider-type"
                    value={providerType}
                    onChange={(e) =>
                      setProviderType(e.target.value)
                    }
                    className="provider-select"
                    disabled={isSubmitting}
                  >
                    <option value="">Select…</option>

                    {PROVIDER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="provider-field">
                  <label
                    htmlFor="provider-npi"
                    className="provider-field-label"
                  >
                    Individual NPI
                  </label>

                  <input
                    id="provider-npi"
                    inputMode="numeric"
                    autoComplete="off"
                    value={npi}
                    onChange={(e) => setNpi(e.target.value)}
                    className="provider-input"
                    placeholder="1234567890"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Specialty */}
              <div className="provider-field">
                <label
                  htmlFor="provider-specialty"
                  className="provider-field-label"
                >
                  <Stethoscope size={13} />
                  Specialty
                </label>

                <input
                  id="provider-specialty"
                  value={specialty}
                  onChange={(e) =>
                    setSpecialty(e.target.value)
                  }
                  className="provider-input"
                  placeholder="Internal Medicine"
                  disabled={isSubmitting}
                />
              </div>

              {/* Contact */}
              <div className="provider-field-grid">
                <div className="provider-field">
                  <label
                    htmlFor="provider-phone"
                    className="provider-field-label"
                  >
                    <Phone size={13} />
                    Phone
                  </label>

                  <input
                    id="provider-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="provider-input"
                    placeholder="(555) 123-4567"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="provider-field">
                  <label
                    htmlFor="provider-email"
                    className="provider-field-label"
                  >
                    Email
                  </label>

                  <input
                    id="provider-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="provider-input"
                    placeholder="provider@example.com"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Status */}
              {isEdit && (
                <div className="provider-field">
                  <label
                    htmlFor="provider-status"
                    className="provider-field-label"
                  >
                    Status
                  </label>

                  <select
                    id="provider-status"
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as
                        | 'active'
                        | 'inactive',
                      )
                    }
                    className="provider-select"
                    disabled={isSubmitting}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              {/* Security / credentialing note */}
              <div className="provider-security-note">
                <ShieldCheck size={15} />

                <p>
                  Licenses, DEA registrations, SSN, and CAQH
                  credentials can be managed from the provider's
                  dedicated profile page.
                </p>
              </div>

              {/* Error */}
              {error && (
                <p
                  className="provider-error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <div className="provider-modal-footer">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="provider-button provider-button-primary"
                >
                  {isSubmitting
                    ? 'Saving…'
                    : isEdit
                      ? 'Save changes'
                      : 'Add provider'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}