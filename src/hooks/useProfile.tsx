import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  recovery_email?: string;
  language: string;
  default_share: {
    expiry_minutes: number;
  };
  settings: {
    darkMode: boolean;
    notifications: boolean;
    telemetry: boolean;
  };
  security_preferences: {
    enablePasskey: boolean;
    appLock: boolean;
    biometric: boolean;
    twoFactor: boolean;
  };
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile settings",
          variant: "destructive",
        });
        return;
      }

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved",
      });
    } catch (error) {
      console.error('Error in updateProfile:', error);
      toast({
        title: "Error", 
        description: "Failed to update profile settings",
        variant: "destructive",
      });
    }
  };

  const updateSettings = async (newSettings: Partial<Profile['settings']>) => {
    if (!profile) return;
    
    const updatedSettings = { ...profile.settings, ...newSettings };
    await updateProfile({ settings: updatedSettings });
  };

  const updateSecurityPreferences = async (newPrefs: Partial<Profile['security_preferences']>) => {
    if (!profile) return;
    
    const updatedPrefs = { ...profile.security_preferences, ...newPrefs };
    await updateProfile({ security_preferences: updatedPrefs });
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    updateProfile,
    updateSettings,
    updateSecurityPreferences,
    refetch: fetchProfile
  };
}