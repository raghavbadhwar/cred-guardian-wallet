import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  MoreHorizontal,
  Shield,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  lastSeen: Date;
  current: boolean;
  userAgent: string;
}

export function DeviceListCard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const { t } = useTranslation('settings');
  const { toast } = useToast();

  useEffect(() => {
    // Mock device data
    const mockDevices: Device[] = [
      {
        id: '1',
        name: 'Current Device',
        type: 'desktop',
        lastSeen: new Date(),
        current: true,
        userAgent: navigator.userAgent,
      },
      {
        id: '2',
        name: 'iPhone 14',
        type: 'mobile',
        lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        current: false,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      },
      {
        id: '3',
        name: 'iPad',
        type: 'tablet',
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        current: false,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
      },
    ];
    setDevices(mockDevices);
  }, []);

  const getDeviceIcon = (type: Device['type']) => {
    switch (type) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Monitor;
    }
  };

  const handleRevokeDevice = (deviceId: string) => {
    setDevices(devices.filter(d => d.id !== deviceId));
    toast({
      title: t('device_revoked'),
      description: t('device_revoked_desc'),
    });
  };

  return (
    <div className="space-y-4">
      {devices.map((device) => {
        const Icon = getDeviceIcon(device.type);
        
        return (
          <Card key={device.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{device.name}</span>
                    {device.current && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        {t('current_device')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('last_seen')}: {formatDistanceToNow(device.lastSeen)} {t('ago')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!device.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeDevice(device.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
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