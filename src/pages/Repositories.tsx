import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/ui/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useProviderAccounts } from '@/hooks/useProviderAccounts';
import { usePrivateRepositories } from '@/hooks/usePrivateRepositories';
import { 
  Github, 
  GitBranch, 
  Lock, 
  Unlock, 
  Search,
  Plus,
  Loader2,
  Calendar,
  Code,
  Settings,
  Key,
  Database,
  FileCode,
  Shield
} from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  full_name: string;
  provider: string;
  external_id: string;
  clone_url: string;
  default_branch: string;
  is_private: boolean;
  description?: string;
  language?: string;
  scan_status: string;
  last_scan_at?: string;
  created_at: string;
  user_id: string;
}

export default function Repositories() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [bitbucketToken, setBitbucketToken] = useState('');
  const [sonarQubeUrl, setSonarQubeUrl] = useState('');
  const [sonarQubeToken, setSonarQubeToken] = useState('');
  const [codeQlToken, setCodeQlToken] = useState('');
  const [ossJsonConfig, setOssJsonConfig] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [bitbucketRepoUrl, setBitbucketRepoUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Use provider accounts hook
  const { providerAccounts, saveProviderAccount } = useProviderAccounts();
  const { privateRepositories, addPrivateRepository } = usePrivateRepositories();

  useEffect(() => {
    if (user) {
      fetchRepositories();
    }
  }, [user]);

  const fetchRepositories = async () => {
    try {
      const response = await apiClient.getRepositories();
      setRepositories(response.repositories || []);
    } catch (error) {
      toast({
        title: "Error fetching repositories",
        description: "Failed to load your repositories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseGitHubUrl = (url: string) => {
    try {
      const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
      const match = url.match(regex);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace('.git', '')
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const fetchGitHubRepoData = async (owner: string, repo: string) => {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    // Add authorization header if GitHub token is available
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Repository not found. Please check the URL.');
      } else if (response.status === 403) {
        throw new Error('API rate limit exceeded. Please add a GitHub token in the Integrations tab.');
      } else {
        throw new Error(`Failed to fetch repository data: ${response.statusText}`);
      }
    }

    return response.json();
  };

  const connectRepository = async () => {
    if (!repoUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid GitHub repository URL.",
        variant: "destructive",
      });
      return;
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      toast({
        title: "Invalid GitHub URL",
        description: "Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo).",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Fetch repository data from GitHub API
      const repoData = await fetchGitHubRepoData(parsed.owner, parsed.repo);
      
      // Check if repository already exists
      const existingRepo = repositories.find(repo => 
        repo.external_id === repoData.id.toString()
      );

      if (existingRepo) {
        toast({
          title: "Repository already connected",
          description: "This repository is already connected to your account.",
          variant: "destructive",
        });
        return;
      }

      // Save repository to database
      await apiClient.createRepository({
        user_id: user?.id,
        name: repoData.name,
        full_name: repoData.full_name,
        provider: 'github',
        external_id: repoData.id.toString(),
        clone_url: repoData.clone_url,
        default_branch: repoData.default_branch || 'main',
        description: repoData.description,
        language: repoData.language,
        is_private: repoData.private,
        scan_status: 'pending'
      });

      toast({
        title: "Repository connected successfully",
        description: `${repoData.full_name} has been added to your repositories.`,
      });

      // Refresh repositories list
      fetchRepositories();
      setRepoUrl('');
    } catch (error: any) {
      toast({
        title: "Failed to connect repository",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'scanning': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'failed': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Settings & Configuration
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure integrations, manage repositories, and set up security scanning tools
            </p>
          </div>
          <Navigation />
        </header>

        <Tabs defaultValue="repositories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="repositories">Public Repositories</TabsTrigger>
            <TabsTrigger value="integrations">Private Repos with Token OAuth</TabsTrigger>
            <TabsTrigger value="security">Security Tools</TabsTrigger>
            <TabsTrigger value="oss">OSS Config</TabsTrigger>
          </TabsList>

          <TabsContent value="repositories" className="space-y-6">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search connected repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter GitHub repository URL"
                  className="w-80"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
                <Button 
                  className="gap-2" 
                  onClick={connectRepository}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredRepositories.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No connected repositories</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'No connected repositories match your search.' : 'Connect your first repository to get started.'}
                  </p>
                  {!searchQuery && (
                    <div className="space-y-2">
                      <Input 
                        placeholder="Enter GitHub repository URL (e.g., https://github.com/owner/repo)"
                        className="mb-2"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                      />
                      <Button 
                        className="gap-2" 
                        onClick={connectRepository}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {isConnecting ? 'Connecting...' : 'Connect Repository'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredRepositories.map((repo) => (
                  <Card key={repo.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Github className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">{repo.name}</h3>
                            {repo.is_private ? (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Unlock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {repo.full_name}
                          </p>
                          
                          {repo.description && (
                            <p className="text-sm mb-3">{repo.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {repo.language && (
                              <div className="flex items-center gap-1">
                                <Code className="h-4 w-4" />
                                {repo.language}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Added {formatDate(repo.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3">
                          <Badge className={getStatusColor(repo.scan_status)}>
                            {repo.scan_status}
                          </Badge>
                          
                          {repo.last_scan_at && (
                            <p className="text-xs text-muted-foreground">
                              Last scan: {formatDate(repo.last_scan_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Repository Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Repositories</span>
                    <span className="font-semibold">{repositories.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Scanned</span>
                    <span className="font-semibold">
                      {repositories.filter(r => r.scan_status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending Scans</span>
                    <span className="font-semibold">
                      {repositories.filter(r => r.scan_status === 'pending').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    GitHub Integration
                  </CardTitle>
                  <CardDescription>
                    Connect to GitHub using OAuth token for repository access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">GitHub Repository URL</label>
                    <Input
                      placeholder="https://github.com/owner/repository"
                      value={githubRepoUrl}
                      onChange={(e) => setGithubRepoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the full URL of your GitHub repository
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">GitHub Personal Access Token</label>
                    <Input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Generate a token with 'repo' scope from GitHub Settings &gt; Developer settings &gt; Personal access tokens
                    </p>
                  </div>
                  <Button className="w-full" onClick={async () => {
                    try {
                      await saveProviderAccount('github', githubToken, githubRepoUrl);
                      if (githubRepoUrl) {
                        await addPrivateRepository(githubRepoUrl);
                      }
                      toast({
                        title: "GitHub integration saved",
                        description: "Your GitHub token and repository have been saved successfully.",
                      });
                    } catch (error) {
                      toast({
                        title: "Error saving integration",
                        description: "Failed to save GitHub integration. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }} disabled={!githubToken}>
                    <Key className="h-4 w-4 mr-2" />
                    Save GitHub Token
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Bitbucket Integration
                  </CardTitle>
                  <CardDescription>
                    Connect to Bitbucket using OAuth token for repository access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bitbucket Repository URL</label>
                    <Input
                      placeholder="https://bitbucket.org/workspace/repository"
                      value={bitbucketRepoUrl}
                      onChange={(e) => setBitbucketRepoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the full URL of your Bitbucket repository
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bitbucket App Password</label>
                    <Input
                      type="password"
                      placeholder="Enter your Bitbucket app password"
                      value={bitbucketToken}
                      onChange={(e) => setBitbucketToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Create an app password from Bitbucket Settings &gt; App passwords with 'Repositories: Read' permission
                    </p>
                  </div>
                  <Button className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Save Bitbucket Token
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    SonarQube Configuration
                  </CardTitle>
                  <CardDescription>
                    Connect to your SonarQube instance for code quality analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SonarQube Server URL</label>
                    <Input
                      placeholder="https://your-sonarqube-instance.com"
                      value={sonarQubeUrl}
                      onChange={(e) => setSonarQubeUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SonarQube Token</label>
                    <Input
                      type="password"
                      placeholder="squ_xxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={sonarQubeToken}
                      onChange={(e) => setSonarQubeToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Generate a token from SonarQube &gt; My Account &gt; Security &gt; Generate Tokens
                    </p>
                  </div>
                  <Button className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Save SonarQube Config
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    CodeQL Configuration
                  </CardTitle>
                  <CardDescription>
                    Connect to GitHub CodeQL for advanced security analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">CodeQL GitHub Token</label>
                    <Input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={codeQlToken}
                      onChange={(e) => setCodeQlToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use a GitHub token with 'security_events' scope for CodeQL access
                    </p>
                  </div>
                  <Button className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Save CodeQL Config
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="oss" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  OSS JSON Configuration
                </CardTitle>
                <CardDescription>
                  Configure Open Source Software analysis using JSON configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 mb-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Connected Repositories</h4>
                    <div className="space-y-2">
                      {/* Public Repositories */}
                      {repositories.length > 0 && (
                        <div>
                          <h5 className="text-sm text-muted-foreground mb-1">Public Repositories ({repositories.length})</h5>
                          {repositories.map(repo => (
                            <div key={repo.id} className="text-sm p-2 bg-background rounded border">
                              {repo.full_name} - {repo.language || 'Unknown'}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Private Repositories */}
                      {privateRepositories.length > 0 && (
                        <div>
                          <h5 className="text-sm text-muted-foreground mb-1">Private Repositories ({privateRepositories.length})</h5>
                          {privateRepositories.map(repo => (
                            <div key={repo.id} className="text-sm p-2 bg-background rounded border">
                              {repo.full_name} - {repo.language || 'Unknown'} 🔒
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {repositories.length === 0 && privateRepositories.length === 0 && (
                        <p className="text-sm text-muted-foreground">No repositories connected. Add repositories in the other tabs first.</p>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const allRepos = [...repositories, ...privateRepositories];
                      const ossConfig = {
                        ossScanners: {
                          dependencyCheck: {
                            enabled: true,
                            nvdApiKey: "your-nvd-api-key"
                          },
                          retireJs: {
                            enabled: true
                          },
                          auditJs: {
                            enabled: true
                          },
                          bundleAudit: {
                            enabled: true
                          }
                        },
                        repositories: allRepos.map(repo => ({
                          name: repo.name,
                          url: repo.full_name ? `https://github.com/${repo.full_name}.git` : repo.name,
                          branch: "main"
                        })),
                        outputFormat: "json",
                        reportPath: "./oss-report.json"
                      };
                      setOssJsonConfig(JSON.stringify(ossConfig, null, 2));
                    }}
                    className="w-full"
                  >
                    Generate Config from Connected Repositories
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">JSON Configuration</label>
                  <textarea
                    className="w-full h-64 p-3 border rounded-md resize-none font-mono text-sm"
                    placeholder={`{
  "ossScanners": {
    "dependencyCheck": {
      "enabled": true,
      "nvdApiKey": "your-nvd-api-key"
    },
    "retireJs": {
      "enabled": true
    },
    "auditJs": {
      "enabled": true
    },
    "bundleAudit": {
      "enabled": true
    }
  },
  "repositories": [
    {
      "name": "example-repo",
      "url": "https://github.com/user/repo.git",
      "branch": "main"
    }
  ],
  "outputFormat": "json",
  "reportPath": "./oss-report.json"
}`}
                    value={ossJsonConfig}
                    onChange={(e) => setOssJsonConfig(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Define your OSS scanning configuration in JSON format. Use the button above to auto-populate from your connected repositories.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => {
                    try {
                      JSON.parse(ossJsonConfig);
                      toast({
                        title: "OSS Config Saved",
                        description: "Your OSS configuration has been saved successfully.",
                      });
                    } catch (error) {
                      toast({
                        title: "Invalid JSON",
                        description: "Please check your JSON configuration for syntax errors.",
                        variant: "destructive",
                      });
                    }
                  }}>
                    <FileCode className="h-4 w-4 mr-2" />
                    Save OSS Config
                  </Button>
                  <Button variant="outline" onClick={() => {
                    try {
                      JSON.parse(ossJsonConfig);
                      toast({
                        title: "Valid JSON",
                        description: "Your JSON configuration is valid.",
                      });
                    } catch (error) {
                      toast({
                        title: "Invalid JSON",
                        description: "Please check your JSON configuration for syntax errors.",
                        variant: "destructive",
                      });
                    }
                  }}>
                    Validate JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}