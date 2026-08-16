import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Building2,
  Users as UsersIcon,
  ShieldCheck,
  UserCheck,
  Search,
  MoreHorizontal,
  ChevronDown,
  X,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AddUserModal } from '../components/AddUserModal';
import type { User, Practice } from '../types';

const roleBadge = (role: string) => ({
  background:
    role === 'admin'
      ? 'var(--accent-tint)'
      : 'var(--status-not-started-tint)',
  color:
    role === 'admin'
      ? 'var(--accent)'
      : 'var(--text-secondary)',
});

const statusBadge = (status: string) => ({
  background:
    status === 'active'
      ? 'var(--status-approved-tint)'
      : 'var(--status-denied-tint)',
  color:
    status === 'active'
      ? 'var(--status-approved)'
      : 'var(--status-denied)',
});

export function Users() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchUsers = () => {
    setIsLoading(true);

    apiClient
      .get('/users')
      .then((res) => setUsers(res.data.users))
      .catch(() => showToast('Could not load users', 'error'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    apiClient
      .get('/practices', { params: { limit: 100 } })
      .then((res) => setPractices(res.data.practices))
      .catch(() =>
        showToast(
          'Could not load practices for assignment',
          'error'
        )
      );
  }, []);

  const updateUser = async (
    id: string,
    payload: Partial<
      Pick<User, 'role' | 'status' | 'assignedPracticeIds'>
    >
  ) => {
    setBusyId(id);

    try {
      const res = await apiClient.patch(`/users/${id}`, payload);

      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? res.data.user : u
        )
      );

      showToast('User updated');
    } catch (err: any) {
      showToast(
        err?.response?.data?.error || 'Update failed',
        'error'
      );
    } finally {
      setBusyId(null);
    }
  };

  const togglePractice = (
    userId: string,
    practiceId: string
  ) => {
    const target = users.find(
      (u) => u._id === userId
    );

    if (!target) return;

    const current =
      target.assignedPracticeIds || [];

    const next = current.includes(practiceId)
      ? current.filter(
        (p) => p !== practiceId
      )
      : [...current, practiceId];

    updateUser(userId, {
      assignedPracticeIds: next,
    });
  };

  const deleteUser = async (id: string) => {
    const target = users.find(
      (u) => u._id === id
    );

    if (!target) return;

    if (
      !confirm(
        `Remove ${target.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setBusyId(id);

    try {
      await apiClient.delete(`/users/${id}`);

      setUsers((prev) =>
        prev.filter(
          (u) => u._id !== id
        )
      );

      showToast('User removed');
    } catch (err: any) {
      showToast(
        err?.response?.data?.error ||
        'Delete failed',
        'error'
      );
    } finally {
      setBusyId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return users;

    return users.filter(
      (u) =>
        u.name
          .toLowerCase()
          .includes(query) ||
        u.email
          .toLowerCase()
          .includes(query) ||
        u.role
          .toLowerCase()
          .includes(query) ||
        u.status
          .toLowerCase()
          .includes(query)
    );
  }, [users, search]);

  const activeUsers = users.filter(
    (u) => u.status === 'active'
  ).length;

  const adminUsers = users.filter(
    (u) => u.role === 'admin'
  ).length;

  const staffUsers = users.filter(
    (u) => u.role === 'staff'
  ).length;

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <div className="users-heading">
          <div className="users-title-row">
            <div className="users-title-icon">
              <UsersIcon size={19} />
            </div>

            <h1 className="users-title">
              User management
            </h1>
          </div>

          <p className="users-subtitle">
            Manage staff accounts, permissions, and practice access.
          </p>
        </div>

        <button
          className="users-primary-btn"
          onClick={() =>
            setShowModal(true)
          }
        >
          <Plus size={16} />
          Add user
        </button>
      </div>

      {/* Stats */}
      <div className="users-stats">
        <MiniStat
          icon={<UsersIcon size={16} />}
          label="Total users"
          value={users.length}
        />

        <MiniStat
          icon={<UserCheck size={16} />}
          label="Active"
          value={activeUsers}
        />

        <MiniStat
          icon={<ShieldCheck size={16} />}
          label="Administrators"
          value={adminUsers}
        />

        <MiniStat
          icon={<Building2 size={16} />}
          label="Staff"
          value={staffUsers}
        />
      </div>

      {/* Main card */}
      <div className="surface-card users-card">
        {/* Toolbar */}
        <div className="users-toolbar">
          <div className="users-search">
            <Search size={16} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search users..."
            />

            {search && (
              <button
                type="button"
                className="users-search-clear"
                onClick={() =>
                  setSearch('')
                }
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <span className="users-result-count">
            {filteredUsers.length} of{' '}
            {users.length} users
          </span>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="users-loading">
            Loading users…
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            hasSearch={Boolean(search)}
            onAdd={() =>
              setShowModal(true)
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Practice access</th>
                  <th>Status</th>
                  <th>Last login</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrent =
                    u._id ===
                    currentUser?._id;

                  const isBusy =
                    busyId === u._id;

                  const assignedCount =
                    (
                      u.assignedPracticeIds ||
                      []
                    ).length;

                  return (
                    <tr
                      key={u._id}
                      className={
                        isBusy
                          ? 'users-row users-row-busy'
                          : 'users-row'
                      }
                    >
                      {/* User */}
                      <td className="users-user-cell">
                        <div className="users-user">
                          <Avatar
                            name={u.name}
                          />

                          <div className="users-user-info">
                            <div className="users-name-row">
                              <span className="users-name">
                                {u.name}
                              </span>

                              {isCurrent && (
                                <span className="users-you">
                                  You
                                </span>
                              )}
                            </div>

                            <span className="users-email">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td>
                        <select
                          value={u.role}
                          disabled={
                            isCurrent ||
                            isBusy
                          }
                          onChange={(e) =>
                            updateUser(
                              u._id,
                              {
                                role: e.target
                                  .value as User['role'],
                              }
                            )
                          }
                          className="users-role-select"
                          style={roleBadge(
                            u.role
                          )}
                        >
                          <option value="staff">
                            Staff
                          </option>

                          <option value="admin">
                            Admin
                          </option>
                        </select>
                      </td>

                      {/* Practice access */}
                      <td>
                        {u.role ===
                          'admin' ? (
                          <span className="users-all-practices">
                            <Building2
                              size={14}
                            />
                            All practices
                          </span>
                        ) : (
                          <div className="users-practice-wrapper">
                            <button
                              type="button"
                              disabled={
                                isBusy
                              }
                              className="users-practice-btn"
                              onClick={() =>
                                setAssigningId(
                                  assigningId ===
                                    u._id
                                    ? null
                                    : u._id
                                )
                              }
                            >
                              <Building2
                                size={14}
                              />

                              <span>
                                {assignedCount ===
                                  0
                                  ? 'No practices'
                                  : `${assignedCount} ${assignedCount ===
                                    1
                                    ? 'practice'
                                    : 'practices'
                                  }`}
                              </span>

                              <ChevronDown
                                size={13}
                              />
                            </button>

                            {assigningId ===
                              u._id && (
                                <PracticePopover
                                  user={u}
                                  practices={
                                    practices
                                  }
                                  onToggle={
                                    togglePractice
                                  }
                                  onClose={() =>
                                    setAssigningId(
                                      null
                                    )
                                  }
                                />
                              )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <button
                          type="button"
                          disabled={
                            isCurrent ||
                            isBusy
                          }
                          onClick={() =>
                            updateUser(
                              u._id,
                              {
                                status:
                                  u.status ===
                                    'active'
                                    ? 'disabled'
                                    : 'active',
                              }
                            )
                          }
                          className="users-status-btn"
                          style={statusBadge(
                            u.status
                          )}
                        >
                          <span className="users-status-dot" />
                          {u.status}
                        </button>
                      </td>

                      {/* Last login */}
                      <td className="users-last-login">
                        {u.lastLoginAt
                          ? formatDate(
                            u.lastLoginAt
                          )
                          : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="users-actions">
                        {!isCurrent ? (
                          <button
                            type="button"
                            onClick={() =>
                              deleteUser(
                                u._id
                              )
                            }
                            disabled={isBusy}
                            className="users-delete-btn"
                            aria-label={`Remove ${u.name}`}
                          >
                            <Trash2
                              size={15}
                            />
                          </button>
                        ) : (
                          <MoreHorizontal
                            size={17}
                            className="users-more-icon"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AddUserModal
          onClose={() =>
            setShowModal(false)
          }
          onCreated={(u) =>
            setUsers((prev) => [
              u,
              ...prev,
            ])
          }
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="surface-card users-stat">
      <div className="users-stat-icon">
        {icon}
      </div>

      <div>
        <p className="users-stat-label">
          {label}
        </p>

        <p className="users-stat-value tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

function Avatar({
  name,
}: {
  name: string;
}) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="users-avatar">
      {initials}
    </div>
  );
}

function PracticePopover({
  user,
  practices,
  onToggle,
  onClose,
}: {
  user: User;
  practices: Practice[];
  onToggle: (
    userId: string,
    practiceId: string
  ) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="users-practice-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="users-practice-popover"
        role="dialog"
        aria-label="Practice access"
      >
        <div className="users-popover-header">
          <div>
            <p className="users-popover-title">
              Practice access
            </p>

            <p className="users-popover-subtitle">
              Choose which practices this user can access.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="users-popover-close"
            aria-label="Close practice access"
          >
            <X size={15} />
          </button>
        </div>

        <div className="users-practice-list">
          {practices.length === 0 ? (
            <div className="users-no-practices">
              No practices available.
            </div>
          ) : (
            practices.map(
              (practice) => {
                const checked = (
                  user.assignedPracticeIds ||
                  []
                ).includes(
                  practice._id
                );

                return (
                  <label
                    key={practice._id}
                    className="users-practice-option"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onToggle(
                          user._id,
                          practice._id
                        )
                      }
                    />

                    <Building2
                      size={14}
                    />

                    <span>
                      {
                        practice.groupName
                      }
                    </span>
                  </label>
                );
              }
            )
          )}
        </div>

        <div className="users-popover-footer">
          <button
            type="button"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}

function EmptyState({
  hasSearch,
  onAdd,
}: {
  hasSearch: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="users-empty">
      <div className="users-empty-icon">
        <UsersIcon size={21} />
      </div>

      <p className="users-empty-title">
        {hasSearch
          ? 'No users found'
          : 'No users yet'}
      </p>

      <p className="users-empty-text">
        {hasSearch
          ? 'Try searching with a different name, email, or role.'
          : 'Add your first staff member to start managing portal access.'}
      </p>

      {!hasSearch && (
        <button
          type="button"
          className="users-primary-btn"
          onClick={onAdd}
        >
          <Plus size={15} />
          Add user
        </button>
      )}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(
    date
  ).toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
}