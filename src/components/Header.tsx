import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Settings, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import credverseIcon from "@/assets/credverse-icon.png";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showProfile?: boolean;
  className?: string;
}

export function Header({ 
  title = "CredVerse", 
  showBack = false,
  onBack,
  showProfile = true,
  className 
}: HeaderProps) {
  return (
    <header className={cn("flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/50", className)}>
      <div className="flex items-center gap-3">
        {showBack && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft size={18} />
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-background/10 backdrop-blur-sm">
            <img src={credverseIcon} alt="CredVerse" className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold text-foreground">
            {title}
          </h1>
        </div>
      </div>
      
      {showProfile && (
        <div className="flex items-center gap-2">
          {/* Wallet Status Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success-bg border border-success/20">
            <div className="h-2 w-2 rounded-full bg-success"></div>
            <span className="text-xs font-medium text-success">Secured</span>
          </div>
          
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings size={16} />
          </Button>
        </div>
      )}
    </header>
  );
}