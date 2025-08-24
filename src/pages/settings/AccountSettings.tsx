import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  Mail, 
  Shield,
  Save
} from 'lucide-react';

export default function AccountSettings() {
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    recoveryEmail: '',
    defaultSharePreset: '15',
  });

  const handleSave = () => {
    // Simulate API call
    toast({
      title: t('account_updated'),
      description: t('account_updated_desc'),
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('account')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('account_desc')}
        </p>
      </div>

      {/* Profile Information */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('profile_info')}</h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">{t('display_name')}</Label>
            <Input
              id="display-name"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              {t('email_readonly')}
            </p>
          </div>
        </div>
      </Card>

      {/* Recovery Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('recovery')}</h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recovery-email">{t('recovery_email')}</Label>
            <Input
              id="recovery-email"
              type="email"
              placeholder={t('recovery_email_placeholder')}
              value={formData.recoveryEmail}
              onChange={(e) => setFormData({...formData, recoveryEmail: e.target.value})}
            />
            <p className="text-xs text-muted-foreground">
              {t('recovery_email_desc')}
            </p>
          </div>
        </div>
      </Card>

      {/* Sharing Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('sharing_prefs')}</h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-preset">{t('default_share_expiry')}</Label>
            <Select 
              value={formData.defaultSharePreset} 
              onValueChange={(value) => setFormData({...formData, defaultSharePreset: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">{t('5_minutes')}</SelectItem>
                <SelectItem value="15">{t('15_minutes')}</SelectItem>
                <SelectItem value="30">{t('30_minutes')}</SelectItem>
                <SelectItem value="60">{t('1_hour')}</SelectItem>
                <SelectItem value="1440">{t('24_hours')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('default_share_expiry_desc')}
            </p>
          </div>
        </div>
      </Card>

      <Button onClick={handleSave} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {t('save_changes')}
      </Button>
    </div>
  );
}