import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { 
  Activity,
  GitCommit,
  Shield,
  RefreshCw,
  TestTube2,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcons = {
  version: RefreshCw,
  security: Shield,
  coverage: TestTube2,
  general: GitCommit
};

const statusStyles = {
  success: 'text-success bg-success/10 border-success/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
  error: 'text-destructive bg-destructive/10 border-destructive/20',
  pending: 'text-primary bg-primary/10 border-primary/20'
};

const statusIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertTriangle,
  pending: Clock
};

export function RecentActivity() {
  const { activities, loading, error } = useRecentActivity();
  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle>Recent Activity</CardTitle>
        </div>
        <CardDescription>
          Latest updates across your repositories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                Failed to load recent activity. Please try again later.
              </p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                No recent activity found. Run some scans to see activity here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const TypeIcon = typeIcons[activity.type];
                const StatusIcon = statusIcons[activity.status];
                
                return (
                  <div key={activity.id} className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="p-2 rounded-full bg-primary/10">
                        <TypeIcon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-sm text-foreground">
                            {activity.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                          {activity.repository && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              {activity.repository}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", statusStyles[activity.status])}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {activity.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {activity.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}