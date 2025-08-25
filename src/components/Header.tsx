import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Settings, ChevronLeft, LogOut, Share2, FileText, Download, ExternalLink, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import credverseIcon from "/lovable-uploads/db11a0ec-0435-450c-9ff8-9ac7c6c38c91.png";
interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showProfile?: boolean;
  className?: string;
  // Quick actions
  onPresent?: () => void;
  onImport?: () => void;
  onBackup?: () => void;
  onSettings?: () => void;
  onDigiLocker?: () => void;
  onTrash?: () => void;
  trashCount?: number;
  showQuickActions?: boolean;
}
export function Header({
  title = "CredVerse",
  showBack = false,
  onBack,
  showProfile = true,
  className,
  onPresent,
  onImport,
  onBackup,
  onSettings,
  onDigiLocker,
  onTrash,
  trashCount = 0,
  showQuickActions = false
}: HeaderProps) {
  const {
    signOut
  } = useAuth();
  return (
    <TooltipProvider>
      <header className={cn("flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/50", className)}>
        <div className="flex items-center gap-3">
          {showBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
              <ChevronLeft size={18} />
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 backdrop-blur-sm bg-gray-950 rounded-none">
              <img src={credverseIcon} alt="CredVerse" className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold text-foreground">
              {title}
            </h1>
          </div>
        </div>
        
        {/* Quick Actions Bar */}
        {showQuickActions && (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onPresent} className="h-8 w-8 p-0">
                  <Share2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Present</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onImport} className="h-8 w-8 p-0">
                  <FileText size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Import</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onBackup} className="h-8 w-8 p-0">
                  <Download size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Backup</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onSettings} className="h-8 w-8 p-0">
                  <Settings size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
            
            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem onClick={onDigiLocker} className="cursor-pointer">
                  <ExternalLink size={16} className="mr-2" />
                  DigiLocker
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onTrash} className="cursor-pointer">
                  <Trash2 size={16} className="mr-2" />
                  Trash {trashCount > 0 && `(${trashCount})`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        {showProfile && (
          <div className="flex items-center gap-2">
            {/* Wallet Status Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success-bg border border-success/20">
              <div className="h-2 w-2 rounded-full bg-success"></div>
              <span className="text-xs font-medium text-success">Secured</span>
            </div>
            
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={signOut}>
              <LogOut size={16} />
            </Button>
          </div>
        )}
      </header>
    </TooltipProvider>
  );
}