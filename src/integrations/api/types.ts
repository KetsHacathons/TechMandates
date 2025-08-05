export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_at: number;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
}

export interface Repository {
  id: string;
  user_id: string;
  external_id: string;
  name: string;
  full_name: string;
  description?: string;
  clone_url: string;
  is_private: boolean;
  language?: string;
  default_branch: string;
  provider: string;
  coverage_percentage?: number;
  test_count?: number;
  scan_status: string;
  last_scan_at?: string;
  last_coverage_update?: string;
  created_at: string;
  updated_at: string;
}

export interface RepositoryList {
  repositories: Repository[];
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss: number;
  package: string;
  version: string;
  fixed_in: string;
  status: 'open' | 'in-progress' | 'resolved';
  discovered_date: string;
  description: string;
  repository: string;
  repository_id: string;
  platform: string;
}

export interface VulnerabilityScanRequest {
  repository_id: string;
  repository_name: string;
  full_name: string;
  language?: string;
  scan_date: string;
}

export interface VulnerabilityScanResponse {
  success: boolean;
  repository_id: string;
  repository_name: string;
  vulnerabilities: Vulnerability[];
  scan_date: string;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface Upgrade {
  repository: string;
  repository_id: string;
  platform: string;
  technology: string;
  current_version: string;
  target_version: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: string;
}

export interface VersionScanRequest {
  repository_id: string;
  repository_name: string;
  full_name: string;
  language?: string;
  scan_date: string;
}

export interface VersionScanResponse {
  success: boolean;
  repository_id: string;
  repository_name: string;
  upgrades: Upgrade[];
  scan_date: string;
}

export interface CoverageData {
  repository_id: string;
  coverage_percentage: number;
  test_count: number;
  last_updated: string;
  language?: string;
}

export interface CoverageScanRequest {
  repository_id: string;
  repository_name: string;
  full_name: string;
  language?: string;
  scan_date: string;
}

export interface CoverageScanResponse {
  success: boolean;
  repository_id: string;
  repository_name: string;
  coverage_data: CoverageData;
  scan_date: string;
}

export interface DashboardMetrics {
  total_repositories: number;
  pending_updates: number;
  vulnerabilities: number;
  test_coverage: string;
  loading?: boolean;
  error?: string;
}

export interface FunctionResponse<T = any> {
  data: T;
  error: string | null;
} 