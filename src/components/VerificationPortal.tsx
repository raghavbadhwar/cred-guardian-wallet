import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { QRScanner } from '@/components/QRScanner';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock,
  Info
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface VerificationResult {
  status: 'valid' | 'invalid' | 'expired' | 'revoked';
  trusted: boolean;
  issuer: string;
  subject: string;
  issuedDate: string;
  expiryDate?: string;
  diagnostics: {
    signatureValid: boolean;
    trustRegistryHit: boolean;
    revocationChecked: boolean;
    timestamps: {
      verified: string;
      issued: string;
    };
  };
}

export function VerificationPortal() {
  const { t } = useTranslation('verify');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [credentialData, setCredentialData] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!credentialData.trim()) return;
    
    setIsVerifying(true);
    
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock verification result
    const result: VerificationResult = {
      status: 'valid',
      trusted: true,
      issuer: 'University of Delhi',
      subject: 'Bachelor of Commerce',
      issuedDate: '2024-05-15',
      diagnostics: {
        signatureValid: true,
        trustRegistryHit: true,
        revocationChecked: true,
        timestamps: {
          verified: new Date().toISOString(),
          issued: '2024-05-15T10:30:00Z',
        },
      },
    };
    
    setVerificationResult(result);
    setIsVerifying(false);
  };

  const handleQRResult = (data: string) => {
    setCredentialData(data);
    setShowQRScanner(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'expired': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'revoked': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string, trusted: boolean) => {
    if (status === 'valid' && trusted) {
      return <Badge variant="default" className="bg-green-100 text-green-800">{t('verify_trust_ok', { ns: 'common' })}</Badge>;
    }
    if (status === 'revoked') {
      return <Badge variant="destructive">{t('verify_revoked', { ns: 'common' })}</Badge>;
    }
    if (status === 'expired') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t('expired')}</Badge>;
    }
    return <Badge variant="destructive">{t('invalid')}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">{t('title')}</h1>
        
        <Card className="p-6 space-y-6">
          <Tabs defaultValue="scan" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scan">{t('scan_tab')}</TabsTrigger>
              <TabsTrigger value="paste">{t('paste_tab')}</TabsTrigger>
              <TabsTrigger value="upload">{t('upload_tab')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scan" className="space-y-4">
              <div className="text-center py-8">
                <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">{t('scan_qr_prompt')}</p>
                <Button onClick={() => setShowQRScanner(true)}>
                  {t('scan_tab')}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="paste" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('paste_prompt')}</p>
                <Textarea
                  value={credentialData}
                  onChange={(e) => setCredentialData(e.target.value)}
                  placeholder="Paste credential data here..."
                  className="min-h-32"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="text-center py-8">
                <div className="border-2 border-dashed border-border rounded-lg p-8">
                  <p className="text-muted-foreground">{t('upload_prompt')}</p>
                  <Button variant="outline" className="mt-4">
                    Choose File
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <Button 
            onClick={handleVerify} 
            className="w-full" 
            disabled={!credentialData.trim() || isVerifying}
          >
            {isVerifying ? t('loading', { ns: 'common' }) : t('verify_button')}
          </Button>
        </Card>

        {verificationResult && (
          <Card className="p-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                {getStatusIcon(verificationResult.status)}
                <h2 className="text-xl font-semibold">
                  {verificationResult.status === 'valid' ? t('verified') : t('invalid')}
                </h2>
              </div>
              
              {getStatusBadge(verificationResult.status, verificationResult.trusted)}
              
              <div className="space-y-2">
                <h3 className="font-medium">{verificationResult.subject}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('issuer_info')}: {verificationResult.issuer}
                </p>
                <p className="text-xs text-muted-foreground">
                  Issued: {verificationResult.issuedDate}
                </p>
              </div>
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="diagnostics">
                <AccordionTrigger>
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4" />
                    <span>{t('diagnostics')}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('signature_valid')}</span>
                      {verificationResult.diagnostics.signatureValid ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('trust_registry')}</span>
                      {verificationResult.diagnostics.trustRegistryHit ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('revocation_status')}</span>
                      {verificationResult.diagnostics.revocationChecked ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-medium mb-2">Timestamps</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Verified: {new Date(verificationResult.diagnostics.timestamps.verified).toLocaleString()}</div>
                      <div>Issued: {new Date(verificationResult.diagnostics.timestamps.issued).toLocaleString()}</div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        )}
      </div>

      <QRScanner
        open={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onResult={handleQRResult}
      />
    </div>
  );
}