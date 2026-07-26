import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AddUserModal } from '../components/AddUserModal';
import type { User } from '../types';

const roleBadge = (role: string) => ({
  background: role === 'admin' ? 'var(--accent-tint)' : 'var(--status-not-started-tint)',
  color: role === 'admin' ? 'var(--accent)' : 'var(--text-secondary)',
});

const statusBadge = (status: string) => ({
  background: status === 'active' ? 'var(--status-approved-tint)' : 'var(--status-denied-tint)',
  color: status === 'active' ? 'var(--status-approved)' : 'var(--status-denied)',
});

const badgeStyle: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 600, padding: '4px 12px', borderRadius: 20, textTransform: 'capitalize',
};

export function Users() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchUsers = () => {
    setIsLoading(true);
    apiClient
      .get('/users')
      .then((res) => setUsers(res.data.users))
      .catch(() => showToast('Could not load users', 'error'))
      .finally(() => setIsLoading(false));
  };

  useEffect(fetchUsers, []);

  const updateUser = async (id: string, payload: Partial<Pick<User, 'role' | 'status'>>) => {
    setBusyId(id);
    try {
      const res = await apiClient.patch(`/users/${id}`, payload);
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data.user : u)));
      showToast('User updated');
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Update failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Remove this user? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await apiClient.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      showToast('User removed');
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Delete failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-page-title)', margin: '0 0 6px' }}>User management</h1>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: 0 }}>
            Manage staff accounts and roles.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius)', padding: '11px 18px', fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Add user
        </button>
      </div>

      <div className="surface-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Loading users…</div>
        ) : (
          <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5, minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Email', 'Role', 'Status', 'Last login', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border)', opacity: busyId === u._id ? 0.5 : 1 }}>
                  <td style={{ padding: '14px 20px', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <select
                      value={u.role}
                      disabled={u._id === currentUser?._id || busyId === u._id}
                      onChange={(e) => updateUser(u._id, { role: e.target.value as User['role'] })}
                      style={{ ...badgeStyle, ...roleBadge(u.role), border: 'none', cursor: 'pointer' }}
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <button
                      disabled={u._id === currentUser?._id || busyId === u._id}
                      onClick={() => updateUser(u._id, { status: u.status === 'active' ? 'disabled' : 'active' })}
                      style={{ ...badgeStyle, ...statusBadge(u.status), border: 'none', cursor: u._id === currentUser?._id ? 'default' : 'pointer' }}
                    >
                      {u.status}
                    </button>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    {u._id !== currentUser?._id && (
                      <button
                        onClick={() => deleteUser(u._id)}
                        disabled={busyId === u._id}
                        aria-label={`Remove ${u.name}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-denied)', display: 'inline-flex' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && (
        <AddUserModal onClose={() => setShowModal(false)} onCreated={(u) => setUsers((prev) => [u, ...prev])} />
      )}
    </div>
  );
}
