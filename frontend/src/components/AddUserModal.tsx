import { useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { User } from '../types';

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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await apiClient.post('/auth/register', { name, email, password, role });
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
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)', width: 360, padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Add team member</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input required type="password" placeholder="Temporary password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'staff')} style={inputStyle}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>

          {error && <p style={{ fontSize: 13, color: 'var(--status-denied)', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={isSubmitting} style={buttonStyle(isSubmitting)}>
            {isSubmitting ? 'Adding…' : 'Add member'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: 14,
  border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)',
  outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
};

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '11px', fontSize: 14, fontWeight: 500, color: '#fff',
  background: disabled ? 'var(--text-muted)' : 'var(--accent)', border: 'none',
  borderRadius: 'var(--radius)', cursor: disabled ? 'not-allowed' : 'pointer', marginTop: 4,
});
