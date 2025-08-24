import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { CredentialCard } from "@/components/CredentialCard";
import { EnhancedCredentialCard } from "@/components/EnhancedCredentialCard";
import { QRScanner } from "@/components/QRScanner";
import { BackupDialog } from "@/components/BackupDialog";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ShareDialog } from "@/components/ShareDialog";
import { EnhancedShareDialog } from "@/components/EnhancedShareDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, QrCode, Upload, Download, Share2, ExternalLink, Search, Trash2, Settings, FileText } from "lucide-react";
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
      <Header title={t('title')} />
      
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={handleReceiveCredential}
            variant="primary"
            className="h-16 flex-col gap-1"
            data-tour="receive"
          >
            <Plus size={20} />
            <span className="text-xs">{t('receive')}</span>
          </Button>
          
          <Button 
            onClick={handleQRScan}
            variant="outline"
            className="h-16 border-border/50 hover:bg-card-hover flex-col gap-1 transition-smooth"
          >
            <QrCode size={20} />
            <span className="text-xs">{t('scan_qr')}</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          <Button 
            onClick={() => credentials.length > 0 && handleShare(credentials[0])}
            variant="outline"
            className="h-16 border-border/50 hover:bg-card-hover flex-col gap-1 transition-smooth"
            data-tour="present"
            disabled={credentials.length === 0}
          >
            <Share2 size={20} />
            <span className="text-xs">{t('present')}</span>
          </Button>
          
          <Button 
            onClick={navigateToImport}
            variant="outline"
            className="h-16 border-border/50 hover:bg-card-hover flex-col gap-1 transition-smooth"
          >
            <FileText size={20} />
            <span className="text-xs">Import</span>
          </Button>
          
          <Button 
            onClick={navigateToTrash}
            variant="outline"
            className="h-16 border-border/50 hover:bg-card-hover flex-col gap-1 transition-smooth"
          >
            <Trash2 size={20} />
            <span className="text-xs">Trash ({credentials.filter(c => c.deleted_at).length})</span>
          </Button>
          
          <Button 
            onClick={() => navigate('/settings')}
            variant="outline"
            className="h-16 border-border/50 hover:bg-card-hover flex-col gap-1 transition-smooth"
          >
            <Settings size={20} />
            <span className="text-xs">Settings</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={handleBackup}
            variant="outline"
            className="h-16 border-border/50 hover:bg-card-hover flex-col gap-1 transition-smooth"
            data-tour="backup"
          >
            <Download size={20} />
            <span className="text-xs">{t('backup')}</span>
          </Button>
          
          <Button 
            onClick={navigateToDigiLocker}
            variant="outline"
            className="h-16 border-border/50 hover:bg-card-hover flex-col gap-1 transition-smooth"
          >
            <ExternalLink size={20} />
            <span className="text-xs">DigiLocker</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search_credentials')}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="gradient-card shadow-card p-4 border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-credverse-success">
                {credentials.filter(c => c.status === 'valid' && !c.deleted_at).length}
              </div>
              <div className="text-sm text-muted-foreground">{t('valid_credentials')}</div>
            </div>
          </Card>
          
          <Card className="gradient-card shadow-card p-4 border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-credverse-primary">
                {credentials.filter(c => !c.deleted_at).length}
              </div>
              <div className="text-sm text-muted-foreground">{t('total_stored')}</div>
            </div>
          </Card>

          <Card className="gradient-card shadow-card p-4 border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {credentials.filter(c => (c.status === 'expired' || c.status === 'revoked') && !c.deleted_at).length}
              </div>
              <div className="text-sm text-muted-foreground">{t('expired_revoked')}</div>
            </div>
          </Card>

          <Card 
            className="gradient-card shadow-card p-4 border-border/50 cursor-pointer hover:shadow-elevated transition-all"
            onClick={navigateToTrash}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {credentials.filter(c => c.deleted_at).length}
              </div>
              <div className="text-sm text-muted-foreground">{t('in_trash')}</div>
            </div>
          </Card>
        </div>

        {/* Enhanced Credentials with Tabs */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                {t('all')} ({credentials.filter(c => !c.deleted_at).length})
              </TabsTrigger>
              <TabsTrigger value="valid">
                {t('valid')} ({credentials.filter(c => c.status === 'valid' && !c.deleted_at).length})
              </TabsTrigger>
              <TabsTrigger value="expired">
                {t('expired')} ({credentials.filter(c => (c.status === 'expired' || c.status === 'revoked') && !c.deleted_at).length})
              </TabsTrigger>
              <TabsTrigger value="trash">
                {t('trash')} ({credentials.filter(c => c.deleted_at).length})
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
                    <Card className="gradient-card shadow-card p-8 border-border/50 text-center">
                      <div className="space-y-3">
                        <Upload size={48} className="mx-auto text-muted-foreground" />
                        <div>
                          <h3 className="font-medium text-card-foreground">
                            {searchTerm ? t('no_search_results') : t('no_credentials')}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {searchTerm ? t('try_different_search') : t('no_credentials_desc')}
                          </p>
                        </div>
                        {!searchTerm && tab !== 'trash' && (
                          <Button 
                            onClick={handleReceiveCredential}
                            variant="primary"
                            data-tour="create-wallet"
                          >
                            <Plus size={16} className="mr-2" />
                            {t('receive_credential')}
                          </Button>
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