import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { type Repository } from "@/hooks/useRepositories";
import { UpgradeReportGenerator } from "./UpgradeReportGenerator";
import { Package, AlertTriangle } from "lucide-react";

interface BulkUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repositories: Repository[];
  scannedUpgrades: Array<{
    repository: string;
    repositoryId: string;
    platform: string;
    technology: string;
    currentVersion: string;
    targetVersion: string;
    status: string;
    priority: string;
  }>;
  loading?: boolean;
  onStartUpgrade: (data: {
    repositoryId: string;
    technology: string;
    targetVersion: string;
  }) => void;
}

export function BulkUpgradeModal({ 
  open, 
  onOpenChange, 
  repositories,
  scannedUpgrades,
  loading = false,
  onStartUpgrade 
}: BulkUpgradeModalProps) {
  const [selectedUpgrades, setSelectedUpgrades] = useState<Set<string>>(new Set());

  // Get pending upgrades only
  const pendingUpgrades = scannedUpgrades.filter(upgrade => upgrade.status === 'pending');

  const handleUpgradeToggle = (upgradeKey: string, checked: boolean) => {
    const newSelected = new Set(selectedUpgrades);
    if (checked) {
      newSelected.add(upgradeKey);
    } else {
      newSelected.delete(upgradeKey);
    }
    setSelectedUpgrades(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUpgrades.size === pendingUpgrades.length) {
      setSelectedUpgrades(new Set());
    } else {
      setSelectedUpgrades(new Set(pendingUpgrades.map(upgrade => 
        `${upgrade.repositoryId}-${upgrade.technology}`
      )));
    }
  };

  const handleStartAllUpgrades = () => {
    const upgradesToProcess = pendingUpgrades.filter(upgrade => 
      selectedUpgrades.has(`${upgrade.repositoryId}-${upgrade.technology}`)
    );

    if (upgradesToProcess.length === 0) return;

    // Generate comprehensive PDF report
    const upgradeInfos = upgradesToProcess.map(upgrade => ({
      repositoryName: upgrade.repository,
      technology: upgrade.technology,
      currentVersion: upgrade.currentVersion,
      targetVersion: upgrade.targetVersion,
      upgradeType: 'bulk' as const
    }));

    UpgradeReportGenerator.generateUpgradeReport(upgradeInfos);

    // Start all selected upgrades
    upgradesToProcess.forEach(upgrade => {
      onStartUpgrade({
        repositoryId: upgrade.repositoryId,
        technology: upgrade.technology,
        targetVersion: upgrade.targetVersion
      });
    });

    // Reset and close
    setSelectedUpgrades(new Set());
    onOpenChange(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const allSelected = selectedUpgrades.size === pendingUpgrades.length;
  const someSelected = selectedUpgrades.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Start All Upgrades
          </DialogTitle>
          <DialogDescription>
            Select the upgrades you want to process. A comprehensive upgrade report will be generated and downloaded.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {pendingUpgrades.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No pending upgrades available</p>
              <p className="text-sm text-muted-foreground">
                Run "Scan for Updates" to discover available upgrades
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="font-medium">
                  {allSelected ? 'Deselect All' : 'Select All'} ({pendingUpgrades.length} upgrades)
                </Label>
              </div>

              {/* Upgrade List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingUpgrades.map((upgrade) => {
                  const upgradeKey = `${upgrade.repositoryId}-${upgrade.technology}`;
                  const isSelected = selectedUpgrades.has(upgradeKey);
                  
                  return (
                    <div 
                      key={upgradeKey}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                        isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        id={upgradeKey}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleUpgradeToggle(upgradeKey, !!checked)}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{upgrade.repository}</span>
                            <Badge variant="outline" className="text-xs">
                              {upgrade.platform}
                            </Badge>
                          </div>
                          <Badge variant={getPriorityColor(upgrade.priority)}>
                            {upgrade.priority}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">{upgrade.technology}:</span> {upgrade.currentVersion} → {upgrade.targetVersion}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              {someSelected && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">{selectedUpgrades.size}</span> upgrade{selectedUpgrades.size !== 1 ? 's' : ''} selected
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    A detailed upgrade report will be generated and downloaded automatically
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedUpgrades(new Set());
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStartAllUpgrades}
            disabled={!someSelected || loading || pendingUpgrades.length === 0}
          >
            {loading ? "Processing..." : `Start ${selectedUpgrades.size} Upgrade${selectedUpgrades.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}