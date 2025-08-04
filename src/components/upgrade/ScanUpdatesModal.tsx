import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type Repository } from "@/hooks/useRepositories";
import { sqlite } from "@/integrations/sqlite/client";
import { RefreshCw, Package, TrendingUp, AlertTriangle } from "lucide-react";

interface ScanUpdatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repositories: Repository[];
  onScanResults: (results: Array<{
    repository: string;
    repositoryId: string;
    platform: string;
    technology: string;
    currentVersion: string;
    targetVersion: string;
    status: string;
    priority: string;
  }>) => void;
}

interface RepositoryUpdate {
  repository: Repository;
  technologies: {
    name: string;
    currentVersion: string | null;
    availableVersions: string[];
    latestVersion: string;
    needsUpdate: boolean;
  }[];
  isScanning: boolean;
  scanned: boolean;
}

const technologyVersions = {
  Java: ["21.0.2", "21.0.1", "21.0.0", "17.0.9", "17.0.8", "17.0.7", "17.0.6", "17.0.5", "11.0.21", "11.0.20", "11.0.19", "8u392", "8u382", "8u372"],
  Angular: ["18", "17", "16", "15"],
  Python: ["3.12", "3.11", "3.10", "3.9"],
  TypeScript: ["5.3", "5.2", "5.1", "5.0", "4.9"],
  "Node.js": ["20", "18", "16", "14"],
  React: ["18", "17", "16"],
  "Vue.js": ["3.4", "3.3", "3.2"],
  "Next.js": ["14", "13", "12"],
  Nuxt: ["3.8", "3.7", "3.6"],
  Express: ["4.18", "4.17"],
  NestJS: ["10", "9", "8"],
  Django: ["4.2", "4.1", "3.2"],
  Flask: ["2.3", "2.2", "2.1"],
  "Spring Boot": ["3.2", "3.1", "3.0", "2.7"],
  ".NET": ["8.0", "7.0", "6.0"],
  Go: ["1.21", "1.20", "1.19"],
  Rust: ["1.75", "1.74", "1.73"],
  PHP: ["8.3", "8.2", "8.1", "8.0"],
  Laravel: ["10", "9", "8"],
  Ruby: ["3.2", "3.1", "3.0"],
  "Ruby on Rails": ["7.1", "7.0", "6.1"]
};

const relevantTechnologies = ["Java", "Angular", "Python", "TypeScript", "Node.js", "React"];

export function ScanUpdatesModal({ open, onOpenChange, repositories, onScanResults }: ScanUpdatesModalProps) {
  const [repositoryUpdates, setRepositoryUpdates] = useState<RepositoryUpdate[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open && repositories.length > 0) {
      initializeScan();
    }
  }, [open, repositories]);

  const initializeScan = () => {
    const initialUpdates: RepositoryUpdate[] = repositories.map(repo => ({
      repository: repo,
      technologies: relevantTechnologies.map(tech => ({
        name: tech,
        currentVersion: null,
        availableVersions: technologyVersions[tech as keyof typeof technologyVersions] || [],
        latestVersion: (technologyVersions[tech as keyof typeof technologyVersions] || [])[0] || "",
        needsUpdate: false
      })),
      isScanning: false,
      scanned: false
    }));
    
    setRepositoryUpdates(initialUpdates);
    setProgress(0);
  };

  const scanAllRepositories = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    const totalScans = repositories.length * relevantTechnologies.length;
    let completedScans = 0;

    for (let repoIndex = 0; repoIndex < repositories.length; repoIndex++) {
      const repo = repositories[repoIndex];
      
      // Mark repository as currently scanning
      setRepositoryUpdates(prev => prev.map((item, index) => 
        index === repoIndex ? { ...item, isScanning: true } : item
      ));

      for (const technology of relevantTechnologies) {
        try {
          const { data, error } = await sqlite.functions.invoke('detect-current-version', {
            body: {
              repositoryId: repo.id,
              technology: technology
            }
          });

          if (!error && data?.success && data.currentVersion) {
            const currentVersion = data.currentVersion;
            const availableVersions = technologyVersions[technology as keyof typeof technologyVersions] || [];
            const latestVersion = availableVersions[0] || "";
            const needsUpdate = currentVersion !== latestVersion && availableVersions.includes(currentVersion);

            setRepositoryUpdates(prev => prev.map((item, index) => {
              if (index === repoIndex) {
                const updatedTechs = item.technologies.map(tech => 
                  tech.name === technology 
                    ? { ...tech, currentVersion, needsUpdate }
                    : tech
                );
                return { ...item, technologies: updatedTechs };
              }
              return item;
            }));
          }
        } catch (error) {
          console.error(`Error scanning ${technology} for ${repo.name}:`, error);
        }

        completedScans++;
        setProgress((completedScans / totalScans) * 100);
      }

      // Mark repository as scanned
      setRepositoryUpdates(prev => prev.map((item, index) => 
        index === repoIndex ? { ...item, isScanning: false, scanned: true } : item
      ));
    }

    setIsScanning(false);

    // Generate results for parent component
    const upgradeResults: Array<{
      repository: string;
      repositoryId: string;
      platform: string;
      technology: string;
      currentVersion: string;
      targetVersion: string;
      status: string;
      priority: string;
    }> = [];

    repositoryUpdates.forEach(repoUpdate => {
      repoUpdate.technologies
        .filter(tech => tech.needsUpdate && tech.currentVersion)
        .forEach(tech => {
          upgradeResults.push({
            repository: repoUpdate.repository.name,
            repositoryId: repoUpdate.repository.id,
            platform: "GitHub", // Default to GitHub for now
            technology: tech.name,
            currentVersion: tech.currentVersion!,
            targetVersion: tech.latestVersion,
            status: "pending",
            priority: getPriorityForTechnology(tech.name)
          });
        });
    });

    onScanResults(upgradeResults);
  };

  const getPriorityForTechnology = (technology: string): string => {
    // Java and critical frameworks get high priority
    if (["Java", "Spring Boot", ".NET"].includes(technology)) return "high";
    // Frontend frameworks get medium priority
    if (["Angular", "React", "Vue.js", "Next.js"].includes(technology)) return "medium";
    // Everything else gets low priority
    return "low";
  };

  const getTotalUpdatesAvailable = () => {
    return repositoryUpdates.reduce((total, repo) => {
      return total + repo.technologies.filter(tech => tech.needsUpdate).length;
    }, 0);
  };

  const getRepositoriesWithUpdates = () => {
    return repositoryUpdates.filter(repo => 
      repo.technologies.some(tech => tech.needsUpdate)
    ).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Scan for Updates
          </DialogTitle>
          <DialogDescription>
            Scan all linked repositories for available version upgrades
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scan Controls */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Found {repositories.length} repositories to scan
              </p>
              {repositoryUpdates.some(repo => repo.scanned) && (
                <p className="text-sm font-medium">
                  {getTotalUpdatesAvailable()} updates available across {getRepositoriesWithUpdates()} repositories
                </p>
              )}
            </div>
            <Button 
              onClick={scanAllRepositories} 
              disabled={isScanning || repositories.length === 0}
              className="gap-2"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Start Scan
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isScanning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Scanning repositories...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Results */}
          {repositoryUpdates.length > 0 && (
            <div className="grid gap-4">
              {repositoryUpdates.map((repoUpdate, index) => (
                <Card key={repoUpdate.repository.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{repoUpdate.repository.full_name}</CardTitle>
                          {repoUpdate.repository.language && (
                            <p className="text-sm text-muted-foreground">{repoUpdate.repository.language}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {repoUpdate.isScanning && (
                          <Badge variant="outline" className="gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Scanning
                          </Badge>
                        )}
                        {repoUpdate.scanned && (
                          <Badge variant="success" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Scanned
                          </Badge>
                        )}
                        {repoUpdate.technologies.some(tech => tech.needsUpdate) && (
                          <Badge variant="warning" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Updates Available
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {repoUpdate.technologies
                        .filter(tech => tech.currentVersion || tech.needsUpdate)
                        .map((tech) => (
                        <div key={tech.name} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{tech.name}</span>
                            {tech.currentVersion && (
                              <Badge variant="outline">
                                Current: {tech.currentVersion}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {tech.needsUpdate ? (
                              <>
                                <Badge variant="warning">
                                  Update to {tech.latestVersion}
                                </Badge>
                                <TrendingUp className="h-4 w-4 text-warning" />
                              </>
                            ) : tech.currentVersion ? (
                              <Badge variant="success">Up to date</Badge>
                            ) : null}
                          </div>
                        </div>
                      ))}
                      {repoUpdate.scanned && 
                       !repoUpdate.technologies.some(tech => tech.currentVersion) && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No supported technologies detected
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {repositories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No repositories found. Connect repositories in Settings to get started.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}