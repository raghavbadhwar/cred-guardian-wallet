import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ExternalLink, 
  FileText, 
  GraduationCap, 
  Award,
  CheckCircle,
  Loader2,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCredentials } from '@/hooks/useCredentials';
import { useDigiLocker, DigiLockerDocument } from '@/hooks/useDigiLocker';

export default function DigiLocker() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { addCredential } = useCredentials();
  const digiLocker = useDigiLocker();
  
  const [step, setStep] = useState<'connect' | 'select' | 'preview'>('connect');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DigiLockerDocument[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user already has a connection
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    const connection = await digiLocker.getConnection();
    if (connection) {
      // Check if connection is still valid
      const expiresAt = new Date(connection.expires_at);
      const now = new Date();
      
      if (now < expiresAt) {
        setStep('select');
        await loadDocuments();
      } else {
        toast({
          title: 'Connection Expired',
          description: 'Your DigiLocker connection has expired. Please reconnect.',
          variant: 'destructive'
        });
      }
    }
  };

  const loadDocuments = async () => {
    const docs = await digiLocker.fetchDocuments();
    setDocuments(docs);
    
    // Check if we're in live mode based on response
    setIsLiveMode(!docs.some((doc: any) => doc.id?.startsWith('mock-')));
  };

  const handleConnect = async () => {
    const result = await digiLocker.initiateOAuth();
    
    if (!result) return;
    
    if (result.authUrl === 'sandbox') {
      // Simulate sandbox connection
      setIsLiveMode(false);
      setStep('select');
      
      // Load mock documents
      const mockDocs: DigiLockerDocument[] = [
        {
          id: 'mock-aadhaar-2024',
          name: 'Aadhaar Card (Masked)',
          type: 'AADHAAR',
          issuer: 'Unique Identification Authority of India',
          issued_date: '2024-01-15',
          metadata: { category: 'certificate', verified: true }
        },
        {
          id: 'mock-pan-2023',
          name: 'Permanent Account Number',
          type: 'PAN',
          issuer: 'Income Tax Department',
          issued_date: '2023-08-20',
          metadata: { category: 'certificate', verified: true }
        },
        {
          id: 'mock-degree-2024',
          name: 'Bachelor of Technology Degree',
          type: 'DEGREE',
          issuer: 'National Institute of Technology',
          issued_date: '2024-06-30',
          metadata: { category: 'degree', verified: true }
        }
      ];
      
      setDocuments(mockDocs);
      
      toast({
        title: 'Sandbox Mode Active',
        description: 'Connected to DigiLocker sandbox - using mock data',
      });
      
      return;
    }
    
    // Redirect to real DigiLocker OAuth
    setIsLiveMode(true);
    window.location.href = result.authUrl;
  };

  // Handle OAuth callback (for when user returns from DigiLocker)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const handleOAuthCallback = async (code: string, state: string) => {
    const success = await digiLocker.handleOAuthCallback(code, state);
    
    if (success) {
      setStep('select');
      await loadDocuments();
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleDocumentToggle = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handlePreview = () => {
    if (selectedDocs.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one document',
        variant: 'destructive'
      });
      return;
    }
    setStep('preview');
  };

  const handleImport = async () => {
    setIsImporting(true);
    
    try {
      // Import selected documents
      for (const docId of selectedDocs) {
        const doc = documents.find(d => d.id === docId);
        if (doc) {
          await addCredential({
            type: doc.type,
            issuer: doc.issuer,
            issuerDomain: generateIssuerDomain(doc.issuer),
            subject: doc.name,
            issuedDate: doc.issued_date,
            status: 'valid',
            category: doc.metadata.category,
            credentialData: {
              source: 'digilocker',
              documentId: doc.id,
              importedAt: new Date().toISOString(),
              liveMode: isLiveMode,
              originalData: doc.metadata.original_data
            }
          });
        }
      }
      
      toast({
        title: t('success', { ns: 'common' }),
        description: `Imported ${selectedDocs.length} credential(s) successfully`,
      });
      
      navigate('/wallet');
    } catch (error) {
      toast({
        title: t('error', { ns: 'common' }),
        description: 'Failed to import credentials',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const generateIssuerDomain = (issuer: string): string => {
    return issuer.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '.')
      .replace(/^\.+|\.+$/g, '') + '.gov.in';
  };

  const getDocumentIcon = (category: string) => {
    switch (category) {
      case 'degree': return <GraduationCap className="w-5 h-5 text-blue-500" />;
      case 'certificate': return <Award className="w-5 h-5 text-green-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="DigiLocker Import" />
      
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {step === 'connect' && (
          <div className="space-y-6">
            <Card className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <ExternalLink className="w-8 h-8 text-blue-600" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">Connect to DigiLocker</h2>
                <p className="text-muted-foreground">
                  Import your government-verified documents directly from DigiLocker
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-2">
                {isLiveMode === null ? (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Checking Status
                  </Badge>
                ) : isLiveMode ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Wifi className="w-3 h-3 mr-1" />
                    Live Mode
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Sandbox Mode
                  </Badge>
                )}
              </div>
              
              <Button 
                onClick={handleConnect} 
                disabled={digiLocker.connecting}
                className="w-full"
              >
                {digiLocker.connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Connect DigiLocker Account
                  </>
                )}
              </Button>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {isLiveMode === false ? 
                    'API credentials not configured - using sandbox with mock documents.' :
                    'Your documents will be imported securely and stored encrypted.'
                  }
                </p>
              </div>
            </Card>
          </div>
        )}

        {step === 'select' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Select Documents</h2>
              <p className="text-muted-foreground">
                Choose which documents you'd like to import to your wallet
              </p>
              {isLiveMode !== null && (
                <div className="mt-2 flex items-center justify-center">
                  <Badge variant="outline" className={isLiveMode ? "border-green-500" : "border-orange-500"}>
                    {isLiveMode ? (
                      <>
                        <Wifi className="w-3 h-3 mr-1" />
                        Live DigiLocker Data
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3 mr-1" />
                        Sandbox Mode
                      </>
                    )}
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedDocs.includes(doc.id)}
                      onCheckedChange={() => handleDocumentToggle(doc.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        {getDocumentIcon(doc.metadata.category)}
                        <h3 className="font-medium">{doc.name}</h3>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>{doc.issuer}</p>
                        <p>Issued: {new Date(doc.issued_date).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Badge variant="outline">{doc.metadata.category}</Badge>
                        {doc.metadata.verified && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setStep('connect')} className="flex-1">
                Back
              </Button>
              <Button onClick={handlePreview} className="flex-1">
                Preview Selected ({selectedDocs.length})
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Import Preview</h2>
              <p className="text-muted-foreground">
                Review the credentials that will be added to your wallet
              </p>
            </div>
            
            <div className="space-y-3">
              {selectedDocs.map((docId) => {
                const doc = documents.find(d => d.id === docId);
                if (!doc) return null;
                
                return (
                  <Card key={doc.id} className="p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <h3 className="font-medium">{doc.name}</h3>
                        <p className="text-sm text-muted-foreground">{doc.issuer}</p>
                        <Badge variant="outline" className="mt-1">{doc.metadata.category}</Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Ready to Import</h4>
                  <p className="text-sm text-green-700 mt-1">
                    {selectedDocs.length} credential(s) will be securely imported to your wallet
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleImport} disabled={isImporting} className="flex-1">
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${selectedDocs.length} Credential(s)`
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
