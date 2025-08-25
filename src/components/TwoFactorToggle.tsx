import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Mail, Loader2 } from 'lucide-react';

export function TwoFactorToggle() {
  const [showSetup, setShowSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const { profile, updateSecurityPreferences } = useProfile();

  const enabled = profile?.security_preferences?.twoFactor ?? false;

  const handleToggle = async (checked: boolean) => {
    if (checked && !enabled) {
      setShowSetup(true);
    } else if (!checked && enabled) {
      setIsLoading(true);
      try {
        await updateSecurityPreferences({ twoFactor: false });
        toast({
          title: t('2fa_disabled'),
          description: t('2fa_disabled_desc'),
        });
      } catch (error) {
        toast({
          title: t('error'),
          description: t('2fa_disable_failed'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would send an email with verification code
      toast({
        title: t('verification_code_sent'),
        description: t('verification_code_sent_desc'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('verification_code_failed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: t('invalid_code'),
        description: t('invalid_code_desc'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, this would verify the code with the backend
      if (verificationCode === '123456') { // Demo verification
        await updateSecurityPreferences({ twoFactor: true });
        setShowSetup(false);
        setVerificationCode('');
        toast({
          title: t('2fa_enabled'),
          description: t('2fa_enabled_desc'),
        });
      } else {
        toast({
          title: t('invalid_code'),
          description: t('invalid_code_desc'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('2fa_enable_failed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {t('email_2fa')}
          </Label>
          <p className="text-sm text-muted-foreground">
            {t('email_2fa_desc')}
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} disabled={isLoading} />
      </div>

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('setup_2fa')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('setup_2fa_desc')}
            </p>
            
            <Button onClick={handleSetup} variant="outline" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {isLoading ? t('sending') : t('send_verification_code')}
            </Button>
            
            <div className="space-y-2">
              <Label htmlFor="code">{t('verification_code')}</Label>
              <Input
                id="code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </div>
            
            <Button onClick={handleVerify} className="w-full" disabled={isLoading || !verificationCode}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {isLoading ? t('verifying') : t('verify_and_enable')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}