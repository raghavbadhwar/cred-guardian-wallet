import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, 
  Eye, 
  Bell,
  Palette
} from 'lucide-react';

export default function GeneralSettings() {
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    telemetry: false,
    notifications: true,
    darkMode: false,
  });

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(`setting_${key}`, value.toString());
    
    toast({
      title: t('setting_updated'),
      description: t('setting_updated_desc'),
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('general')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('general_desc')}
        </p>
      </div>

      {/* Language Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('language')}</h2>
        </div>
        
        <LanguageSwitcher />
      </Card>

      {/* Appearance */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('appearance')}</h2>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>{t('dark_mode')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('dark_mode_desc')}
            </p>
          </div>
          <Switch
            checked={settings.darkMode}
            onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
          />
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('notifications')}</h2>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>{t('enable_notifications')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('notifications_desc')}
            </p>
          </div>
          <Switch
            checked={settings.notifications}
            onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
          />
        </div>
      </Card>

      {/* Privacy */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-primary" />
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
    </div>
  );
}