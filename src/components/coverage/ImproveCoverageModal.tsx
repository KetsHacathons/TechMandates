import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useRepositories } from "@/hooks/useRepositories";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";
import { 
  TestTube2,
  Target,
  AlertCircle,
  CheckCircle,
  Loader2,
  Code,
  FileText,
  PlayCircle,
  ExternalLink,
  X,
  RefreshCw
} from "lucide-react";

interface ImproveCoverageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CoverageImprovement {
  id: string;
  status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'error';
  progress: number;
  suggestedTests?: number;
  estimatedCoverage?: number;
  pullRequestUrl?: string;
  error?: string;
}

export function ImproveCoverageModal({ open, onOpenChange }: ImproveCoverageModalProps) {
  const { repositories, loading, refetch } = useRepositories();
  const { toast } = useToast();
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);
  const [isImproving, setIsImproving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [improvements, setImprovements] = useState<Record<string, CoverageImprovement>>({});
  const [progress, setProgress] = useState(0);

  // Reset modal state when closing
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset all state when closing
      setSelectedRepositories([]);
      setIsImproving(false);
      setIsRefreshing(false);
      setImprovements({});
      setProgress(0);
    }
    onOpenChange(newOpen);
  };

  const refreshCoverageData = async () => {
    if (repositories.length === 0) return;
    
    setIsRefreshing(true);
    try {
      const result = await apiClient.fetchCoverageData({
        repositoryIds: repositories.map(r => r.id)
      });

      if (!result.data?.success) {
        throw new Error(result.error || 'Failed to fetch coverage data');
      }

      const results = result.data?.results || [];
      const successCount = results.filter((r: any) => r.success).length;

      if (successCount > 0) {
        toast({
          title: "Coverage data updated!",
          description: `Successfully updated coverage for ${successCount} repositories.`,
        });
        // Refresh the repositories list to get updated data
        await refetch();
      } else {
        toast({
          title: "No coverage data found",
          description: "Could not fetch coverage data from repositories.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error refreshing coverage:', error);
      toast({
        title: "Failed to refresh coverage",
        description: "An error occurred while fetching coverage data.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter repositories that need improvement (< 80% coverage or no coverage data)
  const repositoriesWithCoverage = repositories.map(repo => ({
    ...repo,
    currentCoverage: repo.coverage_percentage || 0,
    testCount: repo.test_count || 0,
    needsImprovement: true
  })).filter(repo => (repo.currentCoverage || 0) < 80);

  const handleRepositoryToggle = (repoId: string) => {
    setSelectedRepositories(prev => 
      prev.includes(repoId) 
        ? prev.filter(id => id !== repoId)
        : [...prev, repoId]
    );
  };

  const selectAllRepositories = () => {
    setSelectedRepositories(repositoriesWithCoverage.map(repo => repo.id));
  };

  const deselectAllRepositories = () => {
    setSelectedRepositories([]);
  };

  const startCoverageImprovement = async () => {
    if (selectedRepositories.length === 0) {
      toast({
        title: "No repositories selected",
        description: "Please select at least one repository to improve coverage for.",
        variant: "destructive",
      });
      return;
    }

    setIsImproving(true);
    setProgress(0);

    // Initialize improvement tracking
    const initialImprovements: Record<string, CoverageImprovement> = {};
    selectedRepositories.forEach(repoId => {
      initialImprovements[repoId] = {
        id: repoId,
        status: 'pending',
        progress: 0
      };
    });
    setImprovements(initialImprovements);

    try {
      // Prepare repository data for the API
      const selectedRepos = selectedRepositories.map(repoId => {
        const repo = repositoriesWithCoverage.find(r => r.id === repoId);
        return {
          id: repo?.id || '',
          name: repo?.name || '',
          full_name: repo?.full_name || '',
          language: repo?.language || 'Unknown',
          currentCoverage: repo?.currentCoverage || 0
        };
      }).filter(repo => repo.full_name);

      // Update status to analyzing
      setImprovements(prev => {
        const updated = { ...prev };
        selectedRepositories.forEach(repoId => {
          updated[repoId] = { ...updated[repoId], status: 'analyzing', progress: 30 };
        });
        return updated;
      });

      // Call the API
      const result = await apiClient.improveCoverage({
        repositories: selectedRepos
      });

      if (!result.data?.success) {
        throw new Error(result.error || 'Failed to improve coverage');
      }

      // Update status to generating for all repos
      setImprovements(prev => {
        const updated = { ...prev };
        selectedRepositories.forEach(repoId => {
          updated[repoId] = { ...updated[repoId], status: 'generating', progress: 70 };
        });
        return updated;
      });

      // Process results
      const results = result.data?.results || [];
      let successCount = 0;

      results.forEach((result: any) => {
        const repoId = result.repositoryId;
        if (result.success) {
          successCount++;
          setImprovements(prev => ({
            ...prev,
            [repoId]: {
              ...prev[repoId],
              status: 'completed',
              progress: 100,
              suggestedTests: result.suggestedTests,
              estimatedCoverage: result.estimatedCoverage,
              pullRequestUrl: result.pullRequestUrl
            }
          }));
        } else {
          setImprovements(prev => ({
            ...prev,
            [repoId]: {
              ...prev[repoId],
              status: 'error',
              progress: 100,
              error: result.error
            }
          }));
        }
      });

      setProgress(100);

      if (successCount > 0) {
        toast({
          title: "Coverage improvement completed!",
          description: `Successfully created pull requests for ${successCount} repositories.`,
        });
      } else {
        toast({
          title: "Coverage improvement failed",
          description: "Failed to create pull requests. Please check repository access.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error improving coverage:', error);
      
      // Mark all as error
      setImprovements(prev => {
        const updated = { ...prev };
        selectedRepositories.forEach(repoId => {
          updated[repoId] = { 
            ...updated[repoId], 
            status: 'error', 
            progress: 100,
            error: 'Failed to improve coverage'
          };
        });
        return updated;
      });

      setProgress(100);
      
      toast({
        title: "Coverage improvement failed",
        description: "An error occurred while improving coverage. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return 'text-success';
    if (coverage >= 80) return 'text-primary';
    if (coverage >= 70) return 'text-warning';
    return 'text-destructive';
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5 text-primary" />
            Improve Code Coverage
          </DialogTitle>
          <DialogDescription>
            Select repositories to generate unit tests and improve code coverage beyond 80%
          </DialogDescription>
        </DialogHeader>

        {!isImproving ? (
          <div className="space-y-6">
            {/* Repository Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Repositories Needing Improvement
                </h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshCoverageData}
                    disabled={isRefreshing}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Coverage
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllRepositories}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={deselectAllRepositories}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              {repositoriesWithCoverage.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All repositories meet coverage targets!</h3>
                    <p className="text-muted-foreground">
                      All your repositories have coverage above 80%. Great job!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {repositoriesWithCoverage.map((repo) => (
                    <Card key={repo.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={selectedRepositories.includes(repo.id)}
                            onCheckedChange={() => handleRepositoryToggle(repo.id)}
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{repo.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {repo.language || 'Unknown'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {repo.provider}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{repo.testCount || 0} existing tests</span>
                              <span>•</span>
                              <span>Needs {Math.max(0, 80 - (repo.currentCoverage || 0))}% more coverage</span>
                              {repo.last_coverage_update && (
                                <>
                                  <span>•</span>
                                  <span>Updated {new Date(repo.last_coverage_update).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                            
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Current Coverage</span>
                                <span className={`font-medium ${getCoverageColor(repo.currentCoverage || 0)}`}>
                                  {repo.currentCoverage || 0}%
                                </span>
                              </div>
                              <Progress value={repo.currentCoverage || 0} className="h-2" />
                            </div>
                          </div>

                          <div className="text-right">
                            <AlertCircle className="h-5 w-5 text-warning mx-auto mb-1" />
                            <Badge variant="warning" className="text-xs">
                              Below Target
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {repositoriesWithCoverage.length > 0 && (
              <>
                <Separator />
                
                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {selectedRepositories.length} repositories selected
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={startCoverageImprovement}
                      disabled={selectedRepositories.length === 0}
                      className="gap-2"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Improve Coverage
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Generating Unit Tests</h3>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            <Separator />

            {/* Individual Repository Progress */}
            <div className="space-y-4">
              {selectedRepositories.map((repoId) => {
                const repo = repositoriesWithCoverage.find(r => r.id === repoId);
                const improvement = improvements[repoId];
                
                if (!repo || !improvement) return null;

                return (
                  <Card key={repoId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{repo.name}</CardTitle>
                        <Badge 
                          variant={
                            improvement.status === 'completed' ? 'success' : 
                            improvement.status === 'error' ? 'destructive' : 
                            'secondary'
                          }
                          className="gap-1"
                        >
                          {improvement.status === 'pending' && <Loader2 className="h-3 w-3 animate-spin" />}
                          {improvement.status === 'analyzing' && <Code className="h-3 w-3" />}
                          {improvement.status === 'generating' && <FileText className="h-3 w-3" />}
                          {improvement.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                          {improvement.status === 'error' && <X className="h-3 w-3" />}
                          {improvement.status === 'pending' && 'Pending'}
                          {improvement.status === 'analyzing' && 'Analyzing Code'}
                          {improvement.status === 'generating' && 'Generating Tests'}
                          {improvement.status === 'completed' && 'Complete'}
                          {improvement.status === 'error' && 'Failed'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Progress value={improvement.progress} className="h-2" />
                        
                        {improvement.status === 'completed' && (
                          <div className="space-y-3 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 bg-muted/50 rounded-lg">
                                <div className="text-lg font-semibold text-primary">
                                  +{improvement.suggestedTests}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Suggested Tests
                                </div>
                              </div>
                              <div className="text-center p-3 bg-muted/50 rounded-lg">
                                <div className={`text-lg font-semibold ${getCoverageColor(improvement.estimatedCoverage || 0)}`}>
                                  {improvement.estimatedCoverage}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Estimated Coverage
                                </div>
                              </div>
                            </div>
                            {improvement.pullRequestUrl && (
                              <div className="flex justify-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="gap-2"
                                >
                                  <a href={improvement.pullRequestUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3" />
                                    View Pull Request
                                  </a>
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {improvement.status === 'error' && improvement.error && (
                          <div className="pt-2">
                            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                              <p className="text-sm text-destructive">{improvement.error}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {progress === 100 && (
              <>
                <Separator />
                <div className="flex justify-end">
                  <Button onClick={() => handleOpenChange(false)}>
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}