import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface DeviceSession {
  id: string;
  user_id: string;
  device_name: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
  user_agent: string;
  ip_address?: string;
  last_seen: string;
  is_current: boolean;
  created_at: string;
}

export function useDeviceManagement() {
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const detectDeviceType = (userAgent: string): DeviceSession['device_type'] => {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      if (/iPad/.test(userAgent)) return 'tablet';
      return 'mobile';
    }
    return 'desktop';
  };

  const getDeviceName = (userAgent: string): string => {
    if (/iPhone/.test(userAgent)) return 'iPhone';
    if (/iPad/.test(userAgent)) return 'iPad';
    if (/Android/.test(userAgent)) return 'Android Device';
    if (/Chrome/.test(userAgent)) return 'Chrome Browser';
    if (/Firefox/.test(userAgent)) return 'Firefox Browser';
    if (/Safari/.test(userAgent)) return 'Safari Browser';
    return 'Unknown Device';
  };

  const fetchDevices = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // For now, we'll simulate device data since we don't have sessions table yet
      const currentDevice: DeviceSession = {
        id: 'current',
        user_id: user.id,
        device_name: getDeviceName(navigator.userAgent),
        device_type: detectDeviceType(navigator.userAgent),
        user_agent: navigator.userAgent,
        last_seen: new Date().toISOString(),
        is_current: true,
        created_at: new Date().toISOString(),
      };

      // Mock additional devices for demonstration
      const mockDevices: DeviceSession[] = [
        currentDevice,
        {
          id: 'device-2',
          user_id: user.id,
          device_name: 'iPhone 14',
          device_type: 'mobile',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
          last_seen: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          is_current: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
        },
        {
          id: 'device-3',
          user_id: user.id,
          device_name: 'iPad',
          device_type: 'tablet',
          user_agent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
          last_seen: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
          is_current: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 2 weeks ago
        },
      ];

      setDevices(mockDevices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load device list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeDevice = async (deviceId: string) => {
    try {
      // In a real implementation, this would call an API to revoke the session
      setDevices(prevDevices => prevDevices.filter(device => device.id !== deviceId));
      
      toast({
        title: 'Device Revoked',
        description: 'The device session has been terminated',
      });
    } catch (error) {
      console.error('Error revoking device:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke device session',
        variant: 'destructive',
      });
    }
  };

  const revokeAllDevices = async () => {
    try {
      // Keep only the current device
      const currentDevice = devices.find(device => device.is_current);
      setDevices(currentDevice ? [currentDevice] : []);
      
      toast({
        title: 'All Sessions Revoked',
        description: 'All other device sessions have been terminated',
      });
    } catch (error) {
      console.error('Error revoking all devices:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke device sessions',
        variant: 'destructive',
      });
    }
  };

  const updateCurrentDevice = async () => {
    try {
      // Update last seen time for current device
      setDevices(prevDevices => 
        prevDevices.map(device => 
          device.is_current 
            ? { ...device, last_seen: new Date().toISOString() }
            : device
        )
      );
    } catch (error) {
      console.error('Error updating current device:', error);
    }
  };

  useEffect(() => {
    fetchDevices();
    
    // Update current device activity every 5 minutes
    const interval = setInterval(updateCurrentDevice, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  return {
    devices,
    loading,
    revokeDevice,
    revokeAllDevices,
    refetch: fetchDevices,
  };
}
