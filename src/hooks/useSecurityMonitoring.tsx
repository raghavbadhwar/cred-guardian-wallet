import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface SecurityEvent {
  id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  risk_level?: string;
}

export interface RateLimitStatus {
  endpoint: string;
  remaining: number;
  resetAt: Date;
  isLimited: boolean;
}

export function useSecurityMonitoring() {
  const [loading, setLoading] = useState(false);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Log a security event with risk assessment
  const logSecurityEvent = async (
    eventType: string,
    resourceType?: string,
    resourceId?: string,
    metadata: Record<string, any> = {},
    riskLevel: 'low' | 'medium' | 'high' = 'low'
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_event_type: eventType,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_metadata: { ...metadata, risk_level: riskLevel },
        p_risk_level: riskLevel
      });

      if (error) {
        console.error('Error logging security event:', error);
      }

      // Show toast for high-risk events
      if (riskLevel === 'high') {
        toast({
          title: "Security Alert",
          description: `High-risk activity detected: ${eventType}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in logSecurityEvent:', error);
    }
  };

  // Check rate limits for an endpoint
  const checkRateLimit = async (
    endpoint: string,
    limit: number = 10,
    windowMinutes: number = 60
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: user.id,
        p_endpoint: endpoint,
        p_limit: limit,
        p_window_minutes: windowMinutes
      });

      if (error) {
        console.error('Error checking rate limit:', error);
        return false;
      }

      // Update rate limit status
      setRateLimitStatus(prev => {
        const filtered = prev.filter(status => status.endpoint !== endpoint);
        return [...filtered, {
          endpoint,
          remaining: Math.max(0, limit - 1),
          resetAt: new Date(Date.now() + windowMinutes * 60 * 1000),
          isLimited: !data
        }];
      });

      // Log if rate limited
      if (!data) {
        await logSecurityEvent('rate_limit_exceeded', 'api_endpoint', undefined, {
          endpoint,
          limit,
          window_minutes: windowMinutes
        }, 'medium');
      }

      return data;
    } catch (error) {
      console.error('Error in checkRateLimit:', error);
      return false;
    }
  };

  // Detect suspicious activity patterns
  const detectSuspiciousActivity = async (): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch recent security events
      const { data: events, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const recentEvents = events || [];
      setSecurityEvents(recentEvents as SecurityEvent[]);

      // Analyze patterns
      const shareEvents = recentEvents.filter(e => e.action.includes('share'));
      const loginEvents = recentEvents.filter(e => e.action.includes('login'));
      const failedEvents = recentEvents.filter(e => e.action.includes('failed'));

      // Detect unusual activity
      if (shareEvents.length > 50) {
        await logSecurityEvent('unusual_sharing_activity', 'security_analysis', undefined, {
          share_count: shareEvents.length,
          time_window: '24h'
        }, 'high');
      }

      if (failedEvents.length > 10) {
        await logSecurityEvent('multiple_failed_attempts', 'security_analysis', undefined, {
          failed_count: failedEvents.length,
          time_window: '24h'
        }, 'high');
      }

      if (loginEvents.length > 20) {
        await logSecurityEvent('excessive_login_attempts', 'security_analysis', undefined, {
          login_count: loginEvents.length,
          time_window: '24h'
        }, 'medium');
      }

    } catch (error: any) {
      console.error('Error detecting suspicious activity:', error);
    } finally {
      setLoading(false);
    }
  };

  // Monitor for real-time security alerts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('security_monitoring')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'audit_logs',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newEvent = payload.new as SecurityEvent;
        
        // Check for high-risk events
        if (newEvent.metadata?.risk_level === 'high') {
          toast({
            title: "Security Alert",
            description: `High-risk activity: ${newEvent.action}`,
            variant: "destructive"
          });
        }

        setSecurityEvents(prev => [newEvent, ...prev.slice(0, 99)]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Cleanup expired sessions periodically
  const cleanupExpiredSessions = async (): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_sessions');

      if (error) throw error;

      if (data > 0) {
        await logSecurityEvent('sessions_cleaned_up', 'session_management', undefined, {
          cleaned_count: data
        }, 'low');
      }

      return data;
    } catch (error: any) {
      console.error('Error cleaning up sessions:', error);
      return 0;
    }
  };

  return {
    loading,
    securityEvents,
    rateLimitStatus,
    logSecurityEvent,
    checkRateLimit,
    detectSuspiciousActivity,
    cleanupExpiredSessions
  };
}