import { useCallback, useEffect, useState } from 'react';

export interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  updatedAt: string;
}

const VISITOR_STORAGE_KEY = 'rsbp_visitor_stats_cache_v1';
const VISITOR_KNOWN_KEY = 'rsbp_visitor_known_v1';
const VISITOR_SYNC_EVENT = 'rsbp-visitors-sync';

let hasRecordedHitThisPageLoad = false;

function readCachedStats(): VisitorStats {
  try {
    const raw = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<VisitorStats>;
      return {
        totalVisits: typeof parsed.totalVisits === 'number' ? parsed.totalVisits : 0,
        uniqueVisitors: typeof parsed.uniqueVisitors === 'number' ? parsed.uniqueVisitors : 0,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
      };
    }
  } catch {
    // Ignore storage errors
  }
  return { totalVisits: 0, uniqueVisitors: 0, updatedAt: '' };
}

function writeCachedStats(stats: VisitorStats) {
  try {
    localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(stats));
    window.dispatchEvent(new CustomEvent(VISITOR_SYNC_EVENT, { detail: stats }));
  } catch {
    // Ignore storage errors
  }
}

export function useVisitorStats(options?: { trackHit?: boolean }) {
  const trackHit = Boolean(options?.trackHit);
  const [stats, setStats] = useState<VisitorStats>(() => readCachedStats());
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch('/api/visitors');
      if (res.ok) {
        const data = (await res.json()) as VisitorStats;
        setStats(data);
        writeCachedStats(data);
      }
    } catch {
      // Keep cached value if offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleSync = (event: Event) => {
      const custom = event as CustomEvent<VisitorStats>;
      if (custom.detail) {
        setStats(custom.detail);
      } else {
        setStats(readCachedStats());
      }
    };
    window.addEventListener(VISITOR_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(VISITOR_SYNC_EVENT, handleSync);
  }, []);

  useEffect(() => {
    let active = true;

    async function syncOnMount() {
      if (trackHit && !hasRecordedHitThisPageLoad) {
        hasRecordedHitThisPageLoad = true;
        let isNewVisitor = false;
        try {
          isNewVisitor = !localStorage.getItem(VISITOR_KNOWN_KEY);
          if (isNewVisitor) {
            localStorage.setItem(VISITOR_KNOWN_KEY, new Date().toISOString());
          }
        } catch {
          isNewVisitor = false;
        }

        try {
          const res = await fetch('/api/visitors/hit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isNewVisitor }),
          });
          if (res.ok) {
            const data = (await res.json()) as VisitorStats;
            if (active) {
              setStats(data);
              writeCachedStats(data);
              setLoading(false);
            }
            return;
          }
        } catch {
          // Fallback to local increment if server unavailable
          const current = readCachedStats();
          const fallback: VisitorStats = {
            totalVisits: current.totalVisits + 1,
            uniqueVisitors: current.uniqueVisitors + (isNewVisitor ? 1 : 0),
            updatedAt: new Date().toISOString(),
          };
          if (active) {
            setStats(fallback);
            writeCachedStats(fallback);
            setLoading(false);
          }
          return;
        }
      }

      if (active) {
        await refreshStats();
      }
    }

    void syncOnMount();

    return () => {
      active = false;
    };
  }, [trackHit, refreshStats]);

  return {
    stats,
    loading,
    refreshStats,
  };
}
