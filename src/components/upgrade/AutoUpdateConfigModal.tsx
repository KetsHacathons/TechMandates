import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Shield, Bell } from "lucide-react";

interface AutoUpdateConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AutoUpdateConfigModal = ({ open, onOpenChange }: AutoUpdateConfigModalProps) => {
  const [autoUpdatesEnabled, setAutoUpdatesEnabled] = useState(false);
  const [updateSchedule, setUpdateSchedule] = useState("weekly");
  const [updateWindow, setUpdateWindow] = useState("weekend");
  const [notifications, setNotifications] = useState(true);
  const [updateTypes, setUpdateTypes] = useState({
    major: false,
    minor: true,
    patch: true,
    security: true
  });
  const [excludedRepos, setExcludedRepos] = useState<string[]>([]);
  const [maxConcurrentUpdates, setMaxConcurrentUpdates] = useState("3");

  const handleSave = () => {
    // Here you would save the configuration
    console.log("Saving auto-update configuration:", {
      autoUpdatesEnabled,
      updateSchedule,
      updateWindow,
      notifications,
      updateTypes,
      excludedRepos,
      maxConcurrentUpdates
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Auto-Update Configuration
          </DialogTitle>
          <DialogDescription>
            Configure automated version updates for your repositories
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enable Auto-Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enable Auto-Updates</CardTitle>
              <CardDescription>
                Automatically update dependencies and frameworks across your repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-updates"
                  checked={autoUpdatesEnabled}
                  onCheckedChange={setAutoUpdatesEnabled}
                />
                <Label htmlFor="auto-updates">Enable automatic updates</Label>
              </div>
            </CardContent>
          </Card>

          {autoUpdatesEnabled && (
            <>
              {/* Update Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Update Schedule
                  </CardTitle>
                  <CardDescription>
                    When should automatic updates be performed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="schedule">Update Frequency</Label>
                      <Select value={updateSchedule} onValueChange={setUpdateSchedule}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="window">Update Window</Label>
                      <Select value={updateWindow} onValueChange={setUpdateWindow}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekend">Weekend</SelectItem>
                          <SelectItem value="weeknight">Weeknight</SelectItem>
                          <SelectItem value="business">Business Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Update Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Update Types</CardTitle>
                  <CardDescription>
                    Choose which types of updates to apply automatically
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="security"
                          checked={updateTypes.security}
                          onCheckedChange={(checked) => 
                            setUpdateTypes(prev => ({ ...prev, security: checked as boolean }))
                          }
                        />
                        <Label htmlFor="security">Security Updates</Label>
                        <Badge variant="destructive" className="text-xs">Critical</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="patch"
                          checked={updateTypes.patch}
                          onCheckedChange={(checked) => 
                            setUpdateTypes(prev => ({ ...prev, patch: checked as boolean }))
                          }
                        />
                        <Label htmlFor="patch">Patch Updates (1.0.x)</Label>
                        <Badge variant="success" className="text-xs">Safe</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="minor"
                          checked={updateTypes.minor}
                          onCheckedChange={(checked) => 
                            setUpdateTypes(prev => ({ ...prev, minor: checked as boolean }))
                          }
                        />
                        <Label htmlFor="minor">Minor Updates (1.x.0)</Label>
                        <Badge variant="warning" className="text-xs">Review</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="major"
                          checked={updateTypes.major}
                          onCheckedChange={(checked) => 
                            setUpdateTypes(prev => ({ ...prev, major: checked as boolean }))
                          }
                        />
                        <Label htmlFor="major">Major Updates (x.0.0)</Label>
                        <Badge variant="destructive" className="text-xs">Breaking</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance & Limits */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Performance & Limits
                  </CardTitle>
                  <CardDescription>
                    Configure update performance and resource limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="concurrent">Maximum Concurrent Updates</Label>
                    <Select value={maxConcurrentUpdates} onValueChange={setMaxConcurrentUpdates}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 (Conservative)</SelectItem>
                        <SelectItem value="3">3 (Recommended)</SelectItem>
                        <SelectItem value="5">5 (Aggressive)</SelectItem>
                        <SelectItem value="10">10 (Maximum)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure how you want to be notified about updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notifications"
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                    <Label htmlFor="notifications">
                      Send notifications for update status and failures
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};