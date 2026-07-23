import { useAuth } from '../context/AuthContext';

// Basic placeholder — stat cards and charts land once the layout is confirmed working.
export function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={{ fontSize: 24, margin: '0 0 4px' }}>
        Welcome back, {user?.name?.split(' ')[0]}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
        Dashboard content coming soon.
      </p>
    </div>
  );
}
