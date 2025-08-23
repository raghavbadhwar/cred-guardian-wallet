import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Credential {
  id: string;
  type: string;
  issuer: string;
  issuerDomain: string;
  subject: string;
  issuedDate: string;
  status: 'valid' | 'expired' | 'revoked';
  category: 'degree' | 'certificate' | 'transcript' | 'diploma';
  credentialData?: any;
  createdAt?: string;
  updatedAt?: string;
}

export function useCredentials() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCredentials = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedCredentials = data.map(cred => ({
        id: cred.id,
        type: cred.type,
        issuer: cred.issuer,
        issuerDomain: cred.issuer_domain,
        subject: cred.subject,
        issuedDate: cred.issued_date,
        status: cred.status as 'valid' | 'expired' | 'revoked',
        category: cred.category as 'degree' | 'certificate' | 'transcript' | 'diploma',
        credentialData: cred.credential_data,
        createdAt: cred.created_at,
        updatedAt: cred.updated_at
      }));

      setCredentials(transformedCredentials);
    } catch (error: any) {
      console.error('Error fetching credentials:', error);
      toast({
        title: "Error",
        description: "Failed to load credentials",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addCredential = async (credentialData: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credentials')
        .insert({
          user_id: user.id,
          type: credentialData.type,
          issuer: credentialData.issuer,
          issuer_domain: credentialData.issuerDomain,
          subject: credentialData.subject,
          issued_date: credentialData.issuedDate,
          status: credentialData.status,
          category: credentialData.category,
          credential_data: credentialData.credentialData
        })
        .select()
        .single();

      if (error) throw error;

      await fetchCredentials();
      toast({
        title: "Success",
        description: "Credential added successfully",
      });

      return data;
    } catch (error: any) {
      console.error('Error adding credential:', error);
      toast({
        title: "Error",
        description: "Failed to add credential",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateCredentialStatus = async (credentialId: string, status: 'valid' | 'expired' | 'revoked') => {
    try {
      const { error } = await supabase
        .from('credentials')
        .update({ status })
        .eq('id', credentialId);

      if (error) throw error;

      await fetchCredentials();
      toast({
        title: "Success",
        description: "Credential status updated",
      });
    } catch (error: any) {
      console.error('Error updating credential:', error);
      toast({
        title: "Error",
        description: "Failed to update credential",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchCredentials();
    }
  }, [user]);

  return {
    credentials,
    loading,
    addCredential,
    updateCredentialStatus,
    refetch: fetchCredentials
  };
}