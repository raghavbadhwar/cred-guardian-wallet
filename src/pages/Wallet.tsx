import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CredentialCard } from "@/components/CredentialCard";
import { QRScanner } from "@/components/QRScanner";
import { BackupDialog } from "@/components/BackupDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, QrCode, Upload, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCredentials } from "@/hooks/useCredentials";
import { useToast } from "@/hooks/use-toast";

export default function Wallet() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { credentials, loading: credentialsLoading, addCredential } = useCredentials();
  const { toast } = useToast();
  
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || credentialsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-credverse-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading your credentials...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleCredentialClick = (credential: any) => {
    navigate(`/credential/${credential.id}`);
  };

  const handleReceiveCredential = async () => {
    // Demo: Add a sample credential
    try {
      await addCredential({
        type: "Demo Certificate",
        issuer: "CredVerse Academy",
        issuerDomain: "credverse.edu",
        subject: "Blockchain Fundamentals",
        issuedDate: new Date().toISOString().split('T')[0],
        status: "valid",
        category: "certificate",
        credentialData: {
          grade: "A+",
          duration: "3 months",
          skills: ["Blockchain", "Smart Contracts", "DeFi"]
        }
      });
    } catch (error) {
      console.error('Error adding credential:', error);
    }
  };

  const handleQRScan = () => {
    setShowQRScanner(true);
  };

  const handleQRResult = async (result: string) => {
    setShowQRScanner(false);
    toast({
      title: "QR Code Scanned",
      description: "Processing credential data...",
    });
    
    // Demo: Process QR result
    try {
      await addCredential({
        type: "QR Scanned Certificate",
        issuer: "Mobile University",
        issuerDomain: "mobile.edu",
        subject: "Digital Literacy",
        issuedDate: new Date().toISOString().split('T')[0],
        status: "valid",
        category: "certificate",
        credentialData: { source: "qr_scan", data: result }
      });
    } catch (error) {
      console.error('Error processing QR credential:', error);
    }
  };

  const handleBackup = () => {
    setShowBackupDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="My Credentials" />
      
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button 
            onClick={handleReceiveCredential}
            variant="primary"
            className="h-16 flex-col gap-1"
          >
            <Plus size={20} />
            <span className="text-xs">Receive</span>
          </Button>
          
          <Button 
            onClick={handleQRScan}
            variant="outline"
            className="h-16 border-border/50 hover:bg-card-hover flex-col gap-1 transition-smooth"
          >
            <QrCode size={20} />
            <span className="text-xs">Scan QR</span>
          </Button>
          
          <Button 
            onClick={handleBackup}
            variant="outline"
            className="h-16 border-border/50 hover:bg-card-hover flex-col gap-1 transition-smooth"
          >
            <Download size={20} />
            <span className="text-xs">Backup</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="gradient-card shadow-card p-4 border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-credverse-success">
                {credentials.filter(c => c.status === 'valid').length}
              </div>
              <div className="text-sm text-muted-foreground">Valid Credentials</div>
            </div>
          </Card>
          
          <Card className="gradient-card shadow-card p-4 border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-credverse-primary">
                {credentials.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Stored</div>
            </div>
          </Card>
        </div>

        {/* Credentials List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your Credentials</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All
            </Button>
          </div>
          
          {credentials.length > 0 ? (
            <div className="space-y-3">
              {credentials.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  onClick={() => handleCredentialClick(credential)}
                />
              ))}
            </div>
          ) : (
            <Card className="gradient-card shadow-card p-8 border-border/50 text-center">
              <div className="space-y-3">
                <Upload size={48} className="mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-medium text-card-foreground">No credentials yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive your first credential to get started
                  </p>
                </div>
                <Button 
                  onClick={handleReceiveCredential}
                  variant="primary"
                >
                  <Plus size={16} className="mr-2" />
                  Receive Credential
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Modals */}
        <QRScanner 
          open={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onResult={handleQRResult}
        />
        
        <BackupDialog
          open={showBackupDialog}
          onClose={() => setShowBackupDialog(false)}
        />
      </div>
    </div>
  );
}