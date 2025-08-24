import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export function useAuditLog() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAuditLogs = async (limit = 50) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching audit logs:', error);
        return;
      }

      setAuditLogs((data || []) as AuditLogEntry[]);
    } catch (error) {
      console.error('Error in fetchAuditLogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (
    action: string,
    resourceType?: string,
    resourceId?: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!user) return;

    try {
      // Call the database function to log the action
      const { error } = await supabase.rpc('log_user_action', {
        p_user_id: user.id,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_metadata: metadata
      });

      if (error) {
        console.error('Error logging action:', error);
      }
    } catch (error) {
      console.error('Error in logAction:', error);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [user]);

  return {
    auditLogs,
    loading,
    logAction,
    refetch: fetchAuditLogs
  };
}