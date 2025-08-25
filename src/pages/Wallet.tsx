import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { CredentialCard } from "@/components/CredentialCard";
import { EnhancedCredentialCard } from "@/components/EnhancedCredentialCard";
import { EnhancedReceiveButton } from "@/components/EnhancedReceiveButton";
import { WalletActionCard } from "@/components/WalletActionCard";
import { WalletStatsCard } from "@/components/WalletStatsCard";
import { QRScanner } from "@/components/QRScanner";
import { BackupDialog } from "@/components/BackupDialog";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ShareDialog } from "@/components/ShareDialog";
import { EnhancedShareDialog } from "@/components/EnhancedShareDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, QrCode, Upload, Download, Share2, ExternalLink, Search, Trash2, Settings, FileText, Award, Shield, Calendar, Archive } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCredentials } from "@/hooks/useCredentials";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Wallet() {
  const navigate = useNavigate();
  const { t } = useTranslation('wallet');
  const { user, loading: authLoading } = useAuth();
  const { credentials, loading: credentialsLoading, addCredential, refetch } = useCredentials();
  const { toast } = useToast();
  
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showEnhancedShare, setShowEnhancedShare] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Check if this is the first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding && user) {
      setShowOnboarding(true);
    }
  }, [user]);

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

  const handleImportComplete = async (credential: any) => {
    try {
      await addCredential(credential);
      toast({
        title: "Import Successful",
        description: "Credential has been added to your wallet",
      });
    } catch (error) {
      toast({
        title: "Import Failed", 
        description: "Failed to save credential to wallet",
        variant: "destructive",
      });
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

  const handleShare = (credential: any) => {
    setSelectedCredential(credential);
    setShowEnhancedShare(true);
  };

  const handleCreateShare = async (shareData: any) => {
    try {
      const response = await supabase.functions.invoke('create-share', {
        body: shareData
      });

      if (response.error) throw response.error;
      
      return response.data;
    } catch (error) {
      console.error('Share creation failed:', error);
      throw error;
    }
  };

  const handleArchive = async (credentialId: string) => {
    try {
      const { error } = await supabase
        .from('credentials')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', credentialId);

      if (error) throw error;

      await refetch();
      toast({
        title: t('credential_archived'),
        description: t('credential_moved_to_trash'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('archive_failed'),
        variant: 'destructive',
      });
    }
  };

  const handleRestore = async (credentialId: string) => {
    try {
      const { error } = await supabase
        .from('credentials')
        .update({ deleted_at: null })
        .eq('id', credentialId);

      if (error) throw error;

      await refetch();
      toast({
        title: t('credential_restored'),
        description: t('credential_restored_desc'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('restore_failed'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (credentialId: string) => {
    if (!confirm(t('confirm_permanent_delete'))) return;

    try {
      const { error } = await supabase
        .from('credentials')
        .delete()
        .eq('id', credentialId);

      if (error) throw error;

      await refetch();
      toast({
        title: t('credential_deleted'),
        description: t('credential_deleted_permanently'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('delete_failed'),
        variant: 'destructive',
      });
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const navigateToDigiLocker = () => {
    navigate('/digilocker');
  };

  const navigateToImport = () => {
    navigate('/import');
  };

  const navigateToTrash = () => {
    navigate('/wallet/trash');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title={t('title')} 
        showQuickActions={true}
        onPresent={() => credentials.length > 0 && handleShare(credentials[0])}
        onImport={navigateToImport}
        onBackup={handleBackup}
        onSettings={() => navigate('/settings')}
        onDigiLocker={navigateToDigiLocker}
        onTrash={navigateToTrash}
        trashCount={credentials.filter(c => c.deleted_at).length}
      />
      
      <div className="p-4 space-y-8">
        {/* Hero Section with Primary Actions */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Your Digital Wallet</h1>
            <p className="text-muted-foreground">Securely store and manage your credentials</p>
          </div>
          
          {/* Primary Action Cards */}
          <div className="grid grid-cols-2 gap-4">
            <EnhancedReceiveButton
              onImportComplete={handleImportComplete}
              onNavigateToDigiLocker={navigateToDigiLocker}
              onNavigateToImport={navigateToImport}
            />
            
            <WalletActionCard
              title={t('scan_qr')}
              description="Scan QR codes"
              icon={QrCode}
              onClick={handleQRScan}
              variant="primary"
              size="lg"
            />
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Wallet Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <WalletStatsCard
              title="Valid Credentials"
              value={credentials.filter(c => c.status === 'valid' && !c.deleted_at).length}
              icon={Shield}
              variant="success"
              trend="up"
              trendValue="+2 this week"
            />
            
            <WalletStatsCard
              title="Total Stored"
              value={credentials.filter(c => !c.deleted_at).length}
              icon={Award}
              variant="primary"
            />

            <WalletStatsCard
              title="Expired/Revoked"
              value={credentials.filter(c => (c.status === 'expired' || c.status === 'revoked') && !c.deleted_at).length}
              icon={Calendar}
              variant="warning"
            />

            <WalletStatsCard
              title="In Trash"
              value={credentials.filter(c => c.deleted_at).length}
              icon={Archive}
              variant="danger"
              onClick={navigateToTrash}
            />
          </div>
        </div>
        

        {/* Enhanced Search */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Your Credentials</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search credentials by name, issuer, or type..."
              className="pl-10 h-12 bg-card/50 border-border/50 focus:border-primary/50 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Enhanced Credentials with Tabs */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-border/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                All ({credentials.filter(c => !c.deleted_at).length})
              </TabsTrigger>
              <TabsTrigger value="valid" className="data-[state=active]:bg-success data-[state=active]:text-success-foreground">
                Valid ({credentials.filter(c => c.status === 'valid' && !c.deleted_at).length})
              </TabsTrigger>
              <TabsTrigger value="expired" className="data-[state=active]:bg-warning data-[state=active]:text-warning-foreground">
                Expired ({credentials.filter(c => (c.status === 'expired' || c.status === 'revoked') && !c.deleted_at).length})
              </TabsTrigger>
              <TabsTrigger value="trash" className="data-[state=active]:bg-danger data-[state=active]:text-danger-foreground">
                Trash ({credentials.filter(c => c.deleted_at).length})
              </TabsTrigger>
            </TabsList>

            {(['all', 'valid', 'expired', 'trash'] as const).map((tab) => {
              const filteredCredentials = credentials.filter(cred => {
                const matchesSearch = cred.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                     cred.issuer_name?.toLowerCase().includes(searchTerm.toLowerCase());
                
                switch (tab) {
                  case 'valid':
                    return matchesSearch && !cred.deleted_at && cred.status === 'valid';
                  case 'expired':
                    return matchesSearch && !cred.deleted_at && (cred.status === 'expired' || cred.status === 'revoked');
                  case 'trash':
                    return matchesSearch && cred.deleted_at;
                  default:
                    return matchesSearch && !cred.deleted_at;
                }
              });

              return (
                <TabsContent key={tab} value={tab} className="space-y-4">
                  {filteredCredentials.length > 0 ? (
                    <div className="space-y-3">
                      {filteredCredentials.map((credential) => (
                        <EnhancedCredentialCard
                          key={credential.id}
                          credential={credential}
                          onShare={handleShare}
                          onArchive={handleArchive}
                          onRestore={handleRestore}
                          onDelete={handleDelete}
                          isInTrash={tab === 'trash'}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="gradient-card shadow-card p-12 border-border/50 text-center">
                      <div className="space-y-6 max-w-sm mx-auto">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
                          <Upload size={64} className="mx-auto text-muted-foreground relative z-10" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-foreground">
                            {searchTerm ? "No matches found" : "No credentials yet"}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {searchTerm 
                              ? "Try adjusting your search terms or browse all credentials" 
                              : "Start building your digital credential collection"
                            }
                          </p>
                        </div>
                        {!searchTerm && tab !== 'trash' && (
                          <div className="pt-4">
                            <EnhancedReceiveButton
                              onImportComplete={handleImportComplete}
                              onNavigateToDigiLocker={navigateToDigiLocker}
                              onNavigateToImport={navigateToImport}
                              className="inline-block"
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
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
        
        <ShareDialog
          open={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          credential={selectedCredential}
        />

        <EnhancedShareDialog
          open={showEnhancedShare}
          onClose={() => {
            setShowEnhancedShare(false);
            setSelectedCredential(null);
          }}
          credential={selectedCredential}
          onCreateShare={handleCreateShare}
        />

        <OnboardingTour
          run={showOnboarding}
          onComplete={handleOnboardingComplete}
        />
      </div>
    </div>
  );
}