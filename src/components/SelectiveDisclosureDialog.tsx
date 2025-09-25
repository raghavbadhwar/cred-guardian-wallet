import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Copy, 
  QrCode, 
  Share2, 
  Shield, 
  Eye, 
  EyeOff,
  Clock, 
  Lock,
  Info,
  ChevronDown,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import QRCode from 'qrcode';
import { shareDialogSchema, fieldNameSchema, sanitizeString } from '@/schemas/validation';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { z } from 'zod';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  credential: any;
  onCreateShare: (shareData: ShareData) => Promise<{ id: string; url: string }>;
}

interface ShareData {
  credId: string;
  policy: {
    preset: 'full' | 'lite' | 'custom';
    selectedFields?: string[];
    fieldVisibility?: Record<string, 'visible' | 'masked' | 'hidden'>;
  };
  expiresAt: string;
  maxViews: number;
  accessCode?: string;
}

interface FieldConfig {
  key: string;
  label: string;
  value: any;
  category: 'personal' | 'academic' | 'institutional' | 'metadata';
  sensitive: boolean;
  visibility: 'visible' | 'masked' | 'hidden';
}

const PRESET_CONFIGS = {
  full: {
    label: 'Full Disclosure',
    description: 'Share all credential information',
    icon: Shield,
    includeAll: true,
    defaultVisibility: 'visible' as const
  },
  lite: {
    label: 'Essential Info',
    description: 'Share only essential information',
    icon: Eye,
    includeAll: false,
    defaultVisibility: 'visible' as const,
    essentialFields: ['degree', 'institution', 'university', 'year', 'title', 'name']
  },
  custom: {
    label: 'Selective Disclosure',
    description: 'Choose specific fields and their visibility levels',
    icon: EyeOff,
    includeAll: false,
    defaultVisibility: 'hidden' as const
  },
};

export function SelectiveDisclosureDialog({ open, onClose, credential, onCreateShare }: ShareDialogProps) {
  const { t } = useTranslation('wallet');
  const { toast } = useToast();
  const [preset, setPreset] = useState<'full' | 'lite' | 'custom'>('lite');
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [expiryMinutes, setExpiryMinutes] = useState('60');
  const [maxViews, setMaxViews] = useState('10');
  const [accessCode, setAccessCode] = useState('');
  const [requireAccessCode, setRequireAccessCode] = useState(false);
  const [shareResult, setShareResult] = useState<{ id: string; url: string } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    personal: true,
    academic: true,
    institutional: false,
    metadata: false
  });
  const { logSecurityEvent, checkRateLimit } = useSecurityMonitoring();

  // Initialize field configurations when credential changes
  useEffect(() => {
    if (credential?.payload) {
      const configs = Object.entries(credential.payload).map(([key, value]) => ({
        key,
        label: formatFieldLabel(key),
        value,
        category: categorizeField(key),
        sensitive: isSensitiveField(key),
        visibility: getDefaultVisibility(key, preset)
      }));
      setFieldConfigs(configs);
    }
  }, [credential, preset]);

  const formatFieldLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  };

  const categorizeField = (key: string): FieldConfig['category'] => {
    const personalFields = ['name', 'student_name', 'email', 'phone', 'address', 'dob', 'gender'];
    const academicFields = ['degree', 'grade', 'gpa', 'marks', 'course', 'major', 'specialization', 'year'];
    const institutionalFields = ['institution', 'university', 'college', 'school', 'issuer'];
    
    const lowerKey = key.toLowerCase();
    
    if (personalFields.some(field => lowerKey.includes(field))) return 'personal';
    if (academicFields.some(field => lowerKey.includes(field))) return 'academic';
    if (institutionalFields.some(field => lowerKey.includes(field))) return 'institutional';
    
    return 'metadata';
  };

  const isSensitiveField = (key: string): boolean => {
    const sensitiveFields = ['email', 'phone', 'address', 'dob', 'registration_number', 'student_id'];
    return sensitiveFields.some(field => key.toLowerCase().includes(field));
  };

  const getDefaultVisibility = (key: string, currentPreset: string): FieldConfig['visibility'] => {
    if (currentPreset === 'full') return 'visible';
    if (currentPreset === 'custom') return 'hidden';
    
    // For lite preset, show essential fields
    const essentialFields = PRESET_CONFIGS.lite.essentialFields;
    const isEssential = essentialFields.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    );
    
    return isEssential ? 'visible' : 'hidden';
  };

  const updateFieldVisibility = (fieldKey: string, visibility: FieldConfig['visibility']) => {
    setFieldConfigs(prev => 
      prev.map(config => 
        config.key === fieldKey 
          ? { ...config, visibility }
          : config
      )
    );
  };

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getVisibilityColor = (visibility: FieldConfig['visibility']) => {
    switch (visibility) {
      case 'visible': return 'text-green-600 bg-green-50 border-green-200';
      case 'masked': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'hidden': return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getVisibilityIcon = (visibility: FieldConfig['visibility']) => {
    switch (visibility) {
      case 'visible': return <Eye className="h-4 w-4" />;
      case 'masked': return <EyeOff className="h-4 w-4" />;
      case 'hidden': return <span className="h-4 w-4 rounded bg-gray-400" />;
    }
  };

  const maskValue = (value: any): string => {
    const str = String(value);
    if (str.length <= 4) return '***';
    return str.slice(0, 2) + '*'.repeat(str.length - 4) + str.slice(-2);
  };

  const renderFieldValue = (config: FieldConfig) => {
    switch (config.visibility) {
      case 'visible':
        return String(config.value);
      case 'masked':
        return maskValue(config.value);
      case 'hidden':
        return <span className="text-gray-400 italic">Hidden</span>;
    }
  };

  const handleCreateShare = useCallback(async () => {
    const visibleFields = fieldConfigs
      .filter(config => config.visibility !== 'hidden')
      .map(config => config.key);

    if (visibleFields.length === 0) {
      toast({
        title: t('no_fields_selected') || "No Fields Selected",
        description: t('select_at_least_one_field') || "Please select at least one field to share",
        variant: "destructive"
      });
      return;
    }

    try {
      // Validate input data
      const fieldVisibility = fieldConfigs.reduce((acc, config) => {
        acc[config.key] = config.visibility;
        return acc;
      }, {} as Record<string, FieldConfig['visibility']>);

      const formData = {
        preset,
        selectedFields: visibleFields.map(field => sanitizeString(field)),
        expiryMinutes: parseInt(expiryMinutes),
        maxViews: parseInt(maxViews),
        accessCode: accessCode ? sanitizeString(accessCode) : undefined,
        requireAccessCode
      };

      const validation = shareDialogSchema.safeParse(formData);
      
      if (!validation.success) {
        const errors: Record<string, string> = {};
        validation.error.errors.forEach(error => {
          errors[error.path[0] as string] = error.message;
        });
        setValidationErrors(errors);
        
        toast({
          title: t('validation_error') || "Validation Error",
          description: t('check_input') || "Please check your input and try again",
          variant: 'destructive',
        });
        return;
      }

      // Clear validation errors
      setValidationErrors({});

      // Check rate limit for sharing
      const rateLimitOk = await checkRateLimit('share_create', 20, 60);
      if (!rateLimitOk) {
        toast({
          title: t('rate_limited') || "Rate Limited",
          description: t('too_many_requests') || "Too many share requests. Please try again later.",
          variant: 'destructive',
        });
        return;
      }

      // Calculate risk level based on disclosure
      const maskedFields = fieldConfigs.filter(c => c.visibility === 'masked').length;
      const sensitiveVisible = fieldConfigs.filter(c => c.sensitive && c.visibility === 'visible').length;
      
      const riskLevel = sensitiveVisible > 2 ? 'high' :
                        maskedFields === 0 && visibleFields.length > 10 ? 'medium' : 'low';

      await logSecurityEvent('selective_disclosure_share', 'credential', credential.id, {
        visible_fields: visibleFields.length,
        masked_fields: maskedFields,
        hidden_fields: fieldConfigs.length - visibleFields.length - maskedFields,
        sensitive_visible: sensitiveVisible,
        preset: preset
      }, riskLevel);

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + validation.data.expiryMinutes);

      const shareData: ShareData = {
        credId: credential.id,
        policy: {
          preset,
          selectedFields: validation.data.selectedFields,
          fieldVisibility: fieldVisibility
        },
        expiresAt: expiresAt.toISOString(),
        maxViews: validation.data.maxViews,
        ...(validation.data.requireAccessCode && { accessCode: validation.data.accessCode }),
      };

      const result = await onCreateShare(shareData);
      setShareResult(result);

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(result.url, {
        width: 200,
        margin: 1,
      });
      setQrCodeUrl(qrDataUrl);

      toast({
        title: t('share_created') || "Share Created",
        description: t('share_created_desc') || "Your selective disclosure link has been created",
      });
    } catch (error: any) {
      console.error('Error creating share:', error);
      
      await logSecurityEvent('selective_disclosure_failed', 'credential', credential?.id, {
        error: error.message,
        field_count: visibleFields.length
      }, 'medium');

      toast({
        title: t('error') || "Error",
        description: t('share_creation_failed') || "Failed to create share link",
        variant: 'destructive',
      });
    }
  }, [fieldConfigs, preset, expiryMinutes, maxViews, accessCode, requireAccessCode, credential, onCreateShare, toast, checkRateLimit, logSecurityEvent, t]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('copied') || "Copied",
      description: t('link_copied_to_clipboard') || "Link copied to clipboard",
    });
  };

  const groupedFields = fieldConfigs.reduce((acc, config) => {
    if (!acc[config.category]) acc[config.category] = [];
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, FieldConfig[]>);

  const categoryLabels = {
    personal: 'Personal Information',
    academic: 'Academic Details',
    institutional: 'Institution Information',
    metadata: 'Additional Data'
  };

  const categoryIcons = {
    personal: <Shield className="h-4 w-4" />,
    academic: <CheckCircle2 className="h-4 w-4" />,
    institutional: <Lock className="h-4 w-4" />,
    metadata: <Info className="h-4 w-4" />
  };

  if (shareResult) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              {t('share_ready') || 'Share Ready'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="p-4 text-center">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-4" />
              )}
              <p className="text-sm text-muted-foreground mb-2">
                {t('scan_or_share_link') || 'Scan QR code or share the link below'}
              </p>
            </Card>

            <div className="space-y-2">
              <Label>{t('share_link') || 'Share Link'}</Label>
              <div className="flex gap-2">
                <Input value={shareResult.url} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(shareResult.url)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <strong>{t('share_details') || 'Share Details'}</strong>
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>{t('expires_in') || 'Expires in'} {expiryMinutes} {t('minutes') || 'minutes'}</li>
                <li>{t('max_views') || 'Max views'}: {maxViews}</li>
                <li>{t('fields_shared') || 'Fields shared'}: {fieldConfigs.filter(c => c.visibility !== 'hidden').length}</li>
                <li>{t('masked_fields') || 'Masked fields'}: {fieldConfigs.filter(c => c.visibility === 'masked').length}</li>
                {requireAccessCode && <li>{t('access_code_required') || 'Access code required'}</li>}
              </ul>
            </div>

            <Button onClick={onClose} className="w-full">
              {t('done') || 'Done'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5" />
            {t('selective_disclosure') || 'Selective Disclosure'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Field Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t('choose_information_to_share') || 'Choose Information to Share'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('selective_disclosure_desc') || 'Control exactly what information is visible, masked, or hidden'}
              </p>
            </div>

            {/* Preset Selection */}
            <div className="flex gap-2">
              {Object.entries(PRESET_CONFIGS).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={key}
                    variant={preset === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreset(key as any)}
                    className="flex-1"
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {config.label}
                  </Button>
                );
              })}
            </div>

            {/* Field Categories */}
            <div className="space-y-3">
              {Object.entries(groupedFields).map(([category, fields]) => (
                <Card key={category} className="overflow-hidden">
                  <Collapsible
                    open={expandedCategories[category]}
                    onOpenChange={() => toggleCategoryExpansion(category)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-3 cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {categoryIcons[category as keyof typeof categoryIcons]}
                            <h4 className="font-medium">
                              {categoryLabels[category as keyof typeof categoryLabels]}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {fields.filter(f => f.visibility !== 'hidden').length}/{fields.length}
                            </Badge>
                          </div>
                          {expandedCategories[category] ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-2">
                        {fields.map((config) => (
                          <div key={config.key} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{config.label}</span>
                                {config.sensitive && (
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                    Sensitive
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {String(config.value)}
                              </p>
                            </div>
                            
                            <div className="flex gap-1">
                              {(['visible', 'masked', 'hidden'] as const).map((visibility) => (
                                <Button
                                  key={visibility}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateFieldVisibility(config.key, visibility)}
                                  className={`p-1 h-8 w-8 ${
                                    config.visibility === visibility 
                                      ? getVisibilityColor(visibility)
                                      : 'text-gray-400 hover:text-gray-600'
                                  }`}
                                  title={visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                                >
                                  {getVisibilityIcon(visibility)}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Panel - Preview & Settings */}
          <div className="space-y-4">
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('disclosure_preview') || 'Disclosure Preview'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                {fieldConfigs
                  .filter(config => config.visibility !== 'hidden')
                  .map((config) => (
                    <div key={config.key} className="flex justify-between items-center p-2 rounded bg-muted/30">
                      <span className="text-sm font-medium">{config.label}:</span>
                      <div className="flex items-center gap-2">
                        {getVisibilityIcon(config.visibility)}
                        <span className="text-sm">{renderFieldValue(config)}</span>
                      </div>
                    </div>
                  ))}
                
                {fieldConfigs.filter(c => c.visibility !== 'hidden').length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    {t('no_fields_selected_preview') || 'No fields selected for sharing'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Share Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('share_settings') || 'Share Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">{t('expires_in') || 'Expires in'}</Label>
                    <Select value={expiryMinutes} onValueChange={setExpiryMinutes}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 {t('minutes') || 'minutes'}</SelectItem>
                        <SelectItem value="15">15 {t('minutes') || 'minutes'}</SelectItem>
                        <SelectItem value="30">30 {t('minutes') || 'minutes'}</SelectItem>
                        <SelectItem value="60">1 {t('hour') || 'hour'}</SelectItem>
                        <SelectItem value="1440">24 {t('hours') || 'hours'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-views">{t('max_views') || 'Max views'}</Label>
                    <Select value={maxViews} onValueChange={setMaxViews}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 {t('view') || 'view'}</SelectItem>
                        <SelectItem value="5">5 {t('views') || 'views'}</SelectItem>
                        <SelectItem value="10">10 {t('views') || 'views'}</SelectItem>
                        <SelectItem value="25">25 {t('views') || 'views'}</SelectItem>
                        <SelectItem value="100">{t('unlimited') || 'Unlimited'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="access-code">{t('require_access_code') || 'Require access code'}</Label>
                    <Switch
                      id="access-code"
                      checked={requireAccessCode}
                      onCheckedChange={setRequireAccessCode}
                    />
                  </div>

                  {requireAccessCode && (
                    <div className="space-y-2">
                      <Label htmlFor="code">{t('access_code') || 'Access code'}</Label>
                      <Input
                        id="code"
                        type="password"
                        placeholder={t('enter_access_code') || 'Enter access code'}
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                {t('cancel') || 'Cancel'}
              </Button>
              <Button
                onClick={handleCreateShare}
                disabled={fieldConfigs.filter(c => c.visibility !== 'hidden').length === 0}
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t('create_share_link') || 'Create Share Link'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SelectiveDisclosureDialog;