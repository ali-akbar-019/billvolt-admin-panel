import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { User, Practice } from '../types';

interface AddUserModalProps {
  onClose: () => void;
  onCreated: (user: User) => void;
}

export function AddUserModal({ onClose, onCreated }: AddUserModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [assignedPracticeIds, setAssignedPracticeIds] = useState<string[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    apiClient
      .get('/practices', { params: { limit: 100 } })
      .then((res) => setPractices(res.data.practices))
      .catch(() => showToast('Could not load practices', 'error'));
  }, []);

  const togglePractice = (practiceId: string) => {
    setAssignedPracticeIds((prev) =>
      prev.includes(practiceId) ? prev.filter((p) => p !== practiceId) : [...prev, practiceId]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await apiClient.post('/auth/register', {
        name,
        email,
        password,
        role,
        ...(role === 'staff' ? { assignedPracticeIds } : {}),
      });
      onCreated(res.data.user);
      showToast(`${name} was added to the team`);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not create the account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(16,22,43,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="surface-card"
        style={{ width: 380, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Add team member</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Full name *</label>
            <input required placeholder="Jordan Reyes" value={name} onChange={(e) => setName(e.target.value)} className="input-control" />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input required type="email" placeholder="name@billvolt.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input-control" />
          </div>
          <div>
            <label style={labelStyle}>Temporary password *</label>
            <input required type="password" placeholder="Set a temporary password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-control" />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'staff')} className="select-control" style={{ width: '100%' }}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {role === 'staff' && (
            <div>
              <label style={labelStyle}>Practices this user can see</label>
              <div
                className="surface-card"
                style={{ border: '1px solid var(--border)', padding: '8px 10px', borderRadius: 'var(--radius)', maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                {practices.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>No practices yet.</p>
                ) : (
                  practices.map((p) => (
                    <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px', borderRadius: 6, cursor: 'pointer', fontSize: 13.5 }}>
                      <input
                        type="checkbox"
                        checked={assignedPracticeIds.includes(p._id)}
                        onChange={() => togglePractice(p._id)}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      {p.groupName}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {error && <p style={{ fontSize: 13, color: 'var(--status-denied)', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={isSubmitting} style={buttonStyle(isSubmitting)}>
            {isSubmitting ? 'Adding…' : 'Add member'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6,
};

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '11px', fontSize: 14, fontWeight: 600, color: '#fff',
  background: disabled ? 'var(--text-muted)' : 'var(--accent)', border: 'none',
  borderRadius: 'var(--radius)', cursor: disabled ? 'not-allowed' : 'pointer', marginTop: 4,
});