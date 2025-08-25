import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ImportWizard } from "@/components/ImportWizard";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Plus, QrCode, FileText, Upload, ExternalLink, ChevronDown } from "lucide-react";

interface EnhancedReceiveButtonProps {
  onImportComplete: (credential: any) => void;
  onNavigateToDigiLocker: () => void;
  onNavigateToImport: () => void;
  className?: string;
}

export function EnhancedReceiveButton({ 
  onImportComplete, 
  onNavigateToDigiLocker, 
  onNavigateToImport,
  className 
}: EnhancedReceiveButtonProps) {
  const { t } = useTranslation('wallet');
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleImportComplete = (credential: any) => {
    setShowImportWizard(false);
    onImportComplete(credential);
  };

  const handleQuickImport = () => {
    setShowImportWizard(true);
    setShowDropdown(false);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Main Receive Button */}
        <Button 
          onClick={handleQuickImport}
          variant="primary"
          className="min-h-[6rem] h-24 flex-col gap-1 gradient-primary shadow-glow hover:shadow-elevated transition-smooth group relative overflow-hidden"
          data-tour="receive"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-credverse-primary/20 to-primary-hover/20 opacity-0 group-hover:opacity-100 transition-smooth" />
          
          <div className="relative z-10 flex flex-col items-center gap-1">
            <Plus size={20} className="group-hover:rotate-90 transition-smooth" />
            <span className="text-xs font-medium">{t('receive')}</span>
          </div>
        </Button>

        {/* Dropdown for additional options */}
        <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="primary"
              size="sm"
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary/90 hover:bg-primary shadow-card z-20"
            >
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align="end" 
            className="w-48 bg-popover/95 backdrop-blur-sm border-border/50 shadow-elevated"
          >
            <DropdownMenuItem 
              onClick={handleQuickImport}
              className="cursor-pointer hover:bg-card-hover transition-smooth"
            >
              <Upload size={16} className="mr-2" />
              Quick Import
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => {
                onNavigateToImport();
                setShowDropdown(false);
              }}
              className="cursor-pointer hover:bg-card-hover transition-smooth"
            >
              <FileText size={16} className="mr-2" />
              Advanced Import
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-border/50" />
            
            <DropdownMenuItem 
              onClick={() => {
                onNavigateToDigiLocker();
                setShowDropdown(false);
              }}
              className="cursor-pointer hover:bg-card-hover transition-smooth"
            >
              <ExternalLink size={16} className="mr-2" />
              DigiLocker Import
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Import Wizard Modal */}
      <ImportWizard 
        open={showImportWizard}
        onClose={() => setShowImportWizard(false)}
        onImportComplete={handleImportComplete}
      />
    </>
  );
}