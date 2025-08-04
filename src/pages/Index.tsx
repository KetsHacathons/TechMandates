import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { 
  LayoutDashboard,
  GitBranch, 
  Shield, 
  TestTube2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  LogIn
} from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { totalRepositories, pendingUpdates, vulnerabilities, testCoverage, loading: metricsLoading } = useDashboardMetrics();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              CleanCode Scanner
            </CardTitle>
            <CardDescription>
              Monitor your code quality, security, and dependencies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Sign in to access your dashboard and manage your repositories.
            </p>
            <Link to="/auth">
              <Button className="w-full gap-2">
                <LogIn className="h-4 w-4" />
                Sign In to Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overviewMetrics = [
    {
      title: "Total Repositories",
      value: metricsLoading ? "..." : totalRepositories,
      description: "Across GitHub & BitBucket",
      icon: GitBranch,
    },
    {
      title: "Pending Updates",
      value: metricsLoading ? "..." : pendingUpdates,
      description: "Version upgrades needed",
      icon: RefreshCw,
      variant: pendingUpdates > 0 ? "warning" as const : undefined,
    },
    {
      title: "Vulnerabilities",
      value: metricsLoading ? "..." : vulnerabilities,
      description: "High/Critical issues",
      icon: AlertTriangle,
      variant: vulnerabilities > 0 ? "destructive" as const : undefined,
    },
    {
      title: "Test Coverage",
      value: metricsLoading ? "..." : testCoverage,
      description: "Average across all repos",
      icon: TestTube2,
      variant: "success" as const,
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">TechMandates</h1>
                <p className="text-sm text-muted-foreground">Technical Mandates Management Dashboard</p>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, Engineering Lead
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage versions, security, and testing across all your repositories
          </p>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {overviewMetrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <QuickActions />
          <RecentActivity />
        </div>
      </main>
    </div>
  );
};

export default Index;
