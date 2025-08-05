import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SecurityScanModal } from "@/components/vulnerabilities/SecurityScanModal";
import { ScanUpdatesModal } from "@/components/upgrade/ScanUpdatesModal";
import { CoverageAnalysisModal } from "@/components/coverage/CoverageAnalysisModal";
import { ScheduleScansModal } from "@/components/scheduling/ScheduleScansModal";
import { useQuickActions } from "@/hooks/useQuickActions";
import { useToast } from "@/hooks/use-toast";
import { 
  PlayCircle, 
  RefreshCw, 
  ScanLine, 
  TestTube2,
  Clock,
  Zap
} from "lucide-react";

const quickActions = [
  {
    title: "Run Version Scan",
    description: "Check all repositories for outdated dependencies",
    icon: RefreshCw,
    variant: "default" as const,
    action: "scan-versions"
  },
  {
    title: "Security Scan",
    description: "Scan for OSS vulnerabilities across projects",
    icon: ScanLine,
    variant: "secondary" as const,
    action: "scan-security"
  },
  {
    title: "Coverage Analysis",
    description: "Analyze unit test coverage for all repos",
    icon: TestTube2,
    variant: "outline" as const,
    action: "analyze-coverage"
  },
  {
    title: "Schedule Scans",
    description: "Configure automated scanning schedules",
    icon: Clock,
    variant: "outline" as const,
    action: "schedule-scans"
  }
];

export function QuickActions() {
  const { toast } = useToast();
  const {
    isSecurityScanOpen,
    isVersionScanOpen,
    isCoverageAnalysisOpen,
    isScheduleScansOpen,
    repositories,
    closeSecurityScan,
    closeVersionScan,
    closeCoverageAnalysis,
    closeScheduleScans,
    handleAction,
  } = useQuickActions();

  const handleSecurityScanResults = (results: any[]) => {
    toast({
      title: "Security Scan Complete",
      description: `Found ${results.length} vulnerabilities across scanned repositories.`,
    });
  };

  const handleVersionScanResults = (results: any[]) => {
    toast({
      title: "Version Scan Complete", 
      description: `Found ${results.length} available updates across scanned repositories.`,
    });
  };

  const handleCoverageAnalysisResults = (results: any[]) => {
    const avgCoverage = results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.coverage, 0) / results.length)
      : 0;
    
    toast({
      title: "Coverage Analysis Complete",
      description: `Average coverage: ${avgCoverage}% across ${results.length} repositories.`,
    });
  };

  return (
    <>
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Quick Actions</CardTitle>
          </div>
          <CardDescription>
            Execute common tasks across your repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.action}
                variant={action.variant}
                className="h-auto p-4 justify-start gap-3 hover:shadow-md transition-all duration-200"
                onClick={() => handleAction(action.action)}
              >
                <action.icon className="h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <SecurityScanModal
        open={isSecurityScanOpen}
        onOpenChange={closeSecurityScan}
        repositories={repositories}
        onScanResults={handleSecurityScanResults}
      />

      <ScanUpdatesModal
        open={isVersionScanOpen}
        onOpenChange={closeVersionScan}
        repositories={repositories}
        onScanResults={handleVersionScanResults}
      />

      <CoverageAnalysisModal
        open={isCoverageAnalysisOpen}
        onOpenChange={closeCoverageAnalysis}
        repositories={repositories}
        onAnalysisResults={handleCoverageAnalysisResults}
      />

      <ScheduleScansModal
        open={isScheduleScansOpen}
        onOpenChange={closeScheduleScans}
      />
    </>
  );
}