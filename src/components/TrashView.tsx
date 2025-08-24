import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeletedCredential {
  id: string;
  title?: string;
  issuer_name?: string;
  type: string;
  status: string;
  deleted_at: string;
  created_at: string;
}

export function TrashView() {
  const [deletedCredentials, setDeletedCredentials] = useState<DeletedCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('wallet');

  const fetchDeletedCredentials = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credentials')
        .select('id, title, issuer_name, type, status, deleted_at, created_at')
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) {
        console.error('Error fetching deleted credentials:', error);
        return;
      }

      setDeletedCredentials(data || []);
    } catch (error) {
      console.error('Error in fetchDeletedCredentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreCredential = async (credentialId: string) => {
    try {
      const { error } = await supabase
        .from('credentials')
        .update({ deleted_at: null })
        .eq('id', credentialId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error restoring credential:', error);
        toast({
          title: "Error",
          description: "Failed to restore credential",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Credential Restored",
        description: "The credential has been moved back to your wallet",
      });

      fetchDeletedCredentials();
    } catch (error) {
      console.error('Error in restoreCredential:', error);
    }
  };

  const permanentlyDeleteCredential = async (credentialId: string) => {
    try {
      const { error } = await supabase
        .from('credentials')
        .delete()
        .eq('id', credentialId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error permanently deleting credential:', error);
        toast({
          title: "Error",
          description: "Failed to permanently delete credential",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Credential Deleted",
        description: "The credential has been permanently deleted",
      });

      fetchDeletedCredentials();
    } catch (error) {
      console.error('Error in permanentlyDeleteCredential:', error);
    }
  };

  const emptyTrash = async () => {
    try {
      const { error } = await supabase
        .from('credentials')
        .delete()
        .eq('user_id', user?.id)
        .not('deleted_at', 'is', null);

      if (error) {
        console.error('Error emptying trash:', error);
        toast({
          title: "Error",
          description: "Failed to empty trash",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Trash Emptied",
        description: "All deleted credentials have been permanently removed",
      });

      setDeletedCredentials([]);
    } catch (error) {
      console.error('Error in emptyTrash:', error);
    }
  };

  useEffect(() => {
    fetchDeletedCredentials();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trash</h1>
          <p className="text-muted-foreground">
            Deleted credentials are kept for 30 days before permanent removal
          </p>
        </div>
        
        {deletedCredentials.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Empty Trash
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Empty Trash</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {deletedCredentials.length} credentials in trash. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={emptyTrash} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {deletedCredentials.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Trash2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Trash is empty</h3>
            <p className="text-muted-foreground">
              Deleted credentials will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Credentials in trash will be automatically deleted after 30 days. 
              You can restore them before then.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {deletedCredentials.map((credential) => (
              <Card key={credential.id} className="border-destructive/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {credential.title || 'Untitled Credential'}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{credential.issuer_name}</span>
                        <Badge variant="secondary">{credential.type}</Badge>
                        <Badge variant="outline" className="text-destructive border-destructive">
                          {credential.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreCredential(credential.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Forever
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Permanently</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{credential.title || 'this credential'}". 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => permanentlyDeleteCredential(credential.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Forever
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground">
                    Deleted {new Date(credential.deleted_at).toLocaleDateString()} • 
                    Created {new Date(credential.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}