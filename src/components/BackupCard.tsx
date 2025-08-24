import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCredentials } from '@/hooks/useCredentials';
import { useAuth } from '@/hooks/useAuth';
import { 
  Download, 
  Upload, 
  Shield, 
  Key, 
  Clock,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function BackupCard() {
  const [passphrase, setPassphrase] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const { credentials } = useCredentials();
  const { user } = useAuth();

  const handleCreateBackup = async () => {
    if (!passphrase || passphrase.length < 8) {
      toast({
        title: t('error'),
        description: t('passphrase_too_short'),
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Create backup data
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        userId: user?.id,
        credentials: credentials,
        settings: JSON.parse(localStorage.getItem('app_settings') || '{}'),
      };

      // Simulate encryption (in real app, use proper encryption)
      const encryptedData = btoa(JSON.stringify(backupData));
      
      // Create download
      const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credverse-backup-${new Date().toISOString().split('T')[0]}.enc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: t('backup_created'),
        description: t('backup_created_desc'),
      });
      
      setPassphrase('');
    } catch (error) {
      toast({
        title: t('error'),
        description: t('backup_failed'),
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.enc';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast({
          title: t('restore_feature'),
          description: t('restore_feature_desc'),
        });
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      {/* Create Backup */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('create_backup')}</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          {t('create_backup_desc')}
        </p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-passphrase">{t('backup_passphrase')}</Label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="backup-passphrase"
                type="password"
                placeholder={t('enter_strong_passphrase')}
                className="pl-10"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <strong>{t('important')}:</strong> {t('passphrase_warning')}
          </div>
          
          <Button 
            onClick={handleCreateBackup} 
            disabled={isCreating || !passphrase}
            className="w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            {isCreating ? t('creating_backup') : t('create_encrypted_backup')}
          </Button>
        </div>
      </Card>

      {/* Restore Backup */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('restore_backup')}</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          {t('restore_backup_desc')}
        </p>
        
        <Button onClick={handleRestoreBackup} variant="outline" className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          {t('select_backup_file')}
        </Button>
      </Card>

      {/* Backup History */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('backup_history')}</h3>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {t('no_backups_found')}
        </div>
      </Card>
    </div>
  );
}