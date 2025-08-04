import { useState, useEffect } from 'react';
import { sqlite } from '@/integrations/sqlite/client';
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
    try {
      // Load vulnerabilities from localStorage
      const savedVulnerabilities = localStorage.getItem('scannedVulnerabilities');
      const vulnerabilities = savedVulnerabilities ? JSON.parse(savedVulnerabilities) : [];
      
      // Load version upgrades from localStorage
      const savedUpgrades = localStorage.getItem('scannedUpgrades');
      const upgrades = savedUpgrades ? JSON.parse(savedUpgrades) : [];
      
      // Convert vulnerabilities to activities
      const vulnerabilityActivities: ActivityItem[] = vulnerabilities.map((vuln: any) => 
        generateActivityFromScanResult(vuln, { name: vuln.repository }, 'local')
      );
      
      // Convert upgrades to activities
      const upgradeActivities: ActivityItem[] = upgrades.map((upgrade: any) => 
        generateActivityFromScanResult({
          id: `upgrade-${upgrade.repositoryId}-${upgrade.technology}`,
          scan_type: 'version',
          technology: upgrade.technology,
          currentVersion: upgrade.currentVersion,
          targetVersion: upgrade.targetVersion,
          status: upgrade.status,
          repository_id: upgrade.repositoryId,
          created_at: new Date().toISOString() // Use current time as fallback
        }, { name: upgrade.repository }, 'local')
      );
      
      return [...vulnerabilityActivities, ...upgradeActivities];
    } catch (error) {
      console.error('Error loading persisted data:', error);
      return [];
    }
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

      // Load persisted data first
      const persistedActivities = loadPersistedData();

      // Fetch recent scan results with repository information
      const { data: scanResults, error: scanError } = await sqlite
        .from('scan_results')
        .select(`
          *,
          repositories!inner(
            id,
            name,
            full_name,
            user_id
          )
        `)
        .eq('repositories.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (scanError) throw scanError;

      // Transform scan results into activity items
      const databaseActivities: ActivityItem[] = (scanResults || []).map(scanResult => 
        generateActivityFromScanResult(scanResult, scanResult.repositories, 'database')
      );

      // Combine and sort all activities by timestamp
      const allActivities = [...persistedActivities, ...databaseActivities];
      
      // Remove duplicates (prefer database version over local)
      const uniqueActivities = allActivities.reduce((acc, activity) => {
        const existing = acc.find(a => a.id === activity.id);
        if (!existing) {
          acc.push(activity);
        } else if (activity.source === 'database' && existing.source === 'local') {
          // Replace local version with database version
          const index = acc.findIndex(a => a.id === activity.id);
          acc[index] = activity;
        }
        return acc;
      }, [] as ActivityItem[]);
      
      // Sort by timestamp (newest first) and limit to 20
      const sortedActivities = uniqueActivities
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
      // Fallback to persisted data on error
      const persistedActivities = loadPersistedData();
      if (persistedActivities.length > 0) {
        setActivities(persistedActivities.slice(0, 20));
      } else {
        // Show sample data only if no persisted data
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
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, [user]);

  // Listen for changes in localStorage to update activities in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'scannedVulnerabilities' || e.key === 'scannedUpgrades') {
        // Refresh activities when vulnerabilities or upgrades change
        fetchRecentActivity();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Set up real-time subscription for new scan results
  useEffect(() => {
    if (!user) return;

    const channel = sqlite
      .channel('scan-results-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scan_results'
        },
        async (payload) => {
          // Fetch the repository information for the new scan result
          const { data: repository } = await sqlite
            .from('repositories')
            .select('id, name, full_name, user_id')
            .eq('id', payload.new.repository_id)
            .eq('user_id', user.id)
            .single();

          if (repository) {
            const newActivity = generateActivityFromScanResult(payload.new, repository, 'database');
            setActivities(prev => {
              const filtered = prev.filter(a => a.id !== newActivity.id); // Remove any existing
              return [newActivity, ...filtered].slice(0, 20); // Keep only 20 most recent
            });
          }
        }
      )
      .subscribe();

    return () => {
      sqlite.removeChannel(channel);
    };
  }, [user]);

  return {
    activities,
    loading,
    error,
    refetch: fetchRecentActivity
  };
}