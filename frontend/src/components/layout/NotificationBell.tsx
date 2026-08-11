import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { apiClient } from '../../api/client';

interface FollowUp {
  _id: string;
  title: string;
  dueDate: string;
  daysOverdue?: number;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<FollowUp[]>([]);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const refreshCount = () => {
    apiClient.get('/followups/counts').then((res) => setCount((res.data.today || 0) + (res.data.overdue || 0))).catch(() => { });
  };

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    if (!isOpen) {
      Promise.all([
        apiClient.get('/followups', { params: { bucket: 'overdue', limit: 5 } }),
        apiClient.get('/followups', { params: { bucket: 'today', limit: 5 } }),
      ])
        .then(([overdue, today]) => setItems([...overdue.data.followUps, ...today.data.followUps]))
        .catch(() => setItems([]));
    }
    setIsOpen((v) => !v);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        style={{
          position: 'relative', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          background: 'transparent', padding: '7px 9px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex',
        }}
      >
        <Bell size={16} />
        {count > 0 && (
          <span
            className="tabular-nums"
            style={{
              position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8,
              background: 'var(--status-denied)', color: '#fff', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="surface-card"
          style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 'min(300px, calc(100vw - 32px))', padding: 8, zIndex: 30 }}
        >
          <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '6px 10px' }}>
            Overdue & due today
          </p>
          {items.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '6px 10px' }}>Nothing needs attention right now.</p>
          ) : (
            items.map((item) => (
              <div key={item._id} style={{ padding: '8px 10px', borderRadius: 8 }}>
                <p style={{ fontSize: 13.5, fontWeight: 500, margin: '0 0 2px' }}>{item.title}</p>
                <p style={{ fontSize: 12, color: item.daysOverdue ? 'var(--status-denied)' : 'var(--text-muted)', margin: 0 }}>
                  {item.daysOverdue ? `${item.daysOverdue} day${item.daysOverdue === 1 ? '' : 's'} overdue` : 'Due today'}
                </p>
              </div>
            ))
          )}
          <button
            onClick={() => { setIsOpen(false); navigate('/follow-ups'); }}
            style={{
              width: '100%', marginTop: 6, padding: '8px', fontSize: 13, fontWeight: 600, color: 'var(--accent)',
              background: 'var(--accent-tint)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer',
            }}
          >
            View all follow-ups
          </button>
        </div>
      )}
    </div>
  );
}
