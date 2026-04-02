'use client';

import { POSSessionSummary, POSSessionWithRelations } from '@/types/pos-session.types';
import { useCallback, useEffect, useState } from 'react';

interface UseSessionResult {
  session: POSSessionWithRelations | null;
  summary: POSSessionSummary | null;
  loading: boolean;
  error: string | null;
  createSession: (openingCash: number, terminalId?: string) => Promise<POSSessionWithRelations>;
  closeSession: (closingCash: number, notes?: string) => Promise<POSSessionWithRelations>;
  fetchActive: () => Promise<void>;
  fetchSession: (id: string) => Promise<void>;
}

export function usePOSSession(): UseSessionResult {
  const [session, setSession] = useState<POSSessionWithRelations | null>(null);
  const [summary, setSummary] = useState<POSSessionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch active session for current user
   */
  const fetchActive = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pos-sessions/active');
      if (!res.ok) throw new Error('Failed to fetch active session');
      
      const data = await res.json();
      setSession(data.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch specific session by ID
   */
  const fetchSession = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pos-sessions/${id}`);
      if (!res.ok) throw new Error('Failed to fetch session');
      
      const data = await res.json();
      setSession(data.data);

      // Also fetch summary
      const summaryRes = await fetch(`/api/pos-sessions/${id}/summary`);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.data);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new session
   */
  const createSession = useCallback(
    async (openingCash: number, terminalId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/pos-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            openingCashAmount: openingCash,
            terminalId,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create session');
        }

        const data = await res.json();
        setSession(data.data);
        setError(null);
        return data.data;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Close current session
   */
  const closeSession = useCallback(
    async (closingCash: number, notes?: string) => {
      if (!session) throw new Error('No active session');

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/pos-sessions/${session.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            closingCashAmount: closingCash,
            notes,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to close session');
        }

        const data = await res.json();
        setSession(data.data);
        setError(null);
        return data.data;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  // Auto-fetch active session on mount
  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  return {
    session,
    summary,
    loading,
    error,
    createSession,
    closeSession,
    fetchActive,
    fetchSession,
  };
}
