import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTheme } from "@/contexts/ThemeContext";

export const ThemeSelector = () => {
  const { currentTheme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="h-4 w-4" />
          Theme
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose Your Theme</DialogTitle>
          <DialogDescription>
            Select a theme that matches your style. Changes will be applied instantly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {themes.map((theme) => (
            <Card 
              key={theme.id}
              className={`cursor-pointer transition-all hover:shadow-elevated ${
                currentTheme.id === theme.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleThemeSelect(theme.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{theme.name}</h3>
                  {currentTheme.id === theme.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mb-4">{theme.description}</p>
                
                {/* Theme Preview */}
                <div className="space-y-2">
                  <div 
                    className="h-8 rounded-md flex items-center px-3 text-xs font-medium"
                    style={{ 
                      background: `hsl(${theme.colors.primary})`,
                      color: `hsl(${theme.colors.primaryForeground})`
                    }}
                  >
                    Primary
                  </div>
                  <div className="flex gap-2">
                    <div 
                      className="h-6 flex-1 rounded-sm"
                      style={{ background: `hsl(${theme.colors.secondary})` }}
                    />
                    <div 
                      className="h-6 flex-1 rounded-sm"
                      style={{ background: `hsl(${theme.colors.accent})` }}
                    />
                    <div 
                      className="h-6 flex-1 rounded-sm"
                      style={{ background: `hsl(${theme.colors.success})` }}
                    />
                  </div>
                  <div 
                    className="h-4 rounded-sm"
                    style={{ background: theme.colors.gradientPrimary }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};