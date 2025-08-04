import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error } = await supabase
        .from('provider_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching provider accounts:', error);
        setError(error.message);
      } else {
        setProviderAccounts(data || []);
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
      const { data, error } = await supabase
        .from('provider_accounts')
        .upsert({
          user_id: user.id,
          provider: provider.toLowerCase(),
          provider_account_id: `${provider.toLowerCase()}_${user.id}`,
          access_token: token,
          scope: 'repo',
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh the list
      await fetchProviderAccounts();
      return data;
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