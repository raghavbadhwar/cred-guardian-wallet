import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onResult: (result: string) => void;
}

export function QRScanner({ open, onClose, onResult }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // For demo purposes, simulate QR code detection
        if (result) {
          toast({
            title: "QR Code Detected",
            description: "Processing credential...",
          });
          onResult("demo-credential-data");
        }
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    if (open && !scanning) {
      startCamera();
    } else if (!open) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasPermission === false ? (
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">
                Camera permission is required to scan QR codes.
              </div>
              <Button onClick={startCamera} variant="primary">
                <Camera className="w-4 h-4 mr-2" />
                Enable Camera
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                {scanning ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Position the QR code within the frame
              </div>

              <div className="flex gap-2">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*,.pdf,.txt,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </span>
                  </Button>
                </label>
                
                <Button variant="outline" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}