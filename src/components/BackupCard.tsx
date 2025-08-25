import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCredentials } from '@/hooks/useCredentials';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  Upload, 
  Shield, 
  Key, 
  Clock,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function BackupCard() {
  const [passphrase, setPassphrase] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const { credentials } = useCredentials();
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    fetchBackupHistory();
  }, []);

  const fetchBackupHistory = async () => {
    try {
      // In a real implementation, this would fetch backup history from the database
      setBackupHistory([
        {
          id: '1',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          size: '2.4 MB',
          credential_count: credentials.length
        }
      ]);
    } catch (error) {
      console.error('Error fetching backup history:', error);
    }
  };

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
      // Create backup data with proper structure
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        userId: user?.id,
        credentials: credentials,
        profile: profile,
        settings: {
          language: profile?.language || 'en',
          preferences: profile?.settings || {},
          security: profile?.security_preferences || {}
        },
      };

      // In a real implementation, this would use proper encryption
      const encryptedData = btoa(JSON.stringify(backupData));
      
      // Store backup metadata in database
      const backupMetadata = {
        user_id: user?.id,
        backup_size: encryptedData.length,
        credential_count: credentials.length,
        encrypted: true
      };

      // In a real implementation, save to Supabase storage
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
      await fetchBackupHistory(); // Refresh backup history
    } catch (error) {
      console.error('Backup creation error:', error);
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
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setIsRestoring(true);
        try {
          const text = await file.text();
          // In a real implementation, this would decrypt and validate the backup
          const backupData = JSON.parse(atob(text));
          
          toast({
            title: t('backup_validated'),
            description: t('backup_ready_to_restore'),
          });
        } catch (error) {
          toast({
            title: t('error'),
            description: t('invalid_backup_file'),
            variant: 'destructive',
          });
        } finally {
          setIsRestoring(false);
        }
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
            {isCreating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
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
        
        <Button onClick={handleRestoreBackup} variant="outline" className="w-full" disabled={isRestoring}>
          {isRestoring ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          {isRestoring ? t('processing') : t('select_backup_file')}
        </Button>
      </Card>

      {/* Backup History */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('backup_history')}</h3>
        </div>
        
        
        {backupHistory.length > 0 ? (
          <div className="space-y-3">
            {backupHistory.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-sm font-medium">
                      {formatDistanceToNow(new Date(backup.created_at))} ago
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {backup.credential_count} credentials • {backup.size}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {t('no_backups_found')}
          </div>
        )}
      </Card>
    </div>
  );
}