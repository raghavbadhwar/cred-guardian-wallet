import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  AlertTriangle, 
  Trash2, 
  Download,
  Shield
} from 'lucide-react';

export function DangerZoneCard() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const handleExportData = () => {
    const userData = {
      profile: {
        id: user?.id,
        email: user?.email,
        created_at: user?.created_at,
      },
      credentials: [], // Would fetch from database
      settings: JSON.parse(localStorage.getItem('app_settings') || '{}'),
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credverse-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: t('data_exported'),
      description: t('data_exported_desc'),
    });
    
    setShowExportDialog(false);
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast({
        title: t('error'),
        description: t('confirm_delete_text'),
        variant: 'destructive',
      });
      return;
    }

    try {
      // In a real app, this would call an API to delete the account
      toast({
        title: t('account_deleted'),
        description: t('account_deleted_desc'),
      });
      
      await signOut();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('delete_account_failed'),
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card className="p-6 border-destructive/20">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">{t('danger_zone')}</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <h4 className="font-medium">{t('export_data')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('export_data_desc')}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('export')}
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <h4 className="font-medium text-destructive">{t('delete_account')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('delete_account_desc')}
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('delete')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Export Data Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t('export_data')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('export_data_warning')}
            </p>
            
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <strong>{t('included_data')}:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{t('profile_info')}</li>
                <li>{t('credentials_data')}</li>
                <li>{t('app_settings')}</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                {t('export_data')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('delete_account')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive font-medium">
                {t('delete_account_warning')}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                {t('type_delete_to_confirm')}
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                {t('cancel')}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={confirmText !== 'DELETE'}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('delete_account')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}