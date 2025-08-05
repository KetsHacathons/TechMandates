import { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Repository } from '@/integrations/api/types';
import { useAuth } from '@/contexts/AuthContext';

export function useRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRepositories = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getRepositories();
      setRepositories(response.repositories || []);
    } catch (err: any) {
      console.error('Error fetching repositories:', err);
      setError(err.message || 'Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  const createRepository = async (repoData: any) => {
    try {
      const newRepo = await apiClient.createRepository(repoData);
      setRepositories(prev => [newRepo, ...prev]);
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error creating repository:', err);
      return { success: false, error: err.message || 'Failed to create repository' };
    }
  };

  const deleteRepository = async (repoId: string) => {
    try {
      await apiClient.deleteRepository(repoId);
      setRepositories(prev => prev.filter(repo => repo.id !== repoId));
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error deleting repository:', err);
      return { success: false, error: err.message || 'Failed to delete repository' };
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, [user]);

  return {
    repositories,
    loading,
    error,
    refetch: fetchRepositories,
    createRepository,
    deleteRepository,
  };
}