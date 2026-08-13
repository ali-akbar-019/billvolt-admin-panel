import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  X,
  UserPlus,
  ShieldCheck,
  Users,
  Building2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { User, Practice } from '../types';

interface AddUserModalProps {
  onClose: () => void;
  onCreated: (user: User) => void;
}

export function AddUserModal({
  onClose,
  onCreated,
}: AddUserModalProps) {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');

  const [assignedPracticeIds, setAssignedPracticeIds] =
    useState<string[]>([]);

  const [practices, setPractices] = useState<Practice[]>([]);
  const [isLoadingPractices, setIsLoadingPractices] =
    useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    apiClient
      .get('/practices', {
        params: { limit: 100 },
      })
      .then((res) => {
        setPractices(res.data.practices || []);
      })
      .catch(() => {
        showToast(
          'Could not load practices',
          'error',
        );
      })
      .finally(() => {
        setIsLoadingPractices(false);
      });
  }, [showToast]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [isSubmitting, onClose]);

  const togglePractice = (practiceId: string) => {
    setAssignedPracticeIds((prev) =>
      prev.includes(practiceId)
        ? prev.filter((id) => id !== practiceId)
        : [...prev, practiceId],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await apiClient.post(
        '/auth/register',
        {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          ...(role === 'staff'
            ? { assignedPracticeIds }
            : {}),
        },
      );

      onCreated(res.data.user);

      showToast(
        `${name.trim()} was added to the team`,
      );

      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        'Could not create the account.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>
        {`
          .add-user-overlay {
            position: fixed;
            inset: 0;
            z-index: 120;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 20px;

            background: rgba(15, 23, 42, 0.42);

            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);

            animation: addUserOverlayIn 160ms ease-out;
          }

          .add-user-modal {
            width: 440px;
            max-width: 100%;

            max-height: min(
              720px,
              calc(100dvh - 40px)
            );

            display: flex;
            flex-direction: column;

            overflow: hidden;

            background: var(--bg-surface);

            border: 1px solid var(--border);

            border-radius: 14px;

            box-shadow:
              0 24px 70px rgba(15, 23, 42, 0.18),
              0 4px 16px rgba(15, 23, 42, 0.06);

            animation: addUserModalIn 180ms
              cubic-bezier(0.22, 1, 0.36, 1);
          }

          .add-user-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;

            gap: 16px;

            padding: 22px 24px 18px;

            border-bottom: 1px solid var(--border);

            flex-shrink: 0;
          }

          .add-user-title-wrap {
            display: flex;
            align-items: flex-start;
            gap: 12px;

            min-width: 0;
          }

          .add-user-title-icon {
            width: 36px;
            height: 36px;

            flex: 0 0 36px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 9px;

            background: var(--accent-tint);
            color: var(--accent);
          }

          .add-user-title {
            margin: 0;

            color: var(--text-primary);

            font-size: 17px;
            line-height: 1.25;

            font-weight: 650;

            letter-spacing: -0.015em;
          }

          .add-user-subtitle {
            margin: 4px 0 0;

            color: var(--text-muted);

            font-size: 12.5px;
            line-height: 1.4;
          }

          .add-user-close {
            width: 32px;
            height: 32px;

            flex: 0 0 32px;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 0;

            border: 1px solid transparent;
            border-radius: 7px;

            background: transparent;

            color: var(--text-muted);

            cursor: pointer;

            transition:
              background 140ms ease,
              color 140ms ease,
              border-color 140ms ease;
          }

          .add-user-close:hover {
            background: var(--bg-subtle);
            border-color: var(--border);
            color: var(--text-primary);
          }

          .add-user-body {
            padding: 22px 24px 24px;

            overflow-y: auto;
            overflow-x: hidden;

            scrollbar-width: none;
          }

          .add-user-body::-webkit-scrollbar {
            width: 0;
            display: none;
          }

          .add-user-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .add-user-field {
            display: flex;
            flex-direction: column;
          }

          .add-user-label {
            margin-bottom: 7px;

            color: var(--text-secondary);

            font-size: 12.5px;
            font-weight: 600;

            line-height: 1.2;
          }

          .add-user-required {
            color: var(--status-denied);
            margin-left: 2px;
          }

          .add-user-input,
          .add-user-select {
            width: 100%;
            height: 42px;

            box-sizing: border-box;

            padding: 0 12px;

            border: 1px solid var(--border-strong);

            border-radius: 8px;

            outline: none;

            background: var(--bg-surface);
            color: var(--text-primary);

            font-family: inherit;
            font-size: 13.5px;

            transition:
              border-color 140ms ease,
              box-shadow 140ms ease,
              background 140ms ease;
          }

          .add-user-input::placeholder {
            color: var(--text-muted);
          }

          .add-user-input:hover,
          .add-user-select:hover {
            border-color: var(--text-muted);
          }

          .add-user-input:focus,
          .add-user-select:focus {
            border-color: var(--accent);

            box-shadow:
              0 0 0 3px var(--accent-tint);
          }

          .add-user-role-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;

            gap: 8px;
          }

          .add-user-role {
            position: relative;

            display: flex;
            align-items: center;

            gap: 10px;

            min-height: 56px;

            padding: 10px 11px;

            box-sizing: border-box;

            border: 1px solid var(--border);

            border-radius: 9px;

            background: var(--bg-surface);

            cursor: pointer;

            transition:
              border-color 140ms ease,
              background 140ms ease;
          }

          .add-user-role:hover {
            border-color: var(--border-strong);
            background: var(--bg-subtle);
          }

          .add-user-role.is-selected {
            border-color: var(--accent);

            background: var(--accent-tint);
          }

          .add-user-role-radio {
            width: 30px;
            height: 30px;

            flex: 0 0 30px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 7px;

            background: var(--bg-subtle);

            color: var(--text-muted);
          }

          .add-user-role.is-selected
            .add-user-role-radio {
            background: var(--accent);
            color: #fff;
          }

          .add-user-role-title {
            margin: 0;

            color: var(--text-primary);

            font-size: 12.5px;
            font-weight: 600;
          }

          .add-user-role-description {
            margin: 2px 0 0;

            color: var(--text-muted);

            font-size: 10.5px;
            line-height: 1.3;
          }

          .add-user-role input {
            position: absolute;
            opacity: 0;
            pointer-events: none;
          }

          .add-user-practice-header {
            display: flex;
            align-items: center;
            justify-content: space-between;

            margin-bottom: 7px;
          }

          .add-user-practice-count {
            color: var(--accent);

            font-size: 11px;
            font-weight: 600;
          }

          .add-user-practices {
            max-height: 174px;

            overflow-y: auto;

            padding: 5px;

            border: 1px solid var(--border);

            border-radius: 9px;

            background: var(--bg-page);

            scrollbar-width: none;
          }

          .add-user-practices::-webkit-scrollbar {
            width: 0;
            display: none;
          }

          .add-user-practice {
            display: flex;
            align-items: center;

            gap: 10px;

            min-height: 38px;

            padding: 7px 9px;

            box-sizing: border-box;

            border-radius: 7px;

            cursor: pointer;

            transition:
              background 120ms ease;
          }

          .add-user-practice:hover {
            background: var(--bg-subtle);
          }

          .add-user-practice.is-selected {
            background: var(--accent-tint);
          }

          .add-user-checkbox {
            width: 17px;
            height: 17px;

            flex: 0 0 17px;

            display: flex;
            align-items: center;
            justify-content: center;

            border: 1px solid var(--border-strong);

            border-radius: 4px;

            background: var(--bg-surface);

            color: #fff;
          }

          .add-user-practice.is-selected
            .add-user-checkbox {
            border-color: var(--accent);
            background: var(--accent);
          }

          .add-user-practice-name {
            min-width: 0;

            overflow: hidden;

            white-space: nowrap;
            text-overflow: ellipsis;

            color: var(--text-secondary);

            font-size: 12.5px;
            font-weight: 500;
          }

          .add-user-practice.is-selected
            .add-user-practice-name {
            color: var(--text-primary);
            font-weight: 600;
          }

          .add-user-empty {
            padding: 18px 10px;

            text-align: center;

            color: var(--text-muted);

            font-size: 12px;
          }

          .add-user-error {
            display: flex;
            align-items: flex-start;

            gap: 9px;

            padding: 10px 11px;

            border: 1px solid
              color-mix(
                in srgb,
                var(--status-denied) 25%,
                transparent
              );

            border-radius: 8px;

            background: color-mix(
              in srgb,
              var(--status-denied) 7%,
              var(--bg-surface)
            );

            color: var(--status-denied);

            font-size: 12.5px;
            line-height: 1.4;
          }

          .add-user-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;

            gap: 8px;

            margin-top: 3px;
          }

          .add-user-cancel {
            height: 40px;

            padding: 0 15px;

            border: 1px solid var(--border-strong);

            border-radius: 8px;

            background: var(--bg-surface);

            color: var(--text-secondary);

            font-family: inherit;

            font-size: 13px;
            font-weight: 600;

            cursor: pointer;

            transition:
              background 140ms ease,
              color 140ms ease;
          }

          .add-user-cancel:hover:not(:disabled) {
            background: var(--bg-subtle);
            color: var(--text-primary);
          }

          .add-user-submit {
            height: 40px;

            display: flex;
            align-items: center;
            justify-content: center;

            gap: 7px;

            padding: 0 17px;

            border: 0;

            border-radius: 8px;

            background: var(--accent);
            color: #fff;

            font-family: inherit;

            font-size: 13px;
            font-weight: 600;

            cursor: pointer;

            box-shadow:
              0 3px 10px
              color-mix(
                in srgb,
                var(--accent) 20%,
                transparent
              );

            transition:
              opacity 140ms ease,
              transform 140ms ease;
          }

          .add-user-submit:hover:not(:disabled) {
            opacity: 0.92;
          }

          .add-user-submit:active:not(:disabled) {
            transform: translateY(1px);
          }

          .add-user-submit:disabled,
          .add-user-cancel:disabled,
          .add-user-close:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }

          @keyframes addUserOverlayIn {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          @keyframes addUserModalIn {
            from {
              opacity: 0;
              transform: translateY(8px) scale(0.985);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @media (max-width: 520px) {
            .add-user-overlay {
              align-items: flex-end;

              padding: 10px;
            }

            .add-user-modal {
              width: 100%;

              max-height:
                calc(100dvh - 20px);

              border-radius: 13px;
            }

            .add-user-header {
              padding: 18px 18px 16px;
            }

            .add-user-body {
              padding: 18px;
            }

            .add-user-role-grid {
              grid-template-columns: 1fr;
            }

            .add-user-actions {
              flex-direction: column-reverse;
            }

            .add-user-submit,
            .add-user-cancel {
              width: 100%;
            }
          }
        `}
      </style>

      <div
        className="add-user-overlay"
        onMouseDown={(e) => {
          if (
            e.target === e.currentTarget &&
            !isSubmitting
          ) {
            onClose();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
      >
        <div className="add-user-modal">
          {/* Header */}

          <div className="add-user-header">
            <div className="add-user-title-wrap">
              <div className="add-user-title-icon">
                <UserPlus size={18} />
              </div>

              <div>
                <h2
                  id="add-user-title"
                  className="add-user-title"
                >
                  Add team member
                </h2>

                <p className="add-user-subtitle">
                  Create an account and configure
                  access.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="add-user-close"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>


          {/* Body */}

          <div className="add-user-body">
            <form
              onSubmit={handleSubmit}
              className="add-user-form"
            >
              {/* Name */}

              <div className="add-user-field">
                <label className="add-user-label">
                  Full name
                  <span className="add-user-required">
                    *
                  </span>
                </label>

                <input
                  required
                  autoFocus
                  className="add-user-input"
                  placeholder="Jordan Reyes"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>


              {/* Email */}

              <div className="add-user-field">
                <label className="add-user-label">
                  Email address
                  <span className="add-user-required">
                    *
                  </span>
                </label>

                <input
                  required
                  type="email"
                  className="add-user-input"
                  placeholder="name@billvolt.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>


              {/* Password */}

              <div className="add-user-field">
                <label className="add-user-label">
                  Temporary password
                  <span className="add-user-required">
                    *
                  </span>
                </label>

                <input
                  required
                  type="password"
                  className="add-user-input"
                  placeholder="Set a temporary password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>


              {/* Role */}

              <div className="add-user-field">
                <label className="add-user-label">
                  Account role
                </label>

                <div className="add-user-role-grid">
                  <label
                    className={`add-user-role ${role === 'staff'
                        ? 'is-selected'
                        : ''
                      }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="staff"
                      checked={role === 'staff'}
                      onChange={() =>
                        setRole('staff')
                      }
                    />

                    <span className="add-user-role-radio">
                      <Users size={15} />
                    </span>

                    <span>
                      <p className="add-user-role-title">
                        Staff
                      </p>

                      <p className="add-user-role-description">
                        Standard operational access
                      </p>
                    </span>
                  </label>


                  <label
                    className={`add-user-role ${role === 'admin'
                        ? 'is-selected'
                        : ''
                      }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={() =>
                        setRole('admin')
                      }
                    />

                    <span className="add-user-role-radio">
                      <ShieldCheck size={15} />
                    </span>

                    <span>
                      <p className="add-user-role-title">
                        Admin
                      </p>

                      <p className="add-user-role-description">
                        Full portal administration
                      </p>
                    </span>
                  </label>
                </div>
              </div>


              {/* Practices */}

              {role === 'staff' && (
                <div className="add-user-field">
                  <div className="add-user-practice-header">
                    <label className="add-user-label" style={{ marginBottom: 0 }}>
                      Practice access
                    </label>

                    {assignedPracticeIds.length > 0 && (
                      <span className="add-user-practice-count">
                        {assignedPracticeIds.length}{' '}
                        selected
                      </span>
                    )}
                  </div>

                  <div className="add-user-practices">
                    {isLoadingPractices ? (
                      <div className="add-user-empty">
                        Loading practices…
                      </div>
                    ) : practices.length === 0 ? (
                      <div className="add-user-empty">
                        No practices available.
                      </div>
                    ) : (
                      practices.map((practice) => {
                        const selected =
                          assignedPracticeIds.includes(
                            practice._id,
                          );

                        return (
                          <label
                            key={practice._id}
                            className={`add-user-practice ${selected
                                ? 'is-selected'
                                : ''
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                togglePractice(
                                  practice._id,
                                )
                              }
                              style={{
                                position: 'absolute',
                                opacity: 0,
                                pointerEvents: 'none',
                              }}
                            />

                            <span className="add-user-checkbox">
                              {selected && (
                                <Check size={12} />
                              )}
                            </span>

                            <Building2
                              size={14}
                              color="var(--text-muted)"
                            />

                            <span className="add-user-practice-name">
                              {practice.groupName}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}


              {/* Error */}

              {error && (
                <div className="add-user-error">
                  <AlertCircle
                    size={16}
                    style={{
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  />

                  <span>{error}</span>
                </div>
              )}


              {/* Actions */}

              <div className="add-user-actions">
                <button
                  type="button"
                  className="add-user-cancel"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="add-user-submit"
                  disabled={isSubmitting}
                >
                  <UserPlus size={15} />

                  {isSubmitting
                    ? 'Creating account…'
                    : 'Add member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}