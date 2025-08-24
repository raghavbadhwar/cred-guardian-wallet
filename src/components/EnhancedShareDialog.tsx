import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, QrCode, Link, Shield, Eye, Clock, Share2 } from 'lucide-react';
import QRCode from 'qrcode';

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
    fields?: string[];
  };
  expiresAt: string;
  maxViews: number;
  accessCode?: string;
}

const PRESETS = {
  full: {
    label: 'Full Disclosure',
    description: 'Share all credential information',
    icon: Shield,
  },
  lite: {
    label: 'Essential Info',
    description: 'Share only degree, institution, and year',
    icon: Eye,
  },
  custom: {
    label: 'Custom Selection',
    description: 'Choose specific fields to share',
    icon: Clock,
  },
};

export function EnhancedShareDialog({ open, onClose, credential, onCreateShare }: ShareDialogProps) {
  const { t } = useTranslation('wallet');
  const { toast } = useToast();
  const [preset, setPreset] = useState<'full' | 'lite' | 'custom'>('full');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [expiryMinutes, setExpiryMinutes] = useState('15');
  const [maxViews, setMaxViews] = useState('10');
  const [accessCode, setAccessCode] = useState('');
  const [requireAccessCode, setRequireAccessCode] = useState(false);
  const [shareResult, setShareResult] = useState<{ id: string; url: string } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const availableFields = credential?.payload ? Object.keys(credential.payload) : [];

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleCreateShare = async () => {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(expiryMinutes));

      const shareData: ShareData = {
        credId: credential.id,
        policy: {
          preset,
          ...(preset === 'custom' && { fields: selectedFields }),
        },
        expiresAt: expiresAt.toISOString(),
        maxViews: parseInt(maxViews),
        ...(requireAccessCode && { accessCode }),
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
        title: t('share_created'),
        description: t('share_created_desc'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('share_creation_failed'),
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('copied'),
      description: t('link_copied_to_clipboard'),
    });
  };

  const getLiteFields = () => {
    const essentialFields = ['degree', 'institution', 'university', 'year', 'grade', 'title'];
    return availableFields.filter(field =>
      essentialFields.some(essential => field.toLowerCase().includes(essential))
    );
  };

  const getPresetFields = () => {
    switch (preset) {
      case 'full':
        return availableFields;
      case 'lite':
        return getLiteFields();
      case 'custom':
        return selectedFields;
      default:
        return [];
    }
  };

  if (shareResult) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              {t('share_ready')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="p-4 text-center">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-4" />
              )}
              <p className="text-sm text-muted-foreground mb-2">
                {t('scan_or_share_link')}
              </p>
            </Card>

            <div className="space-y-2">
              <Label>{t('share_link')}</Label>
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
                <strong>{t('share_details')}</strong>
              </div>
              <ul className="space-y-1 text-muted-foreground">
                <li>{t('expires_in')} {expiryMinutes} {t('minutes')}</li>
                <li>{t('max_views')}: {maxViews}</li>
                <li>{t('fields_shared')}: {getPresetFields().length}</li>
                {requireAccessCode && <li>{t('access_code_required')}</li>}
              </ul>
            </div>

            <Button onClick={onClose} className="w-full">
              {t('done')}
            </Button>
          </div>
        </DialogContent>
    </Dialog>
  );
}


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('share_credential')}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={preset} onValueChange={(value) => setPreset(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            {Object.entries(PRESETS).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(PRESETS).map(([key, config]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">{config.label}</h3>
                <p className="text-sm text-muted-foreground mb-3">{config.description}</p>
                
                {key === 'custom' && (
                  <div className="space-y-2">
                    <Label>{t('select_fields_to_share')}</Label>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {availableFields.map((field) => (
                        <div key={field} className="flex items-center space-x-2">
                          <Checkbox
                            id={`field-${field}`}
                            checked={selectedFields.includes(field)}
                            onCheckedChange={() => handleFieldToggle(field)}
                          />
                          <Label
                            htmlFor={`field-${field}`}
                            className="text-sm capitalize"
                          >
                            {field.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {key !== 'custom' && (
                  <div>
                    <Label className="text-sm">{t('fields_included')}:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(key === 'lite' ? getLiteFields() : availableFields).map((field) => (
                        <span
                          key={field}
                          className="inline-block px-2 py-1 bg-muted rounded text-xs"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry">{t('expires_in')}</Label>
            <Select value={expiryMinutes} onValueChange={setExpiryMinutes}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 {t('minutes')}</SelectItem>
                <SelectItem value="15">15 {t('minutes')}</SelectItem>
                <SelectItem value="30">30 {t('minutes')}</SelectItem>
                <SelectItem value="60">1 {t('hour')}</SelectItem>
                <SelectItem value="1440">24 {t('hours')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-views">{t('max_views')}</Label>
            <Select value={maxViews} onValueChange={setMaxViews}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 {t('view')}</SelectItem>
                <SelectItem value="5">5 {t('views')}</SelectItem>
                <SelectItem value="10">10 {t('views')}</SelectItem>
                <SelectItem value="25">25 {t('views')}</SelectItem>
                <SelectItem value="100">{t('unlimited')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="access-code"
              checked={requireAccessCode}
              onCheckedChange={(checked) => setRequireAccessCode(!!checked)}
            />
            <Label htmlFor="access-code">{t('require_access_code')}</Label>
          </div>

          {requireAccessCode && (
            <div className="space-y-2">
              <Label htmlFor="code">{t('access_code')}</Label>
              <Input
                id="code"
                type="password"
                placeholder={t('enter_access_code')}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t('cancel')}
          </Button>
          <Button
            onClick={handleCreateShare}
            disabled={preset === 'custom' && selectedFields.length === 0}
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            {t('create_share_link')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EnhancedShareDialog;