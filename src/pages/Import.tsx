import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ImportWizard } from '@/components/ImportWizard';
import { useCredentials } from '@/hooks/useCredentials';
import { useToast } from '@/hooks/use-toast';

export default function Import() {
  const navigate = useNavigate();
  const { addCredential } = useCredentials();
  const { toast } = useToast();

  const handleImportComplete = async (credential: any) => {
    try {
      await addCredential(credential);
      toast({
        title: "Import Successful",
        description: "Credential has been added to your wallet",
      });
      navigate('/wallet');
    } catch (error) {
      toast({
        title: "Import Failed", 
        description: "Failed to save credential to wallet",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Import Credential" />
      
      <main className="container mx-auto px-4 py-6">
        <ImportWizard 
          open={true}
          onClose={() => navigate('/wallet')}
          onImportComplete={handleImportComplete}
        />
      </main>
    </div>
  );
}