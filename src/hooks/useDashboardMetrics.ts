import { useState, useEffect } from 'react';
import { sqlite } from '@/integrations/sqlite/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardMetrics {
  totalRepositories: number;
  pendingUpdates: number;
  vulnerabilities: number;
  testCoverage: string;
  loading: boolean;
  error: string | null;
}

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRepositories: 0,
    pendingUpdates: 0,
    vulnerabilities: 0,
    testCoverage: "0%",
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

      // Fetch total repositories
      const { data: repositories, error: repoError } = await sqlite
        .from('repositories')
        .select('id')
        .eq('user_id', user.id);

      if (repoError) throw repoError;

      const totalRepositories = repositories?.length || 0;

      // Fetch scan results for this user's repositories
      const { data: scanResults, error: scanError } = await sqlite
        .from('scan_results')
        .select(`
          scan_type,
          severity,
          status,
          coverage_percentage,
          repository_id,
          repositories!inner(user_id)
        `)
        .eq('repositories.user_id', user.id);

      if (scanError) throw scanError;

      // Calculate pending updates (version scan results with open status)
      const pendingUpdates = scanResults?.filter(
        result => result.scan_type === 'version' && result.status === 'open'
      ).length || 0;

      // Calculate vulnerabilities (security scan results with high/critical severity)
      const vulnerabilities = scanResults?.filter(
        result => 
          result.scan_type === 'security' && 
          result.status === 'open' &&
          (result.severity === 'high' || result.severity === 'critical')
      ).length || 0;

      // Calculate average test coverage
      const coverageResults = scanResults?.filter(
        result => result.scan_type === 'coverage' && result.coverage_percentage != null
      ) || [];
      
      const avgCoverage = coverageResults.length > 0
        ? coverageResults.reduce((sum, result) => sum + (result.coverage_percentage || 0), 0) / coverageResults.length
        : 0;

      const testCoverage = `${Math.round(avgCoverage)}%`;

      setMetrics({
        totalRepositories,
        pendingUpdates,
        vulnerabilities,
        testCoverage,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch dashboard metrics',
      }));
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  return { ...metrics, refetch: fetchMetrics };
}