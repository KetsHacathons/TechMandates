import { useState, useEffect } from "react";
import { Navigation } from "@/components/ui/navigation";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UpgradeSelectionModal } from "@/components/upgrade/UpgradeSelectionModal";
import { BulkUpgradeModal } from "@/components/upgrade/BulkUpgradeModal";
import { AutoUpdateConfigModal } from "@/components/upgrade/AutoUpdateConfigModal";
import { ScanUpdatesModal } from "@/components/upgrade/ScanUpdatesModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRepositories } from "@/hooks/useRepositories";
import { apiClient } from "@/integrations/api/client";
import { usePrivateRepositories } from "@/hooks/usePrivateRepositories";
import { 
  RefreshCw,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Settings
} from "lucide-react";
import javaLogo from "@/assets/java-logo.png";
import angularLogo from "@/assets/angular-logo.png";
import pythonLogo from "@/assets/python-logo.png";
import upToDateLogo from "@/assets/up-to-date-logo.png";

const Versions = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { repositories, loading: repositoriesLoading } = useRepositories();
  const { privateRepositories, loading: privateReposLoading } = usePrivateRepositories();
  
  // Combine public and private repositories
  const allRepositories = [...repositories, ...privateRepositories];
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isBulkUpgradeModalOpen, setIsBulkUpgradeModalOpen] = useState(false);
  const [isAutoUpdateConfigOpen, setIsAutoUpdateConfigOpen] = useState(false);
  const [isScanUpdatesOpen, setIsScanUpdatesOpen] = useState(false);
  const [isCreatingUpgrade, setIsCreatingUpgrade] = useState(false);
  // Load upgrades from API
  const [scannedUpgrades, setScannedUpgrades] = useState<Array<{
    repository: string;
    repositoryId: string;
    platform: string;
    technology: string;
    currentVersion: string;
    targetVersion: string;
    status: string;
    priority: string;
  }>>([]);

  // Load upgrades on component mount
  useEffect(() => {
    const loadUpgrades = async () => {
      try {
        const result = await apiClient.getUpgrades();
        if (result.data?.success) {
          setScannedUpgrades(result.data.upgrades || []);
        }
      } catch (error) {
        console.error('Failed to load upgrades:', error);
      }
    };
    loadUpgrades();
  }, []);

  const handleStartUpgrade = async (data: { repositoryId: string; technology: string; targetVersion: string }) => {
    const selectedRepo = allRepositories.find(repo => repo.id === data.repositoryId);
    setIsCreatingUpgrade(true);
    
    try {
      toast({
        title: "Creating Upgrade",
        description: `Creating branch and PR for ${data.technology} upgrade to ${data.targetVersion}...`
      });

      const result = await apiClient.createUpgradePR({
        repositoryId: data.repositoryId,
        technology: data.technology,
        targetVersion: data.targetVersion
      });

      if (!result.data?.success) {
        throw new Error(result.error || 'Failed to create upgrade PR');
      }

              toast({
          title: "Pull Request Created! 🎉",
          description: (
            <div className="space-y-2">
              <p>Successfully created PR #{result.data.pullRequestNumber} for {selectedRepo?.full_name}</p>
              <p className="text-sm text-muted-foreground">
                Please review and merge the pull request to complete the upgrade.
              </p>
              <a 
                href={result.data.pullRequestUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-2 text-primary hover:underline"
              >
                View Pull Request →
              </a>
            </div>
          ),
          duration: 10000,
        });

    } catch (error) {
      console.error('Upgrade creation failed:', error);
      toast({
        title: "Upgrade Failed",
        description: `Failed to create upgrade: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingUpgrade(false);
    }
  };

  const calculateMetrics = () => {
    if (scannedUpgrades.length === 0) {
      return [
        {
          title: "Java Projects",
          value: 0,
          description: "No scan data available - run scan to see details",
          iconImage: javaLogo,
          variant: "secondary" as const
        },
        {
          title: "Angular Projects",
          value: 0,
          description: "No scan data available - run scan to see details",
          iconImage: angularLogo,
          variant: "secondary" as const
        },
        {
          title: "Python Projects",
          value: 0,
          description: "No scan data available - run scan to see details",
          iconImage: pythonLogo,
          variant: "secondary" as const
        },
        {
          title: "Up-to-date",
          value: "0%",
          description: "No scan data available",
          iconImage: upToDateLogo,
        }
      ];
    }

    const javaProjects = scannedUpgrades.filter(upgrade => upgrade.technology === 'Java');
    const angularProjects = scannedUpgrades.filter(upgrade => upgrade.technology === 'Angular');
    const pythonProjects = scannedUpgrades.filter(upgrade => upgrade.technology === 'Python');
    
    // Get unique repositories that have been scanned
    const scannedRepoIds = new Set(scannedUpgrades.map(upgrade => upgrade.repositoryId));
    const totalScannedRepos = scannedRepoIds.size;
    
    // Calculate repositories that need no updates
    const reposNeedingUpdates = new Set(scannedUpgrades.map(upgrade => upgrade.repositoryId));
    const upToDateRepos = totalScannedRepos - reposNeedingUpdates.size;
    const upToDatePercentage = totalScannedRepos > 0 ? Math.round((upToDateRepos / totalScannedRepos) * 100) : 0;

    return [
      {
        title: "Java Projects",
        value: javaProjects.length,
        description: javaProjects.length > 0 
          ? `${javaProjects.length} need upgrade to latest version`
          : "All Java projects up to date",
        iconImage: javaLogo,
        variant: javaProjects.length > 0 ? "warning" as const : "success" as const
      },
      {
        title: "Angular Projects", 
        value: angularProjects.length,
        description: angularProjects.length > 0
          ? `${angularProjects.length} need upgrade to latest version`
          : "All Angular projects up to date",
        iconImage: angularLogo,
        variant: angularProjects.length > 0 ? "warning" as const : "success" as const
      },
      {
        title: "Python Projects",
        value: pythonProjects.length,
        description: pythonProjects.length > 0
          ? `${pythonProjects.length} need upgrade to latest version`
          : "All Python projects up to date",
        iconImage: pythonLogo,
        variant: pythonProjects.length > 0 ? "warning" as const : "success" as const
      },
      {
        title: "Up-to-date",
        value: `${upToDatePercentage}%`,
        description: `${upToDateRepos} of ${totalScannedRepos} scanned repositories`,
        iconImage: upToDateLogo,
        trend: upToDatePercentage >= 75 
          ? { value: upToDatePercentage - 60, label: "improvement" }
          : undefined
      }
    ];
  };

  const versionMetrics = calculateMetrics();

  const handleScanResults = (results: Array<{
    repository: string;
    repositoryId: string;
    platform: string;
    technology: string;
    currentVersion: string;
    targetVersion: string;
    status: string;
    priority: string;
  }>) => {
    setScannedUpgrades(results);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <RefreshCw className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Version Management</h1>
                <p className="text-sm text-muted-foreground">Centralized version upgrades across all repositories</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Navigation />
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {versionMetrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button variant="outline" className="gap-2" onClick={() => setIsScanUpdatesOpen(true)}>
            <RefreshCw className="h-4 w-4" />
            Scan for Updates
          </Button>
          <Button className="gap-2" onClick={() => setIsBulkUpgradeModalOpen(true)}>
            <Play className="h-4 w-4" />
            Start All Upgrades
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setIsAutoUpdateConfigOpen(true)}>
            <Settings className="h-4 w-4" />
            Configure Auto-Updates
          </Button>
        </div>

        {/* Upgrade Queue */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upgrade Queue</CardTitle>
                <CardDescription>
                  Pending and active version upgrades across your repositories
                </CardDescription>
              </div>
              <Badge variant="outline">
                {scannedUpgrades.filter(item => item.status === 'pending').length} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {scannedUpgrades.length > 0 ? (
              <div className="space-y-4">
                {scannedUpgrades.map((upgrade, index) => (
                  <div 
                    key={`${upgrade.repositoryId}-${upgrade.technology}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{upgrade.repository}</h4>
                          <Badge variant="outline" className="text-xs">
                            {upgrade.platform}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {upgrade.technology}: {upgrade.currentVersion} → {upgrade.targetVersion}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant={getPriorityColor(upgrade.priority)}>
                        {upgrade.priority}
                      </Badge>
                      <Badge variant={getStatusColor(upgrade.status)}>
                        {upgrade.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {upgrade.status === 'in-progress' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                        {upgrade.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {upgrade.status}
                      </Badge>
                      {upgrade.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setIsUpgradeModalOpen(true);
                          }}
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No upgrade data available</p>
                <p className="text-sm text-muted-foreground">
                  Click "Scan for Updates" to discover available upgrades for your repositories
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Upgrade Selection Modal */}
      <UpgradeSelectionModal
        open={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
        repositories={allRepositories}
        loading={repositoriesLoading || privateReposLoading || isCreatingUpgrade}
        onStartUpgrade={handleStartUpgrade}
      />

      {/* Bulk Upgrade Modal */}
      <BulkUpgradeModal
        open={isBulkUpgradeModalOpen}
        onOpenChange={setIsBulkUpgradeModalOpen}
        repositories={allRepositories}
        scannedUpgrades={scannedUpgrades}
        loading={repositoriesLoading || privateReposLoading || isCreatingUpgrade}
        onStartUpgrade={handleStartUpgrade}
      />

      {/* Auto-Update Configuration Modal */}
      <AutoUpdateConfigModal
        open={isAutoUpdateConfigOpen}
        onOpenChange={setIsAutoUpdateConfigOpen}
      />

      {/* Scan Updates Modal */}
      <ScanUpdatesModal
        open={isScanUpdatesOpen}
        onOpenChange={setIsScanUpdatesOpen}
        repositories={allRepositories}
        onScanResults={handleScanResults}
      />
    </div>
  );
};

export default Versions;