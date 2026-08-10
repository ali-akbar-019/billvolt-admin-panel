import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
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

const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC'];

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
    if (!settings) return;
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
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-small)' }}>Loading settings…</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 'var(--fs-page-title)', margin: '0 0 6px' }}>Settings</h1>
      <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: '0 0 24px' }}>
        Organization preferences and portal-wide behavior.
      </p>

      {!isAdmin && (
        <div className="empty-state" style={{ marginBottom: 20, padding: '20px 24px' }}>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>
            You can view these settings, but only an admin can change them.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="surface-card" style={{ padding: 28, maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Organization name</label>
          <input
            disabled={!isAdmin}
            value={settings.orgName}
            onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
            className="input-control"
          />
        </div>

        <div>
          <label style={labelStyle}>Timezone</label>
          <select
            disabled={!isAdmin}
            value={settings.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            className="select-control"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Contact email</label>
          <input
            disabled={!isAdmin}
            type="email"
            value={settings.contactEmail || ''}
            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            className="input-control"
          />
        </div>

        <div>
          <label style={labelStyle}>Session timeout (minutes)</label>
          <input
            disabled={!isAdmin}
            type="number"
            min={5}
            max={480}
            value={settings.sessionTimeoutMinutes}
            onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
            className="input-control"
          />
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 0' }}>
            Displayed as policy; not yet wired to session expiry enforcement.
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: isAdmin ? 'pointer' : 'default' }}>
          <input
            disabled={!isAdmin}
            type="checkbox"
            checked={settings.notifyOnOverdueFollowUps}
            onChange={(e) => setSettings({ ...settings, notifyOnOverdueFollowUps: e.target.checked })}
          />
          Notify on overdue follow-ups
        </label>

        {isAdmin && (
          <button type="submit" disabled={isSaving} style={buttonStyle(isSaving)}>
            {isSaving ? 'Saving…' : 'Save settings'}
          </button>
        )}
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6,
};

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '12px', fontSize: 14.5, fontWeight: 600, color: '#fff',
  background: disabled ? 'var(--text-muted)' : 'var(--accent)', border: 'none',
  borderRadius: 'var(--radius)', cursor: disabled ? 'not-allowed' : 'pointer',
});
