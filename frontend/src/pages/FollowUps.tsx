import { useEffect, useState } from 'react';
import { Bell, Check, Clock, AlertTriangle } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

interface FollowUp {
  _id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  assignedTo?: { _id: string; name: string; email: string };
  daysOverdue?: number;
}

type Bucket = 'overdue' | 'today' | 'upcoming';

const BUCKETS: { id: Bucket; label: string; icon: typeof Bell }[] = [
  { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
  { id: 'today', label: 'Due today', icon: Bell },
  { id: 'upcoming', label: 'Upcoming', icon: Clock },
];

const priorityColor = (priority: string) =>
  priority === 'high' ? 'var(--status-denied)' : priority === 'medium' ? 'var(--status-in-progress)' : 'var(--text-muted)';

export function FollowUps() {
  const { showToast } = useToast();
  const [bucket, setBucket] = useState<Bucket>('overdue');
  const [items, setItems] = useState<FollowUp[]>([]);
  const [counts, setCounts] = useState({ today: 0, overdue: 0, upcoming: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCounts = () => {
    apiClient.get('/followups/counts').then((res) => setCounts(res.data)).catch(() => { });
  };

  const fetchItems = () => {
    setIsLoading(true);
    apiClient
      .get('/followups', { params: { bucket, limit: 50 } })
      .then((res) => setItems(res.data.followUps))
      .catch(() => showToast('Could not load follow-ups', 'error'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchCounts(); }, []);
  useEffect(fetchItems, [bucket]);

  const markComplete = async (item: FollowUp) => {
    try {
      await apiClient.patch(`/followups/${item._id}`, { status: 'completed' });
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      fetchCounts();
      showToast('Marked complete');
    } catch {
      showToast('Could not update that follow-up', 'error');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 'var(--fs-page-title)', margin: '0 0 6px' }}>Follow-ups</h1>
      <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: '0 0 24px' }}>
        Tasks generated from credentialing records that need attention.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {BUCKETS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setBucket(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 'var(--radius-card)',
              border: bucket === id ? '1.5px solid var(--accent)' : '1px solid var(--border-strong)',
              background: bucket === id ? 'var(--accent-tint)' : 'var(--bg-surface)',
              cursor: 'pointer', flex: '1 1 160px',
            }}
          >
            <Icon size={16} color={bucket === id ? 'var(--accent)' : 'var(--text-muted)'} />
            <span style={{ fontSize: 14, fontWeight: 600, color: bucket === id ? 'var(--accent)' : 'var(--text-primary)' }}>{label}</span>
            <span
              className="tabular-nums"
              style={{
                marginLeft: 'auto', fontSize: 13, fontWeight: 700,
                color: bucket === id ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {counts[id]}
            </span>
          </button>
        ))}
      </div>

      <div className="surface-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-small)' }}>
            Loading follow-ups…
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <Bell size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Nothing here</p>
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: 0 }}>
              No {bucket} follow-ups right now.
            </p>
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <div
                key={item._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColor(item.priority), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14.5, fontWeight: 600, margin: '0 0 3px' }}>{item.title}</p>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', margin: 0 }}>
                    Due {new Date(item.dueDate).toLocaleDateString()}
                    {item.daysOverdue ? ` · ${item.daysOverdue} day${item.daysOverdue === 1 ? '' : 's'} overdue` : ''}
                    {item.assignedTo ? ` · ${item.assignedTo.name}` : ''}
                  </p>
                </div>
                <button onClick={() => markComplete(item)} style={completeButtonStyle}>
                  <Check size={14} /> Done
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const completeButtonStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-surface-2)', color: 'var(--text-secondary)',
  border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '7px 12px',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
};
