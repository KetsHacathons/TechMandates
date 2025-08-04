import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  RefreshCw, 
  Shield, 
  TestTube2,
  Settings,
  GitBranch
} from "lucide-react";
import { ThemeSelector } from "@/components/ui/theme-selector";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Version Upgrades",
    href: "/versions",
    icon: RefreshCw,
  },
  {
    title: "OSS Vulnerabilities",
    href: "/vulnerabilities",
    icon: Shield,
  },
  {
    title: "Test Coverage",
    href: "/coverage",
    icon: TestTube2,
  },
  {
    title: "Settings",
    href: "/repositories",
    icon: Settings,
  },
];

export function Navigation() {
  const location = useLocation();

  return (
    <div className="flex items-center gap-4">
      <nav className="flex items-center space-x-1 bg-card rounded-lg p-1 shadow-card">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                "hover:bg-secondary/80 hover:text-secondary-foreground",
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <ThemeSelector />
    </div>
  );
}