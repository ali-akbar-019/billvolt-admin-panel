import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { LogoutDialog } from './LogoutDialog';
import type { LogoutReason } from './LogoutDialog';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';

export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [logoutReason, setLogoutReason] = useState<LogoutReason | null>(null);

  const { reset: resetSessionTimer } = useSessionTimeout(
    useCallback(() => setLogoutReason('timeout'), [])
  );

  const handleLogoutDialogCancel = () => {
    const reason = logoutReason;

    setLogoutReason(null);

    if (reason === 'timeout') {
      resetSessionTimer();
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div
        className={`sidebar-backdrop${isSidebarOpen ? ' is-open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <div className="app-shell-content">
        <Topbar
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogoutClick={() => setLogoutReason('manual')}
        />

        <main className="app-main">
          <div className="app-content">
            <Outlet />
          </div>
        </main>
      </div>

      {logoutReason && (
        <LogoutDialog
          reason={logoutReason}
          onCancel={handleLogoutDialogCancel}
        />
      )}
    </div>
  );
}

const shellStyles = `
  .app-shell {
    min-height: 100vh;
    width: 100%;
    display: flex;
    background: var(--bg-page);
  }

  .app-shell-content {
    flex: 1;
    min-width: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-main {
    flex: 1;
    min-width: 0;
    padding: 28px 32px 40px;
    background: var(--bg-page);
  }

  .app-content {
    width: 100%;
    max-width: 1480px;
    margin: 0 auto;
  }

  .sidebar-backdrop {
    display: none;
  }

  @media (max-width: 1100px) {
    .app-main {
      padding: 24px;
    }
  }

  @media (max-width: 768px) {
    .app-main {
      padding: 20px 16px 32px;
    }

    /*
     * IMPORTANT:
     * The backdrop must be BELOW the sidebar.
     */
    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      z-index: 40;
      display: block;
      background: rgba(15, 23, 42, 0.32);
      backdrop-filter: blur(3px);
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
      transition:
        opacity 180ms ease,
        visibility 180ms ease;
    }

    .sidebar-backdrop.is-open {
      opacity: 1;
      pointer-events: auto;
      visibility: visible;
    }

    /*
     * Sidebar must ALWAYS be above the backdrop.
     */
    .app-shell-sidebar {
      z-index: 50 !important;
    }
  }
`;
if (typeof document !== 'undefined') {
  const styleId = 'app-shell-inline-styles';

  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = shellStyles;
    document.head.appendChild(style);
  }
}