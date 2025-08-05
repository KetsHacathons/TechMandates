import { User, Session, AuthResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Load token from localStorage
    this.accessToken = localStorage.getItem('access_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Authentication methods
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.access_token) {
      this.accessToken = response.access_token;
      localStorage.setItem('access_token', response.access_token);
    }
    
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.access_token) {
      this.accessToken = response.access_token;
      localStorage.setItem('access_token', response.access_token);
    }
    
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async logout(): Promise<void> {
    this.accessToken = null;
    localStorage.removeItem('access_token');
  }

  // Repository methods
  async getRepositories() {
    return this.request('/repositories');
  }

  async createRepository(repoData: any) {
    return this.request('/repositories', {
      method: 'POST',
      body: JSON.stringify(repoData),
    });
  }

  async deleteRepository(repoId: string) {
    return this.request(`/repositories/${repoId}`, {
      method: 'DELETE',
    });
  }

  // Dashboard methods
  async getDashboardMetrics() {
    return this.request('/dashboard/metrics');
  }

  // Scan methods
  async runSecurityScan(scanData: any) {
    return this.request('/scans/security', {
      method: 'POST',
      body: JSON.stringify(scanData),
    });
  }

  async runVersionScan(scanData: any) {
    return this.request('/scans/version', {
      method: 'POST',
      body: JSON.stringify(scanData),
    });
  }

  async runCoverageScan(scanData: any) {
    return this.request('/scans/coverage', {
      method: 'POST',
      body: JSON.stringify(scanData),
    });
  }

  // Function methods (replacing Supabase edge functions)
  async detectCurrentVersion(body: any) {
    return this.request('/functions/detect-current-version', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async createUpgradePR(body: any) {
    return this.request('/functions/create-upgrade-pr', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async fixVulnerability(body: any) {
    return this.request('/functions/fix-vulnerability', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async fetchCoverageData(body: any) {
    return this.request('/functions/fetch-coverage-data', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async improveCoverage(body: any) {
    return this.request('/functions/improve-coverage', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();
export default apiClient; 