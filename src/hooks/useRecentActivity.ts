import { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityItem {
  id: string;
  type: 'version' | 'security' | 'coverage' | 'general';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  repository?: string;
  repository_id?: string;
  source?: 'database' | 'local'; // Track if this came from DB or localStorage
}

export function useRecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    // Load persisted activities from localStorage on initialization
    const saved = localStorage.getItem('recentActivities');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Save to localStorage whenever activities change
  useEffect(() => {
    localStorage.setItem('recentActivities', JSON.stringify(activities));
  }, [activities]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  const getStatusFromScanResult = (scanResult: any): 'success' | 'warning' | 'error' | 'pending' => {
    if (scanResult.scan_type === 'security') {
      if (scanResult.severity === 'critical' || scanResult.severity === 'high') return 'error';
      if (scanResult.severity === 'medium') return 'warning';
      return 'success';
    }
    
    if (scanResult.scan_type === 'coverage') {
      const coverage = scanResult.coverage_percentage || 0;
      if (coverage >= 80) return 'success';
      if (coverage >= 70) return 'warning';
      return 'error';
    }
    
    if (scanResult.scan_type === 'version') {
      return scanResult.status === 'open' ? 'warning' : 'success';
    }
    
    return 'pending';
  };

  const generateActivityFromScanResult = (scanResult: any, repository: any, source: 'database' | 'local' = 'database'): ActivityItem => {
    const baseActivity = {
      id: scanResult.id,
      timestamp: formatTimeAgo(scanResult.created_at || scanResult.discoveredDate || new Date().toISOString()),
      repository: repository?.name || scanResult.repository || 'Unknown Repository',
      repository_id: scanResult.repository_id || scanResult.repositoryId,
      status: getStatusFromScanResult(scanResult),
      source
    };

    switch (scanResult.scan_type || (scanResult.severity ? 'security' : 'version')) {
      case 'security':
        return {
          ...baseActivity,
          type: 'security' as const,
          title: scanResult.severity === 'critical' || scanResult.severity === 'high' 
            ? 'Critical vulnerability detected' 
            : 'Security issue found',
          description: scanResult.description || `${scanResult.severity} severity vulnerability in ${scanResult.package || scanResult.package_name || 'dependencies'}`
        };
        
      case 'coverage':
        const coverage = scanResult.coverage_percentage || 0;
        return {
          ...baseActivity,
          type: 'coverage' as const,
          title: coverage >= 80 ? 'Test coverage improved' : 'Coverage analysis completed',
          description: `Test coverage is ${coverage}% in ${repository?.name || scanResult.repository || 'repository'}`
        };
        
      case 'version':
        return {
          ...baseActivity,
          type: 'version' as const,
          title: scanResult.status === 'open' || scanResult.status === 'pending' ? 'Update available' : 'Version upgrade completed',
          description: scanResult.currentVersion && (scanResult.recommended_version || scanResult.targetVersion)
            ? `${scanResult.package_name || scanResult.technology || 'Package'} can be upgraded from ${scanResult.currentVersion} to ${scanResult.recommended_version || scanResult.targetVersion}`
            : scanResult.description || `${scanResult.technology || 'Package'} upgrade available`
        };
        
      default:
        return {
          ...baseActivity,
          type: 'general' as const,
          title: scanResult.title || 'Scan completed',
          description: scanResult.description || 'General scan activity'
        };
    }
  };

  const loadPersistedData = () => {
    // No longer using localStorage for business data
    // Activities are now fetched from the API
    return [];
  };

  const fetchRecentActivity = async () => {
    if (!user) {
      // Even without user, show persisted data
      const persistedActivities = loadPersistedData();
      setActivities(persistedActivities.slice(0, 20)); // Keep only 20 most recent
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch recent scan results with repository information
      const result = await apiClient.getScanResults({
        limit: 20,
        orderBy: 'created_at',
        orderDirection: 'desc'
      });

      if (!result.data?.success) {
        throw new Error(result.error || 'Failed to fetch scan results');
      }

      // Transform scan results into activity items
      const activities: ActivityItem[] = (result.data.scanResults || []).map(scanResult => 
        generateActivityFromScanResult(scanResult, scanResult.repository, 'database')
      );

      // Sort by timestamp (newest first) and limit to 20
      const sortedActivities = activities
      
        .sort((a, b) => {
          const timeA = new Date(a.timestamp.includes('ago') ? Date.now() : a.timestamp).getTime();
          const timeB = new Date(b.timestamp.includes('ago') ? Date.now() : b.timestamp).getTime();
          return timeB - timeA;
        })
        .slice(0, 20);

      setActivities(sortedActivities);
    } catch (err) {
      console.error('Error fetching recent activity:', err);
      setError('Failed to fetch recent activity');
      // Fallback to sample data on error
      setActivities([
        {
          id: 'sample-1',
          type: 'general',
          title: 'Welcome to TechMandates',
          description: 'Connect repositories and run scans to see recent activity here',
          timestamp: 'Just now',
          status: 'pending',
          repository: 'Getting Started',
          source: 'local'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, [user]);

  // Note: Real-time updates are now handled by the backend
  // In a production environment, you might want to implement WebSocket connections
  // or Server-Sent Events for real-time updates

  return {
    activities,
    loading,
    error,
    refetch: fetchRecentActivity
  };
}