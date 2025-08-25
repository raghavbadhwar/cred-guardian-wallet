import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface WalletActionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  badge?: string | number;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
}

export function WalletActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  disabled = false,
  className,
  badge,
  variant = "default",
  size = "md",
}: WalletActionCardProps) {
  const variantStyles = {
    default: "border-border/50 hover:border-border/70 hover:bg-card-hover",
    primary: "border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:shadow-glow",
    success: "border-success/20 hover:border-success/40 hover:bg-success/5",
    warning: "border-warning/20 hover:border-warning/40 hover:bg-warning/5",
    danger: "border-danger/20 hover:border-danger/40 hover:bg-danger/5",
  };

  const sizeStyles = {
    sm: "p-3 min-h-[4rem]",
    md: "p-4 min-h-[5rem]",
    lg: "p-6 min-h-[6rem]",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <Card
      className={cn(
        "gradient-card shadow-card cursor-pointer transition-all duration-300 group relative overflow-hidden",
        variantStyles[variant],
        sizeStyles[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-1">
        <div className="relative">
          <Icon 
            size={iconSizes[size]} 
            className={cn(
              "transition-all duration-300 group-hover:scale-110",
              variant === "primary" && "text-primary",
              variant === "success" && "text-success",
              variant === "warning" && "text-warning",
              variant === "danger" && "text-danger",
              variant === "default" && "text-muted-foreground group-hover:text-foreground"
            )} 
          />
          {badge && (
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
              {badge}
            </div>
          )}
        </div>
        
        <div className="space-y-0.5">
          <h3 className={cn(
            "font-medium transition-colors duration-300",
            size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base",
            "group-hover:text-foreground"
          )}>
            {title}
          </h3>
          {description && (
            <p className={cn(
              "text-muted-foreground transition-colors duration-300 group-hover:text-muted-foreground/80",
              size === "sm" ? "text-xs" : "text-xs"
            )}>
              {description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}