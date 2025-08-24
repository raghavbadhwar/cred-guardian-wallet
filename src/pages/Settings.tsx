import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  Shield, 
  Eye, 
  Download,
  Upload,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { t, i18n } = useTranslation('settings');
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    language: i18n.language,
    enablePasskey: false,
    appLock: true,
    telemetry: false,
  });

  const handleLanguageChange = (language: string) => {
    setSettings(prev => ({ ...prev, language }));
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    
    toast({
      title: t('success', { ns: 'common' }),
      description: 'Language updated successfully',
    });
  };

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(`setting_${key}`, value.toString());
    
    toast({
      title: t('success', { ns: 'common' }),
      description: 'Setting updated successfully',
    });
  };

  const handleExportBackup = () => {
    // Simulate export
    const backup = {
      credentials: [], // Would include encrypted credentials
      settings,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credverse-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: t('success', { ns: 'common' }),
      description: 'Backup exported successfully',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title={t('title')} />
      
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Language Settings */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('language')}</h2>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="language">{t('language')}</Label>
            <Select value={settings.language} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('security')}</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>{t('enable_passkey')}</Label>
                <p className="text-sm text-muted-foreground">
                  Use biometric authentication for extra security
                </p>
              </div>
              <Switch
                checked={settings.enablePasskey}
                onCheckedChange={(checked) => handleSettingChange('enablePasskey', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>{t('app_lock')}</Label>
                <p className="text-sm text-muted-foreground">
                  Auto-lock after 2 minutes of inactivity
                </p>
              </div>
              <Switch
                checked={settings.appLock}
                onCheckedChange={(checked) => handleSettingChange('appLock', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('privacy')}</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('telemetry')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('telemetry_desc')}
              </p>
            </div>
            <Switch
              checked={settings.telemetry}
              onCheckedChange={(checked) => handleSettingChange('telemetry', checked)}
            />
          </div>
        </Card>

        {/* Backup & Restore */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Backup & Restore</h2>
          </div>
          
          <div className="space-y-3">
            <Button onClick={handleExportBackup} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              {t('export_backup')}
            </Button>
            
            <Button variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {t('import_backup')}
            </Button>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Backups are encrypted and can only be restored with your passphrase. 
                Keep your backup file safe and secure.
              </p>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('about')}</h2>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>CredVerse Student Wallet v1.2.0</p>
            <p>Improvement Pack v1 includes:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Guided onboarding tour</li>
              <li>Hindi localization support</li>
              <li>DigiLocker beta connector</li>
              <li>Enhanced verification diagnostics</li>
              <li>Improved offline support</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}