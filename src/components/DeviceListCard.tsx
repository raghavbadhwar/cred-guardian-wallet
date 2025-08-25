import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  MoreHorizontal,
  Shield,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function DeviceListCard() {
  const { t } = useTranslation('settings');
  const { devices, loading, revokeDevice, revokeAllDevices } = useDeviceManagement();

  const getDeviceIcon = (type: 'mobile' | 'desktop' | 'tablet') => {
    switch (type) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Monitor;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">{t('loading_devices')}</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Revoke All Sessions */}
      {devices.filter(d => !d.is_current).length > 0 && (
        <Card className="p-4 border-warning/20 bg-warning/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">{t('security_action')}</span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-warning border-warning/20">
                  {t('revoke_all_sessions')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('revoke_all_sessions')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('revoke_all_sessions_desc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={revokeAllDevices} className="bg-warning text-warning-foreground hover:bg-warning/90">
                    {t('revoke_all')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      )}

      {/* Device List */}
      {devices.map((device) => {
        const Icon = getDeviceIcon(device.device_type);
        
        return (
          <Card key={device.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{device.device_name}</span>
                    {device.is_current && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        {t('current_device')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('last_seen')}: {formatDistanceToNow(new Date(device.last_seen))} {t('ago')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!device.is_current && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('revoke_device_session')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('revoke_device_session_desc', { device: device.device_name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => revokeDevice(device.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('revoke')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}