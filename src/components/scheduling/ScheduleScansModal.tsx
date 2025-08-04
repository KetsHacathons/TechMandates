import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Clock, Calendar, RefreshCw, Shield, TestTube2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScheduleScansModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ScanSchedule {
  id: string;
  type: 'security' | 'version' | 'coverage';
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  lastRun?: string;
  nextRun: string;
}

export function ScheduleScansModal({ open, onOpenChange }: ScheduleScansModalProps) {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<ScanSchedule[]>([
    {
      id: 'security',
      type: 'security',
      enabled: false,
      frequency: 'weekly',
      time: '09:00',
      nextRun: 'Not scheduled'
    },
    {
      id: 'version',
      type: 'version',
      enabled: false,
      frequency: 'daily',
      time: '06:00',
      nextRun: 'Not scheduled'
    },
    {
      id: 'coverage',
      type: 'coverage',
      enabled: false,
      frequency: 'weekly',
      time: '10:00',
      nextRun: 'Not scheduled'
    }
  ]);

  const getScanIcon = (type: string) => {
    switch (type) {
      case 'security':
        return Shield;
      case 'version':
        return RefreshCw;
      case 'coverage':
        return TestTube2;
      default:
        return Clock;
    }
  };

  const getScanLabel = (type: string) => {
    switch (type) {
      case 'security':
        return 'Security Scans';
      case 'version':
        return 'Version Scans';
      case 'coverage':
        return 'Coverage Analysis';
      default:
        return 'Unknown';
    }
  };

  const getScanDescription = (type: string) => {
    switch (type) {
      case 'security':
        return 'Automatically scan for security vulnerabilities';
      case 'version':
        return 'Check for available dependency updates';
      case 'coverage':
        return 'Analyze unit test coverage across repositories';
      default:
        return 'Unknown scan type';
    }
  };

  const calculateNextRun = (frequency: string, time: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, move to the next occurrence
    if (nextRun <= now) {
      switch (frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }
    }
    
    return nextRun.toLocaleString();
  };

  const toggleSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.map(schedule => {
      if (schedule.id === scheduleId) {
        const enabled = !schedule.enabled;
        const nextRun = enabled 
          ? calculateNextRun(schedule.frequency, schedule.time)
          : 'Not scheduled';
        
        return { ...schedule, enabled, nextRun };
      }
      return schedule;
    }));
  };

  const updateFrequency = (scheduleId: string, frequency: 'daily' | 'weekly' | 'monthly') => {
    setSchedules(prev => prev.map(schedule => {
      if (schedule.id === scheduleId) {
        const nextRun = schedule.enabled 
          ? calculateNextRun(frequency, schedule.time)
          : schedule.nextRun;
        
        return { ...schedule, frequency, nextRun };
      }
      return schedule;
    }));
  };

  const updateTime = (scheduleId: string, time: string) => {
    setSchedules(prev => prev.map(schedule => {
      if (schedule.id === scheduleId) {
        const nextRun = schedule.enabled 
          ? calculateNextRun(schedule.frequency, time)
          : schedule.nextRun;
        
        return { ...schedule, time, nextRun };
      }
      return schedule;
    }));
  };

  const saveSchedules = () => {
    // In a real implementation, this would save to the database
    console.log('Saving schedules:', schedules);
    
    toast({
      title: "Schedules Updated",
      description: "Your scan schedules have been saved successfully.",
    });
    
    onOpenChange(false);
  };

  const getEnabledCount = () => {
    return schedules.filter(s => s.enabled).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule Automated Scans
          </DialogTitle>
          <DialogDescription>
            Configure automatic scanning schedules for your repositories
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Schedule Summary</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {getEnabledCount()} of {schedules.length} scan types are currently scheduled
            </p>
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Scan Types</h3>
            
            {schedules.map((schedule, index) => {
              const Icon = getScanIcon(schedule.type);
              
              return (
                <div key={schedule.id}>
                  <Card className="p-4">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{getScanLabel(schedule.type)}</h4>
                            <p className="text-sm text-muted-foreground">
                              {getScanDescription(schedule.type)}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={schedule.enabled}
                          onCheckedChange={() => toggleSchedule(schedule.id)}
                        />
                      </div>

                      {/* Schedule Details */}
                      {schedule.enabled && (
                        <div className="space-y-4 pl-11">
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-4">
                            {/* Frequency */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Frequency</Label>
                              <div className="flex gap-2">
                                {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                                  <Button
                                    key={freq}
                                    variant={schedule.frequency === freq ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateFrequency(schedule.id, freq)}
                                    className="capitalize"
                                  >
                                    {freq}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {/* Time */}
                            <div className="space-y-2">
                              <Label htmlFor={`time-${schedule.id}`} className="text-sm font-medium">
                                Time
                              </Label>
                              <input
                                id={`time-${schedule.id}`}
                                type="time"
                                value={schedule.time}
                                onChange={(e) => updateTime(schedule.id, e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </div>
                          </div>

                          {/* Next Run */}
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              <span className="font-medium">Next run:</span>{' '}
                              <span className="text-muted-foreground">{schedule.nextRun}</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                  
                  {index < schedules.length - 1 && <div className="h-2" />}
                </div>
              );
            })}
          </div>

          {/* Warning */}
          {getEnabledCount() > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Scheduled Scan Notice</p>
                <p className="text-sm text-muted-foreground">
                  Automated scans will run in the background and may affect repository access during execution. 
                  You'll receive notifications when scans complete.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveSchedules}>
              Save Schedules
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}