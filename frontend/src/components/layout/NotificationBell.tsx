import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarClock,
  ChevronRight,
  Clock3,
} from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownTop, setDropdownTop] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  /* ---------------------------------------------------------
     Responsive breakpoint
  --------------------------------------------------------- */

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    updateViewport();

    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  /* ---------------------------------------------------------
     Keep mobile dropdown positioned below the trigger
  --------------------------------------------------------- */

  const updateDropdownPosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();

    setDropdownTop(rect.bottom + 10);
  };

  useEffect(() => {
    if (!isOpen || !isMobile) return;

    updateDropdownPosition();

    const handleResize = () => {
      updateDropdownPosition();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, isMobile]);

  /* ---------------------------------------------------------
     Notification count
  --------------------------------------------------------- */

  const refreshCount = () => {
    apiClient
      .get('/followups/counts')
      .then((res) => {
        setCount((res.data.today || 0) + (res.data.overdue || 0));
      })
      .catch(() => { });
  };

  useEffect(() => {
    refreshCount();

    const interval = setInterval(refreshCount, 60000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------------------------------------------------
     Click outside
  --------------------------------------------------------- */

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /* ---------------------------------------------------------
     Open notifications
  --------------------------------------------------------- */

  const toggleOpen = () => {
    if (!isOpen) {
      if (isMobile) {
        updateDropdownPosition();
      }

      setIsLoading(true);

      Promise.all([
        apiClient.get('/followups', {
          params: {
            bucket: 'overdue',
            limit: 5,
          },
        }),

        apiClient.get('/followups', {
          params: {
            bucket: 'today',
            limit: 5,
          },
        }),
      ])
        .then(([overdue, today]) => {
          setItems([
            ...overdue.data.followUps,
            ...today.data.followUps,
          ]);
        })
        .catch(() => {
          setItems([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    setIsOpen((value) => !value);
  };

  const overdueItems = items.filter(
    (item) => Boolean(item.daysOverdue)
  );

  const todayItems = items.filter(
    (item) => !item.daysOverdue
  );

  /* ---------------------------------------------------------
     Dropdown responsive styles
  --------------------------------------------------------- */

  const dropdownStyle: CSSProperties = {
    ...styles.dropdown,

    ...(isMobile
      ? {
        position: 'fixed',
        top: dropdownTop,
        left: 12,
        right: 12,
        width: 'auto',
        maxWidth: 'none',
        maxHeight: 'calc(100vh - 90px)',
      }
      : {}),
  };

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      {/* Notification trigger */}

      <button
        ref={triggerRef}
        onClick={toggleOpen}
        aria-label="Notifications"
        aria-expanded={isOpen}
        style={{
          ...styles.trigger,
          ...(isOpen ? styles.triggerActive : {}),
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background =
              'var(--bg-surface-2)';
            e.currentTarget.style.borderColor =
              'var(--border-strong)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--border)';
          }
        }}
      >
        <Bell
          size={17}
          strokeWidth={1.9}
          style={{
            transform: isOpen
              ? 'rotate(-8deg)'
              : 'none',
            transition: 'transform 160ms ease',
          }}
        />

        {count > 0 && (
          <span
            className="tabular-nums"
            style={styles.badge}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}

      {isOpen && (
        <div
          className="surface-card"
          style={dropdownStyle}
        >
          {/* Header */}

          <div style={styles.header}>
            <div style={styles.headerText}>
              <h3 style={styles.title}>
                Notifications
              </h3>

              <p style={styles.subtitle}>
                {count > 0
                  ? `${count} item${count === 1 ? '' : 's'
                  } need attention`
                  : 'Everything is up to date'}
              </p>
            </div>

            <div style={styles.headerIcon}>
              <Bell size={15} />
            </div>
          </div>

          <div style={styles.divider} />

          {/* Content */}

          <div style={styles.content}>
            {isLoading ? (
              <div style={styles.loading}>
                <div style={styles.spinner} />

                <span>
                  Checking follow-ups…
                </span>
              </div>
            ) : items.length === 0 ? (
              <div style={styles.empty}>
                <div style={styles.emptyIcon}>
                  <Bell
                    size={20}
                    strokeWidth={1.7}
                  />
                </div>

                <p style={styles.emptyTitle}>
                  You're all caught up
                </p>

                <p style={styles.emptyText}>
                  There are no overdue or due-today
                  follow-ups.
                </p>
              </div>
            ) : (
              <>
                {/* Overdue */}

                {overdueItems.length > 0 && (
                  <NotificationSection
                    title="Overdue"
                    icon={<Clock3 size={14} />}
                    count={overdueItems.length}
                    tone="danger"
                    items={overdueItems}
                  />
                )}

                {/* Today */}

                {todayItems.length > 0 && (
                  <NotificationSection
                    title="Due today"
                    icon={<CalendarClock size={14} />}
                    count={todayItems.length}
                    tone="accent"
                    items={todayItems}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer */}

          <div style={styles.footer}>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/follow-ups');
              }}
              style={styles.viewAllButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'var(--accent-tint)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  'transparent';
              }}
            >
              <span>
                View all follow-ups
              </span>

              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Notification Section
============================================================ */

interface NotificationSectionProps {
  title: string;
  icon: ReactNode;
  count: number;
  tone: 'danger' | 'accent';
  items: FollowUp[];
}

function NotificationSection({
  title,
  icon,
  count,
  tone,
  items,
}: NotificationSectionProps) {
  const toneStyles =
    tone === 'danger'
      ? {
        color: 'var(--status-denied)',
        background: 'var(--status-denied-tint)',
      }
      : {
        color: 'var(--accent)',
        background: 'var(--accent-tint)',
      };

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitleGroup}>
          <span
            style={{
              ...styles.sectionIcon,
              color: toneStyles.color,
              background: toneStyles.background,
            }}
          >
            {icon}
          </span>

          <span style={styles.sectionTitle}>
            {title}
          </span>

          <span
            className="tabular-nums"
            style={{
              ...styles.sectionCount,
              color: toneStyles.color,
              background: toneStyles.background,
            }}
          >
            {count}
          </span>
        </div>
      </div>

      <div style={styles.items}>
        {items.map((item) => (
          <div key={item._id} style={styles.item}>
            <div style={styles.itemDot} />

            <div style={styles.itemContent}>
              <p style={styles.itemTitle}>
                {item.title}
              </p>

              <p
                style={{
                  ...styles.itemMeta,
                  color: item.daysOverdue
                    ? 'var(--status-denied)'
                    : 'var(--text-muted)',
                }}
              >
                {item.daysOverdue
                  ? `${item.daysOverdue} day${item.daysOverdue === 1
                    ? ''
                    : 's'
                  } overdue`
                  : 'Due today'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Styles
============================================================ */

const styles: Record<string, CSSProperties> = {
  wrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  trigger: {
    position: 'relative',
    width: 36,
    height: 36,
    flexShrink: 0,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    background: 'transparent',
    padding: 0,
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition:
      'background 150ms ease, border-color 150ms ease',
  },

  triggerActive: {
    background: 'var(--accent-tint)',
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
  },

  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    background: 'var(--status-denied)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    border: '2px solid var(--bg-surface)',
    lineHeight: 1,
    boxSizing: 'border-box',
  },

  dropdown: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 10px)',
    width: 360,
    maxWidth: 'calc(100vw - 24px)',
    padding: 0,
    zIndex: 1000,
    overflow: 'hidden',
    boxShadow:
      '0 14px 38px rgba(16, 22, 43, 0.14)',
    border: '1px solid var(--border)',
    boxSizing: 'border-box',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '16px 16px 14px',
  },

  headerText: {
    minWidth: 0,
    flex: 1,
  },

  title: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)',
  },

  subtitle: {
    margin: '3px 0 0',
    fontSize: 12.5,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },

  headerIcon: {
    width: 32,
    height: 32,
    flexShrink: 0,
    borderRadius: 9,
    background: 'var(--accent-tint)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  divider: {
    height: 1,
    background: 'var(--border)',
  },

  content: {
    maxHeight: 390,
    overflowY: 'auto',
    padding: '12px 10px',
    overscrollBehavior: 'contain',
  },

  section: {
    marginBottom: 12,
  },

  sectionHeader: {
    padding: '4px 6px 7px',
  },

  sectionTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },

  sectionIcon: {
    width: 25,
    height: 25,
    flexShrink: 0,
    borderRadius: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.045em',
  },

  sectionCount: {
    minWidth: 20,
    height: 20,
    flexShrink: 0,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 6px',
    fontSize: 10.5,
    fontWeight: 700,
  },

  items: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },

  item: {
    display: 'flex',
    gap: 10,
    minWidth: 0,
    padding: '10px 9px',
    borderRadius: 9,
    transition: 'background 120ms ease',
  },

  itemDot: {
    width: 6,
    height: 6,
    flexShrink: 0,
    borderRadius: '50%',
    background: 'var(--accent)',
    marginTop: 6,
  },

  itemContent: {
    minWidth: 0,
    flex: 1,
    overflow: 'hidden',
  },

  itemTitle: {
    margin: 0,
    fontSize: 13.5,
    fontWeight: 550,
    color: 'var(--text-primary)',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  itemMeta: {
    margin: '3px 0 0',
    fontSize: 11.5,
    fontWeight: 500,
    lineHeight: 1.4,
  },

  loading: {
    minHeight: 150,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    color: 'var(--text-muted)',
    fontSize: 13,
  },

  spinner: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: '2px solid var(--border)',
    borderTopColor: 'var(--accent)',
    animation: 'spin 0.8s linear infinite',
  },

  empty: {
    padding: '28px 18px',
    textAlign: 'center',
  },

  emptyIcon: {
    width: 42,
    height: 42,
    margin: '0 auto 10px',
    borderRadius: 12,
    background: 'var(--bg-surface-2)',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    margin: '0 0 4px',
    fontSize: 13.5,
    fontWeight: 650,
    color: 'var(--text-primary)',
  },

  emptyText: {
    margin: 0,
    fontSize: 12,
    lineHeight: 1.5,
    color: 'var(--text-muted)',
  },

  footer: {
    borderTop: '1px solid var(--border)',
    padding: 8,
  },

  viewAllButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '9px 10px',
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    color: 'var(--accent)',
    fontSize: 12.5,
    fontWeight: 650,
    cursor: 'pointer',
    transition: 'background 120ms ease',
  },
};