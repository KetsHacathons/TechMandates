import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProviderAccounts } from './useProviderAccounts';
import { Repository } from './useRepositories';

interface PrivateRepository extends Repository {
  provider_token?: string;
}

export function usePrivateRepositories() {
  const [privateRepositories, setPrivateRepositories] = useState<PrivateRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { providerAccounts } = useProviderAccounts();

  const fetchPrivateRepositoryData = async (repoUrl: string, token: string) => {
    try {
      // Parse GitHub URL
      const githubMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (githubMatch) {
        const [, owner, repo] = githubMatch;
        const repoName = repo.replace('.git', '');
        
        const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        });

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.statusText}`);
        }

        return await response.json();
      }

      // Parse Bitbucket URL (if needed)
      const bitbucketMatch = repoUrl.match(/bitbucket\.org\/([^\/]+)\/([^\/]+)/);
      if (bitbucketMatch) {
        // Implement Bitbucket API call if needed
        throw new Error('Bitbucket integration not implemented yet');
      }

      throw new Error('Unsupported repository URL format');
    } catch (error) {
      console.error('Error fetching private repository data:', error);
      throw error;
    }
  };

  const loadPrivateRepositories = async () => {
    if (!user || providerAccounts.length === 0) {
      setPrivateRepositories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const repos: PrivateRepository[] = [];

      // Get stored repository URLs from localStorage or other storage
      const storedRepos = localStorage.getItem(`private_repos_${user.id}`);
      if (storedRepos) {
        const repoUrls = JSON.parse(storedRepos);
        
        for (const repoUrl of repoUrls) {
          try {
            // Find matching provider account
            const githubAccount = providerAccounts.find(acc => acc.provider === 'github');
            if (githubAccount && githubAccount.access_token) {
              const repoData = await fetchPrivateRepositoryData(repoUrl, githubAccount.access_token);
              
              repos.push({
                id: `private_${repoData.id}`,
                name: repoData.name,
                full_name: repoData.full_name,
                provider: 'github',
                language: repoData.language,
                description: repoData.description,
                coverage_percentage: null,
                test_count: null,
                last_coverage_update: null,
                provider_token: githubAccount.access_token
              });
            }
          } catch (error) {
            console.error(`Error loading repository ${repoUrl}:`, error);
          }
        }
      }

      setPrivateRepositories(repos);
    } catch (error) {
      console.error('Error loading private repositories:', error);
      setError('Failed to load private repositories');
    } finally {
      setLoading(false);
    }
  };

  const addPrivateRepository = async (repoUrl: string) => {
    if (!user) throw new Error('User not authenticated');

    // Store the repository URL
    const existingUrls = localStorage.getItem(`private_repos_${user.id}`);
    const urls = existingUrls ? JSON.parse(existingUrls) : [];
    
    if (!urls.includes(repoUrl)) {
      urls.push(repoUrl);
      localStorage.setItem(`private_repos_${user.id}`, JSON.stringify(urls));
    }

    // Reload repositories
    await loadPrivateRepositories();
  };

  useEffect(() => {
    loadPrivateRepositories();
  }, [user, providerAccounts]);

  return {
    privateRepositories,
    loading,
    error,
    addPrivateRepository,
    refetch: loadPrivateRepositories
  };
}