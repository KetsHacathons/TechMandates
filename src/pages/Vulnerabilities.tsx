import { useState, useEffect } from "react";
import { Navigation } from "@/components/ui/navigation";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SecurityScanModal } from "@/components/vulnerabilities/SecurityScanModal";
import { ErrorDialog } from "@/components/vulnerabilities/ErrorDialog";
import { VulnerabilityDetailsModal } from "@/components/vulnerabilities/VulnerabilityDetailsModal";
import { ReportGenerationModal } from "@/components/vulnerabilities/ReportGenerationModal";
import { useAuth } from "@/contexts/AuthContext";
import { useRepositories } from "@/hooks/useRepositories";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";
import { 
  Shield,
  AlertTriangle,
  Bug,
  TrendingDown,
  Play,
  Settings,
  Eye,
  ExternalLink,
  Clock,
  CheckCircle,
  RefreshCw
} from "lucide-react";

const Vulnerabilities = () => {
  const { repositories, loading: repositoriesLoading } = useRepositories();
  const { toast } = useToast();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isFixingVulnerability, setIsFixingVulnerability] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    error: string;
    repositoryName?: string;
  }>({ open: false, error: '' });
  const [selectedVulnerability, setSelectedVulnerability] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  // Load vulnerabilities from API
  const [scannedVulnerabilities, setScannedVulnerabilities] = useState<Array<{
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
  }>>([]);

  // Load vulnerabilities on component mount
  useEffect(() => {
    const loadVulnerabilities = async () => {
      try {
        const result = await apiClient.getVulnerabilities();
        if (result.data?.success) {
          setScannedVulnerabilities(result.data.vulnerabilities || []);
        }
      } catch (error) {
        console.error('Failed to load vulnerabilities:', error);
      }
    };
    loadVulnerabilities();
  }, []);
  const handleScanResults = (results: Array<{
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
  }>) => {
    setScannedVulnerabilities(results);
  };

  const handleFixVulnerability = async (vuln: any) => {
    setIsFixingVulnerability(vuln.id);
    
    try {
      toast({
        title: "Creating Fix",
        description: `Creating pull request to fix ${vuln.package} vulnerability...`
      });

      const result = await apiClient.fixVulnerability({
        repositoryId: vuln.repositoryId,
        vulnerabilityId: vuln.id,
        packageName: vuln.package,
        currentVersion: vuln.version,
        fixedVersion: vuln.fixedIn,
        repositoryFullName: repositories.find(r => r.id === vuln.repositoryId)?.full_name || ''
      });

      if (!result.data?.success) {
        throw new Error(result.error || 'Failed to fix vulnerability');
      }

      // Update vulnerability status to in-progress
      setScannedVulnerabilities(prev => 
        prev.map(v => 
          v.id === vuln.id 
            ? { ...v, status: 'in-progress' }
            : v
        )
      );

              toast({
          title: "Fix Pull Request Created! 🎉",
          description: (
            <div className="space-y-2">
              <p>Successfully created PR #{result.data.pullRequestNumber} to fix {vuln.package}</p>
              <p className="text-sm text-muted-foreground">
                Please review and merge the pull request to apply the security fix.
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
      console.error('Vulnerability fix failed:', error);
      const repository = repositories.find(r => r.id === vuln.repositoryId);
      
      setErrorDialog({
        open: true,
        error: error.message,
        repositoryName: repository?.full_name
      });
    } finally {
      setIsFixingVulnerability(null);
    }
  };

  const handleGenerateReport = () => {
    if (scannedVulnerabilities.length === 0) {
      toast({
        title: "No Data Available",
        description: "Please run a security scan first to generate a report.",
        variant: "destructive",
      });
      return;
    }
    
    setIsReportModalOpen(true);
  };

  const calculateSecurityMetrics = () => {
    if (scannedVulnerabilities.length === 0) {
      return [
        {
          title: "Critical Issues",
          value: 0,
          description: "No scan data available - run scan to see vulnerabilities",
          icon: AlertTriangle,
          variant: "secondary" as const
        },
        {
          title: "High Priority",
          value: 0,
          description: "No scan data available - run scan to see vulnerabilities",
          icon: Bug,
          variant: "secondary" as const
        },
        {
          title: "Medium/Low",
          value: 0,
          description: "No scan data available - run scan to see vulnerabilities",
          icon: Bug,
          variant: "secondary" as const
        },
        {
          title: "Security Score",
          value: "N/A",
          description: "Run scan to calculate score",
          icon: Shield,
          variant: "secondary" as const
        }
      ];
    }

    const critical = scannedVulnerabilities.filter(v => v.severity === 'critical').length;
    const high = scannedVulnerabilities.filter(v => v.severity === 'high').length;
    const medium = scannedVulnerabilities.filter(v => v.severity === 'medium').length;
    const low = scannedVulnerabilities.filter(v => v.severity === 'low').length;
    const total = scannedVulnerabilities.length;

    // Calculate security score based on vulnerability counts
    let score = 100;
    score -= critical * 30; // Critical: -30 points each
    score -= high * 15;     // High: -15 points each  
    score -= medium * 5;    // Medium: -5 points each
    score -= low * 1;       // Low: -1 point each
    score = Math.max(0, score);

    const getScoreGrade = (score: number) => {
      if (score >= 90) return 'A+';
      if (score >= 80) return 'A';
      if (score >= 70) return 'B+';
      if (score >= 60) return 'B';
      if (score >= 50) return 'C+';
      if (score >= 40) return 'C';
      if (score >= 30) return 'D';
      return 'F';
    };

    return [
      {
        title: "Critical Issues",
        value: critical,
        description: critical > 0 ? "Require immediate attention" : "No critical issues found",
        icon: AlertTriangle,
        variant: critical > 0 ? "destructive" as const : "success" as const,
        trend: critical > 0 ? undefined : { value: 100, label: "improvement" }
      },
      {
        title: "High Priority",
        value: high,
        description: high > 0 ? "Fix within 7 days" : "No high priority issues",
        icon: Bug,
        variant: high > 0 ? "warning" as const : "success" as const,
        trend: high > 0 ? undefined : { value: 50, label: "improvement" }
      },
      {
        title: "Medium/Low",
        value: medium + low,
        description: (medium + low) > 0 ? "Schedule for next sprint" : "No medium/low issues",
        icon: Bug,
        variant: (medium + low) > 0 ? "secondary" as const : "success" as const,
        trend: (medium + low) > 0 ? undefined : { value: 25, label: "improvement" }
      },
      {
        title: "Security Score",
        value: getScoreGrade(score),
        description: `${score}/100 - Overall security rating`,
        icon: Shield,
        variant: score >= 70 ? "success" as const : score >= 50 ? "warning" as const : "destructive" as const,
        trend: score >= 70 ? { value: 25, label: "improvement" } : undefined
      }
    ];
  };

  const securityMetrics = calculateSecurityMetrics();

  // Use scanned vulnerabilities if available, otherwise show placeholder
  const vulnerabilities = scannedVulnerabilities.length > 0 ? scannedVulnerabilities : [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'in-progress': return 'warning';
      case 'open': return 'destructive';
      default: return 'secondary';
    }
  };

  const getCVSSColor = (cvss: number) => {
    if (cvss >= 9.0) return 'text-destructive';
    if (cvss >= 7.0) return 'text-warning';
    if (cvss >= 4.0) return 'text-secondary';
    return 'text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">OSS Vulnerabilities</h1>
                <p className="text-sm text-muted-foreground">Security management across all repositories</p>
              </div>
            </div>
            <Navigation />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Security Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {securityMetrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button 
            className="gap-2" 
            onClick={() => {
              console.log('Security scan button clicked');
              console.log('Current modal state:', isScanModalOpen);
              setIsScanModalOpen(true);
              console.log('Modal state after setting to true:', true);
            }}
          >
            <Play className="h-4 w-4" />
            Run Security Scan
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Configure Scanning
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleGenerateReport}>
            <TrendingDown className="h-4 w-4" />
            Generate Report
          </Button>
        </div>

        {/* Vulnerabilities List */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Vulnerabilities</CardTitle>
                <CardDescription>
                  Security issues detected across your repositories
                </CardDescription>
              </div>
              <Badge variant="outline">
                {vulnerabilities.filter(v => v.status !== 'resolved').length} active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {vulnerabilities.length > 0 ? (
              <div className="space-y-6">
                {vulnerabilities.map((vuln) => (
                <div 
                  key={vuln.id}
                  className="p-6 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-full bg-destructive/10">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-foreground">{vuln.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {vuln.id}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {vuln.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Repository:</span>
                            <Badge variant="outline">{vuln.repository}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Package:</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              {vuln.package}@{vuln.version}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Fix available:</span>
                            <code className="bg-success/10 text-success px-2 py-1 rounded text-xs">
                              {vuln.fixedIn}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(vuln.severity)}>
                          {vuln.severity.toUpperCase()}
                        </Badge>
                        <div className={`text-sm font-mono ${getCVSSColor(vuln.cvss)}`}>
                          CVSS: {vuln.cvss}
                        </div>
                      </div>
                      <Badge variant={getStatusColor(vuln.status)}>
                        {vuln.status === 'resolved' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {vuln.status === 'in-progress' && <Clock className="h-3 w-3 mr-1" />}
                        {vuln.status === 'open' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {vuln.status}
                      </Badge>
                       <div className="flex gap-2">
                         <Button 
                           size="sm" 
                           variant="outline" 
                           className="gap-2"
                           onClick={() => {
                             setSelectedVulnerability(vuln);
                             setIsDetailsModalOpen(true);
                           }}
                         >
                           <Eye className="h-3 w-3" />
                           Details
                         </Button>
                        {vuln.status === 'open' && (
                          <Button 
                            size="sm" 
                            className="gap-2"
                            onClick={() => handleFixVulnerability(vuln)}
                            disabled={isFixingVulnerability === vuln.id}
                          >
                            {isFixingVulnerability === vuln.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <ExternalLink className="h-3 w-3" />
                            )}
                            {isFixingVulnerability === vuln.id ? 'Creating Fix...' : 'Fix Now'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {vuln.status === 'in-progress' && (
                    <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-warning">Fix in progress</span>
                        <span className="text-xs text-muted-foreground">65% complete</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  )}
                </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No vulnerability data available</p>
                <p className="text-sm text-muted-foreground">
                  Click "Run Security Scan" to scan your repositories for security vulnerabilities
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Scan Modal */}
        <SecurityScanModal
          open={isScanModalOpen}
          onOpenChange={setIsScanModalOpen}
          repositories={repositories}
          onScanResults={handleScanResults}
        />

        {/* Error Dialog */}
        <ErrorDialog
          open={errorDialog.open}
          onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, open }))}
          error={errorDialog.error}
          repositoryName={errorDialog.repositoryName}
        />

        {/* Vulnerability Details Modal */}
        <VulnerabilityDetailsModal
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          vulnerability={selectedVulnerability}
        />

        {/* Report Generation Modal */}
        <ReportGenerationModal
          open={isReportModalOpen}
          onOpenChange={setIsReportModalOpen}
          vulnerabilities={scannedVulnerabilities}
          metrics={securityMetrics}
        />
      </main>
    </div>
  );
};

export default Vulnerabilities;