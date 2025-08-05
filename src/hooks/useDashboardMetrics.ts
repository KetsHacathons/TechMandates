import { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { DashboardMetrics } from '@/integrations/api/types';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardMetricsState extends DashboardMetrics {
  loading: boolean;
  error: string | null;
}

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetricsState>({
    total_repositories: 0,
    pending_updates: 0,
    vulnerabilities: 0,
    test_coverage: "0%",
    loading: true,
    error: null,
  });
  const { user } = useAuth();

  const fetchMetrics = async () => {
    if (!user) {
      setMetrics(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setMetrics(prev => ({ ...prev, loading: true, error: null }));

      const dashboardMetrics = await apiClient.getDashboardMetrics();

      setMetrics({
        ...dashboardMetrics,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('Error fetching dashboard metrics:', err);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to fetch dashboard metrics',
      }));
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  return { ...metrics, refetch: fetchMetrics };
}