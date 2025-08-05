import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { type Repository } from "@/hooks/useRepositories";
import { apiClient } from "@/integrations/api/client";
import { Shield, AlertTriangle, Bug, Package, RefreshCw } from "lucide-react";

interface SecurityScanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repositories: Repository[];
  onScanResults: (results: Array<{
    id: string;
    title: string;
    severity: string;
    cvss: number;
    repository: string;
    repositoryId: string;
    platform: string;
    package: string;
    version: string;
    fixedIn: string;
    status: string;
    discoveredDate: string;
    description: string;
  }>) => void;
}

interface ScanProgress {
  repositoryId: string;
  repositoryName: string;
  isScanning: boolean;
  isComplete: boolean;
  vulnerabilitiesFound: number;
}

export function SecurityScanModal({ open, onOpenChange, repositories, onScanResults }: SecurityScanModalProps) {
  console.log('SecurityScanModal rendered with open:', open, 'repositories:', repositories.length);
  
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress[]>([]);
  const [progress, setProgress] = useState(0);

  const handleRepositoryToggle = (repositoryId: string) => {
    setSelectedRepositories(prev => 
      prev.includes(repositoryId)
        ? prev.filter(id => id !== repositoryId)
        : [...prev, repositoryId]
    );
  };

  const selectAllRepositories = () => {
    setSelectedRepositories(repositories.map(repo => repo.id));
  };

  const deselectAllRepositories = () => {
    setSelectedRepositories([]);
  };

  const startSecurityScan = async () => {
    if (selectedRepositories.length === 0) return;

    setIsScanning(true);
    setProgress(0);

    // Initialize scan progress
    const initialProgress: ScanProgress[] = selectedRepositories.map(repoId => {
      const repo = repositories.find(r => r.id === repoId);
      return {
        repositoryId: repoId,
        repositoryName: repo?.name || 'Unknown',
        isScanning: false,
        isComplete: false,
        vulnerabilitiesFound: 0
      };
    });
    setScanProgress(initialProgress);

    const allResults: Array<{
      id: string;
      title: string;
      severity: string;
      cvss: number;
      repository: string;
      repositoryId: string;
      platform: string;
      package: string;
      version: string;
      fixedIn: string;
      status: string;
      discoveredDate: string;
      description: string;
    }> = [];

    let completedScans = 0;

    for (const repositoryId of selectedRepositories) {
      const repo = repositories.find(r => r.id === repositoryId);
      if (!repo) continue;

      // Mark repository as currently scanning
      setScanProgress(prev => prev.map(item => 
        item.repositoryId === repositoryId 
          ? { ...item, isScanning: true }
          : item
      ));

      try {
        const result = await apiClient.runSecurityScan({
          repositoryId,
          repositoryName: repo.name,
          fullName: repo.full_name,
          language: repo.language
        });

        if (result.data?.success && result.data.vulnerabilities) {
          const repoVulnerabilities = result.data.vulnerabilities.map((vuln: any) => ({
            ...vuln,
            repository: repo.name,
            repositoryId: repo.id,
            platform: "GitHub"
          }));

          allResults.push(...repoVulnerabilities);

          // Mark repository as complete
          setScanProgress(prev => prev.map(item => 
            item.repositoryId === repositoryId 
              ? { 
                  ...item, 
                  isScanning: false, 
                  isComplete: true, 
                  vulnerabilitiesFound: repoVulnerabilities.length 
                }
              : item
          ));
        } else {
          // Mark as complete with no vulnerabilities found
          setScanProgress(prev => prev.map(item => 
            item.repositoryId === repositoryId 
              ? { ...item, isScanning: false, isComplete: true, vulnerabilitiesFound: 0 }
              : item
          ));
        }
      } catch (error) {
        console.error(`Error scanning ${repo.name}:`, error);
        setScanProgress(prev => prev.map(item => 
          item.repositoryId === repositoryId 
            ? { ...item, isScanning: false, isComplete: true, vulnerabilitiesFound: 0 }
            : item
        ));
      }

      completedScans++;
      setProgress((completedScans / selectedRepositories.length) * 100);
    }

    setIsScanning(false);
    onScanResults(allResults);
  };

  const getTotalVulnerabilities = () => {
    return scanProgress.reduce((total, item) => total + item.vulnerabilitiesFound, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Run Security Scan
          </DialogTitle>
          <DialogDescription>
            Select repositories to scan for security vulnerabilities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isScanning ? (
            <>
              {/* Repository Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Select Repositories</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectAllRepositories}
                      disabled={repositories.length === 0}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={deselectAllRepositories}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {repositories.length > 0 ? (
                  <div className="grid gap-3 max-h-60 overflow-y-auto">
                    {repositories.map((repo) => (
                      <div key={repo.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                        <Checkbox
                          id={repo.id}
                          checked={selectedRepositories.includes(repo.id)}
                          onCheckedChange={() => handleRepositoryToggle(repo.id)}
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <label 
                              htmlFor={repo.id} 
                              className="text-sm font-medium cursor-pointer"
                            >
                              {repo.full_name}
                            </label>
                            {repo.language && (
                              <p className="text-xs text-muted-foreground">{repo.language}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No repositories found. Connect repositories in Settings to get started.</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedRepositories.length} of {repositories.length} repositories selected
                  </p>
                  <Button 
                    onClick={startSecurityScan}
                    disabled={selectedRepositories.length === 0}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Start Security Scan
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Scanning Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Scanning in Progress</h3>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(progress)}% complete
                  </span>
                </div>

                <Progress value={progress} className="h-2" />

                {scanProgress.some(item => item.isComplete) && (
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {getTotalVulnerabilities()} vulnerabilities found across scanned repositories
                    </p>
                  </div>
                )}

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {scanProgress.map((item) => (
                    <Card key={item.repositoryId} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.repositoryName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.isScanning && (
                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                          )}
                          {item.isComplete && (
                            <Badge variant={item.vulnerabilitiesFound > 0 ? "warning" : "success"}>
                              {item.vulnerabilitiesFound > 0 
                                ? `${item.vulnerabilitiesFound} issues`
                                : "Clean"
                              }
                            </Badge>
                          )}
                          {!item.isScanning && !item.isComplete && (
                            <Badge variant="outline">Waiting</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}