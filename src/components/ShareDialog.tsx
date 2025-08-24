import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, QrCode, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  credential: any;
}

export function ShareDialog({ open, onClose, credential }: ShareDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [expiryMinutes, setExpiryMinutes] = useState(15);
  const [shareUrl, setShareUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');

  const generateShareLink = async () => {
    const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const shareToken = btoa(JSON.stringify({
      credentialId: credential.id,
      expires: expiry.toISOString(),
      data: credential
    }));
    
    const url = `${window.location.origin}/verify?token=${shareToken}`;
    setShareUrl(url);
    setExpiresAt(expiry);
    
    // Generate QR code
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
    
    toast({
      title: t('success', { ns: 'common' }),
      description: t('share_expires', { ns: 'common', minutes: expiryMinutes }),
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: t('success', { ns: 'common' }),
      description: 'Share link copied to clipboard',
    });
  };

  const downloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.download = `${credential.subject}-qr.png`;
      link.href = qrDataUrl;
      link.click();
    }
  };

  // Update time remaining
  useEffect(() => {
    if (!expiresAt) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const remaining = expiresAt.getTime() - now.getTime();
      
      if (remaining <= 0) {
        setTimeRemaining('Expired');
        return;
      }
      
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleClose = () => {
    setShareUrl('');
    setQrDataUrl('');
    setExpiresAt(null);
    setTimeRemaining('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <QrCode className="w-5 h-5" />
            <span>Share Credential</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="font-medium mb-2">{credential?.subject}</h3>
            <p className="text-sm text-muted-foreground">{credential?.issuer}</p>
            <Badge className="mt-2">{credential?.status}</Badge>
          </Card>
          
          {!shareUrl ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Time (minutes)</Label>
                <Input
                  id="expiry"
                  type="number"
                  value={expiryMinutes}
                  onChange={(e) => setExpiryMinutes(parseInt(e.target.value) || 15)}
                  min="1"
                  max="1440"
                />
              </div>
              
              <Button onClick={generateShareLink} className="w-full">
                Generate Share Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="QR Code" className="mx-auto mb-4" />
                )}
                
                {timeRemaining && (
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Expires in: {timeRemaining}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Share URL</Label>
                <div className="flex space-x-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button onClick={copyToClipboard} size="sm" variant="outline">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={downloadQR} variant="outline" className="flex-1">
                  Download QR
                </Button>
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              {t('privacy_note', { ns: 'common' })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}