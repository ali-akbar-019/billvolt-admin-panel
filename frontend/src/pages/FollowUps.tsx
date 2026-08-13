import { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  Clock,
  AlertTriangle,
  ClipboardCheck,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

interface FollowUp {
  _id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  daysOverdue?: number;
}

type Bucket = 'overdue' | 'today' | 'upcoming';

const BUCKETS: {
  id: Bucket;
  label: string;
  icon: typeof Bell;
}[] = [
    {
      id: 'overdue',
      label: 'Overdue',
      icon: AlertTriangle,
    },
    {
      id: 'today',
      label: 'Due today',
      icon: Bell,
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      icon: Clock,
    },
  ];

export function FollowUps() {
  const { showToast } = useToast();

  const [bucket, setBucket] = useState<Bucket>('overdue');
  const [items, setItems] = useState<FollowUp[]>([]);
  const [counts, setCounts] = useState({
    today: 0,
    overdue: 0,
    upcoming: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCounts = () => {
    apiClient
      .get('/followups/counts')
      .then((res) => setCounts(res.data))
      .catch(() => { });
  };

  const fetchItems = () => {
    setIsLoading(true);

    apiClient
      .get('/followups', {
        params: {
          bucket,
          limit: 50,
        },
      })
      .then((res) => setItems(res.data.followUps))
      .catch(() => showToast('Could not load follow-ups', 'error'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [bucket]);

  const markComplete = async (item: FollowUp) => {
    try {
      await apiClient.patch(`/followups/${item._id}`, {
        status: 'completed',
      });

      setItems((prev) =>
        prev.filter((followUp) => followUp._id !== item._id)
      );

      fetchCounts();

      showToast('Marked complete');
    } catch {
      showToast('Could not update that follow-up', 'error');
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const priorityLabel = (priority: FollowUp['priority']) => {
    if (priority === 'high') return 'High';
    if (priority === 'medium') return 'Medium';
    return 'Low';
  };

  return (
    <div className="followups-page">
      {/* Header */}

      <div className="followups-header">
        <div>
          <div className="followups-title-row">
            <h1>Follow-ups</h1>

            <span className="followups-count">
              {counts.overdue + counts.today + counts.upcoming}
            </span>
          </div>

          <p>
            Tasks generated from credentialing records that need attention.
          </p>
        </div>
      </div>

      {/* Bucket navigation */}

      <div className="followups-tabs">
        {BUCKETS.map(({ id, label, icon: Icon }) => {
          const active = bucket === id;

          return (
            <button
              key={id}
              className={`followups-tab ${active ? 'active' : ''}`}
              onClick={() => setBucket(id)}
            >
              <span className="followups-tab-icon">
                <Icon size={16} />
              </span>

              <span className="followups-tab-label">{label}</span>

              <span className="followups-tab-count">
                {counts[id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}

      <div className="followups-content">
        {isLoading ? (
          <FollowUpSkeleton />
        ) : items.length === 0 ? (
          <div className="followups-empty">
            <div className="followups-empty-icon">
              <ClipboardCheck size={24} />
            </div>

            <h3>Nothing here</h3>

            <p>
              No {bucket === 'today' ? 'due today' : bucket} follow-ups right
              now.
            </p>
          </div>
        ) : (
          <div className="followups-list">
            {items.map((item) => (
              <div key={item._id} className="followup-row">
                <div
                  className={`followup-priority ${item.priority}`}
                  title={`${priorityLabel(item.priority)} priority`}
                />

                <div className="followup-main">
                  <div className="followup-title-row">
                    <h3>{item.title}</h3>

                    <span
                      className={`followup-priority-label ${item.priority}`}
                    >
                      {priorityLabel(item.priority)}
                    </span>
                  </div>

                  {item.description && (
                    <p className="followup-description">
                      {item.description}
                    </p>
                  )}

                  <div className="followup-meta">
                    <span>
                      <Clock size={13} />
                      Due {formatDate(item.dueDate)}
                    </span>

                    {item.daysOverdue ? (
                      <span className="followup-overdue">
                        <AlertTriangle size={13} />
                        {item.daysOverdue} day
                        {item.daysOverdue === 1 ? '' : 's'} overdue
                      </span>
                    ) : null}

                    {item.assignedTo && (
                      <span>
                        Assigned to {item.assignedTo.name}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="followup-complete"
                  onClick={() => markComplete(item)}
                >
                  <Check size={14} />
                  <span>Done</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FollowUpSkeleton() {
  return (
    <div className="followup-skeleton">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="followup-skeleton-row">
          <div className="followup-skeleton-dot" />

          <div className="followup-skeleton-content">
            <div className="followup-skeleton-title" />
            <div className="followup-skeleton-meta" />
          </div>

          <div className="followup-skeleton-button" />
        </div>
      ))}
    </div>
  );
}