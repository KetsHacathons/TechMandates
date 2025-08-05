import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { type Repository } from "@/hooks/useRepositories";
import { apiClient } from "@/integrations/api/client";
import { TestTube2, Package, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";

interface CoverageAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repositories: Repository[];
  onAnalysisResults: (results: Array<{
    repository: string;
    repositoryId: string;
    platform: string;
    coverage: number;
    previousCoverage: number;
    trend: number;
    status: string;
  }>) => void;
}

interface CoverageProgress {
  repositoryId: string;
  repositoryName: string;
  isAnalyzing: boolean;
  isComplete: boolean;
  coverage: number | null;
}

export function CoverageAnalysisModal({ open, onOpenChange, repositories, onAnalysisResults }: CoverageAnalysisModalProps) {
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<CoverageProgress[]>([]);
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

  const startCoverageAnalysis = async () => {
    if (selectedRepositories.length === 0) return;

    setIsAnalyzing(true);
    setProgress(0);

    // Initialize analysis progress
    const initialProgress: CoverageProgress[] = selectedRepositories.map(repoId => {
      const repo = repositories.find(r => r.id === repoId);
      return {
        repositoryId: repoId,
        repositoryName: repo?.name || 'Unknown',
        isAnalyzing: false,
        isComplete: false,
        coverage: null
      };
    });
    setAnalysisProgress(initialProgress);

    const allResults: Array<{
      repository: string;
      repositoryId: string;
      platform: string;
      coverage: number;
      previousCoverage: number;
      trend: number;
      status: string;
    }> = [];

    let completedAnalysis = 0;

    for (const repositoryId of selectedRepositories) {
      const repo = repositories.find(r => r.id === repositoryId);
      if (!repo) continue;

      // Mark repository as currently analyzing
      setAnalysisProgress(prev => prev.map(item => 
        item.repositoryId === repositoryId 
          ? { ...item, isAnalyzing: true }
          : item
      ));

      try {
        // Simulate coverage analysis with random data for demo
        // In a real implementation, this would call an actual coverage analysis service
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const currentCoverage = Math.floor(Math.random() * 40) + 60; // 60-100%
        const previousCoverage = Math.floor(Math.random() * 40) + 60; // 60-100%
        const trend = currentCoverage - previousCoverage;

        // Store coverage result via API
        const result = await apiClient.runCoverageScan({
          repositoryId,
          scanType: 'coverage',
          title: 'Test Coverage Analysis',
          description: `Test coverage analysis for ${repo.name}`,
          status: 'open',
          coverage_percentage: currentCoverage,
          metadata_json: JSON.stringify({
            previousCoverage,
            trend,
            analyzedAt: new Date().toISOString()
          })
        });

        if (result.data?.success) {
          allResults.push({
            repository: repo.name,
            repositoryId: repo.id,
            platform: "GitHub",
            coverage: currentCoverage,
            previousCoverage,
            trend,
            status: currentCoverage >= 80 ? 'good' : currentCoverage >= 70 ? 'warning' : 'needs_improvement'
          });

          // Mark repository as complete
          setAnalysisProgress(prev => prev.map(item => 
            item.repositoryId === repositoryId 
              ? { 
                  ...item, 
                  isAnalyzing: false, 
                  isComplete: true, 
                  coverage: currentCoverage 
                }
              : item
          ));
        } else {
          console.error(`Error storing coverage for ${repo.name}:`, result.error);
          setAnalysisProgress(prev => prev.map(item => 
            item.repositoryId === repositoryId 
              ? { ...item, isAnalyzing: false, isComplete: true, coverage: null }
              : item
          ));
        }
      } catch (error) {
        console.error(`Error analyzing coverage for ${repo.name}:`, error);
        setAnalysisProgress(prev => prev.map(item => 
          item.repositoryId === repositoryId 
            ? { ...item, isAnalyzing: false, isComplete: true, coverage: null }
            : item
        ));
      }

      completedAnalysis++;
      setProgress((completedAnalysis / selectedRepositories.length) * 100);
    }

    setIsAnalyzing(false);
    onAnalysisResults(allResults);
  };

  const getAverageCoverage = () => {
    const completedAnalysis = analysisProgress.filter(item => item.isComplete && item.coverage !== null);
    if (completedAnalysis.length === 0) return 0;
    
    const totalCoverage = completedAnalysis.reduce((sum, item) => sum + (item.coverage || 0), 0);
    return Math.round(totalCoverage / completedAnalysis.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            Run Coverage Analysis
          </DialogTitle>
          <DialogDescription>
            Analyze unit test coverage across selected repositories
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isAnalyzing ? (
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
                    onClick={startCoverageAnalysis}
                    disabled={selectedRepositories.length === 0}
                    className="gap-2"
                  >
                    <TestTube2 className="h-4 w-4" />
                    Start Coverage Analysis
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Analysis Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Analysis in Progress</h3>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(progress)}% complete
                  </span>
                </div>

                <Progress value={progress} className="h-2" />

                {analysisProgress.some(item => item.isComplete) && (
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Average coverage: {getAverageCoverage()}% across analyzed repositories
                    </p>
                  </div>
                )}

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {analysisProgress.map((item) => (
                    <Card key={item.repositoryId} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.repositoryName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.isAnalyzing && (
                            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                          )}
                          {item.isComplete && item.coverage !== null && (
                            <Badge variant={item.coverage >= 80 ? "success" : item.coverage >= 70 ? "warning" : "destructive"}>
                              {item.coverage}% coverage
                            </Badge>
                          )}
                          {item.isComplete && item.coverage === null && (
                            <Badge variant="outline">Analysis failed</Badge>
                          )}
                          {!item.isAnalyzing && !item.isComplete && (
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