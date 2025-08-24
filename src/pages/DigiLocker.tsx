import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCredentials } from '@/hooks/useCredentials';

interface DigiLockerDocument {
  id: string;
  type: string;
  title: string;
  issuer: string;
  issuedDate: string;
  category: 'degree' | 'certificate' | 'transcript' | 'diploma';
}

const mockDocuments: DigiLockerDocument[] = [
  {
    id: 'du-bcom-2024',
    type: 'Bachelor of Commerce',
    title: 'B.Com Degree Certificate',
    issuer: 'University of Delhi',
    issuedDate: '2024-05-15',
    category: 'degree'
  },
  {
    id: 'iit-btech-2023',
    type: 'B.Tech (CSE)',
    title: 'Bachelor of Technology Degree',
    issuer: 'IIT Delhi',
    issuedDate: '2023-07-20',
    category: 'degree'
  },
  {
    id: 'cbse-12th-2020',
    type: 'Class XII Certificate',
    title: 'Senior Secondary Certificate',
    issuer: 'Central Board of Secondary Education',
    issuedDate: '2020-06-30',
    category: 'certificate'
  }
];

export default function DigiLocker() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { addCredential } = useCredentials();
  
  const [step, setStep] = useState<'connect' | 'select' | 'preview'>('connect');
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsConnecting(false);
    setStep('select');
    
    toast({
      title: t('success', { ns: 'common' }),
      description: 'Connected to DigiLocker successfully',
    });
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
        const doc = mockDocuments.find(d => d.id === docId);
        if (doc) {
          await addCredential({
            type: doc.type,
            issuer: doc.issuer,
            issuerDomain: doc.issuer.toLowerCase().replace(/\s+/g, '.') + '.gov.in',
            subject: doc.title,
            issuedDate: doc.issuedDate,
            status: 'valid',
            category: doc.category,
            credentialData: {
              source: 'digilocker',
              documentId: doc.id,
              importedAt: new Date().toISOString()
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

  const getDocumentIcon = (category: string) => {
    switch (category) {
      case 'degree': return <GraduationCap className="w-5 h-5 text-blue-500" />;
      case 'certificate': return <Award className="w-5 h-5 text-green-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="DigiLocker Import (Beta)" />
      
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
              
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Beta Feature
              </Badge>
              
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect DigiLocker Account
                  </>
                )}
              </Button>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  This is a beta feature. Only sandbox documents are available in development.
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
            </div>
            
            <div className="space-y-3">
              {mockDocuments.map((doc) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedDocs.includes(doc.id)}
                      onCheckedChange={() => handleDocumentToggle(doc.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        {getDocumentIcon(doc.category)}
                        <h3 className="font-medium">{doc.title}</h3>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>{doc.issuer}</p>
                        <p>Issued: {new Date(doc.issuedDate).toLocaleDateString()}</p>
                      </div>
                      
                      <Badge variant="outline">{doc.category}</Badge>
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
                const doc = mockDocuments.find(d => d.id === docId);
                if (!doc) return null;
                
                return (
                  <Card key={doc.id} className="p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <h3 className="font-medium">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground">{doc.issuer}</p>
                        <Badge variant="outline" className="mt-1">{doc.category}</Badge>
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