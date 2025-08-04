import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { type Repository } from "@/hooks/useRepositories";
import { sqlite } from "@/integrations/sqlite/client";
import { UpgradeReportGenerator } from "./UpgradeReportGenerator";

interface UpgradeSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repositories: Repository[];
  loading?: boolean;
  onStartUpgrade: (data: {
    repositoryId: string;
    technology: string;
    targetVersion: string;
  }) => void;
}

const technologyVersions = {
  Java: ["21.0.2", "21.0.1", "21.0.0", "17.0.9", "17.0.8", "17.0.7", "17.0.6", "17.0.5", "11.0.21", "11.0.20", "11.0.19", "8u392", "8u382", "8u372"],
  Angular: ["18", "17", "16", "15"],
  Python: ["3.12", "3.11", "3.10", "3.9"],
  TypeScript: ["5.3", "5.2", "5.1", "5.0", "4.9"],
  "Node.js": ["20", "18", "16", "14"],
  React: ["18", "17", "16"],
  "Vue.js": ["3.4", "3.3", "3.2"],
  "Next.js": ["14", "13", "12"],
  Nuxt: ["3.8", "3.7", "3.6"],
  Express: ["4.18", "4.17"],
  NestJS: ["10", "9", "8"],
  Django: ["4.2", "4.1", "3.2"],
  Flask: ["2.3", "2.2", "2.1"],
  "Spring Boot": ["3.2", "3.1", "3.0", "2.7"],
  ".NET": ["8.0", "7.0", "6.0"],
  Go: ["1.21", "1.20", "1.19"],
  Rust: ["1.75", "1.74", "1.73"],
  PHP: ["8.3", "8.2", "8.1", "8.0"],
  Laravel: ["10", "9", "8"],
  Ruby: ["3.2", "3.1", "3.0"],
  "Ruby on Rails": ["7.1", "7.0", "6.1"]
};

export function UpgradeSelectionModal({ 
  open, 
  onOpenChange, 
  repositories, 
  loading = false,
  onStartUpgrade 
}: UpgradeSelectionModalProps) {
  const [selectedRepository, setSelectedRepository] = useState<string>("");
  const [selectedTechnology, setSelectedTechnology] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [detectingVersion, setDetectingVersion] = useState(false);

  // Detect current version when repository and technology are selected
  useEffect(() => {
    const detectVersion = async () => {
      if (selectedRepository && selectedTechnology) {
        setDetectingVersion(true);
        setCurrentVersion(null);
        
        try {
          const { data, error } = await sqlite.functions.invoke('detect-current-version', {
            body: {
              repositoryId: selectedRepository,
              technology: selectedTechnology
            }
          });

          if (error) {
            console.error('Error detecting version:', error);
          } else if (data?.success) {
            setCurrentVersion(data.currentVersion);
          }
        } catch (error) {
          console.error('Error detecting version:', error);
        } finally {
          setDetectingVersion(false);
        }
      } else {
        setCurrentVersion(null);
      }
    };

    detectVersion();
  }, [selectedRepository, selectedTechnology]);

  const handleStartUpgrade = () => {
    if (selectedRepository && selectedTechnology && selectedVersion) {
      // Generate PDF report before starting upgrade
      const selectedRepo = repositories.find(repo => repo.id === selectedRepository);
      if (selectedRepo) {
        UpgradeReportGenerator.generateUpgradeReport([{
          repositoryName: selectedRepo.full_name,
          technology: selectedTechnology,
          currentVersion: currentVersion,
          targetVersion: selectedVersion,
          upgradeType: 'single'
        }]);
      }

      onStartUpgrade({
        repositoryId: selectedRepository,
        technology: selectedTechnology,
        targetVersion: selectedVersion
      });
      
      // Reset form
      setSelectedRepository("");
      setSelectedTechnology("");
      setSelectedVersion("");
      setCurrentVersion(null);
      onOpenChange(false);
    }
  };

  const availableVersions = selectedTechnology 
    ? technologyVersions[selectedTechnology as keyof typeof technologyVersions] || []
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start Version Upgrade</DialogTitle>
          <DialogDescription>
            Select the repository, technology, and target version for the upgrade scan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="repository">Repository</Label>
            <Select value={selectedRepository} onValueChange={setSelectedRepository} disabled={loading}>
              <SelectTrigger id="repository">
                <SelectValue placeholder={
                  loading 
                    ? "Loading repositories..." 
                    : repositories.length === 0 
                      ? "No repositories found - connect repositories in Settings" 
                      : "Select a repository"
                } />
              </SelectTrigger>
              <SelectContent>
                {repositories.map((repo) => (
                  <SelectItem key={repo.id} value={repo.id}>
                    <div className="flex flex-col">
                      <span>{repo.full_name}</span>
                      {repo.language && (
                        <span className="text-xs text-muted-foreground">{repo.language}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="technology">Technology</Label>
            <Select value={selectedTechnology} onValueChange={(value) => {
              setSelectedTechnology(value);
              setSelectedVersion(""); // Reset version when technology changes
            }}>
              <SelectTrigger id="technology">
                <SelectValue placeholder="Select technology" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(technologyVersions).map((tech) => (
                  <SelectItem key={tech} value={tech}>
                    {tech}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedRepository && selectedTechnology && (
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Current Version</Label>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                {detectingVersion ? (
                  <span className="text-sm text-muted-foreground">Detecting current version...</span>
                ) : currentVersion ? (
                  <span className="text-sm font-mono">{selectedTechnology} {currentVersion}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Could not detect current version</span>
                )}
              </div>
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="version">Target Version</Label>
            <Select 
              value={selectedVersion} 
              onValueChange={setSelectedVersion}
              disabled={!selectedTechnology}
            >
              <SelectTrigger id="version">
                <SelectValue placeholder="Select target version" />
              </SelectTrigger>
              <SelectContent>
                {availableVersions.map((version) => (
                  <SelectItem key={version} value={version}>
                    {version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleStartUpgrade}
            disabled={!selectedRepository || !selectedTechnology || !selectedVersion || loading}
          >
            {loading ? "Creating..." : "Start Upgrade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}