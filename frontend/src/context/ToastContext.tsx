import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  variant: 'success' | 'error';
}

interface ToastContextValue {
  showToast: (
    message: string,
    variant?: Toast['variant'],
  ) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(
  undefined,
);

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id),
    );
  }, []);

  const showToast = useCallback(
    (
      message: string,
      variant: Toast['variant'] = 'success',
    ) => {
      const id = ++nextId.current;

      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          variant,
        },
      ]);
    },
    [],
  );

  /*
   * Automatically remove each toast after 3.5 seconds.
   */
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        removeToast(toast.id);
      }, 3500),
    );

    return () => {
      timers.forEach((timer) =>
        window.clearTimeout(timer),
      );
    };
  }, [toasts, removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div
        className="billvolt-toast-container"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.variant === 'success';

          return (
            <div
              key={toast.id}
              className={`billvolt-toast ${isSuccess
                  ? 'billvolt-toast-success'
                  : 'billvolt-toast-error'
                }`}
              role={
                isSuccess
                  ? 'status'
                  : 'alert'
              }
            >
              <div className="billvolt-toast-icon">
                {isSuccess ? (
                  <CheckCircle2
                    size={18}
                    strokeWidth={2}
                  />
                ) : (
                  <AlertCircle
                    size={18}
                    strokeWidth={2}
                  />
                )}
              </div>

              <div className="billvolt-toast-content">
                <span className="billvolt-toast-message">
                  {toast.message}
                </span>
              </div>

              <button
                type="button"
                className="billvolt-toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
              >
                <X
                  size={15}
                  strokeWidth={2}
                />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        .billvolt-toast-container {
          position: fixed;
          right: 20px;
          bottom: 20px;

          z-index: 9999;

          width: min(380px, calc(100vw - 32px));

          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 10px;

          pointer-events: none;
        }

        .billvolt-toast {
          position: relative;

          width: 100%;
          min-width: 0;

          display: flex;
          align-items: center;
          gap: 11px;

          padding: 12px 12px 12px 13px;

          border: 1px solid transparent;
          border-radius: 10px;

          box-shadow:
            0 12px 30px rgba(16, 22, 43, 0.12),
            0 2px 8px rgba(16, 22, 43, 0.06);

          font-family: inherit;
          font-size: 13px;
          line-height: 1.4;
          font-weight: 500;

          pointer-events: auto;

          animation:
            billvolt-toast-in 0.22s
            cubic-bezier(0.22, 1, 0.36, 1);

          overflow: hidden;
        }

        .billvolt-toast-success {
          background: var(--status-approved);
          border-color: var(--status-approved);
          color: #fff;
        }

        .billvolt-toast-error {
          background: var(--status-denied);
          border-color: var(--status-denied);
          color: #fff;
        }

        .billvolt-toast-icon {
          width: 20px;
          height: 20px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;
        }

        .billvolt-toast-content {
          min-width: 0;
          flex: 1;

          display: flex;
          align-items: center;
        }

        .billvolt-toast-message {
          min-width: 0;

          display: block;

          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .billvolt-toast-close {
          width: 28px;
          height: 28px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          padding: 0;

          border: 0;
          border-radius: 6px;

          background: transparent;
          color: rgba(255, 255, 255, 0.78);

          cursor: pointer;

          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .billvolt-toast-close:hover {
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
        }

        .billvolt-toast-close:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.9);
          outline-offset: 1px;
        }

        @keyframes billvolt-toast-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 600px) {
          .billvolt-toast-container {
            right: 12px;
            bottom: 12px;

            width: calc(100vw - 24px);

            gap: 8px;
          }

          .billvolt-toast {
            padding: 11px 10px 11px 12px;

            border-radius: 9px;

            font-size: 12.5px;
          }
        }

        @media (max-width: 380px) {
          .billvolt-toast-container {
            right: 8px;
            bottom: 8px;

            width: calc(100vw - 16px);
          }

          .billvolt-toast {
            gap: 8px;
            padding: 10px 9px 10px 10px;
          }

          .billvolt-toast-icon {
            width: 18px;
            height: 18px;
          }

          .billvolt-toast-icon svg {
            width: 16px;
            height: 16px;
          }

          .billvolt-toast-close {
            width: 26px;
            height: 26px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .billvolt-toast {
            animation: none;
          }

          .billvolt-toast-close {
            transition: none;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error(
      'useToast must be used within ToastProvider',
    );
  }

  return ctx;
}