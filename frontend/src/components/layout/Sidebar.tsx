import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  UserRound,
  ClipboardCheck,
  Bell,
  BarChart3,
  Sparkles,
  Users,
  Settings,
  ScrollText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/practices', label: 'Practices', icon: Building2 },
  { to: '/providers', label: 'Providers', icon: UserRound },
  { to: '/credentialing', label: 'Credentialing grid', icon: ClipboardCheck },
  { to: '/follow-ups', label: 'Follow-ups', icon: Bell },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/ai-assistant', label: 'AI assistant', icon: Sparkles },
];

const ADMIN_ITEMS = [
  { to: '/users', label: 'User management', icon: Users },
  { to: '/audit-log', label: 'Audit log', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  isOpen = false,
  onClose,
}: SidebarProps) {
  const { user } = useAuth();

  const renderLink = (
    to: string,
    label: string,
    Icon: typeof LayoutDashboard,
    isAdmin = false,
  ) => (
    <NavLink
      key={to}
      to={to}
      onClick={onClose}
      className="billvolt-sidebar-link"
    >
      {({ isActive }) => (
        <>
          <span
            className="billvolt-active-indicator"
            style={{
              background: isActive
                ? 'var(--accent)'
                : 'transparent',
            }}
          />

          <span className="billvolt-icon-wrap">
            <Icon
              size={18}
              strokeWidth={isActive ? 2.1 : 1.8}
              style={{
                color: isActive
                  ? 'var(--accent)'
                  : 'var(--text-muted)',
              }}
            />
          </span>

          <span
            className="billvolt-link-label"
            style={{
              color: isActive
                ? 'var(--text-primary)'
                : 'var(--text-secondary)',
            }}
          >
            {label}
          </span>

          {isAdmin && isActive && (
            <span className="billvolt-admin-dot" />
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <>
      <style>
        {`
          /* =====================================================
             SIDEBAR
          ===================================================== */

          .billvolt-sidebar {
            width: 254px;
            height: 100vh;
            height: 100dvh;

            flex: 0 0 254px;

            position: sticky;
            top: 0;

            z-index: 100;

            display: flex;
            flex-direction: column;

            box-sizing: border-box;

            background: var(--bg-surface);
            border-right: 1px solid var(--border);

            padding: 18px 12px;

            overflow: hidden;

            isolation: isolate;

            transition:
              transform 220ms ease,
              box-shadow 220ms ease;
          }


          /* =====================================================
             BRAND
          ===================================================== */

          .billvolt-sidebar-brand {
            display: flex;
            align-items: center;

            gap: 11px;

            height: 46px;

            padding: 0 10px;

            margin-bottom: 18px;

            flex-shrink: 0;
          }


          .billvolt-brand-mark {
            position: relative;

            width: 34px;
            height: 34px;

            flex: 0 0 34px;

            display: flex;
            align-items: center;
            justify-content: center;

            background: var(--accent);
            color: #fff;

            border-radius: 9px;

            font-family: var(--font-display);
            font-size: 14px;
            font-weight: 700;

            box-shadow:
              0 5px 14px rgba(0, 0, 0, 0.08);
          }


          .billvolt-brand-mark::after {
            content: '';

            position: absolute;

            width: 7px;
            height: 7px;

            right: -3px;
            bottom: -3px;

            border-radius: 50%;

            background: var(--status-approved);

            border: 2px solid var(--bg-surface);
          }


          .billvolt-brand-copy {
            min-width: 0;

            display: flex;
            flex-direction: column;
          }


          .billvolt-brand-name {
            color: var(--text-primary);

            font-family: var(--font-display);

            font-size: 16px;
            line-height: 1.15;

            font-weight: 650;

            letter-spacing: -0.025em;
          }


          .billvolt-brand-subtitle {
            margin-top: 3px;

            color: var(--text-muted);

            font-size: 10px;
            line-height: 1;

            font-weight: 500;

            letter-spacing: 0.045em;

            text-transform: uppercase;
          }


          /* =====================================================
             NAVIGATION
          ===================================================== */

          .billvolt-sidebar-section {
            display: flex;
            flex-direction: column;

            gap: 2px;

            flex-shrink: 0;
          }


          .billvolt-sidebar-label {
            padding: 0 11px;

            margin: 0 0 7px;

            color: var(--text-muted);

            font-size: 10px;
            line-height: 1.2;

            font-weight: 700;

            text-transform: uppercase;

            letter-spacing: 0.085em;
          }


          /* =====================================================
             NAV LINK
          ===================================================== */

          .billvolt-sidebar-link {
            position: relative;

            display: flex;
            align-items: center;

            width: 100%;
            min-height: 39px;

            box-sizing: border-box;

            gap: 10px;

            padding: 8px 11px 8px 12px;

            border-radius: 7px;

            text-decoration: none;

            background: transparent;

            font-size: 13.5px;
            line-height: 1.5;

            font-weight: 500;

            overflow: hidden;

            transition:
              background 150ms ease,
              transform 150ms ease;
          }


          .billvolt-sidebar-link:hover {
            background: var(--bg-subtle);
          }


          .billvolt-sidebar-link:hover .billvolt-icon-wrap svg {
            color: var(--text-secondary) !important;
          }


          .billvolt-sidebar-link:active {
            transform: translateY(1px);
          }


          /* =====================================================
             ACTIVE INDICATOR
          ===================================================== */

          .billvolt-active-indicator {
            position: absolute;

            left: 0;
            top: 8px;
            bottom: 8px;

            width: 3px;

            border-radius: 0 3px 3px 0;

            transition: background 160ms ease;
          }


          /* =====================================================
             ICON
          ===================================================== */

          .billvolt-icon-wrap {
            width: 20px;
            height: 20px;

            flex: 0 0 20px;

            display: flex;
            align-items: center;
            justify-content: center;
          }


          .billvolt-link-label {
            min-width: 0;

            flex: 1;

            white-space: nowrap;

            overflow: hidden;

            text-overflow: ellipsis;

            transition: color 150ms ease;
          }


          .billvolt-admin-dot {
            width: 5px;
            height: 5px;

            flex: 0 0 5px;

            border-radius: 50%;

            background: var(--accent);
          }


          /* =====================================================
             DIVIDER
          ===================================================== */

          .billvolt-sidebar-divider {
            height: 1px;

            flex-shrink: 0;

            background: var(--border);

            margin: 17px 10px 15px;
          }


          /* =====================================================
             FOOTER
          ===================================================== */

          .billvolt-sidebar-footer {
            margin-top: auto;

            flex-shrink: 0;

            padding: 13px 10px 2px;
          }


          .billvolt-sidebar-footer-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;

            padding-top: 12px;

            border-top: 1px solid var(--border);
          }


          .billvolt-sidebar-footer-text {
            color: var(--text-muted);

            font-size: 10px;

            font-weight: 500;
          }


          .billvolt-sidebar-footer-dot {
            width: 6px;
            height: 6px;

            flex: 0 0 6px;

            border-radius: 50%;

            background: var(--status-approved);

            box-shadow:
              0 0 0 3px var(--accent-tint);
          }


          /* =====================================================
             TABLET / MOBILE
             
             IMPORTANT:
             Sidebar z-index = 100
             Backdrop should be below it.
          ===================================================== */

          @media (max-width: 900px) {

            .billvolt-sidebar {
              position: fixed;

              left: 0;
              top: 0;
              bottom: 0;

              width: min(280px, 86vw);

              height: 100vh;
              height: 100dvh;

              min-height: 0;

              flex: none;

              z-index: 100;

              transform: translate3d(-105%, 0, 0);

              visibility: hidden;

              box-shadow:
                12px 0 35px rgba(16, 22, 43, 0.16);

              overflow-x: hidden;
              overflow-y: auto;

              /*
               * Hide scrollbar completely.
               */
              scrollbar-width: none;

              -webkit-overflow-scrolling: touch;

              transition:
                transform 220ms cubic-bezier(
                  0.22,
                  1,
                  0.36,
                  1
                ),
                visibility 0s linear 220ms;
            }


            .billvolt-sidebar::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }


            .billvolt-sidebar.is-open {
              transform: translate3d(0, 0, 0);

              visibility: visible;

              transition:
                transform 220ms cubic-bezier(
                  0.22,
                  1,
                  0.36,
                  1
                ),
                visibility 0s linear 0s;
            }


            .billvolt-sidebar-brand {
              margin-bottom: 20px;
            }


            .billvolt-sidebar-link {
              min-height: 42px;

              padding-top: 9px;
              padding-bottom: 9px;

              font-size: 14px;
            }
          }


          /* =====================================================
             SMALL PHONES
          ===================================================== */

          @media (max-width: 480px) {

            .billvolt-sidebar {
              width: min(286px, 88vw);

              padding:
                16px
                11px
                max(16px, env(safe-area-inset-bottom));
            }


            .billvolt-sidebar-brand {
              padding-left: 9px;

              margin-bottom: 18px;
            }


            .billvolt-sidebar-label {
              padding-left: 10px;
            }


            .billvolt-sidebar-link {
              min-height: 41px;

              padding-left: 11px;
              padding-right: 10px;
            }


            .billvolt-sidebar-divider {
              margin-top: 14px;
              margin-bottom: 13px;
            }
          }


          /* =====================================================
             SHORT DESKTOP SCREENS
          ===================================================== */

          @media (max-height: 720px) and (min-width: 901px) {

            .billvolt-sidebar {
              padding-top: 12px;
              padding-bottom: 10px;
            }


            .billvolt-sidebar-brand {
              margin-bottom: 10px;
            }


            .billvolt-sidebar-link {
              min-height: 35px;

              padding-top: 6px;
              padding-bottom: 6px;
            }


            .billvolt-sidebar-divider {
              margin-top: 11px;
              margin-bottom: 10px;
            }


            .billvolt-sidebar-footer {
              padding-top: 8px;
            }
          }
        `}
      </style>

      <aside
        className={`billvolt-sidebar${isOpen ? ' is-open' : ''}`}
        aria-label="Main navigation"
      >
        {/* Brand */}

        <div className="billvolt-sidebar-brand">
          <div className="billvolt-brand-mark">
            B
          </div>

          <div className="billvolt-brand-copy">
            <span className="billvolt-brand-name">
              billvolt
            </span>

            <span className="billvolt-brand-subtitle">
              Admin portal
            </span>
          </div>
        </div>


        {/* Workspace */}

        <nav
          className="billvolt-sidebar-section"
          aria-label="Workspace"
        >
          <div className="billvolt-sidebar-label">
            Workspace
          </div>

          {NAV_ITEMS.map(({ to, label, icon: Icon }) =>
            renderLink(to, label, Icon),
          )}
        </nav>


        {/* Administration */}

        {user?.role === 'admin' && (
          <>
            <div
              className="billvolt-sidebar-divider"
              aria-hidden="true"
            />

            <nav
              className="billvolt-sidebar-section"
              aria-label="Administration"
            >
              <div className="billvolt-sidebar-label">
                Administration
              </div>

              {ADMIN_ITEMS.map(
                ({ to, label, icon: Icon }) =>
                  renderLink(
                    to,
                    label,
                    Icon,
                    true,
                  ),
              )}
            </nav>
          </>
        )}


        {/* Footer */}

        <div className="billvolt-sidebar-footer">
          <div className="billvolt-sidebar-footer-inner">
            <span className="billvolt-sidebar-footer-text">
              BillVolt Operations
            </span>

            <span
              className="billvolt-sidebar-footer-dot"
              title="System operational"
              aria-label="System operational"
            />
          </div>
        </div>
      </aside>
    </>
  );
}