import { useState, useEffect, useCallback } from 'react';

let isOnline = true;

/**
 * Simple network status hook.
 * Pings Supabase health endpoint periodically to detect connectivity.
 */
export function useNetworkStatus() {
  const [online, setOnline] = useState(isOnline);

  const check = useCallback(async () => {
    try {
      // A lightweight fetch to test connectivity
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      isOnline = true;
      setOnline(true);
    } catch {
      isOnline = false;
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [check]);

  return { isOnline: online, recheckNow: check };
}

/**
 * Get current network status without hook (for use in services).
 */
export function getNetworkStatus(): boolean {
  return isOnline;
}
