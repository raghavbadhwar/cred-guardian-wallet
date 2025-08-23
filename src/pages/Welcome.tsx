import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Download, Smartphone, Lock } from "lucide-react";
import credverseIcon from "@/assets/credverse-icon.png";

export default function Welcome() {
  const navigate = useNavigate();

  const handleCreateWallet = () => {
    // Simulate wallet creation
    localStorage.setItem('credverse-wallet-setup', 'true');
    localStorage.setItem('credverse-wallet-created', new Date().toISOString());
    console.log("Creating new wallet...");
    navigate('/wallet');
  };

  const handleImportWallet = () => {
    // Simulate wallet import
    localStorage.setItem('credverse-wallet-setup', 'true');
    localStorage.setItem('credverse-wallet-imported', new Date().toISOString());
    console.log("Importing existing wallet...");
    navigate('/wallet');
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-background/10 backdrop-blur-sm">
            <img src={credverseIcon} alt="CredVerse" className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">CredVerse</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-background/10 backdrop-blur-sm flex items-center justify-center shadow-glow">
              <img src={credverseIcon} alt="CredVerse" className="h-10 w-10" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Your secure education wallet
              </h1>
              <p className="text-muted-foreground">
                Store and share verified degrees with one tap.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="gradient-card shadow-card p-4 border-border/50">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-10 w-10 rounded-lg bg-success-bg flex items-center justify-center">
                  <Lock size={18} className="text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">Private</p>
                  <p className="text-xs text-muted-foreground">Data stays on device</p>
                </div>
              </div>
            </Card>

            <Card className="gradient-card shadow-card p-4 border-border/50">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-10 w-10 rounded-lg bg-credverse-primary/10 flex items-center justify-center">
                  <Smartphone size={18} className="text-credverse-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">Instant</p>
                  <p className="text-xs text-muted-foreground">5-second verification</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={handleCreateWallet}
              variant="primary"
              className="w-full font-medium h-12"
            >
              Create New Wallet
            </Button>
            
            <Button 
              onClick={handleImportWallet}
              variant="outline" 
              className="w-full border-border/50 hover:bg-card-hover transition-smooth h-12"
            >
              <Download size={16} className="mr-2" />
              Import Existing Wallet
            </Button>
          </div>

          {/* Privacy Note */}
          <Card className="gradient-card shadow-card p-4 border-border/50">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Your data stays on your device. Only proofs are shared.
              <br />
              <span className="text-foreground font-medium">We never see your credentials.</span>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}