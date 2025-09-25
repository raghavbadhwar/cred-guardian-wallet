import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Shield, 
  Eye, 
  EyeOff,
  Lock,
  Globe,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { format } from 'date-fns';

interface VerificationResult {
  status: 'valid' | 'revoked' | 'expired' | 'not_found' | 'invalid_code';
  credential?: {
    title: string;
    issuer_name: string;
    issuer_domain: string;
    issued_date: string;
    expires_at?: string;
    payload: any;
  };
  share?: {
    created_at: string;
    views: number;
    max_views: number;
    expires_at: string;
    policy: any;
  };
  issuerTrusted?: boolean;
  revoked?: boolean;
  checkedAt: string;
  requiresAccessCode?: boolean;
}

export function VerificationPortal() {
  const { shareId } = useParams<{ shareId: string }>();
  const { t } = useTranslation('verify');
  const { toast } = useToast();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);

  useEffect(() => {
    if (shareId) {
      verifyCredential(shareId);
    }
  }, [shareId]);

  const verifyCredential = async (id: string, code?: string) => {
    setLoading(true);
    try {
      // Simulate API call to verification endpoint
      const response = await fetch(`/api/v/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_code: code }),
      });
      
      if (!response.ok) {
        throw new Error('Verification failed');
      }
      
      const data: VerificationResult = await response.json();
      setResult(data);
      
      if (data.requiresAccessCode && !code) {
        setShowAccessCode(true);
      }
    } catch (error) {
      // Mock verification result for demo
      const mockResult: VerificationResult = {
        status: 'valid',
        credential: {
          title: 'Bachelor of Commerce',
          issuer_name: 'University of Delhi',
          issuer_domain: 'du.ac.in',
          issued_date: '2024-05-15',
          payload: {
            student_name: 'John Doe',
            degree: 'B.Com (Hons)',
            year: '2024',
            grade: 'First Division',
            registration_number: 'DU/2021/12345'
          }
        },
        share: {
          created_at: new Date().toISOString(),
          views: 1,
          max_views: 10,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          policy: { preset: 'lite' }
        },
        issuerTrusted: true,
        checkedAt: new Date().toISOString()
      };
      
      setResult(mockResult);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCodeSubmit = () => {
    if (shareId && accessCode) {
      verifyCredential(shareId, accessCode);
      setShowAccessCode(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'revoked':
        return <AlertTriangle className="h-8 w-8 text-red-600" />;
      case 'expired':
        return <Clock className="h-8 w-8 text-amber-600" />;
      default:
        return <Shield className="h-8 w-8 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'revoked':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'expired':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'valid':
        return t('credential_valid');
      case 'revoked':
        return t('credential_revoked');
      case 'expired':
        return t('credential_expired');
      case 'not_found':
        return t('credential_not_found');
      default:
        return t('verification_failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('verifying')}</p>
        </div>
      </div>
    );
  }

  if (showAccessCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <div className="text-center mb-6">
            <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold">{t('access_code_required')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('access_code_required_desc')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">{t('access_code')}</Label>
              <Input
                id="access-code"
                type="password"
                placeholder={t('enter_access_code')}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAccessCodeSubmit()}
              />
            </div>

            <Button onClick={handleAccessCodeSubmit} className="w-full">
              {t('verify')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('no_result')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">{t('credential_verification')}</h1>
          <p className="text-muted-foreground">{t('instant_verification_portal')}</p>
        </div>

        {/* Verification Result Banner */}
        <Card className={`p-6 border-2 ${getStatusColor(result.status)}`}>
          <div className="flex items-center justify-center gap-4">
            {getStatusIcon(result.status)}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">
                {getStatusMessage(result.status)}
              </h2>
              {result.issuerTrusted && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  {t('issuer_trusted')}
                </div>
              )}
            </div>
          </div>
        </Card>

        {result.credential && result.status === 'valid' && (
          <>
            {/* Credential Details */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('credential_details')}
              </h3>
              
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('credential_title')}
                    </Label>
                    <p className="font-semibold">{result.credential.title}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('issuer')}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span className="font-semibold">{result.credential.issuer_name}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('issued_date')}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(result.credential.issued_date), 'PPP')}</span>
                    </div>
                  </div>
                  
                  {result.credential.expires_at && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('expires_date')}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(result.credential.expires_at), 'PPP')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shared Fields with Selective Disclosure */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {t('shared_information')}
                  </Label>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    {Object.entries(result.credential.payload || {}).map(([key, value]) => {
                      // Check if this field should be shown based on share policy
                      const fieldVisibility = result.share?.policy?.fieldVisibility?.[key] || 'visible';
                      
                      if (fieldVisibility === 'hidden') return null;
                      
                      const displayValue = fieldVisibility === 'masked' 
                        ? maskFieldValue(String(value))
                        : String(value);
                      
                      return (
                        <div key={key} className="flex justify-between items-center">
                          <span className="font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <div className="flex items-center gap-2">
                            {fieldVisibility === 'masked' && (
                              <EyeOff className="h-3 w-3 text-amber-600" />
                            )}
                            <span className={fieldVisibility === 'masked' ? 'text-amber-700' : ''}>
                              {displayValue}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Share Information */}
            {result.share && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {t('share_information')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">{t('views')}</Label>
                    <p className="font-semibold">
                      {result.share.views} / {result.share.max_views}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">{t('expires')}</Label>
                    <p className="font-semibold">
                      {format(new Date(result.share.expires_at), 'PPp')}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">{t('policy')}</Label>
                    <Badge variant="outline" className="capitalize">
                      {result.share.policy.preset}
                    </Badge>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Verification Footer */}
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{t('verified_by_credverse')}</span>
            </div>
            <div>
              {t('verified_at')} {format(new Date(result.checkedAt), 'PPp')}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Helper function to mask field values for selective disclosure
const maskFieldValue = (value: string): string => {
  if (value.length <= 4) return '***';
  return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
};