import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Building2, Clock3, Mail, BellRing, ShieldCheck, Save } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface OrgSettings {
  orgName: string;
  timezone: string;
  contactEmail?: string;
  sessionTimeoutMinutes: number;
  notifyOnOverdueFollowUps: boolean;
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'UTC',
];

export function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isAdmin = user?.role === 'admin';

  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    apiClient
      .get('/settings')
      .then((res) => setSettings(res.data.settings))
      .catch(() => showToast('Could not load settings', 'error'));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!settings || !isAdmin) return;

    setIsSaving(true);

    try {
      const res = await apiClient.patch('/settings', settings);

      setSettings(res.data.settings);
      showToast('Settings saved');
    } catch {
      showToast('Could not save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="settings-loading">
        <div className="settings-loading-spinner" />
        <span>Loading settings…</span>
      </div>
    );
  }

  return (
    <div className="settings-page">

      {/* Header */}
      <div className="settings-header">
        <div>
          <div className="settings-eyebrow">
            <span className="settings-eyebrow-dot" />
            Organization
          </div>

          <h1 className="settings-title">
            Settings
          </h1>

          <p className="settings-description">
            Manage organization preferences and portal-wide behavior.
          </p>
        </div>

        <div className="settings-header-icon">
          <ShieldCheck size={21} />
        </div>
      </div>

      {/* Permission notice */}
      {!isAdmin && (
        <div className="settings-permission-banner">
          <div className="settings-permission-icon">
            <ShieldCheck size={17} />
          </div>

          <div>
            <p className="settings-permission-title">
              View-only access
            </p>

            <p className="settings-permission-text">
              You can view organization settings, but only an administrator
              can make changes.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-layout">

        {/* Organization */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Building2 size={17} />
            </div>

            <div>
              <h2>Organization</h2>
              <p>Basic information about your organization.</p>
            </div>
          </div>

          <div className="settings-card-body">

            <div className="settings-field">
              <label htmlFor="orgName">
                Organization name
              </label>

              <input
                id="orgName"
                disabled={!isAdmin}
                value={settings.orgName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    orgName: e.target.value,
                  })
                }
                className="input-control"
                placeholder="Organization name"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="contactEmail">
                Contact email
              </label>

              <div className="settings-input-icon">
                <Mail size={15} />

                <input
                  id="contactEmail"
                  disabled={!isAdmin}
                  type="email"
                  value={settings.contactEmail || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contactEmail: e.target.value,
                    })
                  }
                  className="input-control"
                  placeholder="admin@example.com"
                />
              </div>

              <p className="settings-help">
                Used for organization-level notifications and contact information.
              </p>
            </div>

          </div>
        </section>

        {/* Regional settings */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Clock3 size={17} />
            </div>

            <div>
              <h2>Regional settings</h2>
              <p>Control how dates and times are handled across the portal.</p>
            </div>
          </div>

          <div className="settings-card-body">

            <div className="settings-field">
              <label htmlFor="timezone">
                Timezone
              </label>

              <select
                id="timezone"
                disabled={!isAdmin}
                value={settings.timezone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    timezone: e.target.value,
                  })
                }
                className="select-control"
              >
                {TIMEZONES.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>

              <p className="settings-help">
                Follow-up dates and activity timestamps use this timezone.
              </p>
            </div>

          </div>
        </section>

        {/* Security */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <ShieldCheck size={17} />
            </div>

            <div>
              <h2>Security</h2>
              <p>Configure session behavior for portal users.</p>
            </div>
          </div>

          <div className="settings-card-body">

            <div className="settings-field">
              <label htmlFor="sessionTimeout">
                Session timeout
              </label>

              <div className="settings-number-row">
                <input
                  id="sessionTimeout"
                  disabled={!isAdmin}
                  type="number"
                  min={5}
                  max={480}
                  value={settings.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      sessionTimeoutMinutes: Number(e.target.value),
                    })
                  }
                  className="input-control"
                />

                <span className="settings-number-unit">
                  minutes
                </span>
              </div>

              <p className="settings-help">
                Users are automatically signed out after this period
                of inactivity. Allowed range: 5–480 minutes.
              </p>
            </div>

          </div>
        </section>

        {/* Notifications */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <BellRing size={17} />
            </div>

            <div>
              <h2>Notifications</h2>
              <p>Choose which organization-level alerts are enabled.</p>
            </div>
          </div>

          <div className="settings-card-body">

            <label
              className={`settings-toggle-row ${!isAdmin ? 'settings-toggle-disabled' : ''
                }`}
            >
              <div className="settings-toggle-content">
                <div className="settings-toggle-icon">
                  <BellRing size={15} />
                </div>

                <div>
                  <span className="settings-toggle-title">
                    Overdue follow-ups
                  </span>

                  <span className="settings-toggle-description">
                    Notify when follow-ups remain incomplete after their due date.
                  </span>
                </div>
              </div>

              <span className="settings-switch">
                <input
                  disabled={!isAdmin}
                  type="checkbox"
                  checked={settings.notifyOnOverdueFollowUps}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifyOnOverdueFollowUps: e.target.checked,
                    })
                  }
                />

                <span className="settings-switch-track" />
              </span>
            </label>

          </div>
        </section>

        {/* Footer actions */}
        {isAdmin && (
          <div className="settings-actions">
            <div className="settings-save-copy">
              <span className="settings-save-status">
                <span className="settings-save-dot" />
                Changes are saved organization-wide
              </span>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="settings-save-button"
            >
              <Save size={15} />

              {isSaving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        )}

      </form>
    </div>
  );
}