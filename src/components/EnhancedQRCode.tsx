
import React, { useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Copy, Printer, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedQRCodeProps {
  value: string;
  size?: number;
  accessCode?: string;
  title?: string;
  showDownload?: boolean;
  showCopy?: boolean;
  showPrint?: boolean;
}

export function EnhancedQRCode({ 
  value, 
  size = 256, 
  accessCode,
  title = "Verification QR Code",
  showDownload = true,
  showCopy = true,
  showPrint = true
}: EnhancedQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch(console.error);
    }
  }, [value, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `credverse-qr-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
    
    toast({
      title: "QR Code Downloaded",
      description: "The QR code has been saved to your device",
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Link Copied",
        description: "The verification link has been copied to your clipboard",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Could not copy the link to clipboard",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    
    printWindow.document.write(`
      <html>
        <head>
          <title>CredVerse Verification QR Code</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px; 
            }
            .qr-container { 
              border: 2px solid #000; 
              padding: 20px; 
              display: inline-block; 
              margin: 20px;
            }
            .access-code { 
              font-size: 18px; 
              font-weight: bold; 
              margin-top: 10px; 
              color: #333;
            }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <div class="qr-container">
            <img src="${dataUrl}" alt="QR Code" />
            ${accessCode ? `<div class="access-code">Access Code: ${accessCode}</div>` : ''}
          </div>
          <p>Scan with any QR code scanner or camera app</p>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
    
    toast({
      title: "Print Dialog Opened",
      description: "QR code is ready to print",
    });
  };

  return (
    <Card className="p-6 text-center space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      
      <div className="relative inline-block">
        <canvas ref={canvasRef} className="border rounded-lg" />
        {accessCode && (
          <div className="mt-2 p-2 bg-muted rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-mono">Access Code: {accessCode}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-2">
        {showDownload && (
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        )}
        
        {showCopy && (
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        )}
        
        {showPrint && (
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Scan with any QR code scanner or camera app
      </p>
    </Card>
  );
}
