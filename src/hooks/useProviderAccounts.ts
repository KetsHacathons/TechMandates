import { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProviderAccount {
  id: string;
  provider: string;
  provider_account_id: string;
  access_token: string | null;
  refresh_token: string | null;
  scope: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useProviderAccounts() {
  const [providerAccounts, setProviderAccounts] = useState<ProviderAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProviderAccounts = async () => {
    if (!user) {
      setProviderAccounts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await apiClient.getProviderAccounts();

      if (!result.data?.success) {
        console.error('Error fetching provider accounts:', result.error);
        setError(result.error || 'Failed to fetch provider accounts');
      } else {
        setProviderAccounts(result.data.providerAccounts || []);
      }
    } catch (err) {
      console.error('Error fetching provider accounts:', err);
      setError('Failed to fetch provider accounts');
    } finally {
      setLoading(false);
    }
  };

  const saveProviderAccount = async (provider: string, token: string, repoUrl?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const result = await apiClient.saveProviderAccount({
        provider: provider.toLowerCase(),
        access_token: token,
        scope: 'repo',
      });

      if (!result.data?.success) {
        throw new Error(result.error || 'Failed to save provider account');
      }

      // Refresh the list
      await fetchProviderAccounts();
      return result.data.providerAccount;
    } catch (error) {
      console.error('Error saving provider account:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchProviderAccounts();
  }, [user]);

  return { 
    providerAccounts, 
    loading, 
    error, 
    refetch: fetchProviderAccounts,
    saveProviderAccount
  };
}