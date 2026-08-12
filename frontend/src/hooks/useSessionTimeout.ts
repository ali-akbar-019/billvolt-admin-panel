import { useCallback, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';

const DEFAULT_TIMEOUT_MINUTES = 30;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'click', 'scroll', 'touchstart'];

/**
 * Signs the user out after `sessionTimeoutMinutes` of inactivity (from
 * GET /api/settings, default 30). Resets the clock on any user activity and
 * calls `onTimeout` when the session expires so the app can show the
 * auto-logout dialog.
 */
export function useSessionTimeout(onTimeout: () => void) {
  const timerRef = useRef<number | null>(null);
  const minutesRef = useRef(DEFAULT_TIMEOUT_MINUTES);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const startTimer = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      () => onTimeoutRef.current(),
      minutesRef.current * 60 * 1000
    );
  }, []);

  const reset = useCallback(() => startTimer(), [startTimer]);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get('/settings')
      .then((res) => {
        const minutes = Number(res.data?.settings?.sessionTimeoutMinutes);
        if (Number.isFinite(minutes) && minutes >= 1) minutesRef.current = minutes;
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) startTimer();
      });

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, startTimer, { passive: true }));

    return () => {
      cancelled = true;
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, startTimer));
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  return { reset };
}
