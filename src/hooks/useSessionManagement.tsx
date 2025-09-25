import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface SessionInfo {
  id: string;
  user_id: string;
  device_fingerprint?: string;
  user_agent?: string;
  ip_hash?: string;
  last_seen: string;
  created_at: string;
  is_current?: boolean;
}

export function useSessionManagement() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Generate device fingerprint
  const generateDeviceFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  };

  // Create or update current session
  const createOrUpdateSession = async (): Promise<void> => {
    if (!user) return;

    try {
      const deviceFingerprint = generateDeviceFingerprint();
      const userAgent = navigator.userAgent;

      // Check if session already exists
      const { data: existingSessions, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('device_fingerprint', deviceFingerprint);

      if (fetchError) throw fetchError;

      if (existingSessions && existingSessions.length > 0) {
        // Update existing session
        const { error: updateError } = await supabase
          .from('sessions')
          .update({
            last_seen: new Date().toISOString(),
            user_agent: userAgent
          })
          .eq('id', existingSessions[0].id);

        if (updateError) throw updateError;
      } else {
        // Create new session
        const { error: insertError } = await supabase
          .from('sessions')
          .insert({
            user_id: user.id,
            device_fingerprint: deviceFingerprint,
            user_agent: userAgent,
            last_seen: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      console.error('Error managing session:', error);
    }
  };

  // Fetch all user sessions
  const fetchSessions = async (): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen', { ascending: false });

      if (error) throw error;

      const currentFingerprint = generateDeviceFingerprint();
      const sessionsWithCurrent = (data || []).map(session => ({
        ...session,
        is_current: session.device_fingerprint === currentFingerprint
      }));

      setSessions(sessionsWithCurrent as SessionInfo[]);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch session information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Revoke a specific session
  const revokeSession = async (sessionId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));

      toast({
        title: "Session Revoked",
        description: "The session has been successfully revoked",
      });

      return true;
    } catch (error: any) {
      console.error('Error revoking session:', error);
      toast({
        title: "Error",
        description: "Failed to revoke session",
        variant: "destructive"
      });
      return false;
    }
  };

  // Revoke all sessions except current
  const revokeAllOtherSessions = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const currentFingerprint = generateDeviceFingerprint();

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('user_id', user.id)
        .neq('device_fingerprint', currentFingerprint);

      if (error) throw error;

      // Update local state
      setSessions(prev => prev.filter(session => session.device_fingerprint === currentFingerprint));

      toast({
        title: "Sessions Revoked",
        description: "All other sessions have been revoked",
      });

      return true;
    } catch (error: any) {
      console.error('Error revoking other sessions:', error);
      toast({
        title: "Error",
        description: "Failed to revoke other sessions",
        variant: "destructive"
      });
      return false;
    }
  };

  // Validate current session
  const validateSession = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const deviceFingerprint = generateDeviceFingerprint();
      const userAgent = navigator.userAgent;

      const { data, error } = await supabase.rpc('validate_session_context', {
        p_user_id: user.id,
        p_device_fingerprint: deviceFingerprint,
        p_user_agent: userAgent
      });

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error validating session:', error);
      return false;
    }
  };

  // Initialize session on mount
  useEffect(() => {
    if (user) {
      createOrUpdateSession();
      fetchSessions();

      // Update session activity every 5 minutes
      const interval = setInterval(createOrUpdateSession, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return {
    sessions,
    loading,
    fetchSessions,
    revokeSession,
    revokeAllOtherSessions,
    validateSession,
    createOrUpdateSession
  };
}