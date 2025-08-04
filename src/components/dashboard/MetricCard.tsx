import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconImage?: string;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "success" | "warning" | "destructive" | "secondary";
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconImage,
  trend,
  variant = "default",
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: "border-border",
    success: "border-success/20 bg-gradient-to-br from-success/5 to-success/10",
    warning: "border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10",
    destructive: "border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10",
    secondary: "border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10"
  };

  const iconStyles = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    secondary: "text-secondary-foreground"
  };

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-elevated hover:-translate-y-1",
      variantStyles[variant],
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        {iconImage ? (
          <img src={iconImage} alt={title} className="h-5 w-5 object-contain" />
        ) : Icon ? (
          <Icon className={cn("h-5 w-5", iconStyles[variant])} />
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span className={cn(
              "text-xs font-medium",
              trend.value > 0 ? "text-success" : trend.value < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}