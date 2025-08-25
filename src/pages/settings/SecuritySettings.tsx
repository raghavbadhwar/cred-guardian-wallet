import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TwoFactorToggle } from '@/components/TwoFactorToggle';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { 
  Shield, 
  Smartphone, 
  Lock,
  Key
} from 'lucide-react';

export default function SecuritySettings() {
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const { profile, updateSecurityPreferences, loading } = useProfile();

  const handleSettingChange = async (key: string, value: boolean) => {
    try {
      await updateSecurityPreferences({ [key]: value });
    } catch (error) {
      console.error('Error updating security setting:', error);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('security')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('security_desc')}
        </p>
      </div>

      {/* Authentication */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('authentication')}</h2>
        </div>
        
        <div className="space-y-4">
          <TwoFactorToggle />
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                {t('enable_passkey')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('passkey_desc')}
              </p>
            </div>
            <Switch
              checked={profile?.security_preferences?.enablePasskey ?? false}
              onCheckedChange={(checked) => handleSettingChange('enablePasskey', checked)}
              disabled={loading}
            />
          </div>
        </div>
      </Card>

      {/* App Security */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('app_security')}</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('app_lock')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('app_lock_desc')}
              </p>
            </div>
            <Switch
              checked={profile?.security_preferences?.appLock ?? true}
              onCheckedChange={(checked) => handleSettingChange('appLock', checked)}
              disabled={loading}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{t('biometric_unlock')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('biometric_unlock_desc')}
              </p>
            </div>
            <Switch
              checked={profile?.security_preferences?.biometric ?? false}
              onCheckedChange={(checked) => handleSettingChange('biometric', checked)}
              disabled={loading}
            />
          </div>
        </div>
      </Card>

      {/* Security Status */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('security_status')}</h2>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('password_strength')}</span>
            <span className="text-sm text-green-600 font-medium">{t('strong')}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('2fa_status')}</span>
            <span className="text-sm text-amber-600 font-medium">{t('not_enabled')}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('last_password_change')}</span>
            <span className="text-sm text-muted-foreground">{t('never')}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}