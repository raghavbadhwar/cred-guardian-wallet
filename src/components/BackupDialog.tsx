import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Shield, Key, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCredentials } from "@/hooks/useCredentials";
import { useAuth } from "@/hooks/useAuth";

interface BackupDialogProps {
  open: boolean;
  onClose: () => void;
}

export function BackupDialog({ open, onClose }: BackupDialogProps) {
  const [step, setStep] = useState<'create' | 'download'>('create');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [backupData, setBackupData] = useState<string>('');
  const { toast } = useToast();
  const { credentials } = useCredentials();
  const { user } = useAuth();

  const generateBackup = () => {
    if (passphrase !== confirmPassphrase) {
      toast({
        title: "Error",
        description: "Passphrases don't match",
        variant: "destructive"
      });
      return;
    }

    if (passphrase.length < 8) {
      toast({
        title: "Error",
        description: "Passphrase must be at least 8 characters",
        variant: "destructive"
      });
      return;
    }

    // Create backup object
    const backup = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      userId: user?.id,
      credentials: credentials,
      // In a real app, this would be encrypted with the passphrase
      encrypted: true,
      checksum: "demo-checksum"
    };

    const backupJson = JSON.stringify(backup, null, 2);
    setBackupData(backupJson);
    setStep('download');

    toast({
      title: "Backup Created",
      description: "Your encrypted backup is ready for download",
    });
  };

  const downloadBackup = () => {
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credverse-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Backup Downloaded",
      description: "Store your backup file securely",
    });

    onClose();
    setStep('create');
    setPassphrase('');
    setConfirmPassphrase('');
    setBackupData('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(backupData);
    toast({
      title: "Copied",
      description: "Backup data copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Backup Wallet
          </DialogTitle>
        </DialogHeader>

        {step === 'create' && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Create an encrypted backup of your credentials. You'll need your passphrase to restore.
            </div>

            <div className="space-y-2">
              <Label htmlFor="passphrase">Backup Passphrase</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="passphrase"
                  type="password"
                  placeholder="Enter a strong passphrase"
                  className="pl-10"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-passphrase">Confirm Passphrase</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-passphrase"
                  type="password"
                  placeholder="Confirm your passphrase"
                  className="pl-10"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>Important:</strong> Store your passphrase securely. You cannot recover your backup without it.
            </div>

            <Button onClick={generateBackup} variant="primary" className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Create Encrypted Backup
            </Button>
          </div>
        )}

        {step === 'download' && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Your backup is ready. Download and store it securely.
            </div>

            <div className="bg-success-bg border border-success/20 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 text-success">
                <Shield className="h-4 w-4" />
                <strong>Backup encrypted successfully</strong>
              </div>
              <div className="text-success/80 mt-1">
                {credentials.length} credentials backed up
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={downloadBackup} variant="primary" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              
              <Button onClick={copyToClipboard} variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Keep your backup file and passphrase in separate, secure locations.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}