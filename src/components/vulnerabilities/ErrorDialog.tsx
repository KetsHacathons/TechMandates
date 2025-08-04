import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Info } from "lucide-react";

interface ErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string;
  repositoryName?: string;
}

const getErrorDetails = (error: string, repositoryName?: string) => {
  const isExternalRepo = repositoryName && !repositoryName.startsWith('KetsHacathons/');
  
  if (error.includes("Failed to create branch: Forbidden") || error.includes("Resource not accessible by personal access token")) {
    if (isExternalRepo) {
      return {
        title: "Cannot Fix External Repository",
        description: `You don't have write access to "${repositoryName}". You can only create vulnerability fixes for repositories you own or have collaborator access to.`,
        solutions: [
          "You can only fix vulnerabilities in your own repositories",
          "Fork this repository to your account if you want to create a fix",
          "Contact the repository owner to report the vulnerability",
          "Focus on fixing vulnerabilities in repositories you control"
        ],
        links: [
          {
            text: `Fork ${repositoryName?.split('/')[1]} Repository`,
            url: repositoryName ? `https://github.com/${repositoryName}/fork` : undefined
          },
          {
            text: "Report Security Issue",
            url: repositoryName ? `https://github.com/${repositoryName}/security/advisories/new` : undefined
          }
        ]
      };
    } else {
      return {
        title: "GitHub Token Permissions Error",
        description: "Your GitHub token doesn't have sufficient permissions to create branches and pull requests in your own repository.",
        solutions: [
          "Update your GitHub token with write permissions to Contents and Pull Requests",
          "Ensure your token hasn't expired",
          "For fine-grained tokens: grant 'Contents: Write' and 'Pull requests: Write' permissions",
          "For classic tokens: ensure 'repo' scope is selected"
        ],
        links: [
          {
            text: "Update GitHub Token in Supabase",
            url: "https://supabase.com/dashboard/project/hbxbmrffzlmkuahhsfwx/settings/functions"
          },
          {
            text: "Create New GitHub Token",
            url: "https://github.com/settings/tokens"
          }
        ]
      };
    }
  }

  if (error.includes("Failed to create pull request: Unprocessable Entity")) {
    return {
      title: "Pull Request Creation Failed",
      description: "Unable to create the pull request. This usually happens when there are conflicts or duplicate branches.",
      solutions: [
        "A branch with this name may already exist - check your repository",
        "Delete any existing fix branches and try again",
        "Ensure your repository allows pull requests from branches",
        "Verify your GitHub token has pull request write permissions"
      ],
      links: [
        {
          text: "View Repository Branches",
          url: repositoryName ? `https://github.com/${repositoryName}/branches` : undefined
        }
      ]
    };
  }

  if (error.includes("Resource not accessible by personal access token")) {
    return {
      title: "Repository Access Denied",
      description: isExternalRepo 
        ? `You don't have access to modify "${repositoryName}". This is an external repository that you cannot directly fix.`
        : "You don't have access to this repository or the token permissions are insufficient.",
      solutions: isExternalRepo ? [
        "You can only create fixes for repositories you own or collaborate on",
        "Fork the repository to your account to work on a fix",
        "Report the vulnerability to the repository maintainers",
        "Focus on vulnerabilities in your own repositories"
      ] : [
        "Ensure you own the repository or are a collaborator",
        "Use a fine-grained token with specific repository access",
        "Check that your GitHub token hasn't been revoked"
      ],
      links: isExternalRepo ? [
        {
          text: `Fork ${repositoryName?.split('/')[1]}`,
          url: repositoryName ? `https://github.com/${repositoryName}/fork` : undefined
        }
      ] : []
    };
  }

  // Generic error
  return {
    title: "Vulnerability Fix Failed", 
    description: "An unexpected error occurred while trying to create the vulnerability fix.",
    solutions: [
      "Check your internet connection",
      "Verify you have write access to the repository", 
      "Ensure your GitHub token is valid and has proper permissions",
      "Try again in a few minutes"
    ],
    links: []
  };
};

export function ErrorDialog({ open, onOpenChange, error, repositoryName }: ErrorDialogProps) {
  const errorDetails = getErrorDetails(error, repositoryName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {errorDetails.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {errorDetails.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              How to Fix This:
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {errorDetails.solutions.map((solution, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{solution}</span>
                </li>
              ))}
            </ul>
          </div>

          {errorDetails.links.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Helpful Links:</h4>
              {errorDetails.links.map((link, index) => (
                link.url && (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full justify-start"
                  >
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      {link.text}
                    </a>
                  </Button>
                )
              ))}
            </div>
          )}

          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs text-muted-foreground font-mono">{error}</p>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}