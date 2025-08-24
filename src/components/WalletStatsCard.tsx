import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WalletStatsCardProps {
  title: string;
  value: number;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  onClick?: () => void;
  variant?: "default" | "success" | "warning" | "danger" | "primary";
  className?: string;
}

export function WalletStatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  onClick,
  variant = "default",
  className,
}: WalletStatsCardProps) {
  const variantStyles = {
    default: "border-border/50",
    success: "border-success/20 bg-success/5",
    warning: "border-warning/20 bg-warning/5",
    danger: "border-danger/20 bg-danger/5",
    primary: "border-primary/20 bg-primary/5",
  };

  const valueColors = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    primary: "text-primary",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <Card
      className={cn(
        "gradient-card shadow-card p-4 transition-all duration-300 group relative overflow-hidden",
        variantStyles[variant],
        onClick && "cursor-pointer hover:shadow-elevated hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      {/* Background glow effect for interactive cards */}
      {onClick && (
        <div className="absolute inset-0 bg-gradient-to-br from-background/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {Icon && <Icon size={16} className="text-muted-foreground" />}
        </div>
        
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className={cn("text-3xl font-bold transition-colors duration-300", valueColors[variant])}>
              {value}
            </div>
            
            {trend && trendValue && (
              <div className="flex items-center gap-1">
                <TrendIcon 
                  size={12} 
                  className={cn(
                    trend === "up" && "text-success",
                    trend === "down" && "text-danger",
                    trend === "neutral" && "text-muted-foreground"
                  )}
                />
                <span className={cn(
                  "text-xs font-medium",
                  trend === "up" && "text-success",
                  trend === "down" && "text-danger",
                  trend === "neutral" && "text-muted-foreground"
                )}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}