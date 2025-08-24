import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QRScanner } from './QRScanner';
import { useToast } from '@/hooks/use-toast';
import { 
  QrCode, 
  Upload, 
  FileText, 
  Mail, 
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ImportWizardProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: (credential: any) => void;
}

export function ImportWizard({ open, onClose, onImportComplete }: ImportWizardProps) {
  const [activeTab, setActiveTab] = useState('qr');
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pastedToken, setPastedToken] = useState('');
  const [emailToken, setEmailToken] = useState('');
  const [fileContent, setFileContent] = useState<string>('');
  const { toast } = useToast();
  const { t } = useTranslation('wallet');

  if (!open) return null;

  const importMethods = [
    {
      id: 'qr',
      label: 'Scan QR Code',
      description: 'Use camera to scan QR codes from issuers',
      icon: QrCode,
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'file',
      label: 'Upload File',
      description: 'Import credential files (.json, .jwt)',
      icon: Upload,
      color: 'bg-success/10 text-success'
    },
    {
      id: 'paste',
      label: 'Paste Token',
      description: 'Direct credential token import',
      icon: FileText,
      color: 'bg-warning/10 text-warning'
    },
    {
      id: 'email',
      label: 'Email Link',
      description: 'Import from issuer email links',
      icon: Mail,
      color: 'bg-danger/10 text-danger'
    }
  ];

  const handleQRResult = async (result: string) => {
    setImporting(true);
    try {
      // Process QR code result
      await processCredentialData(result, 'qr');
    } finally {
      setImporting(false);
      setScanning(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      setFileContent(content);
      await processCredentialData(content, 'file');
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Failed to read file content",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handlePasteImport = async () => {
    if (!pastedToken.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please paste a valid credential token",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      await processCredentialData(pastedToken, 'paste');
    } finally {
      setImporting(false);
    }
  };

  const handleEmailImport = async () => {
    if (!emailToken.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid email token or link",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      await processCredentialData(emailToken, 'email');
    } finally {
      setImporting(false);
    }
  };

  const processCredentialData = async (data: string, source: string) => {
    try {
      // Basic validation
      let credentialData;
      
      if (data.startsWith('http')) {
        // Handle URL links
        const response = await fetch(data);
        credentialData = await response.json();
      } else if (data.includes('.')) {
        // Likely a JWT token
        try {
          const payload = JSON.parse(atob(data.split('.')[1]));
          credentialData = payload;
        } catch {
          credentialData = JSON.parse(data);
        }
      } else {
        // Try parsing as JSON
        credentialData = JSON.parse(data);
      }

      // Create mock credential for now
      const newCredential = {
        id: crypto.randomUUID(),
        title: credentialData.credentialSubject?.name || 'Imported Credential',
        issuer: credentialData.issuer || 'Unknown Issuer',
        issuer_name: credentialData.issuer || 'Unknown Issuer',
        subject: credentialData.credentialSubject?.id || 'Unknown Subject',
        type: credentialData.type?.[1] || 'VerifiableCredential',
        category: 'education',
        status: 'valid',
        issued_date: credentialData.issuanceDate || new Date().toISOString().split('T')[0],
        payload: credentialData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      onImportComplete(newCredential);
      onClose();

      toast({
        title: "Import Successful",
        description: `Credential imported via ${source}`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Invalid credential format or data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Import Credential</h2>
              <p className="text-muted-foreground">Choose your preferred import method</p>
            </div>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
        </div>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              {importMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <TabsTrigger key={method.id} value={method.id} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{method.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="mt-6">
              {importMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <TabsContent key={method.id} value={method.id}>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${method.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{method.label}</CardTitle>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {method.id === 'qr' && (
                          <div className="space-y-4">
                            {!scanning ? (
                              <Button 
                                onClick={() => setScanning(true)}
                                className="w-full"
                                disabled={importing}
                              >
                                <QrCode className="h-4 w-4 mr-2" />
                                Start QR Scanner
                              </Button>
                            ) : (
                              <div className="space-y-4">
                                <QRScanner 
                                  open={scanning} 
                                  onClose={() => setScanning(false)}
                                  onResult={handleQRResult} 
                                />
                                <Button 
                                  variant="outline" 
                                  onClick={() => setScanning(false)}
                                  className="w-full"
                                >
                                  Cancel Scan
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {method.id === 'file' && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="file-upload">Choose credential file</Label>
                              <Input
                                id="file-upload"
                                type="file"
                                accept=".json,.jwt,.txt"
                                onChange={handleFileUpload}
                                disabled={importing}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Supported formats: JSON, JWT, TXT
                            </div>
                          </div>
                        )}

                        {method.id === 'paste' && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="paste-token">Credential token</Label>
                              <Textarea
                                id="paste-token"
                                placeholder="Paste your credential token here..."
                                value={pastedToken}
                                onChange={(e) => setPastedToken(e.target.value)}
                                rows={4}
                                disabled={importing}
                              />
                            </div>
                            <Button 
                              onClick={handlePasteImport} 
                              disabled={!pastedToken.trim() || importing}
                              className="w-full"
                            >
                              {importing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4 mr-2" />
                              )}
                              Import Token
                            </Button>
                          </div>
                        )}

                        {method.id === 'email' && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="email-token">Email link or token</Label>
                              <Input
                                id="email-token"
                                placeholder="https://issuer.com/credential/..."
                                value={emailToken}
                                onChange={(e) => setEmailToken(e.target.value)}
                                disabled={importing}
                              />
                            </div>
                            <Button 
                              onClick={handleEmailImport} 
                              disabled={!emailToken.trim() || importing}
                              className="w-full"
                            >
                              {importing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4 mr-2" />
                              )}
                              Import from Email
                            </Button>
                          </div>
                        )}

                        {importing && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing credential...
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                );
              })}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}