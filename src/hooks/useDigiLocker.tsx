
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface DigiLockerConnection {
  id: string;
  user_id: string;
  subject_id?: string;
  token_type: string;
  expires_at: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DigiLockerDocument {
  id: string;
  name: string;
  type: string;
  issuer: string;
  issued_date: string;
  metadata: {
    category: 'degree' | 'certificate' | 'transcript' | 'diploma';
    verified: boolean;
    original_data?: any;
  };
}

export function useDigiLocker() {
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const initiateOAuth = async (): Promise<{ authUrl: string; state: string } | null> => {
    if (!user) return null;

    try {
      setConnecting(true);
      
      const { data, error } = await supabase.functions.invoke('digilocker-oauth', {
        body: { action: 'authorize' }
      });

      if (error) {
        console.error('OAuth initiation error:', error);
        
        // Check if this is a sandbox mode response
        if (error.message?.includes('sandbox')) {
          return { authUrl: 'sandbox', state: 'sandbox' };
        }
        
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error initiating DigiLocker OAuth:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to DigiLocker",
        variant: "destructive"
      });
      return null;
    } finally {
      setConnecting(false);
    }
  };

  const handleOAuthCallback = async (code: string, state: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('digilocker-oauth', {
        body: { 
          action: 'callback',
          code,
          state 
        }
      });

      if (error) throw error;

      toast({
        title: "Connected Successfully",
        description: "DigiLocker account connected to CredVerse",
      });

      return true;
    } catch (error: any) {
      console.error('Error handling OAuth callback:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to complete DigiLocker connection",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (): Promise<DigiLockerDocument[]> => {
    if (!user) return [];

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('digilocker-fetch');

      if (error) throw error;

      return data.documents || [];
    } catch (error: any) {
      console.error('Error fetching DigiLocker documents:', error);
      toast({
        title: "Fetch Error",
        description: error.message || "Failed to fetch documents from DigiLocker",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getConnection = async (): Promise<DigiLockerConnection | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('digilocker_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching connection:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting DigiLocker connection:', error);
      return null;
    }
  };

  const disconnectDigiLocker = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('digilocker_connections')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Disconnected",
        description: "DigiLocker account has been disconnected",
      });

      return true;
    } catch (error: any) {
      console.error('Error disconnecting DigiLocker:', error);
      toast({
        title: "Disconnect Error",
        description: error.message || "Failed to disconnect DigiLocker",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    loading,
    connecting,
    initiateOAuth,
    handleOAuthCallback,
    fetchDocuments,
    getConnection,
    disconnectDigiLocker
  };
}
