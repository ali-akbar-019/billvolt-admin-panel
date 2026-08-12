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
    if (reason === 'timeout') resetSessionTimer();
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div
        className={`sidebar-backdrop${isSidebarOpen ? ' is-open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} onLogoutClick={() => setLogoutReason('manual')} />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
      {logoutReason && (
        <LogoutDialog reason={logoutReason} onCancel={handleLogoutDialogCancel} />
      )}
    </div>
  );
}
