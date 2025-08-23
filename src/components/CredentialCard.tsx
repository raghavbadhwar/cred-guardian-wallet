import { Card } from "@/components/ui/card";
import { StatusBadge, type CredentialStatus } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2, GraduationCap, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Credential {
  id: string;
  type: string;
  issuer: string;
  issuerDomain: string;
  subject: string;
  issuedDate: string;
  status: CredentialStatus;
  category: "degree" | "diploma" | "certificate" | "transcript";
  credentialData?: any;
}

interface CredentialCardProps {
  credential: Credential;
  onClick?: () => void;
  className?: string;
}

const categoryConfig = {
  degree: {
    icon: GraduationCap,
    label: "Degree",
    color: "text-credverse-primary"
  },
  diploma: {  
    icon: Award,
    label: "Diploma", 
    color: "text-credverse-success"
  },
  certificate: {
    icon: Badge,
    label: "Certificate",
    color: "text-credverse-warning"
  },
  transcript: {
    icon: Building2,
    label: "Transcript",
    color: "text-muted-foreground"
  }
};

export function CredentialCard({ credential, onClick, className }: CredentialCardProps) {
  const config = categoryConfig[credential.category];
  const CategoryIcon = config.icon;
  
  return (
    <Card 
      className={cn(
        "gradient-card shadow-card hover:shadow-elevated transition-smooth cursor-pointer border-border/50 hover:border-border p-4",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Category Icon */}
        <div className={cn("flex-shrink-0 p-2 rounded-lg bg-muted/50", config.color)}>
          <CategoryIcon size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header with Status */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-card-foreground truncate">
              {credential.type}
            </h3>
            <StatusBadge status={credential.status} />
          </div>
          
          {/* Issuer Info */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-muted">
                {credential.issuer.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-card-foreground truncate">
                {credential.issuer}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {credential.issuerDomain}
              </p>
            </div>
          </div>
          
          {/* Issue Date */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar size={12} />
            <span>Issued {new Date(credential.issuedDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}