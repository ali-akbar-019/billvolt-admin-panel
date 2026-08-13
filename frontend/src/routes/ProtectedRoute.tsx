import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <>
        <style>
          {`
            .billvolt-auth-loading {
              min-height: 100dvh;
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              box-sizing: border-box;
              background: var(--bg-page, #f8f9fb);
            }

            .billvolt-auth-loading-card {
              width: min(100%, 320px);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 14px;
              padding: 28px 24px;
              box-sizing: border-box;
              background: var(--bg-surface, #ffffff);
              border: 1px solid var(--border, #e7e9ee);
              border-radius: var(--radius-lg, 12px);
              box-shadow: var(--shadow-card, 0 8px 30px rgba(16, 22, 43, 0.06));
            }

            .billvolt-auth-loading-icon {
              width: 38px;
              height: 38px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--accent);
            }

            .billvolt-auth-loading-spinner {
              animation: billvolt-auth-spin 0.85s linear infinite;
            }

            .billvolt-auth-loading-title {
              margin: 0;
              color: var(--text-primary);
              font-family: var(--font-display, inherit);
              font-size: 14px;
              line-height: 1.4;
              font-weight: 600;
              text-align: center;
            }

            .billvolt-auth-loading-subtitle {
              margin: -7px 0 0;
              color: var(--text-muted);
              font-size: 12px;
              line-height: 1.5;
              text-align: center;
            }

            @keyframes billvolt-auth-spin {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .billvolt-auth-loading-spinner {
                animation: none;
              }
            }

            @media (max-width: 480px) {
              .billvolt-auth-loading {
                padding: 16px;
              }

              .billvolt-auth-loading-card {
                padding: 24px 18px;
                border-radius: var(--radius, 8px);
              }
            }
          `}
        </style>

        <div
          className="billvolt-auth-loading"
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <div className="billvolt-auth-loading-card">
            <div className="billvolt-auth-loading-icon">
              <LoaderCircle
                size={30}
                strokeWidth={2}
                className="billvolt-auth-loading-spinner"
              />
            </div>

            <p className="billvolt-auth-loading-title">
              Loading your workspace
            </p>

            <p className="billvolt-auth-loading-subtitle">
              Please wait while we verify your session.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}