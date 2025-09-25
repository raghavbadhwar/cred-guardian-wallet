import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Share2, 
  Download, 
  Archive, 
  RotateCcw,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

interface Credential {
  id: string;
  type: string;
  title?: string;
  issuer: string;
  issuer_name?: string;
  issuerDomain: string;
  subject: string;
  issuedDate: string;
  status: 'valid' | 'expired' | 'revoked';
  category: 'degree' | 'certificate' | 'transcript' | 'diploma';
  credentialData?: any;
  deleted_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CredentialCardProps {
  credential: Credential;
  onShare?: (credential: Credential) => void;
  onArchive?: (credentialId: string) => void;
  onRestore?: (credentialId: string) => void;
  onDelete?: (credentialId: string) => void;
  onAddTag?: (credentialId: string) => void;
  onMoveToFolder?: (credentialId: string) => void;
  isInTrash?: boolean;
}

export function EnhancedCredentialCard({ 
  credential, 
  onShare, 
  onArchive, 
  onRestore, 
  onDelete, 
  onAddTag, 
  onMoveToFolder,
  isInTrash = false 
}: CredentialCardProps) {
  const { t } = useTranslation('wallet');
  const { toast } = useToast();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'revoked':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'valid':
        return 'default';
      case 'revoked':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleDownload = () => {
    // Create downloadable JSON file
    const dataStr = JSON.stringify(credential, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(credential.title || credential.subject).replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: t('credential_downloaded'),
      description: t('credential_downloaded_desc'),
    });
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(credential.status)}
            <h3 className="font-semibold text-lg">{credential.title || credential.subject}</h3>
            <Badge variant={getStatusVariant(credential.status)}>
              {t(`status_${credential.status}`)}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium">{t('issuer')}:</span> {credential.issuer_name || credential.issuer}
            </p>
            <p>
              <span className="font-medium">{t('issued')}:</span> {format(new Date(credential.issuedDate), 'PPP')}
            </p>
            <p className="text-xs">
              {t('added')} {formatDistanceToNow(new Date(credential.createdAt || credential.issuedDate))} {t('ago')}
            </p>
          </div>

        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isInTrash ? (
              <>
                <DropdownMenuItem onClick={() => onShare?.(credential)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('share')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('download')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onArchive?.(credential.id)}
                  className="text-destructive"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {t('move_to_trash')}
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => onRestore?.(credential.id)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('restore')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(credential.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('delete_permanently')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

export default EnhancedCredentialCard;