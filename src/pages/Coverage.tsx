import { useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ImproveCoverageModal } from "@/components/coverage/ImproveCoverageModal";
import { 
  TestTube2,
  TrendingUp,
  Target,
  Play,
  Settings,
  BarChart3,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Zap
} from "lucide-react";

const Coverage = () => {
  const [isImproveCoverageModalOpen, setIsImproveCoverageModalOpen] = useState(false);
  
  const coverageMetrics = [
    {
      title: "Average Coverage",
      value: "78%",
      description: "Across all repositories",
      icon: BarChart3,
      variant: "warning" as const,
      trend: { value: 15, label: "improvement" }
    },
    {
      title: "Above 80%",
      value: 14,
      description: "Repositories meeting target",
      icon: Target,
      variant: "success" as const,
      trend: { value: 20, label: "this month" }
    },
    {
      title: "Below 80%",
      value: 10,
      description: "Need improvement",
      icon: AlertCircle,
      variant: "destructive" as const,
      trend: { value: -30, label: "reduced" }
    },
    {
      title: "Test Suites",
      value: 1247,
      description: "Total across all projects",
      icon: TestTube2,
      trend: { value: 8, label: "new tests" }
    }
  ];

  const repositories = [
    {
      name: "auth-service",
      platform: "GitHub",
      technology: "Java",
      coverage: 92,
      previousCoverage: 88,
      testCount: 156,
      status: "excellent",
      lastRun: "2 hours ago",
      trend: "up"
    },
    {
      name: "user-frontend",
      platform: "BitBucket",
      technology: "Angular",
      coverage: 85,
      previousCoverage: 82,
      testCount: 243,
      status: "good",
      lastRun: "4 hours ago",
      trend: "up"
    },
    {
      name: "payment-api",
      platform: "GitHub",
      technology: "Java",
      coverage: 74,
      previousCoverage: 78,
      testCount: 189,
      status: "needs-improvement",
      lastRun: "1 day ago",
      trend: "down"
    },
    {
      name: "notification-service",
      platform: "GitHub",
      technology: "Python",
      coverage: 68,
      previousCoverage: 65,
      testCount: 97,
      status: "critical",
      lastRun: "6 hours ago",
      trend: "up"
    },
    {
      name: "analytics-service",
      platform: "GitHub",
      technology: "Python",
      coverage: 95,
      previousCoverage: 94,
      testCount: 312,
      status: "excellent",
      lastRun: "1 hour ago",
      trend: "up"
    },
    {
      name: "file-service",
      platform: "BitBucket",
      technology: "Java",
      coverage: 71,
      previousCoverage: 69,
      testCount: 134,
      status: "needs-improvement",
      lastRun: "8 hours ago",
      trend: "up"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'success';
      case 'good': return 'secondary';
      case 'needs-improvement': return 'warning';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return 'text-success';
    if (coverage >= 80) return 'text-primary';
    if (coverage >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getCoverageBarColor = (coverage: number) => {
    if (coverage >= 90) return 'bg-success';
    if (coverage >= 80) return 'bg-primary';
    if (coverage >= 70) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <TestTube2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Test Coverage</h1>
                <p className="text-sm text-muted-foreground">Unit test coverage analysis across all repositories</p>
              </div>
            </div>
            <Navigation />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Coverage Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {coverageMetrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button className="gap-2">
            <Play className="h-4 w-4" />
            Run All Tests
          </Button>
          <Button 
            variant="secondary" 
            className="gap-2"
            onClick={() => setIsImproveCoverageModalOpen(true)}
          >
            <Zap className="h-4 w-4" />
            Improve Code Coverage
          </Button>
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Generate Report
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Configure Thresholds
          </Button>
        </div>

        {/* Coverage Details */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Repository Coverage</CardTitle>
                <CardDescription>
                  Test coverage breakdown by repository
                </CardDescription>
              </div>
              <Badge variant="outline">
                Target: 80%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {repositories.map((repo) => (
                <div 
                  key={repo.name}
                  className="p-6 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-primary/10">
                        <TestTube2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{repo.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {repo.platform}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {repo.technology}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {repo.testCount} test cases • Last run {repo.lastRun}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getCoverageColor(repo.coverage)}`}>
                          {repo.coverage}%
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {repo.trend === 'up' ? (
                            <ArrowUp className="h-3 w-3 text-success" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-destructive" />
                          )}
                          {Math.abs(repo.coverage - repo.previousCoverage)}% from last run
                        </div>
                      </div>
                      <Badge variant={getStatusColor(repo.status)}>
                        {repo.status === 'excellent' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {repo.status === 'critical' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {repo.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Coverage Progress</span>
                      <span className="font-medium">Target: 80%</span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={repo.coverage} 
                        className="h-3"
                      />
                      {/* Target line */}
                      <div 
                        className="absolute top-0 h-3 w-0.5 bg-primary" 
                        style={{ left: '80%' }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>50%</span>
                      <span className="font-medium text-primary">80%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  {repo.coverage < 80 && (
                    <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-warning" />
                        <span className="text-sm font-medium text-warning">
                          Needs {80 - repo.coverage}% more coverage to reach target
                        </span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline">
                          Analyze Gaps
                        </Button>
                        <Button size="sm">
                          Improve Coverage
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Improve Coverage Modal */}
      <ImproveCoverageModal
        open={isImproveCoverageModalOpen}
        onOpenChange={setIsImproveCoverageModalOpen}
      />
    </div>
  );
};

export default Coverage;